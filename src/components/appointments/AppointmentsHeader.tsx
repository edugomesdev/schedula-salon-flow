
import React from 'react';

interface AppointmentsHeaderProps {
  stylistId: string | null;
}

const AppointmentsHeader: React.FC<AppointmentsHeaderProps> = ({ stylistId }) => {
  const pageTitle = stylistId 
    ? "Stylist Appointments"
    : "Appointment Booking";
    
  const pageDescription = stylistId
    ? "Online booking calendar for this stylist"
    : "Manage your salon's online booking system";

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">{pageTitle}</h1>
      <p className="text-muted-foreground">
        {pageDescription}
      </p>
    </div>
  );
};

export default AppointmentsHeader;
