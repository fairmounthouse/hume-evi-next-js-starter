
"use client";

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Crown, Video, BarChart3, FileText, Users, CheckCircle, Sparkles } from 'lucide-react'

export default function PremiumPage() {
  const features = [
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "See detailed charts and insights about your interview performance, confidence levels, and areas to improve.",
      href: "/premium-analytics",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      available: true
    },
    {
      icon: Video,
      title: "Video Recording",
      description: "Record your practice interviews and get AI feedback on your body language, tone, and presentation style.",
      href: "/interview/setup",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
      available: true
    },
    {
      icon: FileText,
      title: "Detailed Feedback",
      description: "Get comprehensive written feedback on every interview with specific examples and improvement tips.",
      href: "/sessions",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      available: true
    },
    {
      icon: Users,
      title: "Personal Coaching",
      description: "Book one-on-one sessions with real consultants who can give you personalized advice and practice.",
      href: "#",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
      available: false,
      comingSoon: true
    },
    {
      icon: Crown,
      title: "Exclusive Cases",
      description: "Practice with real interview cases from McKinsey, Bain, BCG and other top consulting firms.",
      href: "/interview/setup",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      available: false,
      comingSoon: true
    },
    {
      icon: Sparkles,
      title: "Priority Help",
      description: "Get faster responses from our support team and direct access to our coaching experts.",
      href: "#",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      available: false,
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-16 h-16 text-blue-500" />
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              All Included
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Platform Features
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Every user gets access to all features. Plans only determine how many interview minutes you get each month.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>No feature restrictions • Plans only affect interview time limits</span>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className={`p-6 transition-all hover:shadow-lg ${feature.available ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  {feature.available && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                      Available
                    </Badge>
                  )}
                  {feature.comingSoon && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                  {feature.description}
                </p>
                
                {feature.available ? (
                  <Link href={feature.href}>
                    <Button variant="outline" className="w-full">
                      Use Feature
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Card className="p-8 max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
            <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Start Using These Features</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              All features are available to everyone. Your plan only determines how many interview minutes you get per month - everything else is included!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/interview/setup">
                <Button className="w-full sm:w-auto">
                  Start an Interview
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="w-full sm:w-auto">
                  Compare Plans
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
