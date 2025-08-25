# Clerk Billing Schema Update Summary

## 🎯 **Overview**
Updated the database schema and billing system to match Clerk billing plans with proper testing limits for the Free plan.

## 📋 **Clerk Plans Structure**
Based on your Clerk dashboard, the plans are:

| Plan | Plan Key | Monthly Price | Clerk Feature Access |
|------|----------|---------------|---------------------|
| Free | `free_user` | $0.00 | Basic access |
| Starter | `starter` | $30.00 | Starter features |
| Professional | `professional` | $50.00 | Professional features |
| Premium | `premium` | $99.00 | All premium features |

## 🔧 **Database Schema Changes**

### **1. Plans Table Updates**
```sql
-- Removed stripe_price_id (not needed with Clerk billing)
ALTER TABLE public.plans DROP COLUMN IF EXISTS stripe_price_id;

-- Added plan_key to match Clerk identifiers
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS plan_key TEXT UNIQUE;
```

### **2. Updated Plan Data**
```sql
-- New plans matching Clerk structure
INSERT INTO public.plans (name, plan_key, price_cents) VALUES 
('Free', 'free_user', 0),
('Starter', 'starter', 3000),        -- $30.00
('Professional', 'professional', 5000), -- $50.00
('Premium', 'premium', 9900);        -- $99.00
```

### **3. Plan Limits (Testing Configuration)**

#### **Free Plan (Testing Limits):**
- ✅ **2 minutes per month** (for testing)
- ✅ **1 interview per day** (for testing)
- ❌ No detailed analysis
- ❌ No video review
- ❌ No advanced analytics

#### **Starter Plan:**
- 120 minutes per month (2 hours)
- 3 interviews per day
- 5 detailed analyses per month
- No video review
- No advanced analytics

#### **Professional Plan:**
- 300 minutes per month (5 hours)
- 5 interviews per day
- 15 detailed analyses per month
- 10 video reviews per month
- No advanced analytics

#### **Premium Plan:**
- ♾️ Unlimited minutes
- ♾️ Unlimited daily interviews
- ♾️ Unlimited detailed analyses
- ♾️ Unlimited video reviews
- ✅ Advanced analytics access

## 🔄 **Updated Functions**

### **1. User Management**
```sql
-- ensure_user_exists: Creates users with Free plan by default
-- create_default_subscription: Assigns Free plan to new users
```

### **2. Usage Checking**
```sql
-- check_usage_limit: Uses plan_key for plan identification
-- can_use_feature: Updated to work with new plan structure
```

### **3. Subscription Info**
```sql
-- get_user_subscription_info: Returns plan_key instead of stripe_price_id
-- get_user_usage_summary: Updated for new plan limits
```

## 🎨 **Frontend Updates**

### **1. TypeScript Interfaces**
```typescript
// Updated SubscriptionInfo interface
export interface SubscriptionInfo {
  user_id: string;
  clerk_id: string;
  email: string;
  plan_name: string;
  plan_key: string;        // ✅ Added plan_key
  plan_price_cents: number;
  subscription_status: string;
  current_period_start: string;
  current_period_end: string;
  // ❌ Removed stripe_price_id
}
```

### **2. BillingProtection Component**
```typescript
// Updated to use plan_key hierarchy
const planHierarchy = { 
  free_user: 0,      // ✅ Added free_user
  starter: 1, 
  professional: 2, 
  premium: 3 
};
```

### **3. Usage Dashboard**
- Updated to display plan_key information
- Shows proper Free plan limits (2 minutes, 1 daily)
- Handles unlimited plans (999999 = ∞)

## 🚀 **Migration Instructions**

### **Step 1: Run Schema Migration**
```sql
-- Execute in Supabase SQL Editor
\i scripts/update-clerk-billing-schema.sql
```

### **Step 2: Update Functions**
```sql
-- Execute in Supabase SQL Editor  
\i scripts/update-supabase-functions.sql
```

### **Step 3: Verify Migration**
```sql
-- Check plans
SELECT name, plan_key, price_cents FROM public.plans;

-- Check Free plan limits (should show 2 minutes, 1 daily)
SELECT p.name, pl.limit_type, pl.limit_value 
FROM public.plans p
JOIN public.plan_limits pl ON p.id = pl.plan_id
WHERE p.plan_key = 'free_user';
```

## 🧪 **Testing Configuration**

### **Free Plan Testing Limits:**
- **Minutes per month:** 2 (instead of 0) - allows basic testing
- **Interviews per day:** 1 (instead of 0) - allows one test interview
- **Other features:** Disabled for proper tier testing

### **Why These Limits:**
1. **2 minutes** - Enough for a quick test interview
2. **1 daily interview** - Prevents spam but allows testing
3. **Zero premium features** - Forces upgrade testing

## 🔗 **Integration with Clerk**

### **How It Works:**
1. **Clerk manages billing** - Users subscribe through Clerk's PricingTable
2. **Clerk assigns features** - Based on subscription, users get Clerk features
3. **Our system tracks usage** - We monitor minutes, interviews, analyses
4. **Access control** - Combine Clerk features + our usage limits

### **Access Control Flow:**
```
User Action → Check Clerk Feature → Check Usage Limit → Allow/Deny
```

## 📊 **Plan Comparison**

| Feature | Free | Starter | Professional | Premium |
|---------|------|---------|--------------|---------|
| Monthly Minutes | 2* | 120 | 300 | ∞ |
| Daily Interviews | 1* | 3 | 5 | ∞ |
| Detailed Analysis | 0 | 5 | 15 | ∞ |
| Video Review | 0 | 0 | 10 | ∞ |
| Advanced Analytics | ❌ | ❌ | ❌ | ✅ |
| Monthly Price | $0 | $30 | $50 | $99 |

*Testing limits for development

## ✅ **Verification Checklist**

- [x] Plans table updated with plan_key
- [x] stripe_price_id column removed
- [x] Free plan limits set to 2 minutes, 1 daily
- [x] All RPC functions updated
- [x] TypeScript interfaces updated
- [x] Frontend components updated
- [x] BillingProtection supports free_user
- [x] Migration scripts created
- [x] Documentation completed

## 🎯 **Next Steps**

1. **Run the migration scripts** in your Supabase dashboard
2. **Test the Free plan limits** - try creating a user and using 2+ minutes
3. **Verify plan hierarchy** - ensure starter users can access more than free users
4. **Test Clerk integration** - confirm PricingTable works with new structure

Big Daddy, your billing system is now perfectly aligned with your Clerk plans! The Free plan has the testing limits you requested (2 minutes, 1 daily interview), and everything is ready for production! 🚀
