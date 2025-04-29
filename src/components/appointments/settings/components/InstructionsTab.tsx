
import React from 'react';
import { FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

interface InstructionsTabProps {
  systemPrompt: string;
  setSystemPrompt: (value: string) => void;
}

export const InstructionsTab = ({ systemPrompt, setSystemPrompt }: InstructionsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4" />
          <label htmlFor="system-prompt" className="text-sm font-medium">
            GPT Custom Instructions
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
          rows={8}
          className="mb-4"
        />
        <p className="text-xs text-muted-foreground">
          These instructions guide how the AI responds to appointment requests and questions.
        </p>
      </div>
    </div>
  );
};
