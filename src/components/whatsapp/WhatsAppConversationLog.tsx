import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppMessage } from './types';

interface WhatsAppConversation {
  client_phone: string;
  messages: WhatsAppMessage[];
  last_message_at: string;
}

const WhatsAppConversationLog = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        
        // Fetch latest WhatsApp messages using explicit typing
        const { data: messages, error } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100) as { data: WhatsAppMessage[] | null, error: any };
          
        if (error) throw error;
        
        // Group messages by phone number
        const groupedMessages: Record<string, WhatsAppMessage[]> = {};
        
        if (messages) {
          messages.forEach((msg: WhatsAppMessage) => {
            if (!groupedMessages[msg.client_phone]) {
              groupedMessages[msg.client_phone] = [];
            }
            groupedMessages[msg.client_phone].push(msg);
          });
        }
        
        // Convert to array and sort by most recent message
        const conversationArray: WhatsAppConversation[] = Object.keys(groupedMessages).map(phone => {
          const phoneMessages = groupedMessages[phone];
          return {
            client_phone: phone,
            messages: phoneMessages.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            ),
            last_message_at: phoneMessages[phoneMessages.length - 1].created_at
          };
        });
        
        // Sort by most recent conversation
        conversationArray.sort((a, b) => 
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );
        
        setConversations(conversationArray);
        
        // Select the most recent conversation by default
        if (conversationArray.length > 0 && !selectedConversation) {
          setSelectedConversation(conversationArray[0]);
        }
      } catch (error) {
        console.error("Error fetching WhatsApp conversations:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('whatsapp-message-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_messages' },
        () => {
          fetchConversations();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const variants: Record<string, string> = {
      'booked': 'bg-green-100 text-green-800',
      'canceled': 'bg-red-100 text-red-800',
      'rescheduled': 'bg-yellow-100 text-yellow-800',
      'inquiry': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={variants[status] || ''}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };
  
  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    return phone.replace(/(\d{1,3})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Conversations</CardTitle>
          <CardDescription>Loading conversation history...</CardDescription>
        </CardHeader>
        <CardContent className="h-[600px] flex items-center justify-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Conversations</CardTitle>
          <CardDescription>No conversations found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            No WhatsApp booking conversations have been received yet.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Conversations</CardTitle>
        <CardDescription>Recent client booking conversations</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Conversation list */}
          <div className="border-r">
            <div className="p-4 font-medium text-sm text-gray-500">CONVERSATIONS</div>
            <div className="overflow-y-auto max-h-[550px]">
              {conversations.map((conversation) => (
                <div 
                  key={conversation.client_phone}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.client_phone === conversation.client_phone 
                      ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="font-medium">
                    {formatPhoneNumber(conversation.client_phone)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex justify-between">
                    <span className="truncate max-w-[150px]">
                      {conversation.messages[conversation.messages.length - 1].message.substring(0, 30)}
                      {conversation.messages[conversation.messages.length - 1].message.length > 30 ? '...' : ''}
                    </span>
                    <span className="text-xs">
                      {format(new Date(conversation.last_message_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Conversation detail */}
          <div className="col-span-2 flex flex-col h-full">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b">
                  <div className="font-medium">
                    {formatPhoneNumber(selectedConversation.client_phone)}
                  </div>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                  {selectedConversation.messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`mb-4 flex ${
                        message.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div 
                        className={`px-4 py-2 rounded-lg max-w-[80%] ${
                          message.direction === 'outgoing'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="text-sm">{message.message}</div>
                        <div className="text-xs mt-1 opacity-75 flex justify-between items-center">
                          <span>{format(new Date(message.created_at), 'MMM d, h:mm a')}</span>
                          {message.status && (
                            <span className="ml-2">{getStatusBadge(message.status)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a conversation to view details
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConversationLog;
