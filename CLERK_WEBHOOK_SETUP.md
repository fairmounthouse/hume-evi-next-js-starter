# 🔗 Clerk Webhook Setup Guide

This guide will help you set up Clerk webhooks for real-time user synchronization between Clerk and Supabase after you deploy your application.

## 📋 **Prerequisites**

- ✅ Application deployed to production (Vercel, Netlify, etc.)
- ✅ Clerk project configured with billing enabled
- ✅ Supabase database set up with user tables
- ✅ Environment variables configured in production

---

## 🚀 **Step 1: Get Your Production URL**

After deploying, you'll have a production URL like:
- **Vercel**: `https://your-app-name.vercel.app`
- **Netlify**: `https://your-app-name.netlify.app`
- **Custom Domain**: `https://yourdomain.com`

**Your webhook endpoint will be:** `https://yourdomain.com/api/webhooks/clerk`

---

## ⚙️ **Step 2: Configure Webhook in Clerk Dashboard**

### 1. **Access Clerk Dashboard**
- Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
- Select your project
- Navigate to **"Webhooks"** in the left sidebar

### 2. **Create New Webhook**
- Click **"Add Endpoint"** button
- **Endpoint URL:** `https://yourdomain.com/api/webhooks/clerk`
  - Replace `yourdomain.com` with your actual production URL
- **Description:** "User sync webhook for Supabase integration"

### 3. **Select Events**
Check these events (CRITICAL - must select all):
- ✅ `user.created` - When new users sign up
- ✅ `user.updated` - When users update their profile
- ✅ `user.deleted` - When users are deleted
- ✅ `session.created` - When users log in (optional but recommended)

### 4. **Save Webhook**
- Click **"Create"** button
- **IMPORTANT:** Copy the **Signing Secret** that appears
- It will look like: `whsec_1234567890abcdef...`

---

## 🔐 **Step 3: Update Environment Variables**

### **Production Environment (.env.production or deployment platform)**

Add the webhook secret to your production environment:

```bash
# Clerk Webhook Secret (REPLACE with your actual secret)
CLERK_WEBHOOK_SECRET=whsec_your_actual_signing_secret_here
```

### **Platform-Specific Instructions:**

#### **Vercel:**
1. Go to your project dashboard on Vercel
2. Click **"Settings"** → **"Environment Variables"**
3. Add new variable:
   - **Name:** `CLERK_WEBHOOK_SECRET`
   - **Value:** `whsec_your_actual_signing_secret_here`
   - **Environment:** Production
4. **Redeploy** your application

#### **Netlify:**
1. Go to your site dashboard on Netlify
2. Click **"Site settings"** → **"Environment variables"**
3. Click **"Add a variable"**:
   - **Key:** `CLERK_WEBHOOK_SECRET`
   - **Value:** `whsec_your_actual_signing_secret_here`
4. **Redeploy** your application

#### **Other Platforms:**
Add the environment variable according to your platform's documentation.

---

## 🧪 **Step 4: Test the Webhook**

### **1. Test User Creation**
- Sign up a new user in your production app
- Check Supabase database to see if user was created
- Check webhook logs in Clerk dashboard

### **2. Test User Updates**
- Update user profile in your app
- Verify changes sync to Supabase
- Check for any errors in logs

### **3. Monitor Webhook Status**
In Clerk Dashboard → Webhooks → Your webhook:
- ✅ **Green status** = Working correctly
- ❌ **Red status** = Check logs for errors

---

## 🔍 **Step 5: Verify Integration**

### **Check Supabase Database**
Run this query in Supabase SQL Editor:
```sql
SELECT 
  clerk_id, 
  email, 
  first_name, 
  last_name, 
  created_at, 
  updated_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;
```

### **Expected Behavior:**
- ✅ New users appear in Supabase immediately after Clerk signup
- ✅ Profile updates sync in real-time
- ✅ All user data fields are populated correctly

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **1. Webhook Returns 401 Unauthorized**
- ❌ **Problem:** Wrong or missing signing secret
- ✅ **Solution:** Double-check `CLERK_WEBHOOK_SECRET` in production env

#### **2. Webhook Returns 500 Internal Server Error**
- ❌ **Problem:** Database connection or function error
- ✅ **Solution:** Check Supabase connection and RPC functions

#### **3. Users Not Syncing**
- ❌ **Problem:** Webhook not triggering or failing silently
- ✅ **Solution:** Check Clerk webhook logs and Vercel/Netlify function logs

#### **4. Partial Data Syncing**
- ❌ **Problem:** Missing user fields in database
- ✅ **Solution:** Verify `ensure_user_exists` function accepts all parameters

### **Debug Steps:**

1. **Check Webhook Logs in Clerk:**
   - Go to Webhooks → Your webhook → "Recent deliveries"
   - Look for failed requests (red status)

2. **Check Production Logs:**
   - **Vercel:** Functions tab → View logs
   - **Netlify:** Functions tab → View logs
   - Look for webhook-related errors

3. **Test Webhook Manually:**
   ```bash
   # Test webhook endpoint directly
   curl -X POST https://yourdomain.com/api/webhooks/clerk \
     -H "Content-Type: application/json" \
     -d '{"test": "webhook"}'
   ```

---

## 📊 **Monitoring & Maintenance**

### **Regular Checks:**
- ✅ Monitor webhook success rate in Clerk dashboard
- ✅ Verify user data consistency between Clerk and Supabase
- ✅ Check for any failed webhook deliveries

### **Performance:**
- Webhooks should respond within 5 seconds
- Failed webhooks will be retried automatically by Clerk
- Monitor your database performance under webhook load

---

## 🔄 **Webhook Payload Examples**

### **User Created Event:**
```json
{
  "type": "user.created",
  "data": {
    "id": "user_2abc123def456",
    "email_addresses": [{"email_address": "user@example.com"}],
    "first_name": "John",
    "last_name": "Doe",
    "image_url": "https://img.clerk.com/...",
    // ... more user data
  }
}
```

### **User Updated Event:**
```json
{
  "type": "user.updated",
  "data": {
    "id": "user_2abc123def456",
    "email_addresses": [{"email_address": "newemail@example.com"}],
    "first_name": "Jane",
    "last_name": "Smith",
    // ... updated user data
  }
}
```

---

## ✅ **Success Checklist**

After setup, verify these work:

- [ ] New user signup → User appears in Supabase immediately
- [ ] User profile update → Changes sync to Supabase
- [ ] User deletion → User marked as deleted in Supabase
- [ ] Webhook shows green status in Clerk dashboard
- [ ] No errors in production logs
- [ ] All user fields populate correctly
- [ ] Real-time sync works consistently

---

## 📞 **Need Help?**

If you encounter issues:

1. **Check this guide first** - Most issues are covered above
2. **Review webhook logs** in Clerk dashboard
3. **Check production logs** in your deployment platform
4. **Test manually** using curl commands
5. **Verify environment variables** are set correctly

---

## 🎯 **Quick Reference**

**Webhook URL Format:** `https://yourdomain.com/api/webhooks/clerk`

**Required Events:**
- `user.created`
- `user.updated` 
- `user.deleted`
- `session.created` (optional)
- `subscription.created` (for plan upgrades)
- `subscription.updated` (for plan changes)
- `subscription.cancelled` (for downgrades)
- `subscription.deleted` (for cancellations)

**Environment Variable:**
```bash
CLERK_WEBHOOK_SECRET=whsec_your_signing_secret_here
```

**Test Command:**
```bash
curl -X POST https://yourdomain.com/api/webhooks/clerk -H "Content-Type: application/json" -d '{"test": true}'
```

---

*This webhook enables real-time synchronization between Clerk and Supabase, ensuring your user data is always up-to-date across both systems!* 🚀
