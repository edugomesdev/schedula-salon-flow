
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const WhatsAppSetupGuide = () => {
  const { toast } = useToast();
  
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
  );
};

export default WhatsAppSetupGuide;
