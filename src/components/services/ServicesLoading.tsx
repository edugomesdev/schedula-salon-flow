
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ServicesLoading = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-6 bg-card rounded-lg border shadow-sm">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-3" />
          <Skeleton className="h-4 w-1/3 mb-6" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServicesLoading;
