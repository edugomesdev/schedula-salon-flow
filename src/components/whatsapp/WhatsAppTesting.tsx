
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const WhatsAppTesting = () => {
  const { toast } = useToast();
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from our salon WhatsApp system.');
  const [isSending, setIsSending] = useState(false);

  const sendTestMessage = async () => {
    if (!testPhone) {
      toast({
        title: 'Error',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSending(true);
      
      // Format phone number - ensure it starts with a + and has no spaces
      const formattedPhone = testPhone.startsWith('+') ? testPhone : `+${testPhone}`;
      
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch(
        `https://gusvinsszquyhppemkgq.functions.supabase.co/whatsapp-test-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            to: formattedPhone.replace(/\s+/g, ''),
            message: testMessage
          }),
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Test message sent successfully!',
        });
        
        // Save the outgoing message to our database
        await supabase
          .from('whatsapp_messages')
          .insert({
            client_phone: formattedPhone.replace(/\s+/g, ''),
            message: testMessage,
            direction: 'outgoing'
          });
      } else {
        throw new Error(result.error || 'Failed to send test message');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
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
            <Input
              type="text"
              placeholder="+1234567890"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="mb-2"
            />
            <label className="block text-sm font-medium mb-1">Message</label>
            <Textarea
              placeholder="Enter your test message here..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="mb-4"
            />
            <Button 
              onClick={sendTestMessage} 
              disabled={isSending || !testPhone.trim()} 
              className="w-full"
            >
              {isSending ? 'Sending...' : 'Send Test Message'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Note: The phone number must include the country code (e.g., +1 for US numbers).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppTesting;
