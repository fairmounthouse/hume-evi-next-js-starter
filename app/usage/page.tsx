"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Clock,
  Crown,
  RefreshCw,
  PlayCircle,
  Timer,
  CalendarDays,
  Gift,
  Coins,
  CreditCard,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Activity,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { getSessionBreakdown, getUserAvailableMinutes } from '@/utils/billing-client';

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
  const [couponCode, setCouponCode] = useState('');
  const [redeemingCoupon, setRedeemingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availableMinutes, setAvailableMinutes] = useState<{
    monthly_used: number;
    monthly_limit: number;
    monthly_remaining: number;
    topup_balance: number;
    total_available: number;
    topup_total_purchased: number;
    topup_used: number;
  } | null>(null);

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
        
        // Fetch available minutes (including top-up)
        const minutes = await getUserAvailableMinutes(user.id);
        setAvailableMinutes(minutes);
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

  const handleCouponRedeem = async () => {
    if (!couponCode.trim() || !user?.id) return;
    
    try {
      setRedeemingCoupon(true);
      setCouponMessage(null);
      
      const response = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCouponMessage({ type: 'success', text: data.message });
        setCouponCode('');
        // Refresh usage data to show new balance
        await fetchUsageData();
      } else {
        setCouponMessage({ type: 'error', text: data.error || 'Failed to redeem coupon' });
      }
    } catch (error) {
      console.error('Error redeeming coupon:', error);
      setCouponMessage({ type: 'error', text: 'Failed to redeem coupon' });
    } finally {
      setRedeemingCoupon(false);
    }
  };

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
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getNextResetDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const currentPeriod = getCurrentPeriod();
  const nextReset = getNextResetDate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Usage & Billing 
                <Badge className="ml-2 bg-blue-50 text-blue-700 hover:bg-blue-100">
                  {subscriptionInfo?.plan_name || 'Free'} Plan
                </Badge>
              </h1>
              <div className="flex flex-col sm:flex-row gap-4 mt-4 text-sm text-muted-foreground">
                <div><strong>Monthly Cost:</strong> ${subscriptionInfo ? (subscriptionInfo.plan_price_cents / 100).toFixed(2) : '0.00'}</div>
                <div><strong>Next Reset:</strong> {nextReset}</div>
                <div><strong>Billing Period:</strong> {currentPeriod.start} - {currentPeriod.end}</div>
              </div>
            </div>
            <Button 
              onClick={fetchUsageData} 
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Minutes Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Minutes Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {availableMinutes ? (
                <>
                  {/* Monthly Minutes */}
                  <div className="p-5 bg-muted/30 rounded-lg border-l-4 border-green-500">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Monthly Minutes</span>
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                          Resets Monthly
                        </Badge>
                      </div>
                      <div className={`text-2xl font-bold ${availableMinutes.monthly_remaining === 0 ? 'text-red-600' : 'text-foreground'}`}>
                        {availableMinutes.monthly_remaining} / {availableMinutes.monthly_limit}
                      </div>
                    </div>
                    <Progress 
                      value={availableMinutes.monthly_limit > 0 ? (availableMinutes.monthly_used / availableMinutes.monthly_limit) * 100 : 0} 
                      className="h-2 mb-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {availableMinutes.monthly_remaining === 0 
                          ? `Used ${availableMinutes.monthly_used} min (${Math.max(0, availableMinutes.monthly_used - availableMinutes.monthly_limit)} min overage covered by top-up)`
                          : `${availableMinutes.monthly_used} of ${availableMinutes.monthly_limit} minutes used`
                        }
                      </span>
                      <span>
                        {availableMinutes.monthly_limit > 0 
                          ? Math.round((availableMinutes.monthly_used / availableMinutes.monthly_limit) * 100)
                          : 0
                        }% used
                      </span>
                    </div>
                  </div>

                  {/* Top-up Minutes */}
                  <div className="p-5 bg-muted/30 rounded-lg border-l-4 border-blue-500">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Top-up Minutes</span>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                          Never Expires
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {availableMinutes.topup_balance} / {availableMinutes.topup_total_purchased} min
                      </div>
                    </div>
                    <Progress 
                      value={availableMinutes.topup_total_purchased > 0 ? (availableMinutes.topup_used / availableMinutes.topup_total_purchased) * 100 : 0}
                      className="h-2 mb-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {availableMinutes.topup_used > 0 
                          ? `${availableMinutes.topup_used} of ${availableMinutes.topup_total_purchased} minutes used lifetime`
                          : 'Available for unlimited use'
                        }
                      </span>
                      <span>
                        {availableMinutes.topup_total_purchased > 0 
                          ? `${Math.round((availableMinutes.topup_used / availableMinutes.topup_total_purchased) * 100)}% used`
                          : 'Never expires'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Total Available */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg text-center">
                    <div className="text-sm opacity-90 mb-2">Total Available</div>
                    <div className="text-5xl font-bold">
                      {availableMinutes.total_available}
                      <span className="text-xl font-normal ml-2">minutes</span>
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>💡 How minutes work:</strong> Monthly minutes are always used first. When they run out, top-up minutes are automatically used. Top-up minutes never expire and carry over forever.
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <Skeleton className="h-64 w-full" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/pricing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Buy Top-up Minutes
                </Link>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/pricing">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Link>
              </Button>
              
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Have a coupon?</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !redeemingCoupon) {
                        handleCouponRedeem();
                      }
                    }}
                    disabled={redeemingCoupon}
                  />
                  <Button 
                    className="w-full"
                    onClick={handleCouponRedeem}
                    disabled={redeemingCoupon || !couponCode.trim()}
                    variant="outline"
                  >
                    {redeemingCoupon ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Gift className="h-4 w-4 mr-2" />
                    )}
                    Redeem Code
                  </Button>
                </div>
                
                {couponMessage && (
                  <Alert variant={couponMessage.type === 'error' ? 'destructive' : 'default'} className="mt-3">
                    <AlertDescription>
                      {couponMessage.text}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionBreakdown.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Duration & Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionBreakdown.map((session) => (
                  <TableRow key={session.session_id}>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {session.session_id.slice(-8)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{session.case_title}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.duration_minutes} min</span>
                        {/* Mock breakdown - in real app would come from session metadata */}
                        {session.duration_minutes > 0 && availableMinutes && (
                          <div className="flex gap-1">
                            {availableMinutes.monthly_remaining > 0 && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                {Math.min(session.duration_minutes, availableMinutes.monthly_limit)} monthly
                              </Badge>
                            )}
                            {session.duration_minutes > availableMinutes.monthly_limit && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                {session.duration_minutes - availableMinutes.monthly_limit} top-up
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(session.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(session.started_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your first interview session to see your session history here.
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
    </div>
  );
}