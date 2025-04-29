
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstructionsTab } from './components/InstructionsTab';
import { ServicesTab } from './components/ServicesTab';
import { OpenAIStatusAlert } from './components/OpenAIStatusAlert';
import { SettingsActions } from './components/SettingsActions';

const AppointmentAssistantSettings = () => {
  const { toast } = useToast();
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [servicesList, setServicesList] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState<null | {success: boolean, message: string}>(null);
  const [activeTab, setActiveTab] = useState('instructions');

  // Load the current settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('appointment_assistant_settings')
          .select('system_prompt, services_list')
          .single();
          
        if (error) throw error;
        
        if (data) {
          setSystemPrompt(data.system_prompt || '');
          setServicesList(data.services_list || '');
        }
      } catch (error) {
        console.error('Error loading appointment assistant settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [toast]);

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('appointment_assistant_settings')
        .upsert({ 
          id: 1, // Using a constant ID for the single row
          system_prompt: systemPrompt,
          services_list: servicesList,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Appointment assistant settings updated successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAIKey = async () => {
    try {
      setIsTestingOpenAI(true);
      setOpenAIStatus(null);
      
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch(
        `https://gusvinsszquyhppemkgq.functions.supabase.co/openai-test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();
      
      setOpenAIStatus({
        success: result.success,
        message: result.message
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'OpenAI API key is valid and working correctly',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to validate OpenAI API key',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing OpenAI API key:', error);
      setOpenAIStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test OpenAI API key'
      });
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to test OpenAI API key',
        variant: 'destructive',
      });
    } finally {
      setIsTestingOpenAI(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Appointment Assistant Settings</CardTitle>
          <CardDescription>
            Customize how your AI appointment assistant behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="instructions">AI Instructions</TabsTrigger>
              <TabsTrigger value="services">Services List</TabsTrigger>
            </TabsList>
            
            <TabsContent value="instructions">
              <InstructionsTab 
                systemPrompt={systemPrompt} 
                setSystemPrompt={setSystemPrompt} 
              />
            </TabsContent>
            
            <TabsContent value="services">
              <ServicesTab 
                servicesList={servicesList} 
                setServicesList={setServicesList} 
              />
            </TabsContent>
          </Tabs>

          <SettingsActions 
            handleSaveSettings={handleSaveSettings}
            testOpenAIKey={testOpenAIKey}
            isLoading={isLoading}
            isTestingOpenAI={isTestingOpenAI}
          />
          
          <OpenAIStatusAlert openAIStatus={openAIStatus} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentAssistantSettings;
