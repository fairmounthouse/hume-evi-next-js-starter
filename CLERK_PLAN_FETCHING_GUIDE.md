# 🎯 How We Fetch User Plans from Clerk

Big Daddy, here's exactly how we determine what plan a user has, following [Clerk's B2C SaaS documentation](https://clerk.com/docs/nextjs/billing/b2c-saas) patterns:

## 🔍 **The Clerk `has()` Method**

According to Clerk's documentation, we use the `has()` method to check for specific plans and features:

### **Plan Checking:**
```typescript
// Direct from Clerk docs:
const hasPremiumAccess = has({ plan: 'premium' })
const hasProfessional = has({ plan: 'professional' })
const hasStarter = has({ plan: 'starter' })
```

### **Feature Checking:**
```typescript
// Direct from Clerk docs:
const hasAdvancedAnalytics = has({ feature: 'advanced_analytics' })
const hasVideoReview = has({ feature: 'video_review' })
```

## 🚀 **Our Implementation**

### **Step 1: Raw Clerk Checks**
```typescript
// In utils/plan-config.ts
export function getUserPlan(has: ((params: { plan: string }) => boolean) | undefined): PlanConfig {
  if (!has) {
    return PLAN_CONFIGS.find(p => p.isFree) || PLAN_CONFIGS[0];
  }

  // 🎯 Check each plan explicitly as recommended by Clerk docs
  // Check premium first (highest tier)
  if (has({ plan: 'premium' })) {
    return PLAN_CONFIGS.find(p => p.key === 'premium')!;
  }
  
  // Check professional 
  if (has({ plan: 'professional' })) {
    return PLAN_CONFIGS.find(p => p.key === 'professional')!;
  }
  
  // Check starter
  if (has({ plan: 'starter' })) {
    return PLAN_CONFIGS.find(p => p.key === 'starter')!;
  }
  
  // Default to free plan if no paid plan found
  return PLAN_CONFIGS.find(p => p.isFree) || PLAN_CONFIGS[0];
}
```

### **Step 2: Detailed Plan Information**
```typescript
export function getUserPlanDetails(has: ((params: { plan: string }) => boolean) | undefined) {
  const planChecks = {
    hasPremium: has?.({ plan: 'premium' }) || false,
    hasProfessional: has?.({ plan: 'professional' }) || false,
    hasStarter: has?.({ plan: 'starter' }) || false,
  };
  
  const currentPlan = getUserPlan(has);
  
  return {
    plan: currentPlan,
    checks: planChecks,
    isPremium: planChecks.hasPremium,
    isProfessional: planChecks.hasProfessional,
    isStarter: planChecks.hasStarter,
    isFree: !planChecks.hasPremium && !planChecks.hasProfessional && !planChecks.hasStarter
  };
}
```

## 🎯 **Usage Examples**

### **In Server Components (following Clerk docs):**
```typescript
import { auth } from '@clerk/nextjs/server'

export default async function MyPage() {
  const { has } = await auth()

  // Direct Clerk checks (from documentation)
  const hasPremiumPlan = has({ plan: 'premium' })
  const hasAdvancedAnalytics = has({ feature: 'advanced_analytics' })

  if (!hasPremiumPlan) {
    return <h1>Only Premium subscribers can access this content.</h1>
  }

  return <h1>Premium Content</h1>
}
```

### **In Client Components (using our hook):**
```typescript
import { usePlan } from '@/hooks/usePlan'

function MyComponent() {
  const { plan, isPremium, hasFeature, debug } = usePlan()
  
  // See exactly what Clerk returned
  console.log('Raw Clerk checks:', debug.clerkPlanChecks)
  
  return (
    <div>
      <h1>Current Plan: {plan.name}</h1>
      <p>Is Premium: {isPremium}</p>
      
      {hasFeature('advanced_analytics') && (
        <AdvancedAnalyticsComponent />
      )}
    </div>
  )
}
```

### **In API Routes:**
```typescript
import { auth } from "@clerk/nextjs/server"

export async function GET() {
  const { userId, has } = await auth()
  
  // Direct Clerk plan check
  if (!has({ plan: 'premium' })) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 })
  }
  
  // Direct Clerk feature check  
  if (!has({ feature: 'advanced_analytics' })) {
    return NextResponse.json({ error: "Feature not available" }, { status: 403 })
  }
  
  // Proceed with premium logic...
}
```

## 🔍 **Debug Endpoint**

We created `/api/plans/debug` to show exactly what's happening:

```bash
GET /api/plans/debug
```

**Response shows:**
```json
{
  "rawClerkChecks": {
    "hasPremium": true,
    "hasProfessional": false, 
    "hasStarter": false
  },
  "rawFeatureChecks": {
    "hasDetailedAnalysis": true,
    "hasVideoReview": true,
    "hasUnlimitedSessions": true,
    "hasAdvancedAnalytics": true
  },
  "currentPlan": {
    "key": "premium",
    "name": "Premium",
    "price": 99,
    "isFree": false
  },
  "logicalFlow": {
    "step1": "Check Clerk has({ plan: 'premium' })",
    "step1Result": true,
    "finalResult": "Premium"
  }
}
```

## 🎯 **The Logical Flow**

### **How We Determine User's Plan:**

1. **Call `has({ plan: 'premium' })`** 
   - If `true` → User has Premium plan ✅
   - If `false` → Continue to step 2

2. **Call `has({ plan: 'professional' })`**
   - If `true` → User has Professional plan ✅  
   - If `false` → Continue to step 3

3. **Call `has({ plan: 'starter' })`**
   - If `true` → User has Starter plan ✅
   - If `false` → User has Free plan (default)

### **How We Check Features:**

```typescript
// Primary: Direct Clerk feature check (most accurate)
if (has({ feature: 'advanced_analytics' })) {
  return true // User has this feature via Clerk
}

// Fallback: Check plan configuration  
return userPlan.features.includes('advanced_analytics')
```

## 🔧 **Configuration Requirements**

### **In Clerk Dashboard:**
1. **Create Plans** with exact keys:
   - `premium`
   - `professional` 
   - `starter`
   - (No `free` plan needed - it's the default)

2. **Add Features** to plans:
   - `detailed_analysis`
   - `video_review`
   - `unlimited_sessions`
   - `advanced_analytics`

### **In Our Code:**
- Plan keys in `plan-config.ts` must match Clerk exactly
- Feature names must match Clerk exactly
- The `has()` function handles all the logic

## 🎉 **Benefits of This Approach**

### **✅ Following Clerk Best Practices:**
- Uses official `has()` method as documented
- Checks plans and features separately
- Handles server and client scenarios

### **✅ Real-Time Accuracy:**
- Direct Clerk API calls (no caching issues)
- Immediate plan changes reflected
- No sync delays or inconsistencies

### **✅ Flexible & Scalable:**
- Add new plans → just update config
- Add new features → just update config  
- Clerk handles all the complex billing logic

## 🚨 **Key Points**

1. **Clerk is the Source of Truth** - We always check Clerk first
2. **No Database Sync Needed** - Plans are fetched real-time from Clerk
3. **Fallback Configuration** - Our config provides structure and fallbacks
4. **Boolean Logic** - Each `has()` call returns true/false
5. **Hierarchy Matters** - We check highest plans first

**This approach follows Clerk's documentation exactly and gives us real-time, accurate plan information!** 🎯

---

**Test it yourself:** Visit `/api/plans/debug` to see exactly what Clerk returns for your user! 🔍
