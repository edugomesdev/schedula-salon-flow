
import { useState, useEffect, useRef } from 'react';
import { SendIcon, XIcon, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './chat/ChatMessage';
import { format } from 'date-fns';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AppointmentChatProps {
  salonId: string;
  stylistId?: string | null;
  currentDate?: Date;
}

const AppointmentChat = ({ salonId, stylistId, currentDate }: AppointmentChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Welcome message when chat first opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        content: "👋 Hello! I'm your appointment assistant. How can I help you today? You can ask about services, availability, or get help scheduling an appointment.",
        role: 'assistant' as const,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      content: inputValue,
      role: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Prepare conversation history for the API in the format OpenAI expects
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Format date context if available
      const dateContext = currentDate 
        ? `Viewing calendar for ${format(currentDate, 'MMMM d, yyyy')}`
        : undefined;
      
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('appointment-assistant', {
        body: {
          message: inputValue,
          conversationHistory,
          salonId,
          stylistId,
          dateContext
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Add the assistant's response to the messages
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        content: data.response,
        role: 'assistant' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
      
      // Add an error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: "I'm sorry, I couldn't process your request. Please try again later.",
        role: 'assistant' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-lg"
            aria-label="Open appointment assistant"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-[400px] p-0 flex flex-col h-[600px]">
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>Appointment Assistant</SheetTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                aria-label="Close appointment assistant"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id}
                message={message}
              />
            ))}
            <div ref={messagesEndRef} />
            
            {isLoading && (
              <div className="flex items-center justify-center py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Tooltip content="Send message">
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  size="icon"
                  aria-label="Send message"
                >
                  <SendIcon className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AppointmentChat;
