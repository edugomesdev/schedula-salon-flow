
import { format } from 'date-fns';
import { Message } from '../AppointmentChat';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isAssistant = message.role === 'assistant';
  
  return (
    <div className={cn(
      "flex flex-col max-w-[85%]",
      isAssistant ? "items-start" : "items-end ml-auto"
    )}>
      <div className={cn(
        "rounded-lg px-4 py-2",
        isAssistant 
          ? "bg-secondary text-secondary-foreground" 
          : "bg-primary text-primary-foreground"
      )}>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
      <span className="text-xs text-muted-foreground mt-1">
        {format(new Date(message.timestamp), 'h:mm a')}
      </span>
    </div>
  );
};

export default ChatMessage;
