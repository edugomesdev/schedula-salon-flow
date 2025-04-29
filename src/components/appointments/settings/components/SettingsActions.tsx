
import React from 'react';
import { Button } from '@/components/ui/button';

interface SettingsActionsProps {
  handleSaveSettings: () => Promise<void>;
  testOpenAIKey: () => Promise<void>;
  isLoading: boolean;
  isTestingOpenAI: boolean;
}

export const SettingsActions = ({ 
  handleSaveSettings, 
  testOpenAIKey, 
  isLoading, 
  isTestingOpenAI 
}: SettingsActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button 
        onClick={handleSaveSettings} 
        disabled={isLoading} 
        className="flex-1"
      >
        {isLoading ? 'Saving...' : 'Save Settings'}
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
  );
};
