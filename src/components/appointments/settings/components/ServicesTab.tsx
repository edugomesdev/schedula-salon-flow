
import React from 'react';
import { FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

interface ServicesTabProps {
  servicesList: string;
  setServicesList: (value: string) => void;
}

export const ServicesTab = ({ servicesList, setServicesList }: ServicesTabProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4" />
          <label htmlFor="services-list" className="text-sm font-medium">
            Services List
          </label>
          <Tooltip content="Custom information about your services that the AI can reference">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              ?
            </Button>
          </Tooltip>
        </div>
        <Textarea
          id="services-list"
          placeholder="Enter details about your services (prices, descriptions, etc.)..."
          value={servicesList}
          onChange={(e) => setServicesList(e.target.value)}
          rows={8}
          className="mb-4"
        />
        <p className="text-xs text-muted-foreground">
          Note: Services entered here will supplement the services already defined in your salon settings.
        </p>
      </div>
    </div>
  );
};
