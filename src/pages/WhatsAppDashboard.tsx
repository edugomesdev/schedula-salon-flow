
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import WhatsAppConversationLog from '@/components/whatsapp/WhatsAppConversationLog';
import WhatsAppSettings from '@/components/whatsapp/WhatsAppSettings';
import WhatsAppTesting from '@/components/whatsapp/WhatsAppTesting';
import WhatsAppSetupGuide from '@/components/whatsapp/WhatsAppSetupGuide';
import AppointmentAssistantSettings from '@/components/appointments/settings/AppointmentAssistantSettings';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const WhatsAppDashboard = () => {
  const [activeTab, setActiveTab] = useState('conversations');

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">WhatsApp Business Integration</h1>
            <p className="text-muted-foreground">
              Manage your salon's WhatsApp booking assistant
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <span className="flex h-2 w-2 mr-1 rounded-full bg-green-500" />
            Active
          </Badge>
        </div>

        <Tabs defaultValue="conversations" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="whatsapp-settings">WhatsApp Settings</TabsTrigger>
            <TabsTrigger value="appointment-settings">Appointment Assistant</TabsTrigger>
            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          </TabsList>
          
          <TabsContent value="conversations">
            <WhatsAppConversationLog />
          </TabsContent>
          
          <TabsContent value="whatsapp-settings">
            <div className="grid gap-6">
              <WhatsAppSettings />
              <WhatsAppTesting />
            </div>
          </TabsContent>
          
          <TabsContent value="appointment-settings">
            <AppointmentAssistantSettings />
          </TabsContent>
          
          <TabsContent value="setup">
            <WhatsAppSetupGuide />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppDashboard;
