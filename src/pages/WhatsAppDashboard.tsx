
import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import WhatsAppConversationLog from '@/components/whatsapp/WhatsAppConversationLog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppSettings } from '@/components/whatsapp/types';

const WhatsAppDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('conversations');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  // Load the current system prompt when component mounts
  React.useEffect(() => {
    const loadSystemPrompt = async () => {
      try {
        const { data, error } = await supabase
          .from('whatsapp_settings')
          .select('system_prompt')
          .single() as { data: WhatsAppSettings | null, error: any };
          
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
        }) as { error: any };
        
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

  const copyWebhookUrl = () => {
    const projectId = 'gusvinsszquyhppemkgq';
    const url = `https://${projectId}.functions.supabase.co/whatsapp-webhook`;
    
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: 'Webhook URL copied',
          description: 'The webhook URL has been copied to your clipboard',
        });
      })
      .catch(err => {
        console.error('Failed to copy webhook URL:', err);
        toast({
          title: 'Failed to copy URL',
          description: 'Please copy the URL manually',
          variant: 'destructive',
        });
      });
  };

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
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          </TabsList>
          
          <TabsContent value="conversations">
            <WhatsAppConversationLog />
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="grid gap-6">
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
                  <Button onClick={handleSavePrompt} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Instructions'}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Testing</CardTitle>
                  <CardDescription>
                    Send test messages to ensure your WhatsApp integration is working correctly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          placeholder="+1234567890"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                        />
                        <Button variant="outline">Send Test Message</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="setup">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Business API Setup Guide</CardTitle>
                <CardDescription>
                  Follow these steps to connect your WhatsApp Business account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">1. Create a Meta Developer Account</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Visit the <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Meta for Developers</a> website and set up your account.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">2. Set Up a Meta App</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Create a new app and select "Business" as the app type.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">3. Add WhatsApp to Your App</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Navigate to the app dashboard and add WhatsApp as a product.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">4. Configure Your Webhook</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Use the following URL as your webhook endpoint:
                  </p>
                  <div className="flex items-center bg-gray-100 p-2 rounded-md">
                    <code className="flex-1 text-sm overflow-auto">
                      https://gusvinsszquyhppemkgq.functions.supabase.co/whatsapp-webhook
                    </code>
                    <Button variant="ghost" size="sm" onClick={copyWebhookUrl} className="ml-2">
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">5. Set Up Required Secrets</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Add the following secrets in your Supabase project:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    <li>WHATSAPP_TOKEN (Your verification token)</li>
                    <li>WHATSAPP_API_KEY (Your WhatsApp API key)</li>
                    <li>WHATSAPP_PHONE_NUMBER_ID (Your WhatsApp phone number ID)</li>
                    <li>OPENAI_API_KEY (For GPT integration)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">6. Configure Webhooks</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Subscribe to "messages" webhook field to receive incoming messages.
                  </p>
                </div>
                
                <Button variant="outline" className="mt-4">
                  <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noreferrer" className="flex items-center">
                    View Official Documentation
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppDashboard;
