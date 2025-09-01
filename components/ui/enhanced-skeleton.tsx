import { cn } from "@/utils"
import { Skeleton } from "./skeleton"

interface DashboardSkeletonProps {
  className?: string
}

export function DashboardSkeleton({ className }: DashboardSkeletonProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="grid w-full grid-cols-3 gap-1 p-1 bg-muted rounded-lg">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 p-6 border rounded-lg">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4 p-6 border rounded-lg">
            <Skeleton className="h-5 w-32" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface InterviewSetupSkeletonProps {
  className?: string
}

export function InterviewSetupSkeleton({ className }: InterviewSetupSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Progress indicator */}
      <div className="flex items-center space-x-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            {i < 3 && <Skeleton className="h-0.5 w-8 mx-2" />}
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Skeleton className="h-10 w-full" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>

      {/* Grid of cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 border rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface UsageSkeletonProps {
  className?: string
}

export function UsageSkeleton({ className }: UsageSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

interface SessionsSkeletonProps {
  className?: string
}

export function SessionsSkeleton({ className }: SessionsSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
