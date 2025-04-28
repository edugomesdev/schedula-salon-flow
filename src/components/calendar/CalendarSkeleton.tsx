
import React from 'react';

const CalendarSkeleton = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-40 bg-gray-200 rounded"></div>
      <div className="h-80 bg-gray-200 rounded"></div>
    </div>
  );
};

export default CalendarSkeleton;
