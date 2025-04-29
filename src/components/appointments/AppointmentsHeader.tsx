
import React from 'react';

interface AppointmentsHeaderProps {
  stylistId: string | null;
}

const AppointmentsHeader: React.FC<AppointmentsHeaderProps> = ({ stylistId }) => {
  const pageTitle = stylistId 
    ? "Stylist Calendar"
    : "Calendar Management";
    
  const pageDescription = stylistId
    ? "View and manage appointments for this stylist"
    : "Manage your stylists' appointments and schedules";

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
