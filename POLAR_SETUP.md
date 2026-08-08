# Polar Integration Setup Documentation

## Overview
This document details the Polar (https://polar.sh) checkout and webhook integration configured for **hookzen**.

---

## 1. Environment Variables Configuration
The following environment keys are defined in `.env` and `.env.example`:

- `POLAR_ACCESS_TOKEN` — Organization access token from Polar (scopes: `products`, `checkouts`, `webhooks`).
- `POLAR_WEBHOOK_SECRET` — Signing secret used to verify raw signatures at `/api/webhook/polar`.
- `POLAR_SERVER` — Set to `production` (`https://api.polar.sh`).

*Note: Secrets are safely stored in `.env` and excluded from version control via `.gitignore`.*

---

## 2. Files Modified & Created

1. **`server.ts`**:
   - Initialized reusable `@polar-sh/sdk` client with `POLAR_SERVER`.
   - Added `/checkout?products=<ID>` route redirecting users directly to hosted Polar Checkout pages.
   - Added `/api/webhook/polar` endpoint with raw body parsing and `validateEvent` signature verification. Handles `order.created`, `order.paid`, and `customer.state_changed` lifecycle events.
   - Added `/api/polar/checkout` JSON API endpoint for custom modal triggers.

2. **`src/components/PolarCheckoutModal.tsx`**:
   - Payment modal component supporting card, Apple Pay, and Google Pay flows powered by Polar API backend.

3. **`src/components/PricingModal.tsx`**:
   - Integrated Polar checkout launcher for Pro Monthly, Pro Annual, and Lifetime Pass tiers.

4. **`POLAR_SETUP.md`**:
   - Setup guide and verification documentation.

---

## 3. Product & Webhook Registration

- **Organization ID**: `66ee889c-b34e-41e9-af20-81db3f8a71c2` (hookzen)
- **Environment**: Production (`https://api.polar.sh`)
- **Domain**: `https://hookzen.me`
- **Monthly Checkout Link**: `https://buy.polar.sh/polar_cl_TTO1bMO8aauIImAFpZftt5HjnncmgA2u6SQvy1wLKEF`
- **Yearly Checkout Link**: `https://buy.polar.sh/polar_cl_aGmfxo8xDnpWHiMuA0qpF4Q5P2O1CaBOBgIl44bAt7X`
- **Lifetime Checkout Link**: `https://buy.polar.sh/polar_cl_rOTZcvExdcMLC5hAfscDfgTtdMBcFHxtKiQVk2fqZVZ`
- **Webhook Endpoint**: `https://hookzen.me/api/webhook/polar`
- **Success Redirect**: `https://hookzen.me/payment/success?checkout_success=true`
- **Cancel Redirect**: `https://hookzen.me/payment/cancel?checkout_canceled=true`
- **Customer Portal**: Hosted directly by Polar. Polar automatically emails receipt and subscription management links to customers upon payment completion (no custom portal code needed).

---

## 4. Verification Checklist Before Merging

- [x] `@polar-sh/sdk` installed and configured.
- [x] `.env` populated with `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, and `POLAR_SERVER=production`.
- [x] Express `/checkout` route redirects cleanly to `polar.checkouts.create` URLs.
- [x] Express `/api/webhook/polar` validates signatures using `validateEvent` from `@polar-sh/sdk/webhooks`.
- [x] Project builds (`npm run build`) and passes typechecking (`tsc --noEmit`) without errors.

---

## 5. Local Testing
To test a checkout locally:
```bash
# Test direct redirect checkout link:
http://localhost:3000/checkout?products=<YOUR_PRODUCT_ID>
```
To test without actual charges, create a 100% discount code in your [Polar Dashboard](https://polar.sh/dashboard/hookzen) and apply it during checkout.
