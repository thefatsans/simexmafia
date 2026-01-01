'use client'

export default function ProductCardSkeleton() {
  return (
    <div className="bg-fortnite-dark dark:bg-fortnite-dark bg-white dark:border-purple-500/20 border-gray-200 rounded-lg overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-900/20 to-yellow-900/20">
        <div className="w-full h-full bg-gray-700 dark:bg-gray-800" />
      </div>

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title Skeleton */}
        <div className="h-4 bg-gray-700 dark:bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-700 dark:bg-gray-800 rounded w-1/2" />

        {/* Badge Skeleton */}
        <div className="h-6 bg-gray-700 dark:bg-gray-800 rounded w-20" />

        {/* Info Skeleton */}
        <div className="flex items-center space-x-2">
          <div className="h-3 bg-gray-700 dark:bg-gray-800 rounded w-12" />
          <div className="h-3 bg-gray-700 dark:bg-gray-800 rounded w-16" />
        </div>

        {/* Price Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-700 dark:bg-gray-800 rounded w-20" />
          <div className="h-8 w-8 bg-gray-700 dark:bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  )
}













