
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ServicesList from '@/components/services/ServicesList';
import { ServiceHeader } from '@/components/services/ServiceHeader';

const Services = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <ServiceHeader />
        <ServicesList />
      </div>
    </DashboardLayout>
  );
};

export default Services;
