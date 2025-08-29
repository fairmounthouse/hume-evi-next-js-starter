"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Activity,
  Clock,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Crown,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  PlayCircle,
  Timer,
  CalendarDays
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSessionBreakdown } from '@/utils/billing-client';

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

interface SessionBreakdown {
  session_id: string;
  started_at: string;
  ended_at: string;
  duration_minutes: number;
  case_title: string;
  status: string;
  created_at: string;
}

export default function UsagePage() {
  const { user } = useUser();
  const [usageData, setUsageData] = useState<UsageSummary[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [sessionBreakdown, setSessionBreakdown] = useState<SessionBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsageData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch usage summary
      const usageResponse = await fetch('/api/billing/usage-summary');
      if (usageResponse.ok) {
        const usage = await usageResponse.json();
        setUsageData(usage);
      }

      // Fetch subscription info
      const subResponse = await fetch('/api/billing/subscription-info');
      if (subResponse.ok) {
        const sub = await subResponse.json();
        setSubscriptionInfo(sub);
      }

      // Fetch session breakdown
      if (user?.id) {
        const sessions = await getSessionBreakdown(user.id, 15);
        setSessionBreakdown(sessions);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 90) return { 
      variant: 'destructive' as const, 
      icon: AlertTriangle, 
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
    };
    if (percentage >= 70) return { 
      variant: 'default' as const, 
      icon: Clock, 
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
    };
    return { 
      variant: 'default' as const, 
      icon: CheckCircle, 
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
    };
  };

  const formatUsageType = (type: string) => {
    switch (type) {
      case 'minutes_per_month': return 'Monthly Minutes';
      default: return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getUsageIcon = (type: string) => {
    switch (type) {
      case 'minutes_per_month': return Clock;
      default: return Activity;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const criticalUsage = usageData.filter(usage => usage.percentage_used >= 90);
  const warningUsage = usageData.filter(usage => usage.percentage_used >= 70 && usage.percentage_used < 90);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Usage & Limits</h1>
          <p className="text-muted-foreground">
            Monitor your usage and track your interview sessions
          </p>
        </div>
        
        <Button 
          onClick={fetchUsageData} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Usage Alerts */}
      {criticalUsage.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Usage Limits Reached</AlertTitle>
          <AlertDescription>
            You've reached the limit for {criticalUsage.length} feature(s). 
            <Link href="/pricing" className="underline ml-1">Upgrade your plan</Link> to continue using these features.
          </AlertDescription>
        </Alert>
      )}
      
      {warningUsage.length > 0 && criticalUsage.length === 0 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Usage Warning</AlertTitle>
          <AlertDescription>
            You're approaching the limit for {warningUsage.length} feature(s). Consider upgrading to avoid interruptions.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Overview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Current Plan: {subscriptionInfo?.plan_name || 'Loading...'}
          </CardTitle>
          <CardDescription>
            Your subscription details and billing information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptionInfo ? (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Plan</p>
                <div className="flex items-center gap-2">
                  <Badge variant={subscriptionInfo.plan_key === 'free' ? 'secondary' : 'default'} className="text-sm">
                    {subscriptionInfo.plan_name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({subscriptionInfo.subscription_status})
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                <p className="text-2xl font-bold">
                  ${(subscriptionInfo.plan_price_cents / 100).toFixed(2)}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
                <p className="text-sm">
                  {new Date(subscriptionInfo.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          )}
          
          <Separator className="my-6" />
          
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/pricing">
                View All Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {subscriptionInfo?.plan_key === 'free' && (
              <Button asChild>
                <Link href="/pricing">
                  Upgrade Now
                  <Crown className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Details */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Usage Overview</TabsTrigger>
          <TabsTrigger value="sessions">Session Breakdown</TabsTrigger>
          <TabsTrigger value="detailed">Monthly Minutes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {usageData.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {usageData.map((usage) => {
                const status = getUsageStatus(usage.percentage_used);
                const StatusIcon = status.icon;
                const UsageIcon = getUsageIcon(usage.usage_type);
                
                return (
                  <Card key={`${usage.usage_type}-${usage.period_start}`} className={`${status.bg} border-2`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-lg">
                        <div className="flex items-center gap-2">
                          <UsageIcon className="h-5 w-5" />
                          {formatUsageType(usage.usage_type)}
                        </div>
                        <StatusIcon className={`h-5 w-5 ${status.color}`} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Used</span>
                          <span className="font-medium">
                            {usage.current_usage} / {usage.limit_value === 999999 ? '∞' : usage.limit_value}
                          </span>
                        </div>
                        <Progress 
                          value={usage.percentage_used} 
                          className="h-3"
                        />
                        <p className="text-xs text-muted-foreground">
                          {usage.percentage_used.toFixed(1)}% of limit used
                        </p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <p>Period: {new Date(usage.period_start).toLocaleDateString()} - {new Date(usage.period_end).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Usage Data</h3>
                <p className="text-muted-foreground mb-4">
                  Start using Interview AI to see your usage statistics here.
                </p>
                <Button asChild>
                  <Link href="/interview/setup">
                    Start Your First Interview
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Session Breakdown
              </CardTitle>
              <CardDescription>
                Detailed breakdown of your recent interview sessions and time usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionBreakdown.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                    <div className="bg-primary/5 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Total Minutes</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {sessionBreakdown.reduce((acc, session) => acc + session.duration_minutes, 0)}
                      </p>
                    </div>
                    <div className="bg-secondary/5 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-secondary-foreground" />
                        <span className="text-sm font-medium">Total Sessions</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {sessionBreakdown.length}
                      </p>
                    </div>
                    <div className="bg-accent/5 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-accent-foreground" />
                        <span className="text-sm font-medium">Avg Duration</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {sessionBreakdown.length > 0 
                          ? Math.round(sessionBreakdown.reduce((acc, session) => acc + session.duration_minutes, 0) / sessionBreakdown.length)
                          : 0} min
                      </p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session</TableHead>
                        <TableHead>Case</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionBreakdown.map((session) => (
                        <TableRow key={session.session_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <PlayCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-xs">
                                {session.session_id.slice(-8)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{session.case_title}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Timer className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{session.duration_minutes} min</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(session.status)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(session.started_at)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your first interview session to see detailed breakdowns here.
                  </p>
                  <Button asChild>
                    <Link href="/interview/setup">
                      Start Your First Interview
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Minutes Usage</CardTitle>
              <CardDescription>
                Detailed breakdown of your monthly minutes usage and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Current Usage</TableHead>
                      <TableHead>Limit</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageData.map((usage) => {
                      const status = getUsageStatus(usage.percentage_used);
                      const StatusIcon = status.icon;
                      
                      return (
                        <TableRow key={`${usage.usage_type}-${usage.period_start}`}>
                          <TableCell className="font-medium">
                            {formatUsageType(usage.usage_type)}
                          </TableCell>
                          <TableCell>{usage.current_usage}</TableCell>
                          <TableCell>{usage.limit_value === 999999 ? '∞' : usage.limit_value}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={usage.percentage_used} 
                                className="h-2 w-16"
                              />
                              <span className="text-sm">
                                {usage.percentage_used.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${status.color}`} />
                              <Badge variant={status.variant}>
                                {usage.percentage_used >= 90 ? 'At Limit' : 
                                 usage.percentage_used >= 70 ? 'Warning' : 'Good'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(usage.period_start).toLocaleDateString()} - {new Date(usage.period_end).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No detailed usage data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Usage Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Optimize Your Sessions</h4>
                <p className="text-sm text-muted-foreground">
                  Focus on shorter, targeted practice sessions to maximize your monthly minutes.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Track Progress</h4>
                <p className="text-sm text-muted-foreground">
                  Use detailed analysis sparingly on your best sessions for maximum insight.
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Need more resources? Upgrade your plan for higher limits and additional features.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/pricing">
                View Plans
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}