import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
// import { WhatsAppSettings as WhatsAppSettingsType } from './types'; // Removed unused import (Source 1252)

const WhatsAppSettings = () => {
  const { toast } = useToast();
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false); // For saving prompt
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false); // For testing API key
  const [openAIStatus, setOpenAIStatus] = useState<null | {success: boolean, message: string}>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);


  // Load the current system prompt when component mounts
  useEffect(() => {
    const loadSystemPrompt = async () => {
      setIsLoading(true); // Indicate loading for initial fetch
      try {
        const { data, error } = await supabase
          .from('whatsapp_settings') // [✓] Source 1253
          .select('system_prompt')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: " relazione «whatsapp_settings» non contiene righe" (no rows)
            throw error;
        }
        if (data?.system_prompt) {
          setSystemPrompt(data.system_prompt);
        } else {
          // If no prompt is found (e.g., first time setup), you might set a default
          // setSystemPrompt("Default prompt here if needed");
        }
      } catch (error: any) {
        console.error('Error loading system prompt:', error);
        toast({
            title: 'Error Loading Settings',
            description: error.message || 'Failed to load AI instructions.',
            variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setInitialLoadComplete(true);
      }
    };
    loadSystemPrompt();
  }, [toast]);

  const handleSavePrompt = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({
          id: 1, // Using a constant ID for the single row
          system_prompt: systemPrompt,
          updated_at: new Date().toISOString()
        }); // [✓] Source 1254

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'GPT instructions updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving system prompt:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update GPT instructions', // [✓] Source 1255
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAIKey = async () => {
    setIsTestingOpenAI(true);
    setOpenAIStatus(null);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Authentication required. Please log in again.');
      }
      const accessToken = sessionData.session.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-test`, // Use environment variable for function URL
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}), // Empty body as per the openai-test function
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
          description: 'OpenAI API key is valid and working correctly', // [✓] Source 1257
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to validate OpenAI API key', // [✓] Source 1258
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error testing OpenAI API key:', error);
      setOpenAIStatus({
        success: false,
        message: error.message || 'Failed to test OpenAI API key' // [✓] Source 1259
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to test OpenAI API key',
        variant: 'destructive',
      });
    } finally {
      setIsTestingOpenAI(false);
    }
  };

  if (!initialLoadComplete && isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Instructions</CardTitle>
                <CardDescription>
                Customize the behavior of your GPT-powered WhatsApp assistant
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    );
  }


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
          disabled={isLoading} // Disable textarea while loading/saving initial prompt
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSavePrompt} disabled={isLoading || isTestingOpenAI} className="flex-1">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Saving...' : 'Save Instructions'}
          </Button>
          <Button
            onClick={testOpenAIKey}
            disabled={isTestingOpenAI || isLoading}
            variant="outline"
            className="flex-1"
          >
            {isTestingOpenAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isTestingOpenAI ? 'Testing...' : 'Test OpenAI API Key'}
          </Button>
        </div>
        {openAIStatus && (
          <Alert className={`mt-4 ${openAIStatus.success ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'}`}>
            {openAIStatus.success ? (
              <CheckCircle className="h-4 w-4 text-green-700" />
            ) : (
              <XCircle className="h-4 w-4 text-red-700" />
            )}
            <AlertTitle className={openAIStatus.success ? 'text-green-800' : 'text-red-800'}>
              {openAIStatus.success ? 'API Key Valid' : 'API Key Invalid'}
            </AlertTitle>
            <AlertDescription className={openAIStatus.success ? 'text-green-700' : 'text-red-700'}>
              {openAIStatus.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppSettings;
