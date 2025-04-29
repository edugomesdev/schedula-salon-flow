
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppSettings as WhatsAppSettingsType } from './types';

const WhatsAppSettings = () => {
  const { toast } = useToast();
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState<null | {success: boolean, message: string}>(null);

  // Load the current system prompt when component mounts
  useEffect(() => {
    const loadSystemPrompt = async () => {
      try {
        const { data, error } = await supabase
          .from('whatsapp_settings')
          .select('system_prompt')
          .single();
          
        if (error) throw error;
        
        if (data?.system_prompt) {
          setSystemPrompt(data.system_prompt);
        }
      } catch (error) {
        console.error('Error loading system prompt:', error);
      }
    };
    
    loadSystemPrompt();
  }, []);

  const handleSavePrompt = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({ 
          id: 1, // Using a constant ID for the single row
          system_prompt: systemPrompt,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'GPT instructions updated successfully',
      });
    } catch (error) {
      console.error('Error saving system prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to update GPT instructions',
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
    <Card>
      <CardHeader>
        <CardTitle>AI Instructions</CardTitle>
        <CardDescription>
          Customize the behavior of your GPT-powered WhatsApp assistant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Enter custom instructions for your AI assistant..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={10}
          className="mb-4"
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSavePrompt} disabled={isLoading} className="flex-1">
            {isLoading ? 'Saving...' : 'Save Instructions'}
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
  );
};

export default WhatsAppSettings;
