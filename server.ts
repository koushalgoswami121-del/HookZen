import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });
import express from 'express';
import path from 'path';
import https from 'https';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { Polar } from '@polar-sh/sdk';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { generateSmartScriptHooks } from './src/utils/scriptBrain';
import { updateUserPremiumStatus, extractUserFromPolarEvent } from './src/lib/serverFirebase';
import firebaseConfigData from './firebase-applet-config.json';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Force HTTPS in production — trust proxy headers from Railway/Render/Cloudflare
  app.set('trust proxy', 1);
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
      next();
    });
  }

  // Transparent Firebase Auth Reverse Proxy (/__/auth/*, /__/firebase/*)
  // Transparently forwards all requests to Firebase Hosting (<projectId>.firebaseapp.com).
  // Required so authDomain can be set to hookzen.me (custom domain) per Firebase documentation.
  // Fully forwards HTTP method, headers, cookies, query strings, request body, and response headers.
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || (firebaseConfigData as any)?.projectId || 'ai-studio-applet-webapp-20a1f';
  const FIREBASE_HOSTING_DOMAIN = `${FIREBASE_PROJECT_ID}.firebaseapp.com`;
  const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'transfer-encoding',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'upgrade',
  ]);

  app.use('/__', (req: express.Request, res: express.Response) => {
    try {
      const proxyHeaders: Record<string, string | string[]> = {};
      for (const [key, val] of Object.entries(req.headers)) {
        if (val === undefined) continue;
        const lower = key.toLowerCase();
        if (lower === 'host' || HOP_BY_HOP_HEADERS.has(lower)) continue;
        proxyHeaders[lower] = val;
      }

      proxyHeaders['host'] = FIREBASE_HOSTING_DOMAIN;
      proxyHeaders['x-forwarded-host'] = (req.headers['x-forwarded-host'] || req.headers.host || 'hookzen.me') as string;
      proxyHeaders['x-forwarded-proto'] = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
      const clientIp = req.ip || req.socket.remoteAddress;
      if (clientIp) {
        proxyHeaders['x-forwarded-for'] = req.headers['x-forwarded-for']
          ? `${req.headers['x-forwarded-for']}, ${clientIp}`
          : clientIp;
      }

      const proxyReq = https.request(
        {
          protocol: 'https:',
          hostname: FIREBASE_HOSTING_DOMAIN,
          port: 443,
          method: req.method,
          path: req.originalUrl,
          headers: proxyHeaders,
        },
        (proxyRes) => {
          const clientHost = ((req.headers['x-forwarded-host'] || req.headers.host || 'hookzen.me') as string).split(':')[0];
          const clientProto = (req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http')) as string;

          res.status(proxyRes.statusCode || 200);

          for (const [headerKey, headerVal] of Object.entries(proxyRes.headers)) {
            if (headerVal === undefined) continue;
            const lower = headerKey.toLowerCase();
            if (HOP_BY_HOP_HEADERS.has(lower)) continue;

            if (lower === 'set-cookie') {
              const cookies = Array.isArray(headerVal) ? headerVal : [headerVal];
              const rewrittenCookies = cookies.map((c) =>
                c.replace(
                  new RegExp(`domain=\\.?${FIREBASE_HOSTING_DOMAIN}`, 'gi'),
                  `domain=${clientHost}`
                )
              );
              res.setHeader('set-cookie', rewrittenCookies);
            } else if (lower === 'location' && typeof headerVal === 'string') {
              const rewrittenLocation = headerVal.replace(
                new RegExp(`^https?://${FIREBASE_HOSTING_DOMAIN}`, 'i'),
                `${clientProto}://${clientHost}`
              );
              res.setHeader('location', rewrittenLocation);
            } else {
              res.setHeader(headerKey, headerVal);
            }
          }

          if (!res.getHeader('access-control-allow-origin')) {
            res.setHeader('access-control-allow-origin', '*');
          }

          proxyRes.pipe(res);
        }
      );

      proxyReq.on('error', (err) => {
        console.error('[Firebase Auth Proxy Error]:', err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Firebase auth proxy error', detail: err.message });
        }
      });

      req.on('aborted', () => proxyReq.destroy());
      res.on('close', () => {
        if (!proxyReq.destroyed) proxyReq.destroy();
      });

      req.pipe(proxyReq);
    } catch (err: any) {
      console.error('[Firebase Auth Proxy Setup Error]:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Firebase auth proxy error', detail: err.message });
      }
    }
  });

  // Initialize re-usable Polar SDK client
  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN || '',
    server: (process.env.POLAR_SERVER as 'sandbox' | 'production') || 'production',
  });

  // Polar Webhook Endpoint (Requires raw body for signature verification)
  app.post('/api/webhook/polar', express.raw({ type: 'application/json' }), async (req, res) => {
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('POLAR_WEBHOOK_SECRET is not set in environment.');
      return res.status(400).send('Webhook secret not configured');
    }

    let event: any;
    try {
      const headers = req.headers as Record<string, string>;
      event = validateEvent(req.body, headers, webhookSecret);
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        console.error('Invalid Polar webhook signature:', err.message);
        return res.status(400).send('Invalid signature');
      }
      console.error('Webhook verification failed:', err);
      return res.status(400).send('Webhook verification failed');
    }

    console.log(`[Polar Webhook] Received event: ${event.type}`);

    try {
      switch (event.type) {
        // Payment Success & Active Subscription Events
        case 'order.created':
        case 'order.paid':
        case 'subscription.created':
        case 'subscription.active':
        case 'subscription.updated': {
          const { userId, email, planType } = extractUserFromPolarEvent(event);
          console.log(`[Polar Webhook SUCCESS] ${event.type} for user:`, { userId, email, planType });

          if (userId || email) {
            await updateUserPremiumStatus({ userId, email }, true, planType);
          } else {
            console.warn('[Polar Webhook] Could not extract userId or email from payload.');
          }
          break;
        }

        // Subscription Cancellation / Revocation / Expiration Events
        case 'subscription.canceled':
        case 'subscription.revoked':
        case 'subscription.expired': {
          const { userId, email } = extractUserFromPolarEvent(event);
          console.log(`[Polar Webhook CANCELED] ${event.type} for user:`, { userId, email });

          if (userId || email) {
            await updateUserPremiumStatus({ userId, email }, false, 'free');
          } else {
            console.warn('[Polar Webhook] Could not extract userId or email from cancellation payload.');
          }
          break;
        }

        default: {
          console.log(`[Polar Webhook] Unhandled event type: ${event.type}`);
        }
      }
    } catch (handlerErr) {
      console.error('[Polar Webhook] Event handler processing error:', handlerErr);
    }

    return res.json({ received: true });
  });

  // Standard JSON body parsing for remaining endpoints
  app.use(express.json());

  // Polar Checkout Redirect Endpoint: /checkout?products=<id>
  app.get('/checkout', async (req, res) => {
    const productId = req.query.products as string;
    if (!productId) {
      return res.redirect('/');
    }

    try {
      const checkout = await polar.checkouts.create({
        products: [productId],
      });
      return res.redirect(checkout.url);
    } catch (err: any) {
      console.error('Polar checkout creation error:', err);
      return res.redirect('https://buy.polar.sh/polar_cl_TTO1bMO8aauIImAFpZftt5HjnncmgA2u6SQvy1wLKEF');
    }
  });

  // API Health Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      geminiAvailable: !!process.env.GEMINI_API_KEY,
      polarConfigured: !!process.env.POLAR_ACCESS_TOKEN,
    });
  });

  // Polar Payment Checkout Session API Endpoint
  app.post('/api/polar/checkout', async (req, res) => {
    try {
      const { planType = 'annual', email = '', productId = '', userId = '' } = req.body || {};
      const accessToken = process.env.POLAR_ACCESS_TOKEN;
      const baseUrl = process.env.APP_URL || 'https://hookzen.me';
      const successUrl =
        process.env.POLAR_SUCCESS_URL ||
        `${baseUrl}/payment/success?checkout_success=true&plan=${planType}`;

      // Official Polar checkout links
      if (planType === 'monthly') {
        return res.json({
          checkoutUrl: 'https://buy.polar.sh/polar_cl_TTO1bMO8aauIImAFpZftt5HjnncmgA2u6SQvy1wLKEF',
          checkoutId: 'polar_cl_TTO1bMO8aauIImAFpZftt5HjnncmgA2u6SQvy1wLKEF',
        });
      } else if (planType === 'lifetime') {
        return res.json({
          checkoutUrl: 'https://buy.polar.sh/polar_cl_rOTZcvExdcMLC5hAfscDfgTtdMBcFHxtKiQVk2fqZVZ',
          checkoutId: 'polar_cl_rOTZcvExdcMLC5hAfscDfgTtdMBcFHxtKiQVk2fqZVZ',
        });
      } else if (planType === 'annual') {
        return res.json({
          checkoutUrl: 'https://buy.polar.sh/polar_cl_aGmfxo8xDnpWHiMuA0qpF4Q5P2O1CaBOBgIl44bAt7X',
          checkoutId: 'polar_cl_aGmfxo8xDnpWHiMuA0qpF4Q5P2O1CaBOBgIl44bAt7X',
        });
      }

      if (accessToken) {
        // Attempt creating a Polar checkout session via official SDK
        if (productId) {
          const checkout = await polar.checkouts.create({
            products: [productId],
            customerEmail: email || undefined,
            externalCustomerId: userId || undefined,
            metadata: {
              userId,
              planType,
              email,
            },
            successUrl,
          });
          return res.json({ checkoutUrl: checkout.url, checkoutId: checkout.id });
        }
      }

      // Return mock / fallback checkout payload when token is unconfigured or in dev mode
      const mockCheckoutId = `chk_${Math.random().toString(36).substring(2, 11)}`;
      return res.json({
        success: true,
        checkoutId: mockCheckoutId,
        planType,
        successUrl,
        message: 'Polar checkout endpoint ready.',
      });
    } catch (err: any) {
      console.error('Polar Checkout API error:', err);
      return res.status(500).json({ error: err.message || 'Failed to create Polar checkout session' });
    }
  });

  // Helpers for Social Profile Scanner ($0 API cost, server-side fetch)
  function parseMetricCount(str: string): number {
    if (!str) return 0;
    const raw = str.trim();
    const bMatch = raw.match(/([0-9.]+)\s*(?:b|billion)\b/i);
    if (bMatch) return Math.round(parseFloat(bMatch[1]) * 1000000000);
    const mMatch = raw.match(/([0-9.]+)\s*(?:m|million)\b/i);
    if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1000000);
    const kMatch = raw.match(/([0-9.]+)\s*(?:k|thousand)\b/i);
    if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
    const plain = raw.replace(/,/g, '').match(/[0-9.]+/);
    return plain ? Math.round(parseFloat(plain[0])) : 0;
  }

  function cleanSocialHandle(input: string): string {
    if (!input) return '';
    let cleaned = input.trim();
    cleaned = cleaned.replace(/^https?:\/\/(?:www\.)?(?:instagram\.com|youtube\.com|tiktok\.com)\//i, '');
    cleaned = cleaned.replace(/^[@\/]+/, '').split(/[?#\/]/)[0].trim();
    return cleaned;
  }

  async function fetchInstagramProfile(handle: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const url = `https://www.instagram.com/${encodeURIComponent(handle)}/`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      if (res.status === 404) {
        return { success: false, error: `Instagram account @${handle} not found.` };
      }

      const html = await res.text();
      const metaMatch = html.match(/content="([0-9.,KMBkmb]+\s+Followers,[^"]+)"/i)
        || html.match(/property="og:description"\s+content="([^"]+)"/i)
        || html.match(/name="description"\s+content="([^"]+)"/i);

      if (metaMatch) {
        const text = metaMatch[1];
        const followersMatch = text.match(/([0-9.,KMBkmb]+)\s+Followers/i);
        const followingMatch = text.match(/([0-9.,KMBkmb]+)\s+Following/i);
        const postsMatch = text.match(/([0-9.,KMBkmb]+)\s+Posts/i);

        if (followersMatch) {
          const rawFollowers = followersMatch[1];
          const followerCount = parseMetricCount(rawFollowers);
          const rawPosts = postsMatch ? postsMatch[1] : null;
          const postsCount = rawPosts ? parseMetricCount(rawPosts) : undefined;
          const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
          const displayName = titleMatch ? titleMatch[1].replace(/\s*\(@.*\).*$/, '').trim() : undefined;

          return {
            success: true,
            platform: 'instagram',
            handle,
            displayName,
            followers: rawFollowers,
            followerCount,
            posts: rawPosts,
            postsCount,
          };
        }
      }
      return { success: false, error: `Could not extract public metrics for @${handle}. Account may be private or restricted.` };
    } catch (err: any) {
      return { success: false, error: err.name === 'AbortError' ? 'Instagram connection timed out' : err.message };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function fetchYouTubeProfile(handle: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    try {
      const url = `https://www.youtube.com/@${encodeURIComponent(handle)}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      if (res.status === 404) {
        return { success: false, error: `YouTube channel @${handle} not found.` };
      }

      const html = await res.text();
      const subMatch = html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"\}\},"simpleText":"([^"]+)"\}/)
        || html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/)
        || html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"\}\}\}/);

      const videoMatch = html.match(/"videosCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"\}\},"simpleText":"([^"]+)"\}/)
        || html.match(/"videosCountText":\{"runs":\[\{"text":"([^"]+)"\}/);

      let rawSubs = subMatch ? (subMatch[2] || subMatch[1]) : null;
      if (!rawSubs) {
        const descMatch = html.match(/content="([^"]*?([0-9.,KMBkmb]+)\s+subscribers[^"]*)"/i);
        if (descMatch) rawSubs = descMatch[2];
      }

      if (rawSubs) {
        const cleanSubs = rawSubs.replace(/subscribers/i, '').trim();
        const followerCount = parseMetricCount(cleanSubs);
        const rawVideos = videoMatch ? (videoMatch[2] || videoMatch[1]) : null;
        const postsCount = rawVideos ? parseMetricCount(rawVideos) : undefined;
        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        const displayName = titleMatch ? titleMatch[1].trim() : undefined;

        return {
          success: true,
          platform: 'youtube',
          handle,
          displayName,
          followers: cleanSubs,
          followerCount,
          posts: rawVideos,
          postsCount,
        };
      }

      return { success: false, error: `Could not extract subscriber count for YouTube channel @${handle}.` };
    } catch (err: any) {
      return { success: false, error: err.name === 'AbortError' ? 'YouTube connection timed out' : err.message };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function fetchTikTokProfile(handle: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    try {
      const url = `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });

      if (res.status === 404) {
        return { success: false, error: `TikTok account @${handle} not found.` };
      }

      const html = await res.text();
      const rehydrationMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/);
      if (rehydrationMatch) {
        try {
          const data = JSON.parse(rehydrationMatch[1]);
          const stats = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.stats;
          if (stats && stats.followerCount !== undefined) {
            return {
              success: true,
              platform: 'tiktok',
              handle,
              followers: `${stats.followerCount}`,
              followerCount: Number(stats.followerCount),
              postsCount: stats.videoCount ? Number(stats.videoCount) : undefined,
            };
          }
        } catch (e) {
          // ignore JSON parse error
        }
      }

      const metaMatch = html.match(/content="([0-9.,KMBkmb]+\s+Followers,[^"]+)"/i)
        || html.match(/name="description"\s+content="([^"]+)"/i);
      if (metaMatch) {
        const followersMatch = metaMatch[1].match(/([0-9.,KMBkmb]+)\s+Followers/i);
        if (followersMatch) {
          const rawFollowers = followersMatch[1];
          return {
            success: true,
            platform: 'tiktok',
            handle,
            followers: rawFollowers,
            followerCount: parseMetricCount(rawFollowers),
          };
        }
      }

      return { success: false, error: `Could not extract followers for @${handle}.` };
    } catch (err: any) {
      return {
        success: false,
        fallback: true,
        error: err.name === 'AbortError' ? 'TikTok connection timed out (region/network block)' : err.message,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Social Profile Scanner API Route ($0 API cost, server-side fetch)
  app.get('/api/fetch-social-profile', async (req, res) => {
    try {
      const rawPlatform = ((req.query.platform as string) || 'instagram').toLowerCase();
      const rawHandle = ((req.query.handle as string) || '').trim();
      const platform = (['instagram', 'youtube', 'tiktok'].includes(rawPlatform) ? rawPlatform : 'instagram') as
        | 'instagram'
        | 'youtube'
        | 'tiktok';

      const handle = cleanSocialHandle(rawHandle);
      if (!handle) {
        return res.status(400).json({ success: false, error: 'Social handle is required.' });
      }

      let result;
      if (platform === 'instagram') {
        result = await fetchInstagramProfile(handle);
      } else if (platform === 'youtube') {
        result = await fetchYouTubeProfile(handle);
      } else if (platform === 'tiktok') {
        result = await fetchTikTokProfile(handle);
      }

      return res.json(result);
    } catch (err: any) {
      console.error('[Social Scanner API] Error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to scan social profile.' });
    }
  });

  // AI Hook Generation API Route
  app.post('/api/generate-hooks', async (req, res) => {
    try {
      const { title = '', transcript = '', industry = 'General', customPrompt = '' } = req.body || {};
      const fullText = `${title} ${transcript} ${customPrompt}`.trim();

      if (!fullText) {
        return res.status(400).json({ error: 'Title or transcript text is required.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        // Fallback to local intelligent NLP script brain if no key configured
        const fallbackHooks = generateSmartScriptHooks(title, transcript, industry);
        return res.json({ source: 'local-brain', hooks: fallbackHooks });
      }

      // Initialize HookZen Core AI Engine
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'hookzen-core-engine/1.0',
          },
        },
      });

      const prompt = `Analyze this video script and generate 5 custom, high-retention viral opening hooks tailored specifically to its actual content:

Title: "${title}"
Script / Transcript: "${transcript}"
Industry / Niche: "${industry}"
${customPrompt ? `User Custom Direction: "${customPrompt}"` : ''}

Generate 5 distinct viral hooks rewritten directly from the core premise, surprising facts, or value in this script. Do NOT use template brackets or placeholder text like [your topic]. Write complete, spoken-out-loud first 3-second lines.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are a world-class viral short-form script doctor for TikTok, YouTube Shorts, and Instagram Reels.
You analyze user scripts and rewrite their openings into 5 ultra-compelling 3-second hooks.

CRITICAL HOOK GENERATION RULES:
1. NEVER output placeholders or fill-in-the-blanks like "[topic]" or "[tool]".
2. Speak directly to the specific premise, facts, tools, advice, or story mentioned in the provided script.
3. Keep each hook concise (12-22 words max) so it can be spoken in under 3 seconds.
4. Generate 5 unique angles:
   - Pattern Interrupt (shocking statement or bold stop)
   - Contrarian Take (debunking a myth in the script)
   - Curiosity Gap (revealing a specific secret from the script)
   - Story / Transformation Arc (how a specific result was achieved)
   - Direct Audience Calling (calling out the exact target viewer)
5. Explanations must be 1 concise sentence explaining the psychological trigger.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: {
                  type: Type.STRING,
                  description: 'The exact spoken opening line for the video.',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Psychological hook reason why this holds retention.',
                },
                category: {
                  type: Type.STRING,
                  description: 'Hook angle (e.g., Pattern Interrupt, Contrarian Take, Curiosity Gap, Story Arc, Direct Callout).',
                },
              },
              required: ['title', 'explanation', 'category'],
            },
          },
        },
      });

      const jsonText = response.text?.trim() || '[]';
      const parsedHooks = JSON.parse(jsonText);

      if (Array.isArray(parsedHooks) && parsedHooks.length > 0) {
        return res.json({ source: 'hookzen-core-engine', hooks: parsedHooks });
      }

      // Fallback if parsing was empty
      const fallbackHooks = generateSmartScriptHooks(title, transcript, industry);
      return res.json({ source: 'local-brain', hooks: fallbackHooks });
    } catch (err: any) {
      console.error('Error generating AI hooks:', err);
      // Gracefully fall back to local brain
      const { title = '', transcript = '', industry = 'General' } = req.body || {};
      const fallbackHooks = generateSmartScriptHooks(title, transcript, industry);
      return res.json({ source: 'local-brain-fallback', hooks: fallbackHooks, error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
