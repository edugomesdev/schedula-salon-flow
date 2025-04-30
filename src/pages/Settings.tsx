
import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <div className="grid gap-6">
          {/* Settings content will be added here in the future */}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
