
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { useServiceModal } from '@/hooks/services/useServiceModal';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { openModal } = useServiceModal();
  
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours} hr ${remainingMinutes} min` 
      : `${hours} hr`;
  };

  return (
    <Card className="relative overflow-hidden border-primary/10 transition-all hover:shadow-md">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
        {service.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{service.description}</p>
        )}
        <div className="flex items-center text-muted-foreground text-sm mb-4">
          <Clock className="mr-1 h-4 w-4" />
          <span>{formatDuration(service.duration)}</span>
        </div>
        <div className="text-2xl font-bold text-primary">
          {formatCurrency(service.price)}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/10 px-6 py-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => openModal(service)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
