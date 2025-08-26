# 🎯 Usage-Based Plan Management with Clerk

Big Daddy, you're absolutely right! Since you're using **usage-based limits** instead of feature locks, here's how we've optimized the system:

## 🔍 **The Approach: Clerk Plans → Usage Limits**

### **Step 1: Use Clerk `has()` to Infer Plan**
```typescript
const { has } = await auth()

// Check what plan user has (following Clerk docs)
const hasPremium = has({ plan: 'premium' })        // Boolean
const hasProfessional = has({ plan: 'professional' }) // Boolean  
const hasStarter = has({ plan: 'starter' })        // Boolean
```

### **Step 2: Map Plan to Usage Limits**
```typescript
// Based on the plan, we get their usage limits:
const userPlan = getUserPlan(has) // Returns plan config

// Plan config includes usage limits:
{
  key: 'premium',
  name: 'Premium', 
  price: 99,
  limits: {
    minutesPerMonth: -1,        // Unlimited
    interviewsPerDay: -1,       // Unlimited
    detailedAnalysesPerMonth: -1, // Unlimited
    videoReviewsPerMonth: -1    // Unlimited
  }
}
```

### **Step 3: Enforce via Supabase Usage Tracking**
```typescript
// When user tries to use a feature, check against their limits:
const currentUsage = await getUserUsageSummary(clerkId)
const userLimits = getUserLimits(userPlan)

if (currentUsage.minutesUsed >= userLimits.minutesPerMonth) {
  return "Usage limit reached"
}
```

## 🎯 **Plan Configuration (Single Source of Truth)**

```typescript
export const PLAN_CONFIGS: PlanConfig[] = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    isFree: true,
    features: ['basic_interviews'], // Display only
    limits: {
      minutesPerMonth: 2,           // Very limited
      interviewsPerDay: 1,
      detailedAnalysesPerMonth: 0,  // None allowed
      videoReviewsPerMonth: 0,      // None allowed
    }
  },
  {
    key: 'starter', 
    name: 'Starter',
    price: 30,
    limits: {
      minutesPerMonth: 120,         // 2 hours
      interviewsPerDay: 3,
      detailedAnalysesPerMonth: 5,
      videoReviewsPerMonth: 3,
    }
  },
  {
    key: 'professional',
    name: 'Professional', 
    price: 50,
    limits: {
      minutesPerMonth: 300,         // 5 hours
      interviewsPerDay: 5,
      detailedAnalysesPerMonth: 15,
      videoReviewsPerMonth: 10,
    }
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 99,
    limits: {
      minutesPerMonth: -1,          // Unlimited
      interviewsPerDay: -1,         // Unlimited
      detailedAnalysesPerMonth: -1, // Unlimited
      videoReviewsPerMonth: -1,     // Unlimited
    }
  }
]
```

## 🚀 **How It Works in Practice**

### **In Components:**
```typescript
import { usePlan } from '@/hooks/usePlan'

function InterviewComponent() {
  const { limits, unlimited, canUseFeature } = usePlan()
  
  // Check if user can start an interview
  if (limits.interviewsPerDay === 0) {
    return <UpgradePrompt feature="interviews" />
  }
  
  // Check if user can use detailed analysis
  if (!canUseFeature('detailed_analysis')) {
    return <UpgradePrompt feature="detailed analysis" />
  }
  
  // Show unlimited badge for premium users
  {unlimited.minutes && <Badge>Unlimited Minutes</Badge>}
}
```

### **In API Routes:**
```typescript
import { auth } from "@clerk/nextjs/server"
import { getUserPlan, getUserLimits } from "@/utils/plan-config"

export async function POST() {
  const { userId, has } = await auth()
  
  // Get user's plan and limits
  const userPlan = getUserPlan(has)
  const limits = getUserLimits(userPlan)
  
  // Check if they can use detailed analysis
  if (limits.detailedAnalysesPerMonth === 0) {
    return NextResponse.json({ 
      error: "Detailed analysis not available on your plan" 
    }, { status: 403 })
  }
  
  // Check current usage against limits
  const currentUsage = await getUserUsageSummary(userId)
  if (currentUsage.analyses >= limits.detailedAnalysesPerMonth) {
    return NextResponse.json({ 
      error: "Monthly detailed analysis limit reached" 
    }, { status: 429 })
  }
  
  // Proceed with analysis...
}
```

## 🔍 **Feature Inference Logic**

Instead of feature flags, we infer capabilities from usage limits:

```typescript
export function canUseFeature(userPlan: PlanConfig, feature: string): boolean {
  switch (feature) {
    case 'detailed_analysis':
      return userPlan.limits.detailedAnalysesPerMonth !== 0
    case 'video_review':
      return userPlan.limits.videoReviewsPerMonth !== 0
    case 'unlimited_sessions':
      return userPlan.limits.interviewsPerDay === -1
    case 'advanced_analytics':
      return userPlan.key === 'premium' // Only premium
    default:
      return false
  }
}
```

## 🎯 **Benefits of This Approach**

### **✅ Clerk Handles Billing:**
- Plan subscriptions managed by Clerk
- Payment processing via Stripe
- Real-time plan status via `has()`

### **✅ You Control Usage:**
- Usage limits defined in your config
- Enforcement via Supabase tracking
- Flexible limit adjustments

### **✅ No Feature Flag Complexity:**
- No need to configure features in Clerk Dashboard
- Features inferred from usage limits
- Simpler plan management

### **✅ Real-Time & Accurate:**
- `has()` returns current plan status
- No sync delays or inconsistencies
- Immediate plan changes reflected

## 🔧 **Setup Requirements**

### **In Clerk Dashboard:**
1. **Create Plans** with these exact keys:
   - `premium`
   - `professional` 
   - `starter`
   - (No `free` plan - it's the default)

2. **No Features Needed** - we infer from usage limits!

### **In Your Code:**
- Plan keys must match Clerk exactly
- Usage limits enforced via Supabase
- Features inferred from limits

## 🚨 **Key Differences from Feature-Based**

### **Feature-Based (Complex):**
```typescript
// Would need to configure each feature in Clerk:
has({ feature: 'detailed_analysis' })    // Requires Clerk config
has({ feature: 'video_review' })         // Requires Clerk config
has({ feature: 'unlimited_sessions' })   // Requires Clerk config
```

### **Usage-Based (Simple):**
```typescript
// Just check the plan, infer capabilities:
has({ plan: 'premium' })                 // Simple plan check
// Then map to: unlimited minutes, analyses, etc.
```

## 🎉 **Example Flow**

### **User Tries to Use Detailed Analysis:**

1. **Check Plan**: `has({ plan: 'premium' })` → `true`
2. **Get Limits**: Premium = unlimited analyses (`-1`)
3. **Check Usage**: Current usage = 50 analyses this month
4. **Decision**: Allow (unlimited > 50) ✅

### **Free User Tries Detailed Analysis:**

1. **Check Plan**: `has({ plan: 'premium' })` → `false`, `has({ plan: 'starter' })` → `false` → Free plan
2. **Get Limits**: Free = 0 analyses allowed
3. **Decision**: Block (0 analyses allowed) ❌

## 🔍 **Debug Your Setup**

Visit `/api/plans/debug` to see:
- What plan Clerk thinks you have
- What usage limits that maps to
- How features are inferred
- Current usage vs limits

**This approach gives you the best of both worlds: Clerk's robust billing + your flexible usage control!** 🎯

---

**The key insight: Use Clerk for "what plan do they have?" and your config for "what can they do with that plan?"** 🚀
