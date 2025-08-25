# 🎛️ Feature Control System Guide

⚠️ **DEPRECATED:** This guide is no longer relevant as we've removed all feature restrictions. 

**Current Model:** All features are available to everyone - only interview minutes are limited by plan.

## 🚀 Quick Start

### Change Feature Access Instantly

Edit `utils/feature-config.ts` to change who can access what:

```typescript
// Make detailed analysis require Starter plan
detailed_analysis: {
  minimumPlan: 'starter', // Changed from 'free_user'
  displayName: 'Detailed Analysis',
  // ...
}

// Make video review Premium only
video_review: {
  minimumPlan: 'premium', // Changed from 'free_user'
  displayName: 'Video Review',
  // ...
}
```

### Use in Components

```typescript
// Option 1: Wrap components with FeatureGate
<FeatureGate feature="detailed_analysis">
  <DetailedAnalysisComponent />
</FeatureGate>

// Option 2: Use hook for custom logic
const { hasAccess, userPlan } = useFeatureAccess('video_review');
if (hasAccess) {
  return <VideoReviewComponent />;
}
```

## 📋 Common Scenarios

### 1. **Freemium Model** (Free basic, paid premium)

```typescript
// In utils/feature-config.ts
export const FEATURE_CONFIG = {
  interviews: { minimumPlan: 'free_user' },        // ✅ Free
  session_history: { minimumPlan: 'free_user' },   // ✅ Free
  detailed_analysis: { minimumPlan: 'starter' },   // 💰 Paid
  video_review: { minimumPlan: 'starter' },        // 💰 Paid
  advanced_analytics: { minimumPlan: 'professional' }, // 💰💰 Higher tier
};
```

### 2. **Trial Model** (Limited free, full paid)

```typescript
export const FEATURE_CONFIG = {
  interviews: { 
    minimumPlan: 'free_user',
    usageType: 'interviews_per_day',
    usageAmount: 1 // Only 1 per day for free
  },
  detailed_analysis: { minimumPlan: 'starter' },
  // ... rest require payment
};
```

### 3. **Role-Based Access**

```typescript
// In utils/feature-config.ts
export const ROLE_PERMISSIONS = {
  admin: ['*'], // Everything
  coach: ['interviews', 'detailed_analysis', 'advanced_analytics'],
  student: ['interviews', 'session_history'],
  trial: ['interviews'] // Limited
};

// In your component
const { hasAccess } = useFeatureAccess('advanced_analytics');
// Automatically checks user's role + plan
```

### 4. **Enterprise Features**

```typescript
custom_branding: {
  minimumPlan: 'premium',
  customAccess: (userPlan, userRole) => {
    // Custom logic for enterprise customers
    return userPlan === 'premium' || userRole === 'enterprise';
  }
}
```

## 🔄 Dynamic Changes

### Method 1: Configuration File (Instant)
Edit `utils/feature-config.ts` and redeploy.

### Method 2: Database-Driven (Runtime)
Store config in database and load dynamically:

```typescript
// Example: Load from database
const config = await supabase
  .from('feature_configs')
  .select('*')
  .eq('feature', 'detailed_analysis')
  .single();
```

### Method 3: Admin Panel
Use the admin API to change settings:

```typescript
// POST /api/admin/feature-config
{
  "feature": "detailed_analysis",
  "minimumPlan": "starter",
  "enabled": true
}
```

## 💳 Payment Integration

### Stripe Webhooks
```typescript
// When payment succeeds, update user plan
await supabase
  .from('user_subscriptions')
  .update({ plan_id: newPlanId })
  .eq('user_id', userId);
```

### Clerk Billing
```typescript
// Sync with Clerk features
const { has } = useAuth();
const hasFeature = has({ feature: 'detailed_analysis' });
```

## 🎯 Usage Examples

### Protect API Routes
```typescript
// app/api/premium-feature/route.ts
import { hasFeatureAccess, getRequiredPlan } from '@/utils/feature-config';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const userPlan = await getUserPlan(userId);
  
  if (!hasFeatureAccess('detailed_analysis', userPlan)) {
    return NextResponse.json(
      { error: 'Premium subscription required' },
      { status: 403 }
    );
  }
  
  // Process premium feature...
}
```

### Conditional UI
```typescript
function DashboardPage() {
  const { hasAccess: hasAnalytics } = useFeatureAccess('advanced_analytics');
  const { hasAccess: hasVideo } = useFeatureAccess('video_review');
  
  return (
    <div>
      {hasAnalytics && <AnalyticsWidget />}
      {hasVideo && <VideoReviewButton />}
      
      <FeatureGate feature="detailed_analysis">
        <DetailedAnalysisPanel />
      </FeatureGate>
    </div>
  );
}
```

### Usage Limits
```typescript
const { checkUsage } = useFeatureAccess('interviews');

const handleStartInterview = async () => {
  const canUse = await checkUsage();
  if (!canUse) {
    showUpgradeModal();
    return;
  }
  
  // Start interview...
};
```

## 🔧 Advanced Customization

### Time-Based Access
```typescript
premium_weekend: {
  minimumPlan: 'free_user',
  customAccess: () => {
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    return isWeekend; // Free on weekends!
  }
}
```

### Geographic Restrictions
```typescript
us_only_feature: {
  minimumPlan: 'starter',
  customAccess: async (userPlan, userRole) => {
    const userCountry = await getUserCountry();
    return userCountry === 'US' && userPlan !== 'free_user';
  }
}
```

### A/B Testing
```typescript
experimental_feature: {
  minimumPlan: 'free_user',
  customAccess: (userPlan, userRole) => {
    const userId = getCurrentUserId();
    const isInExperiment = userId % 2 === 0; // 50% of users
    return isInExperiment;
  }
}
```

## 🚀 Quick Configuration Presets

Uncomment in `utils/feature-config.ts`:

```typescript
// 🆓 Everything Free (Current)
// Already set

// 💰 Freemium Model
// Uncomment FREEMIUM_CONFIG

// 🔒 Strict Paid Model
// Uncomment PAID_CONFIG

// 🎓 Education Model  
// Uncomment EDUCATION_CONFIG
```

## 📊 Monitoring & Analytics

Track feature usage:

```typescript
// Log feature access attempts
console.log(`User ${userId} accessed ${feature} with plan ${userPlan}`);

// Send to analytics
analytics.track('Feature Access', {
  feature,
  userPlan,
  hasAccess,
  userId
});
```

This system gives you **complete control** over feature access with **zero code changes** needed for most modifications!
