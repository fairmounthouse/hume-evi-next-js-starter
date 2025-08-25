"use client";

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AlertTriangle, Clock, Crown, Activity, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface UsageCheck {
  allowed: boolean;
  current_usage: number;
  limit_value: number;
  remaining: number;
  is_unlimited: boolean;
}

interface InterviewLimitCheckProps {
  onCanProceed: (canProceed: boolean) => void;
  estimatedMinutes?: number;
}

export default function InterviewLimitCheck({ 
  onCanProceed, 
  estimatedMinutes = 15 
}: InterviewLimitCheckProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [minutesCheck, setMinutesCheck] = useState<UsageCheck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkLimits();
    }
  }, [user, estimatedMinutes]);

  const checkLimits = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize user billing if needed
      await fetch('/api/billing/init-user', { method: 'POST' });

      // Check minutes limit only - no daily interview limits
      const minutesResponse = await fetch('/api/billing/usage-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usageType: 'minutes_per_month',
          amount: estimatedMinutes
        })
      });

      if (minutesResponse.ok) {
        const minutesData = await minutesResponse.json();
        setMinutesCheck(minutesData);
      }

    } catch (err) {
      console.error('Error checking limits:', err);
      setError('Failed to check usage limits');
    } finally {
      setLoading(false);
    }
  };

  // Determine if user can proceed - only check minutes, no daily interview limits
  useEffect(() => {
    if (minutesCheck) {
      // Always allow interviews - only warn about low minutes but don't block
      const canProceed = true;
      onCanProceed(canProceed);
    }
  }, [minutesCheck, onCanProceed]);

  if (loading) {
    return (
      <Card className="p-6 mb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 mb-6 border-red-200">
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-medium">Unable to check usage limits</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
        <Button onClick={checkLimits} variant="outline" size="sm" className="mt-3">
          Retry
        </Button>
      </Card>
    );
  }

  const minutesLow = minutesCheck && !minutesCheck.is_unlimited && minutesCheck.remaining < estimatedMinutes;
  const hasLimits = !minutesCheck?.is_unlimited;

  return (
    <Card className={`p-6 mb-6 ${minutesLow ? 'border-yellow-200' : 'border-green-200'}`}>
      <div className="flex items-center gap-3 mb-4">
        {minutesLow ? (
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
        ) : (
          <CheckCircle className="w-6 h-6 text-green-600" />
        )}
        <div>
          <h3 className="font-semibold">
            {minutesLow 
              ? 'Low on Minutes - Interview May Be Cut Short'
              : 'Ready to Start Interview'
            }
          </h3>
          <p className="text-sm text-gray-600">
            {minutesLow
              ? 'You have limited minutes remaining. Your interview may end early when you run out.'
              : 'You have sufficient usage remaining for this interview'
            }
          </p>
        </div>
      </div>

      {hasLimits && (
        <div className="space-y-3">
          {/* Minutes Check */}
          {minutesCheck && !minutesCheck.is_unlimited && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Interview Minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={minutesCheck.allowed ? "default" : "destructive"}>
                  {minutesCheck.remaining} / {minutesCheck.limit_value} remaining
                </Badge>
                {!minutesCheck.allowed && (
                  <span className="text-xs text-red-600">
                    Need {estimatedMinutes} min
                  </span>
                )}
              </div>
            </div>
          )}


        </div>
      )}



      {/* Warning for low minutes */}
      {minutesLow && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              Low on Minutes
            </span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            You only have {minutesCheck?.remaining} minutes remaining. Your interview may be automatically ended when you run out of time.
          </p>
          <div className="flex gap-2">
            <Link href="/pricing">
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                Upgrade for More Minutes
              </Button>
            </Link>
            <Button size="sm" variant="outline">
              Continue Anyway
            </Button>
          </div>
        </div>
      )}

      {/* Success message for unlimited users */}
      {minutesCheck?.is_unlimited && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Premium Access - Unlimited Minutes
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
