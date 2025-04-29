
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OpenAIStatusAlertProps {
  openAIStatus: {
    success: boolean;
    message: string;
  } | null;
}

export const OpenAIStatusAlert = ({ openAIStatus }: OpenAIStatusAlertProps) => {
  if (!openAIStatus) return null;
  
  return (
    <Alert className={`mt-4 ${openAIStatus.success ? 'bg-green-50' : 'bg-red-50'}`}>
      {openAIStatus.success ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
      <AlertTitle>
        {openAIStatus.success ? 'API Key Valid' : 'API Key Invalid'}
      </AlertTitle>
      <AlertDescription>
        {openAIStatus.message}
      </AlertDescription>
    </Alert>
  );
};
