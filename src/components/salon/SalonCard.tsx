
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Building, MapPin, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SalonData {
  id: string;
  name: string;
  description?: string;
  location?: string | null;
  phone?: string | null;
}

interface SalonCardProps {
  salon: SalonData;
  onEditClick: () => void;
}

const SalonCard = ({ salon, onEditClick }: SalonCardProps) => {
  console.log("SalonCard rendering with salon data:", salon);
  
  return (
    <Card className="border-primary/30 shadow-sm overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">{salon.name}</h3>
        </div>
        
        <div className="mb-4">
          <div className="flex items-start gap-2 text-muted-foreground">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{salon.description || "No description available"}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{salon.location || "No address provided"}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span>{salon.phone || "No phone number provided"}</span>
          </div>
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
