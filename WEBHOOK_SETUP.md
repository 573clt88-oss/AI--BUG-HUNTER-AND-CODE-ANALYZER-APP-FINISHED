# Stripe Webhook Setup Guide

This guide provides step-by-step instructions for configuring Stripe webhooks to enable real-time subscription and payment event handling for the AI Bug Hunter & Code Analyzer SaaS application.

## Table of Contents
- [Why Webhooks Are Important](#why-webhooks-are-important)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Production Deployment Setup](#production-deployment-setup)
- [Webhook Event Types](#webhook-event-types)
- [Testing Webhooks](#testing-webhooks)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## Why Webhooks Are Important

Stripe webhooks allow your application to receive real-time notifications when payment events occur. This is critical for:

- **Subscription Management**: Automatically activate/deactivate user subscriptions
- **Payment Confirmation**: Update order status when payments succeed or fail
- **Failed Payments**: Handle declined cards and retry logic
- **Subscription Changes**: Manage upgrades, downgrades, and cancellations
- **Email Notifications**: Trigger automated emails (welcome, billing reminders, etc.)

Without webhooks, your application won't know when Stripe processes payments or subscription changes.

---

## Prerequisites

Before setting up webhooks, ensure you have:

1. **Stripe Account**: Sign up at [https://stripe.com](https://stripe.com)
2. **API Keys**: 
   - Test Mode: For development
   - Live Mode: For production
3. **Deployed Application**: Your backend must be publicly accessible (for production webhooks)
4. **SSL Certificate**: Production webhook endpoints must use HTTPS

---

## Local Development Setup

For local development, you'll use the Stripe CLI to forward webhook events to your localhost.

### Step 1: Install Stripe CLI

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
curl -s https://packages.stripe.com/api/v1/installation/stripe-cli | bash
```

**Windows:**
Download from [https://github.com/stripe/stripe-cli/releases/latest](https://github.com/stripe/stripe-cli/releases/latest)

### Step 2: Authenticate Stripe CLI

```bash
stripe login
```

This will open a browser window to authorize the CLI with your Stripe account.

### Step 3: Forward Webhooks to Localhost

Start your backend server (ensure it's running on port 8001), then run:

```bash
stripe listen --forward-to http://localhost:8001/api/webhook/stripe
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx (^C to quit)
```

### Step 4: Update Backend Environment

Copy the webhook signing secret from the CLI output and add it to your backend `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Test the Webhook

In another terminal, trigger a test event:

```bash
stripe trigger checkout.session.completed
```

Check your backend logs to confirm the webhook was received.

---

## Production Deployment Setup

Once your application is deployed to a live server, configure webhooks in the Stripe Dashboard.

### Step 1: Get Your Production URL

Determine your production backend webhook endpoint:
```
https://your-domain.com/api/webhook/stripe
```

**Important**: This URL MUST:
- Be publicly accessible
- Use HTTPS (not HTTP)
- Include the `/api` prefix (required by your Kubernetes ingress configuration)

### Step 2: Create Webhook in Stripe Dashboard

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter your webhook URL: `https://your-domain.com/api/webhook/stripe`
5. Select **API version**: Use the latest or the version you're testing with
6. Click **Select events**

### Step 3: Select Event Types

Select the following events that your application handles:

**Checkout Events:**
- ✅ `checkout.session.completed` - Payment successful
- ✅ `checkout.session.expired` - Session expired without payment

**Payment Events:**
- ✅ `payment_intent.succeeded` - Payment succeeded
- ✅ `payment_intent.payment_failed` - Payment failed

**Subscription Events:**
- ✅ `customer.subscription.created` - New subscription
- ✅ `customer.subscription.updated` - Subscription changed
- ✅ `customer.subscription.deleted` - Subscription cancelled
- ✅ `customer.subscription.trial_will_end` - Trial ending soon

**Invoice Events:**
- ✅ `invoice.paid` - Invoice paid successfully
- ✅ `invoice.payment_failed` - Invoice payment failed
- ✅ `invoice.upcoming` - Upcoming invoice (7 days before due)

### Step 4: Get Webhook Signing Secret

After creating the webhook, Stripe will display the **Signing Secret** (starts with `whsec_`).

**CRITICAL**: Copy this secret immediately - it won't be shown again!

### Step 5: Update Production Environment

Add the signing secret to your production backend environment variables:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

Then restart your backend service:

```bash
sudo supervisorctl restart backend
```

### Step 6: Verify Webhook Setup

1. Go to **Webhooks** in Stripe Dashboard
2. Click on your webhook endpoint
3. Click **Send test webhook**
4. Select `checkout.session.completed`
5. Check your backend logs to confirm receipt

---

## Webhook Event Types

Your backend currently handles the following events in `/app/backend/server.py`:

### Currently Implemented: `checkout.session.completed`

**Triggered**: When a customer completes a Stripe Checkout session (payment successful)

**Handler Location**: `server.py` line 473-518

**Actions Performed**:
1. Updates payment transaction status to `completed`
2. Logs subscription completion
3. (Ready for) Sends subscription confirmation email via MailChimp

**Example Payload**:
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_xxxxxxxxxxxxx",
      "amount_total": 1900,
      "currency": "usd",
      "customer_email": "user@example.com",
      "payment_status": "paid"
    }
  }
}
```

### Recommended Additional Events to Implement

**1. Payment Failed:**
```python
if webhook_response.event_type == "payment_intent.payment_failed":
    # Send payment failed email
    # Update user subscription status
    # Log failed attempt
```

**2. Subscription Cancelled:**
```python
if webhook_response.event_type == "customer.subscription.deleted":
    # Downgrade user to Free tier
    # Send cancellation confirmation email
    # Update database
```

**3. Trial Ending:**
```python
if webhook_response.event_type == "customer.subscription.trial_will_end":
    # Send trial expiration warning email
    # Remind user to add payment method
```

---

## Testing Webhooks

### Test Mode Events

Use the Stripe CLI to trigger test events:

```bash
# Successful checkout
stripe trigger checkout.session.completed

# Failed payment
stripe trigger payment_intent.payment_failed

# Subscription created
stripe trigger customer.subscription.created

# Subscription cancelled
stripe trigger customer.subscription.deleted
```

### Manual Testing in Dashboard

1. Go to **Stripe Dashboard** → **Webhooks**
2. Click on your webhook endpoint
3. Click **Send test webhook**
4. Select event type
5. (Optional) Customize payload
6. Click **Send test webhook**

### Check Webhook Logs

**In Stripe Dashboard:**
- Go to **Webhooks** → Click your endpoint
- View **Recent deliveries** tab
- Check response codes (200 = success, 4xx/5xx = error)

**In Your Backend:**
```bash
tail -f /var/log/supervisor/backend.out.log | grep webhook
```

---

## Troubleshooting

### Issue: Webhook Returns 401 Unauthorized

**Cause**: Invalid or missing webhook signing secret

**Fix**:
1. Verify `STRIPE_WEBHOOK_SECRET` in backend `.env`
2. Ensure you copied the correct secret from Stripe Dashboard
3. Restart backend: `sudo supervisorctl restart backend`

### Issue: Webhook Returns 404 Not Found

**Cause**: Incorrect webhook URL

**Fix**:
1. Ensure URL includes `/api` prefix: `https://domain.com/api/webhook/stripe`
2. Check Kubernetes ingress rules are routing `/api` to backend port 8001
3. Verify backend route exists: `@api_router.post("/webhook/stripe")`

### Issue: Webhook Returns 500 Internal Server Error

**Cause**: Backend code error during webhook processing

**Fix**:
1. Check backend error logs:
   ```bash
   tail -n 100 /var/log/supervisor/backend.err.log
   ```
2. Look for Python exceptions in webhook handler
3. Test locally with Stripe CLI to debug

### Issue: Webhook Not Receiving Events

**Cause**: Webhook endpoint not publicly accessible or HTTPS issue

**Fix**:
1. Test URL accessibility: `curl https://your-domain.com/api/webhook/stripe`
2. Ensure SSL certificate is valid
3. Check firewall rules allow incoming traffic on port 443

### Issue: Event Processed Multiple Times

**Cause**: Stripe retries webhooks if no 200 response received

**Fix**:
1. Implement idempotency checks (use `event.id` to track processed events)
2. Ensure webhook handler returns 200 quickly
3. Process heavy tasks in background (use `background_tasks`)

---

## Security Best Practices

### 1. Always Verify Webhook Signatures

Your backend uses `StripeCheckout.handle_webhook()` which automatically verifies the signature. Never skip this step!

```python
# ✅ GOOD: Signature verified automatically
webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)

# ❌ BAD: Never process unverified webhook data
# data = json.loads(await request.body())  # DANGEROUS!
```

### 2. Use HTTPS Only

- ❌ `http://your-domain.com/api/webhook/stripe` - INSECURE
- ✅ `https://your-domain.com/api/webhook/stripe` - SECURE

### 3. Keep Webhook Secrets Secure

- Store `STRIPE_WEBHOOK_SECRET` in environment variables, NOT in code
- Use different secrets for test and live modes
- Rotate secrets if compromised
- Never commit secrets to version control (use `.env.example` templates)

### 4. Implement Idempotency

Track processed events to prevent duplicate processing:

```python
# Store processed event IDs in database
processed_events = set()

if event_id in processed_events:
    return {"received": True}  # Already processed
    
# Process event...
processed_events.add(event_id)
```

### 5. Return 200 Quickly

Stripe expects a 200 response within 5 seconds:

```python
# ✅ GOOD: Return immediately, process in background
background_tasks.add_task(send_email, user_email)
return {"received": True}

# ❌ BAD: Slow synchronous processing
send_email(user_email)  # May timeout
return {"received": True}
```

### 6. Monitor Webhook Failures

Set up alerts for:
- Repeated webhook failures (Stripe will disable endpoint after 72 hours of failures)
- Unexpected event types
- Signature verification failures (possible attack)

---

## Current Implementation Status

### ✅ Completed

- [x] Webhook endpoint created: `POST /api/webhook/stripe`
- [x] Signature verification implemented
- [x] `checkout.session.completed` handler
- [x] Payment transaction status updates
- [x] MailChimp email integration ready

### ⚠️ Requires Configuration

- [ ] **Add webhook signing secret to production `.env`**
- [ ] **Configure webhook URL in Stripe Dashboard**
- [ ] **Test webhook in production environment**

### 🔮 Future Enhancements

- [ ] Handle `payment_intent.payment_failed` events
- [ ] Handle `customer.subscription.deleted` events  
- [ ] Handle `customer.subscription.trial_will_end` events
- [ ] Implement idempotency checks with event tracking
- [ ] Add webhook monitoring and alerting
- [ ] Store webhook logs in database for audit trail

---

## Quick Reference

**Local Development Webhook URL:**
```
http://localhost:8001/api/webhook/stripe
```

**Production Webhook URL:**
```
https://your-domain.com/api/webhook/stripe
```

**Environment Variable:**
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Backend File:**
```
/app/backend/server.py (lines 473-518)
```

**Test Webhook:**
```bash
stripe trigger checkout.session.completed
```

**View Logs:**
```bash
tail -f /var/log/supervisor/backend.out.log | grep webhook
```

---

## Support

If you encounter issues with webhook setup:

1. Check Stripe Dashboard → Webhooks → Recent deliveries
2. Review backend logs: `tail -f /var/log/supervisor/backend.err.log`
3. Test locally with Stripe CLI first
4. Verify SSL certificate and DNS configuration
5. Contact Stripe Support: [https://support.stripe.com](https://support.stripe.com)

---

**Last Updated**: {new Date().toISOString()}

**Application**: AI Bug Hunter & Code Analyzer  
**Stripe Integration**: Emergent Integrations v1.0  
**Backend Framework**: FastAPI  
