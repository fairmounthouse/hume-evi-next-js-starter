"use client";

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useClerkSync } from '@/hooks/useClerkSync';
import { 
  Play,
  BarChart3,
  Clock,
  Calendar,
  TrendingUp,
  ArrowRight,
  Crown,
  Activity,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  Zap,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UsageSummary {
  usage_type: string;
  current_usage: number;
  limit_value: number;
  percentage_used: number;
  period_start: string;
  period_end: string;
}

interface SubscriptionInfo {
  plan_name: string;
  plan_key: string;
  plan_price_cents: number;
  subscription_status: string;
  current_period_end: string;
}

export default function DashboardPage() {
  const { user } = useUser();
  const { has } = useAuth();
  
  // Check user's plan directly with Clerk Billing (same as original)
  const userPlan = has?.({ plan: 'premium' }) ? 'premium' : 
                   has?.({ plan: 'professional' }) ? 'professional' :
                   has?.({ plan: 'starter' }) ? 'starter' : 'free';
  
  // Check specific features (same as original)
  const hasAdvancedAnalytics = has?.({ feature: 'advanced_analytics' }) || false;
  const hasVideoReview = has?.({ feature: 'video_review' }) || false;
  const hasUnlimitedSessions = has?.({ feature: 'unlimited_sessions' }) || false;
  
  // Auto-sync with Clerk on page load only (reduced frequency)
  const { syncUser, lastSync, isUserLoaded } = useClerkSync({
    onPageLoad: true,
    onUserChange: false, // Disabled - user changes are rare
    intervalMs: 300000, // Sync every 5 minutes instead of 30 seconds
    debug: false // Reduced logging
  });
  const [usageData, setUsageData] = useState<UsageSummary[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState<{
    total_sessions: number;
    monthly_sessions: number;
    average_score: number | null;
    improvement_percentage: number | null;
  } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Note: User sync now happens automatically via webhooks
        // No need to manually sync on every dashboard visit

        // Fetch usage summary
        const usageResponse = await fetch('/api/billing/usage-summary');
        if (usageResponse.ok) {
          const usage = await usageResponse.json();
          setUsageData(usage);
        }

        // Fetch subscription info (now uses our clean backend)
        const subResponse = await fetch('/api/billing/subscription-info');
        if (subResponse.ok) {
          const sub = await subResponse.json();
          setSubscriptionInfo(sub);
        }

        // Fetch recent sessions
        const sessionsResponse = await fetch('/api/sessions/list');
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          const sessions = sessionsData.sessions || [];
          setRecentSessions(Array.isArray(sessions) ? sessions.slice(0, 3) : []);
        }

        // Fetch quick stats from Supabase RPC
        const quickStatsResponse = await fetch('/api/dashboard/quick-stats');
        if (quickStatsResponse.ok) {
          const quickStatsData = await quickStatsResponse.json();
          if (quickStatsData.success) {
            setQuickStats(quickStatsData.stats);
          }
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { variant: 'destructive' as const, icon: AlertTriangle };
    if (percentage >= 70) return { variant: 'default' as const, icon: Clock };
    return { variant: 'default' as const, icon: CheckCircle };
  };

  const formatUsageType = (type: string) => {
    switch (type) {
      case 'minutes_per_month': return 'Monthly Minutes';
      default: return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const criticalUsage = usageData.find(usage => usage.percentage_used >= 90);
  const warningUsage = usageData.find(usage => usage.percentage_used >= 70 && usage.percentage_used < 90);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName || 'there'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's your interview practice overview and progress.
          </p>
        </div>

        {/* Usage Alerts */}
        {criticalUsage && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Usage Limit Reached</AlertTitle>
            <AlertDescription>
              You've reached your {formatUsageType(criticalUsage.usage_type)} limit. 
              <button 
                onClick={() => window.location.href = '/pricing'} 
                className="underline ml-1 hover:no-underline"
              >
                Upgrade your plan
              </button> to continue.
            </AlertDescription>
          </Alert>
        )}
        
        {warningUsage && !criticalUsage && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Usage Warning</AlertTitle>
            <AlertDescription>
              You're at {warningUsage.percentage_used}% of your {formatUsageType(warningUsage.usage_type)} limit.
            </AlertDescription>
          </Alert>
        )}

        {/* Plan info now comes directly from Clerk - no sync needed! */}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => window.location.href = '/interview/setup'}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Start Interview</p>
                <p className="text-sm text-muted-foreground">Begin practice session</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => window.location.href = '/sessions'}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">View Sessions</p>
                <p className="text-sm text-muted-foreground">Review past interviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => window.location.href = '/usage'}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Usage Stats</p>
                <p className="text-sm text-muted-foreground">Track your limits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => window.location.href = '/premium'}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">All Features</p>
                <p className="text-sm text-muted-foreground">See what's available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{subscriptionInfo?.plan_name || userPlan}</span>
                  <Badge variant={userPlan === 'free' ? 'secondary' : 'default'}>
                    {subscriptionInfo?.subscription_status || 'active'}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">
                  {subscriptionInfo ? `$${(subscriptionInfo.plan_price_cents / 100).toFixed(2)}` : '$0.00'}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {userPlan === 'free' && 'Get started with basic interview practice'}
                  {userPlan === 'starter' && 'Perfect for regular practice'}
                  {userPlan === 'professional' && 'For serious interview preparation'}
                  {userPlan === 'premium' && 'Complete interview mastery suite'}
                </p>
                {userPlan === 'free' && (
                  <Button 
                    className="w-full"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    Upgrade Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {userPlan !== 'free' && (
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    Manage Subscription
                  </Button>
                )}
                
                {/* Show available features */}
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Available Features:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      {hasAdvancedAnalytics ? '✅' : '❌'} Advanced Analytics
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {hasVideoReview ? '✅' : '❌'} Video Review
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {hasUnlimitedSessions ? '✅' : '❌'} Unlimited Sessions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
                <CardDescription>
                  Your performance at a glance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Total Sessions</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {quickStats ? quickStats.total_sessions : '...'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">This Month</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {quickStats ? quickStats.monthly_sessions : '...'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">Avg. Score</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {quickStats?.average_score ? `${quickStats.average_score}/100` : 'No data'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Improvement</span>
                    </div>
                    <p className={`text-2xl font-bold ${
                      quickStats?.improvement_percentage !== null && quickStats?.improvement_percentage !== undefined
                        ? quickStats.improvement_percentage >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {quickStats?.improvement_percentage !== null && quickStats?.improvement_percentage !== undefined
                        ? `${quickStats.improvement_percentage >= 0 ? '+' : ''}${quickStats.improvement_percentage}%`
                        : 'No data'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Usage Overview
              </CardTitle>
              <CardDescription>
                Your current usage across all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageData.length > 0 ? (
                <div className="space-y-6">
                  {usageData.map((usage) => {
                    const status = getUsageStatus(usage.percentage_used);
                    const StatusIcon = status.icon;
                    
                    return (
                      <div key={usage.usage_type} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-4 w-4" />
                            <span className="font-medium">{formatUsageType(usage.usage_type)}</span>
                          </div>
                          <Badge variant={usage.percentage_used >= 90 ? 'destructive' : 'secondary'}>
                            {usage.current_usage} / {usage.limit_value}
                          </Badge>
                        </div>
                        <Progress 
                          value={usage.percentage_used} 
                          className="h-3"
                        />
                        <p className="text-xs text-muted-foreground">
                          {usage.percentage_used.toFixed(1)}% used this period
                        </p>
                      </div>
                    );
                  })}
                  
                  <Separator />
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/usage'}
                  >
                    View Detailed Usage
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No usage data yet</p>
                  <p className="text-sm text-muted-foreground">Start your first interview to see stats</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Sessions
              </CardTitle>
              <CardDescription>
                Your latest interview practice sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-4">
                  {recentSessions.map((session, index) => (
                    <div key={session.id || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-muted rounded-lg">
                          <BarChart3 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Interview Session #{index + 1}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.started_at ? new Date(session.started_at).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {session.status === 'completed' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                        <Badge variant="outline">
                          {session.status || 'completed'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/sessions'}
                  >
                    View All Sessions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sessions yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Start your first interview to see it here</p>
                  <Button onClick={() => window.location.href = '/interview/setup'}>
                    Start First Interview
                    <Play className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}