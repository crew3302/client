# 🚀 Pronote Deployment Guide

## ✅ Pre-Deployment Checklist

### Required Services Setup
- [x] Supabase Database (configured)
- [x] OpenAI API Key (configured)
- [x] Stripe Account (configured with 3 plans)
- [ ] PayPal Account (optional)
- [ ] Domain name (optional)

### Environment Variables Ready
- [x] Backend `.env` configured
- [x] Frontend `.env` configured
- [x] All API keys tested locally

---

## 📦 Deployment Options

You have **3 deployment configurations** ready:

### Option 1: **Vercel** (Recommended - Easiest)

**Backend:**
```bash
cd backend
vercel
```

**Frontend:**
```bash
cd frontend
vercel
```

**Environment Variables to Add in Vercel Dashboard:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_INDIVIDUAL_ANNUAL_PRICE_ID`
- `STRIPE_GROUP_MONTHLY_PRICE_ID`
- `STRIPE_GROUP_ANNUAL_PRICE_ID`
- `FRONTEND_URL` (add after frontend is deployed)

For Frontend:
- `VITE_API_URL` (add backend URL after backend is deployed)
- `VITE_USE_API=true`
- `VITE_STRIPE_PUBLISHABLE_KEY`

---

### Option 2: **Render** (Good Free Tier)

1. Push code to GitHub (already done ✅)
2. Go to https://render.com
3. Click "New +" → "Blueprint"
4. Connect your GitHub repo: `crew3302/client`
5. Render will auto-detect `render.yaml` and deploy both services
6. Add environment variables in Render dashboard

---

### Option 3: **Fly.io** (Backend only)

```bash
cd backend
fly launch --config fly.toml
fly secrets set SUPABASE_URL=your-url
fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
fly secrets set JWT_SECRET=your-secret
fly secrets set OPENAI_API_KEY=your-key
fly secrets set STRIPE_SECRET_KEY=your-key
fly secrets set STRIPE_INDIVIDUAL_ANNUAL_PRICE_ID=price_id
fly secrets set STRIPE_GROUP_MONTHLY_PRICE_ID=price_id
fly secrets set STRIPE_GROUP_ANNUAL_PRICE_ID=price_id
fly deploy
```

---

## 🔍 Current Status

**Local Development:** ✅ Running
- Backend: http://localhost:3001
- Frontend: http://localhost:5173

**Production Deployment:** ❌ Not yet deployed

---

## 📝 Next Steps to Deploy

### Quick Deploy (Vercel - 5 minutes)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy Backend:**
   ```bash
   cd backend
   vercel
   ```
   - Follow prompts
   - Copy the production URL (e.g., `https://pronote-api.vercel.app`)

3. **Add Backend Environment Variables:**
   - Go to https://vercel.com/dashboard
   - Select your backend project
   - Settings → Environment Variables
   - Add all required variables

4. **Deploy Frontend:**
   ```bash
   cd ../frontend
   vercel
   ```

5. **Add Frontend Environment Variables:**
   - `VITE_API_URL`: Your backend URL from step 2
   - `VITE_USE_API=true`
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key

6. **Update Backend CORS:**
   - Add `FRONTEND_URL` to backend env vars with your frontend URL

7. **Redeploy both to apply env vars:**
   ```bash
   vercel --prod
   ```

---

## 🧪 Post-Deployment Testing

After deployment, test:

1. **Health Check:**
   ```bash
   curl https://your-backend-url.vercel.app/health
   ```

2. **Frontend Loads:**
   Visit your frontend URL in browser

3. **Signup/Login:**
   Create account and login

4. **Subscription Plans:**
   Check if plans display correctly

5. **Stripe Integration:**
   Test checkout flow (use Stripe test mode)

---

## 🔐 Security Notes

- ✅ `.env` files are git-ignored
- ✅ API keys are not in code
- ⚠️ Remember to add env vars in deployment platform
- ⚠️ Use production API keys for production deployment
- ⚠️ Set up Stripe webhooks with production URLs

---

## 📞 Need Help?

Common issues:
- **CORS errors:** Update `FRONTEND_URL` in backend env vars
- **API not found:** Check `VITE_API_URL` in frontend env vars
- **Database errors:** Verify Supabase credentials
- **Build fails:** Check Node.js version (needs 18+)

