import { auth } from '@clerk/nextjs/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Crown, BarChart3, TrendingUp, Target, Users } from 'lucide-react'

export default function PremiumAnalyticsPage() {
  return (
    // Advanced analytics available to everyone - only limited by usage minutes
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Advanced Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Deep insights into your interview performance and improvement areas
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">85%</span>
            </div>
            <h3 className="font-semibold mb-1">Overall Score</h3>
            <p className="text-sm text-gray-600">+12% from last month</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-green-600">24</span>
            </div>
            <h3 className="font-semibold mb-1">Sessions Completed</h3>
            <p className="text-sm text-gray-600">This month</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold text-purple-600">92%</span>
            </div>
            <h3 className="font-semibold mb-1">Confidence Level</h3>
            <p className="text-sm text-gray-600">+8% improvement</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">Top 15%</span>
            </div>
            <h3 className="font-semibold mb-1">Ranking</h3>
            <p className="text-sm text-gray-600">Among all users</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Interactive chart would go here</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Improvement Recommendations</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">Structure Your Responses</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Use frameworks like STAR method to organize your answers more effectively
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100">Improve Eye Contact</h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Maintain better eye contact with the camera during responses
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100">Quantify Your Impact</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Include more specific numbers and metrics in your examples
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </div>
  )
}
