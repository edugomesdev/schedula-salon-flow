
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip } from '@/components/ui/tooltip';

const AppointmentAssistantSettings = () => {
  const { toast } = useToast();
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [servicesList, setServicesList] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState<null | {success: boolean, message: string}>(null);

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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="system-prompt" className="text-sm font-medium">
                AI Instructions
              </label>
              <Tooltip content="Instructions that guide how the AI assistant responds to clients">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  ?
                </Button>
              </Tooltip>
            </div>
            <Textarea
              id="system-prompt"
              placeholder="Enter custom instructions for your AI appointment assistant..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              className="mb-4"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="services-list" className="text-sm font-medium">
                Services List
              </label>
              <Tooltip content="Custom information about your services that the AI can reference">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  ?
                </Button>
              </Tooltip>
            </div>
            <Textarea
              id="services-list"
              placeholder="Enter details about your services (prices, descriptions, etc.)..."
              value={servicesList}
              onChange={(e) => setServicesList(e.target.value)}
              rows={6}
              className="mb-4"
            />
            <p className="text-xs text-muted-foreground">
              Note: Services entered here will supplement the services already defined in your salon settings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleSaveSettings} 
              disabled={isLoading} 
              className="flex-1"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button 
              onClick={testOpenAIKey} 
              disabled={isTestingOpenAI} 
              variant="outline"
              className="flex-1"
            >
              {isTestingOpenAI ? 'Testing...' : 'Test OpenAI API Key'}
            </Button>
          </div>
          
          {openAIStatus && (
            <Alert className={`mt-4 ${openAIStatus.success ? 'bg-green-50' : 'bg-red-50'}`}>
              {openAIStatus.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>
                {openAIStatus.success ? 'API Key Valid' : 'API Key Invalid'}
              </AlertTitle>
              <AlertDescription>
                {openAIStatus.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentAssistantSettings;
