
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Building, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SalonData {
  id: string;
  name: string;
  description?: string;
  location?: string;
  phone?: string;
}

interface SalonCardProps {
  salon: SalonData;
  onEditClick: () => void;
}

const SalonCard = ({ salon, onEditClick }: SalonCardProps) => {
  return (
    <Card className="border-primary/30 shadow-sm overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">{salon.name}</h3>
        </div>
        
        {salon.description && (
          <p className="text-muted-foreground mb-4">{salon.description}</p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mt-2">
          {salon.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{salon.location}</span>
            </div>
          )}
          
          {salon.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{salon.phone}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/10 px-6 py-3">
        <Button 
          onClick={onEditClick}
          variant="outline" 
          size="sm"
        >
          Edit Salon Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SalonCard;
