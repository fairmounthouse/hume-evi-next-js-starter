"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Database,
  Shield,
  CreditCard,
  User,
  Settings
} from 'lucide-react';

interface SystemCheck {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading';
  message: string;
  details?: any;
}

export default function SystemStatus() {
  const { user } = useUser();
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runSystemChecks = async () => {
      let newChecks: SystemCheck[] = [];

      // Check 1: User Authentication
      newChecks = [...newChecks, {
        name: 'User Authentication',
        status: user ? 'success' : 'error',
        message: user ? `Authenticated as ${user.firstName || 'User'}` : 'Not authenticated',
        details: { userId: user?.id, email: user?.emailAddresses[0]?.emailAddress }
      }];

      if (user) {
        // Check 2: Billing System Initialization
        try {
          const initResponse = await fetch('/api/billing/init-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: user.emailAddresses[0]?.emailAddress 
            })
          });

          newChecks = [...newChecks, {
            name: 'Billing System',
            status: initResponse.ok ? 'success' : 'error',
            message: initResponse.ok ? 'User initialized in billing system' : 'Failed to initialize billing',
            details: { status: initResponse.status }
          }];
        } catch (error) {
          newChecks = [...newChecks, {
            name: 'Billing System',
            status: 'error',
            message: 'Error connecting to billing system',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          }];
        }

        // Check 3: Subscription Info
        try {
          const subResponse = await fetch('/api/billing/subscription-info');
          if (subResponse.ok) {
            const subData = await subResponse.json();
            newChecks = [...newChecks, {
              name: 'Subscription Status',
              status: 'success',
              message: `Active ${subData.plan_name} plan`,
              details: subData
            }];
          } else {
            newChecks = [...newChecks, {
              name: 'Subscription Status',
              status: 'warning',
              message: 'Could not fetch subscription info',
              details: { status: subResponse.status }
            }];
          }
        } catch (error) {
          newChecks = [...newChecks, {
            name: 'Subscription Status',
            status: 'error',
            message: 'Error fetching subscription',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          }];
        }

        // Check 4: Usage Limits
        try {
          const usageResponse = await fetch('/api/billing/usage-summary');
          if (usageResponse.ok) {
            const usageData = await usageResponse.json();
            const criticalUsage = usageData.find((item: any) => item.percentage_used >= 90);
            
            newChecks = [...newChecks, {
              name: 'Usage Limits',
              status: criticalUsage ? 'warning' : 'success',
              message: criticalUsage ? 'Some limits near capacity' : 'All limits healthy',
              details: usageData
            }];
          } else {
            newChecks = [...newChecks, {
              name: 'Usage Limits',
              status: 'warning',
              message: 'Could not fetch usage data',
              details: { status: usageResponse.status }
            }];
          }
        } catch (error) {
          newChecks = [...newChecks, {
            name: 'Usage Limits',
            status: 'error',
            message: 'Error fetching usage data',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          }];
        }

        // Check 5: Interview Access
        try {
          const accessResponse = await fetch('/api/billing/usage-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usageType: 'interviews_per_day',
              amount: 1
            })
          });

          if (accessResponse.ok) {
            const accessData = await accessResponse.json();
            newChecks = [...newChecks, {
              name: 'Interview Access',
              status: accessData.allowed ? 'success' : 'warning',
              message: accessData.allowed ? 'Can start interviews' : 'Interview limit reached',
              details: accessData
            }];
          } else {
            newChecks = [...newChecks, {
              name: 'Interview Access',
              status: 'error',
              message: 'Could not check interview access',
              details: { status: accessResponse.status }
            }];
          }
        } catch (error) {
          newChecks = [...newChecks, {
            name: 'Interview Access',
            status: 'error',
            message: 'Error checking interview access',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          }];
        }
      }

      setChecks(newChecks);
      setLoading(false);
    };

    runSystemChecks();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Settings className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-900/10';
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-900/10';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <h2 className="text-xl font-semibold">Running System Checks...</h2>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          System Status
        </h2>
        <Badge variant="outline" className="ml-auto">
          {checks.filter(c => c.status === 'success').length}/{checks.length} Healthy
        </Badge>
      </div>

      <div className="space-y-4">
        {checks.map((check, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                {getStatusIcon(check.status)}
                <span className="font-medium text-gray-900 dark:text-white">
                  {check.name}
                </span>
              </div>
              <Badge 
                variant={check.status === 'success' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {check.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {check.message}
            </p>
            {check.details && (
              <details className="text-xs text-gray-500 dark:text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                  View Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                  {JSON.stringify(check.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="sm"
          className="w-full"
        >
          Refresh System Status
        </Button>
      </div>
    </Card>
  );
}
