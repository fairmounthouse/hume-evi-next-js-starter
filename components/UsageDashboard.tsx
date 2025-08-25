"use client";

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Clock, Video, BarChart3, Crown, AlertTriangle, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface UsageSummary {
  limit_type: string;
  limit_value: number;
  current_usage: number;
  remaining: number;
  percentage_used: number;
}

interface SubscriptionInfo {
  plan_name: string;
  plan_key: string;
  plan_price_cents: number;
  subscription_status: string;
  current_period_end: string;
}

export default function UsageDashboard() {
  const { user } = useUser();
  const [usageSummary, setUsageSummary] = useState<UsageSummary[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUsageData();
    }
  }, [user]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      
      // Initialize user billing if needed
      await fetch('/api/billing/init-user', { method: 'POST' });
      
      // Fetch usage summary (you'd implement this API endpoint)
      const usageResponse = await fetch('/api/billing/usage-summary');
      if (usageResponse.ok) {
        const usage = await usageResponse.json();
        setUsageSummary(usage);
      }

      // Fetch subscription info (you'd implement this API endpoint)
      const subResponse = await fetch('/api/billing/subscription-info');
      if (subResponse.ok) {
        const sub = await subResponse.json();
        setSubscriptionInfo(sub);
      }

    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const getUsageIcon = (limitType: string) => {
    switch (limitType) {
      case 'minutes_per_month':
        return <Clock className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getUsageLabel = (limitType: string) => {
    switch (limitType) {
      case 'minutes_per_month':
        return 'Interview Minutes';
      default:
        return limitType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatPlanName = (planName: string) => {
    return planName.charAt(0).toUpperCase() + planName.slice(1);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchUsageData} variant="outline">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      {subscriptionInfo && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Current Plan
            </h3>
            <Badge variant={subscriptionInfo.subscription_status === 'active' ? 'default' : 'destructive'}>
              {subscriptionInfo.subscription_status}
            </Badge>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="font-semibold">{formatPlanName(subscriptionInfo.plan_name)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Price</p>
              <p className="font-semibold">${(subscriptionInfo.plan_price_cents / 100).toFixed(2)}/month</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Billing</p>
              <p className="font-semibold">
                {new Date(subscriptionInfo.current_period_end).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                Change Plan
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Usage Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Usage This Month</h3>
        
        {usageSummary.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No usage data available</p>
        ) : (
          <div className="space-y-4">
            {usageSummary.map((usage) => (
              <div key={usage.limit_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getUsageIcon(usage.limit_type)}
                    <span className="font-medium">{getUsageLabel(usage.limit_type)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {usage.limit_value === -1 ? (
                      <Badge variant="secondary">Unlimited</Badge>
                    ) : (
                      `${usage.current_usage} / ${usage.limit_value}`
                    )}
                  </div>
                </div>
                
                {usage.limit_value !== -1 && (
                  <div className="space-y-1">
                    <Progress 
                      value={usage.percentage_used} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{usage.percentage_used.toFixed(1)}% used</span>
                      <span>{usage.remaining} remaining</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upgrade prompt if near limits */}
        {usageSummary.some(u => u.percentage_used > 80 && u.limit_value !== -1) && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                Approaching Usage Limits
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              You're running low on some features. Consider upgrading to continue using the platform without interruption.
            </p>
            <Link href="/pricing">
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                Upgrade Plan
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
