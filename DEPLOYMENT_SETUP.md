# AI Bug Hunter SaaS - Deployment Setup Guide

## 🔒 Environment Variables Setup

**IMPORTANT**: The actual `.env` files containing secrets have been removed for security. Follow these steps to configure your environment variables.

## 1. Backend Environment Setup

Copy the example file and fill in your actual values:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your actual credentials:

### Required Credentials:

#### **Stripe Configuration** (Required for subscriptions)
- `STRIPE_API_KEY`: Your Stripe secret key (sk_live_...)
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (pk_live_...)
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret (whsec_...)
- `STRIPE_BASIC_PRICE_ID`: price_1SF9C7LPRbXW6PGNIYt7BuMt
- `STRIPE_PRO_PRICE_ID`: price_1SEnBjLPRbXW6PGNp0BN2yi0
- `STRIPE_ENTERPRISE_PRICE_ID`: price_1SF9DTLPRbXW6PGNaOZtAz9u
- `STRIPE_BASIC_PAYMENT_LINK`: https://buy.stripe.com/14A6oI9cqdjx2o29Wj83C00
- `STRIPE_PRO_PAYMENT_LINK`: https://buy.stripe.com/eVq9AUcoC2ET4wa6K783C01
- `STRIPE_ENTERPRISE_PAYMENT_LINK`: https://buy.stripe.com/28E8wQ1JY4N17Im2tR83C02

#### **MailChimp Configuration** (Required for email automation)
- `MAILCHIMP_API_KEY`: Your MailChimp API key
- `MAILCHIMP_SERVER_PREFIX`: Your server prefix (e.g., us12)
- `DEFAULT_AUDIENCE_ID`: Your MailChimp audience/list ID

#### **AI/LLM Configuration** (Optional - for advanced AI analysis)
- `EMERGENT_LLM_KEY`: Your Emergent LLM key (recommended)
- `ANTHROPIC_API_KEY`: Your Anthropic API key (alternative)

## 2. Frontend Environment Setup

Copy the example file and update the backend URL:
```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```
REACT_APP_BACKEND_URL=https://your-deployed-backend-url.com
WDS_SOCKET_PORT=443
```

## 3. Deployment on Emergent Platform

### Step 1: Configure Environment Variables in Emergent
1. Go to your app settings in Emergent dashboard
2. Navigate to "Environment Variables" section
3. Add all the variables from your `backend/.env` file
4. Update `REACT_APP_BACKEND_URL` to your live backend URL
5. Update `APP_BASE_URL` to your live frontend URL

### Step 2: Deploy
1. Click "Deploy Now" in your Emergent dashboard
2. Your app will be deployed with a public URL
3. Update your Stripe webhook URL to point to your live backend
4. Test all functionality in production

## 4. Security Checklist

- ✅ Removed .env files from repository
- ✅ Added .env.example templates
- ✅ Configured secrets in Emergent environment variables
- ✅ Updated webhook URLs for production
- ✅ Tested payment flows in production

## 5. Post-Deployment Steps

1. **Update Stripe Webhooks**: Point to your live URL + `/api/webhook/stripe`
2. **Test Subscription Flow**: Verify all 3 tiers work correctly
3. **Test Email Automation**: Confirm welcome and subscription emails
4. **Monitor Logs**: Check for any production issues
5. **Set Up Custom Domain**: Configure your purchased domain

## 6. Backup Your Credentials

Store your actual environment variables securely:
- Use a password manager
- Keep encrypted backups
- Document which keys belong to which services

---

Your AI Bug Hunter SaaS Platform is now ready for secure deployment! 🚀