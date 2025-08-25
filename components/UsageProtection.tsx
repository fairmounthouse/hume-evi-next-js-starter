"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  AlertTriangle, 
  ArrowRight,
  Zap,
  Star
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UsageProtectionProps {
  children: React.ReactNode;
  usageType: string;
  usageAmount?: number;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface UsageCheck {
  allowed: boolean;
  current_usage: number;
  limit_value: number;
  percentage_used: number;
  message?: string;
}

/**
 * 🛡️ USAGE PROTECTION COMPONENT
 * 
 * Only checks usage limits - no feature restrictions
 * All features are available to everyone, only usage minutes are limited
 */
export default function UsageProtection({
  children,
  usageType,
  usageAmount = 1,
  fallbackTitle = "Usage Limit Reached",
  fallbackDescription = "You've reached your usage limit for this feature."
}: UsageProtectionProps) {
  const { user } = useUser();
  const [hasUsage, setHasUsage] = useState<boolean | null>(null);
  const [usageCheck, setUsageCheck] = useState<UsageCheck | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUsage = async () => {
      if (!user) return;

      try {
        // Initialize user in billing system
        await fetch('/api/billing/init-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.emailAddresses[0]?.emailAddress 
          })
        });

        // Check usage limits only
        const usageResponse = await fetch('/api/billing/usage-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usageType,
            amount: usageAmount
          })
        });

        if (usageResponse.ok) {
          const usage = await usageResponse.json();
          setUsageCheck(usage);
          setHasUsage(usage.allowed);
        } else {
          setHasUsage(true); // Default to allow if check fails
        }

        // Get subscription info for display
        const subResponse = await fetch('/api/billing/subscription-info');
        if (subResponse.ok) {
          const sub = await subResponse.json();
          setSubscriptionInfo(sub);
        }

      } catch (error) {
        console.error('Error checking usage:', error);
        setHasUsage(true); // Default to allow if check fails
      } finally {
        setLoading(false);
      }
    };

    checkUsage();
  }, [user, usageType, usageAmount]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (hasUsage) {
    return <>{children}</>;
  }

  // Show usage limit reached
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <Card className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <AlertTriangle className="w-10 h-10 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {fallbackTitle}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              {fallbackDescription}
            </p>
          </motion.div>

          {/* Current Plan Info */}
          {subscriptionInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Badge variant="outline" className="text-sm">
                  Current Plan: {subscriptionInfo.plan_name}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ${subscriptionInfo.plan_price_cents ? (subscriptionInfo.plan_price_cents / 100).toFixed(2) : '0'}/month
              </p>
            </motion.div>
          )}

          {/* Usage Limit Info */}
          {usageCheck && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center justify-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-900 dark:text-red-100">
                  Usage Limit Reached
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-200">
                You've used {usageCheck.current_usage} of {usageCheck.limit_value === -1 ? '∞' : usageCheck.limit_value} 
                {' '}{usageType?.replace(/_/g, ' ')} this period.
              </p>
              {usageCheck.message && (
                <p className="text-sm text-red-600 dark:text-red-300 mt-2">
                  {usageCheck.message}
                </p>
              )}
            </motion.div>
          )}

          {/* Plan Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid md:grid-cols-3 gap-4 mb-8"
          >
            <div className="text-center p-4">
              <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                More Minutes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Extended interview time
              </p>
            </div>
            <div className="text-center p-4">
              <Star className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                More Interviews
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unlimited daily sessions
              </p>
            </div>
            <div className="text-center p-4">
              <AlertTriangle className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Priority Support
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get help when you need it
              </p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/pricing">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                Upgrade Now <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                Back to Dashboard
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-sm text-gray-500 dark:text-gray-400 mt-6"
          >
            Upgrade or downgrade anytime. No long-term commitments.
          </motion.p>
        </Card>
      </motion.div>
    </div>
  );
}
