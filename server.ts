import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { Polar } from '@polar-sh/sdk';
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { generateSmartScriptHooks } from './src/utils/scriptBrain';
import { updateUserPremiumStatus, extractUserFromPolarEvent } from './src/lib/serverFirebase';

async function startServer() {
  const app = express();
  const PORT = 3000;

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
