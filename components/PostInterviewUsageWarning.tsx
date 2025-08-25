"use client";

import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AlertTriangle, Crown, Clock, Activity, TrendingUp } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface UsageCheck {
  allowed: boolean;
  current_usage: number;
  limit_value: number;
  remaining: number;
  is_unlimited: boolean;
}

interface PostInterviewUsageWarningProps {
  sessionDurationMinutes: number;
  onClose?: () => void;
}

export default function PostInterviewUsageWarning({ 
  sessionDurationMinutes, 
  onClose 
}: PostInterviewUsageWarningProps) {
  const { user } = useUser();
  const [minutesCheck, setMinutesCheck] = useState<UsageCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (user) {
      checkPostInterviewUsage();
    }
  }, [user, sessionDurationMinutes]);

  const checkPostInterviewUsage = async () => {
    try {
      setLoading(true);

      // Check current usage after the interview - only minutes, no daily limits
      const minutesResponse = await fetch('/api/billing/usage-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usageType: 'minutes_per_month',
          amount: 1
        })
      });

      if (minutesResponse.ok) {
        const minutesData = await minutesResponse.json();
        setMinutesCheck(minutesData);
      }

    } catch (err) {
      console.error('Error checking post-interview usage:', err);
    } finally {
      setLoading(false);
    }
  };

  // Determine if we should show warning - only for minutes
  useEffect(() => {
    if (minutesCheck) {
      // Show warning if:
      // 1. They're now over their monthly minutes limit, OR
      // 2. They have very few minutes left (less than 10)
      const overMonthlyMinutes = !minutesCheck.is_unlimited && minutesCheck.remaining <= 0;
      const veryLowMinutes = !minutesCheck.is_unlimited && minutesCheck.remaining > 0 && minutesCheck.remaining < 10;
      
      setShouldShow(overMonthlyMinutes || veryLowMinutes);
    }
  }, [minutesCheck]);

  if (loading || !shouldShow) {
    return null;
  }

  const overMonthlyMinutes = minutesCheck && !minutesCheck.is_unlimited && minutesCheck.remaining <= 0;
  const veryLowMinutes = minutesCheck && !minutesCheck.is_unlimited && minutesCheck.remaining > 0 && minutesCheck.remaining < 10;

  return (
    <Card className="p-3 mb-3 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <div>
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
              {sessionDurationMinutes}min interview completed
            </span>
            {minutesCheck && !minutesCheck.is_unlimited && (
              <span className="text-xs text-orange-700 dark:text-orange-300 ml-2">
                • {minutesCheck.remaining}/{minutesCheck.limit_value} minutes left
                {overMonthlyMinutes && <span className="text-red-600 font-medium"> (EXCEEDED)</span>}
                {veryLowMinutes && !overMonthlyMinutes && <span className="text-yellow-600 font-medium"> (LOW)</span>}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/pricing">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Upgrade
            </Button>
          </Link>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="h-7 px-2 text-xs">
              ×
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
