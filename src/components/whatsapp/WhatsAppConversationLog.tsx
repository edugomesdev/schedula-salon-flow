import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator'; // Removed unused import (Source 1263)
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { WhatsAppMessage } from './types'; // [✓] Source 1263

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
        // Fetch latest WhatsApp messages
        const { data: messages, error } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100); // [✓] Source 1265

        if (error) throw error;

        // Group messages by phone number
        const groupedMessages: Record<string, WhatsAppMessage[]> = {};
        if (messages) {
          (messages as WhatsAppMessage[]).forEach((msg: WhatsAppMessage) => {
            if (!groupedMessages[msg.client_phone]) {
              groupedMessages[msg.client_phone] = [];
            }
            groupedMessages[msg.client_phone].push(msg);
          });
        }

        // Convert to array and sort by most recent message
        const conversationArray: WhatsAppConversation[] = Object.keys(groupedMessages).map(phone => {
          const phoneMessages = groupedMessages[phone];
          // Sort messages within each conversation by timestamp ascending
          const sortedMessages = [...phoneMessages].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          return {
            client_phone: phone,
            messages: sortedMessages,
            // last_message_at should be from the most recent message in the sorted list
            last_message_at: sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].created_at : new Date(0).toISOString()
          };
        });

        // Sort conversations by the timestamp of their most recent message, descending
        conversationArray.sort((a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );

        setConversations(conversationArray);

        // Select the most recent conversation by default if none is selected or the selected one is no longer valid
        if (conversationArray.length > 0 && 
            (!selectedConversation || !conversationArray.find(c => c.client_phone === selectedConversation.client_phone))) {
          setSelectedConversation(conversationArray[0]);
        } else if (conversationArray.length === 0) {
          setSelectedConversation(null);
        }

      } catch (error) {
        console.error("Error fetching WhatsApp conversations:", error); // [✓] Source 1266
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
        (_payload) => { // Renamed payload to _payload as it's not directly used in this callback
          fetchConversations(); // Refetch all conversations on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // selectedConversation is removed from deps to prevent re-fetching when user just clicks a conversation
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // Effect for initial fetch and subscription setup

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, string> = {
      'booked': 'bg-green-100 text-green-800',
      'canceled': 'bg-red-100 text-red-800',
      'rescheduled': 'bg-yellow-100 text-yellow-800',
      'inquiry': 'bg-blue-100 text-blue-800'
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}> {/* Added default badge style */}
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const formatPhoneNumber = (phone: string) => {
    // Basic formatting, can be improved for different regions
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{1,3}|1)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      const intlCode = (match[1] ? `+${match[1]} ` : '');
      return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
    }
    return phone; // Return original if no match
  };


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Conversations</CardTitle>
          <CardDescription>Loading conversation history...</CardDescription>
        </CardHeader>
        <CardContent className="h-[600px] flex items-center justify-center">
          {/* Simple loading spinner or text */}
          <div className="animate-pulse text-muted-foreground">Loading...</div>
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
        <div className="grid grid-cols-1 md:grid-cols-[minmax(250px,1fr)_2fr] h-[600px]"> {/* Adjusted grid for better responsiveness */}
          {/* Conversation list */}
          <div className="border-r flex flex-col">
            <div className="p-4 font-medium text-sm text-gray-500 border-b">CONVERSATIONS</div>
            <div className="overflow-y-auto flex-1"> {/* Allow this part to scroll */}
              {conversations.map((conversation) => (
                <div
                  key={conversation.client_phone}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.client_phone === conversation.client_phone
                      ? 'bg-gray-100' // Slightly different background for selected
                      : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="font-medium">
                    {formatPhoneNumber(conversation.client_phone)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex justify-between items-center">
                    <span className="truncate max-w-[150px] sm:max-w-[180px]"> {/* Responsive max-width */}
                      {conversation.messages[conversation.messages.length - 1].message.substring(0, 30)}
                      {conversation.messages[conversation.messages.length - 1].message.length > 30 ? '...' : ''}
                    </span>
                    <span className="text-xs whitespace-nowrap"> {/* Prevent wrapping of date */}
                      {format(new Date(conversation.last_message_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation detail */}
          <div className="col-span-2 md:col-span-1 flex flex-col h-full"> {/* Ensure it takes up remaining space */}
            {selectedConversation ? (
              <>
                <div className="p-4 border-b">
                  <div className="font-medium">
                    {formatPhoneNumber(selectedConversation.client_phone)}
                  </div>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-4"> {/* Added space-y-4 for message spacing */}
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg max-w-[80%] shadow-sm`} // Added shadow
                      >
                        <div className={`text-sm ${message.direction === 'outgoing' ? 'text-white' : 'text-gray-800'}`}>
                            {message.message}
                        </div>
                        <div className={`text-xs mt-1 flex justify-between items-center ${message.direction === 'outgoing' ? 'text-blue-100' : 'opacity-75'}`}>
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
              <div className="flex items-center justify-center h-full text-gray-500 p-4">
                Select a conversation to view details.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConversationLog;
