
import React from 'react';
import Calendar from '@/components/calendar/Calendar';

interface AppointmentsCalendarProps {
  salonId: string;
  stylistId: string | null;
  isLoading: boolean;
}

const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({ 
  salonId, 
  stylistId,
  isLoading 
}) => {
  // Debug log for checking the stylistId
  console.log('[AppointmentsCalendar] Rendering with:', { salonId, stylistId, isLoading });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  return <Calendar salonId={salonId} initialStylistId={stylistId} showRefreshButton={true} />;
};

export default AppointmentsCalendar;
