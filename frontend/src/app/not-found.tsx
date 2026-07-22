import React from 'react'
import Link from 'next/link'

const NotFound = () => {
  return (
    <main className="flex min-h-[50dvh] items-center justify-center py-12">
      <div className="text-center px-4">
        <h1 className="mb-4 text-7xl font-bold text-gray-800 sm:text-9xl">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for seems to have disappeared into thin air.
        </p>
        <Link 
          href="/"
          className="btn-primary "
        >
          Return Home
        </Link>
      </div>
    </main>
  )
}

export default NotFound