
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ServicesList from '@/components/services/ServicesList';
import { ServiceHeader } from '@/components/services/ServiceHeader';
import { ServiceModal } from '@/components/services/ServiceModal';

const Services = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <ServiceHeader />
        <ServicesList />
        <ServiceModal />
      </div>
    </DashboardLayout>
  );
};

export default Services;
