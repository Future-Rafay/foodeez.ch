"use client";

import { Search, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface NoResultsProps {
  query: string;
}

export default function NoResults({ query }: NoResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-16 px-6 bg-white rounded-xl border border-gray-100 shadow-sm"
    >
      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 text-primary mb-4">
        <Search size={28} />
      </div>
      
      <h3 className="text-xl font-bold text-text-main mb-2">No results found</h3>
      
      <p className="text-text-muted mb-6 max-w-md mx-auto">
        {query ? (
          <>
            We couldn't find any restaurants matching "<span className="font-medium text-primary">{query}</span>".
            Try different keywords or browse our categories.
          </>
        ) : (
          <>
            No restaurants match your current filters. Try changing your search criteria or 
            browse all restaurants.
          </>
        )}
      </p>
      
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/search-your-business"
          className="inline-flex items-center px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw size={16} className="mr-2" />
          Clear all filters
        </Link>
        
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2.5 bg-white hover:bg-gray-50 text-text-main border border-gray-200 rounded-lg transition-colors"
        >
          Back to home
        </Link>
      </div>
    </motion.div>
  );
} 