
import React from 'react';
import { Calendar, Clock, Scissors, Users } from 'lucide-react';
import MetricCard from './MetricCard';

interface DashboardMetricsProps {
  upcomingAppointments: { count: number, isLoading: boolean };
  totalAppointments: { count: number, isLoading: boolean };
  services: { count: number, isLoading: boolean };
  staff: { count: number, isLoading: boolean };
}

const DashboardMetrics = ({
  upcomingAppointments,
  totalAppointments,
  services,
  staff
}: DashboardMetricsProps) => {
  const isLoading = 
    upcomingAppointments.isLoading || 
    totalAppointments.isLoading || 
    services.isLoading || 
    staff.isLoading;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Upcoming Appointments"
        value={upcomingAppointments.count}
        icon={Calendar}
        isLoading={upcomingAppointments.isLoading}
      />
      <MetricCard
        title="Total Appointments"
        value={totalAppointments.count}
        icon={Clock}
        isLoading={totalAppointments.isLoading}
      />
      <MetricCard
        title="Total Services"
        value={services.count}
        icon={Scissors}
        isLoading={services.isLoading}
      />
      <MetricCard
        title="Staff Members"
        value={staff.count}
        icon={Users}
        isLoading={staff.isLoading}
      />
    </div>
  );
};

export default DashboardMetrics;
