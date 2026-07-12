import React from 'react'

const BusinessProfilePageLoadingSkeleton = () => {
  return (
    <div className="space-y-8">

      {/* Business Name and Location */}
      <div className="">
        <div className="space-y-2">
          <div className="h-8 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
      
        </div>
      </div>
      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="w-full h-[300px] md:h-[400px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded-none" />
        
        {/* Business Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Logo */}
              <div className="w-24 h-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded-xl" />
              
              <div className="flex-1 space-y-3">
                <div className="h-8 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                <div className="h-4 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                <div className="flex gap-4">
                  <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                  <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
              <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
              <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
              <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
            </div>

            {/* Menu Section */}
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4 p-4 border rounded-lg">
                    <div className="w-24 h-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                      <div className="h-4 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                      <div className="h-4 w-1/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-1/3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                      <div className="h-4 w-1/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                  <div className="h-4 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="p-6 border rounded-xl space-y-4">
              <div className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                <div className="h-4 w-2/3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
              </div>
            </div>

            {/* Hours Card */}
            <div className="p-6 border rounded-xl space-y-4">
              <div className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                    <div className="h-4 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Location Card */}
            <div className="p-6 border rounded-xl space-y-4">
              <div className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
              <div className="h-48 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded-lg" />
              <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessProfilePageLoadingSkeleton