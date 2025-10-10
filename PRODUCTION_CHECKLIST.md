# Production Deployment Checklist

**Application**: AI Bug Hunter & Code Analyzer SaaS  
**Version**: 2.0.0  
**Target Platform**: emergence.host  
**Last Updated**: October 2025

---

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration

#### Backend Environment Variables (`.env`)
```bash
# Database
MONGO_URL=mongodb://your-production-mongo-url
DB_NAME=aibughunter_production

# API Keys
STRIPE_API_KEY=sk_live_xxxxxxxxxx  # MUST use live key
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxx  # Configure after deployment
MAILCHIMP_API_KEY=your_mailchimp_api_key
EMERGENT_LLM_KEY=your_emergent_llm_key

# Environment
ENVIRONMENT=production
```

#### Frontend Environment Variables (`.env`)
```bash
REACT_APP_BACKEND_URL=https://your-domain.com
```

- [ ] All environment variables configured
- [ ] Using **LIVE** Stripe keys (not test keys)
- [ ] MongoDB connection string updated for production
- [ ] Backend URL points to production domain

---

### 2. Security Hardening

- [ ] No API keys or secrets in code
- [ ] `.env` files are in `.gitignore`
- [ ] `.env.example` files created for documentation
- [ ] CORS origins updated to production domains
- [ ] Rate limiting configured (if applicable)
- [ ] SSL/HTTPS enforced
- [ ] Password hashing verified (bcrypt)
- [ ] JWT secret is strong and unique

---

### 3. Database Preparation

- [x] MongoDB indexes created (run `python backend/create_indexes.py`)
- [ ] Database backup strategy in place
- [ ] Connection pooling configured
- [ ] Database monitoring enabled

**Index Status**: ✅ All indexes created successfully

---

### 4. API & Backend

- [x] Health check endpoint (`/api/health`)
- [x] Version endpoint (`/api/version`)
- [x] All API routes use `/api` prefix
- [x] Analytics endpoints tested
- [ ] Error logging configured
- [ ] Performance monitoring enabled
- [ ] API rate limits set (optional)

**Verified Endpoints**:
- ✅ `/api/` - Base API health check
- ✅ `/api/health` - Detailed health check
- ✅ `/api/version` - Version information
- ✅ `/api/analytics/user/{user_id}` - User analytics
- ✅ `/api/analytics/admin/overview` - Admin overview
- ✅ `/api/analytics/admin/trends` - Admin trends
- ✅ `/api/webhook/stripe` - Stripe webhook handler

---

### 5. Frontend Build

- [ ] Production build created (`yarn build`)
- [ ] Build optimization verified
- [ ] No console errors in production build
- [ ] All routes accessible
- [ ] Analytics dashboards tested

**Build Command**:
```bash
cd /app/frontend && yarn build
```

---

### 6. Legal & Compliance

- [x] Terms of Service page published (`/terms`)
- [x] Privacy Policy page published (`/privacy`)
- [x] Support/Contact page published (`/support`)
- [x] Footer with legal links on all pages
- [x] GDPR/CCPA compliance documented
- [ ] Cookie consent banner (optional)

---

### 7. Payment Integration

#### Stripe Setup
- [ ] Switch from test keys to **LIVE** keys
- [ ] Verify payment links work in live mode
- [ ] Configure webhook endpoint in Stripe Dashboard
  - URL: `https://your-domain.com/api/webhook/stripe`
  - Events: `checkout.session.completed`, `payment_intent.*`, `customer.subscription.*`
- [ ] Copy webhook signing secret to `.env`
- [ ] Test payment flow end-to-end

**See `/app/WEBHOOK_SETUP.md` for detailed webhook configuration**

---

### 8. Email Automation

- [ ] MailChimp API key configured
- [ ] Audience/list created in MailChimp
- [ ] Email templates verified
- [ ] Test emails sent successfully

**Email Types**:
- Welcome email
- Subscription confirmation
- Trial expiration reminder
- Billing notifications
- Support responses

---

### 9. Analytics & Monitoring

- [x] User analytics dashboard implemented
- [x] Admin analytics dashboard implemented
- [x] Recharts library integrated
- [ ] Error tracking (Sentry, LogRocket, etc.)
- [ ] Performance monitoring (New Relic, Datadog, etc.)
- [ ] Uptime monitoring (UptimeRobot, Pingdom, etc.)

---

### 10. Testing

- [ ] All authentication flows tested
- [ ] Code analysis functionality tested
- [ ] Subscription upgrades tested
- [ ] Payment processing tested (use live test mode first)
- [ ] Analytics dashboards loaded correctly
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility checked

---

### 11. Performance Optimization

- [ ] MongoDB indexes verified
- [ ] Backend response times acceptable (<500ms)
- [ ] Frontend bundle size optimized
- [ ] Images compressed and optimized
- [ ] Lazy loading implemented where appropriate
- [ ] CDN configured (optional)

---

### 12. Documentation

- [x] README.md complete
- [x] DEPLOYMENT_SETUP.md created
- [x] WEBHOOK_SETUP.md created
- [x] COMPLIANCE_CHECKLIST.md created
- [x] PRODUCTION_CHECKLIST.md created (this file)
- [ ] API documentation published (optional)
- [ ] User guide created (optional)

---

## 🚀 Deployment Steps

### Step 1: Prepare Code

```bash
# 1. Ensure all changes are committed
git status

# 2. Create production branch (optional)
git checkout -b production

# 3. Verify no secrets in code
grep -r "sk_test" .
grep -r "pk_test" .
grep -r "api_key" .
```

### Step 2: Configure Environment

```bash
# Backend
cp /app/backend/.env.example /app/backend/.env
# Edit .env with production values
nano /app/backend/.env

# Frontend
cp /app/frontend/.env.example /app/frontend/.env
# Edit .env with production values
nano /app/frontend/.env
```

### Step 3: Build Frontend

```bash
cd /app/frontend
yarn install
yarn build
```

### Step 4: Verify Services

```bash
# Check backend
curl http://localhost:8001/api/health

# Check frontend build
ls -lh /app/frontend/build
```

### Step 5: Deploy to emergence.host

**Follow emergence.host deployment instructions**:

1. Connect your repository to emergence.host
2. Set environment variables in emergence.host dashboard
3. Deploy application
4. Verify deployment URL

### Step 6: Post-Deployment Configuration

```bash
# 1. Configure Stripe Webhook
# Go to Stripe Dashboard → Webhooks
# Add endpoint: https://your-domain.com/api/webhook/stripe
# Copy webhook signing secret
# Update STRIPE_WEBHOOK_SECRET in environment

# 2. Test webhook
# Use Stripe CLI: stripe trigger checkout.session.completed

# 3. Verify all integrations
curl https://your-domain.com/api/health
curl https://your-domain.com/api/version
```

### Step 7: Smoke Testing

- [ ] Visit homepage
- [ ] Create test account
- [ ] Login successfully
- [ ] Run code analysis
- [ ] Check analytics dashboard
- [ ] Test subscription upgrade
- [ ] Verify email received

---

## 🔧 Post-Deployment Tasks

### Immediate (Within 1 Hour)

- [ ] Verify application is accessible
- [ ] Test core user flows
- [ ] Check error logs
- [ ] Verify database connections
- [ ] Test webhook endpoint

### Within 24 Hours

- [ ] Monitor error rates
- [ ] Check analytics data flowing
- [ ] Verify email delivery
- [ ] Test payment processing with real transaction
- [ ] Set up monitoring alerts

### Within 1 Week

- [ ] Review performance metrics
- [ ] Analyze user feedback
- [ ] Optimize slow queries
- [ ] Plan feature improvements
- [ ] Update documentation

---

## 🚨 Rollback Plan

### If Critical Issues Occur:

1. **Immediately**:
   - Put maintenance page up (if available)
   - Notify users via status page

2. **Investigate**:
   - Check error logs: `tail -f /var/log/supervisor/backend.err.log`
   - Check health endpoint: `curl https://your-domain.com/api/health`
   - Review recent changes

3. **Rollback**:
   - Revert to previous stable version
   - Restore database backup if needed
   - Clear caches
   - Restart services

4. **Verify**:
   - Test core functionality
   - Check monitoring dashboards
   - Notify users issue is resolved

---

## 📊 Success Metrics

### Technical Metrics
- API response time < 500ms (p95)
- Error rate < 1%
- Uptime > 99.5%
- Page load time < 3 seconds

### Business Metrics
- User registrations
- Analysis completion rate
- Free to paid conversion rate
- Monthly recurring revenue (MRR)

---

## 🆘 Emergency Contacts

**Technical Support**:
- Backend issues: tech@aibughunter.com
- Database issues: [DBA contact]
- Hosting issues: emergence.host support

**External Services**:
- Stripe Support: https://support.stripe.com
- MongoDB Atlas: https://support.mongodb.com
- MailChimp Support: https://mailchimp.com/contact

---

## ✅ Final Verification

Before marking deployment complete, verify:

```bash
# Health checks
curl https://your-domain.com/api/health
curl https://your-domain.com/api/version

# Public pages
curl -I https://your-domain.com/
curl -I https://your-domain.com/terms
curl -I https://your-domain.com/privacy
curl -I https://your-domain.com/support

# Authentication
# (Test via browser)

# Analytics
curl https://your-domain.com/api/analytics/admin/overview
```

**All systems green?** ✅ Deployment successful!

---

## 📝 Deployment Log Template

```
=== DEPLOYMENT LOG ===
Date: [YYYY-MM-DD HH:MM]
Version: 2.0.0
Deployed By: [Name]
Environment: Production

Pre-deployment checks: [PASS/FAIL]
Build status: [SUCCESS/FAILED]
Deployment status: [SUCCESS/FAILED]
Post-deployment tests: [PASS/FAIL]

Issues encountered:
- [None / List issues]

Resolution:
- [N/A / Describe resolution]

Final status: [DEPLOYED / ROLLED BACK]
Notes: [Additional notes]
```

---

**Good luck with your deployment! 🚀**

For detailed webhook setup, see `/app/WEBHOOK_SETUP.md`  
For legal compliance status, see `/app/COMPLIANCE_CHECKLIST.md`  
For deployment instructions, see `/app/DEPLOYMENT_SETUP.md`
