
import { useCalendar } from '@/contexts/CalendarContext';
import { Stylist } from '@/types/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { PersonStanding } from 'lucide-react';

interface StylistToggleProps {
  stylists: Stylist[];
  onRefreshRequest?: () => void;
}

const StylistToggle = ({ stylists, onRefreshRequest }: StylistToggleProps) => {
  const { stylistVisibility, toggleStylistVisibility, showAllStylists, hideAllStylists } = useCalendar();

  return (
    <div className="p-4 border rounded-md space-y-4 mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Stylists</h3>
        <div className="space-x-2 flex">
          <Button variant="outline" size="sm" onClick={showAllStylists}>
            Show All
          </Button>
          <Button variant="outline" size="sm" onClick={hideAllStylists}>
            Hide All
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {stylists.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center p-2">
            No stylists found. Add staff members to see them here.
          </p>
        ) : (
          stylists.map((stylist) => (
            <div key={stylist.id} className="flex items-center space-x-3">
              <Checkbox 
                id={`stylist-${stylist.id}`} 
                checked={stylistVisibility[stylist.id] !== false} 
                onCheckedChange={() => toggleStylistVisibility(stylist.id)}
              />
              <div className="flex items-center flex-1">
                <Avatar className="h-6 w-6 mr-2">
                  {stylist.profile_image_url ? (
                    <img src={stylist.profile_image_url} alt={stylist.name} className="rounded-full" />
                  ) : (
                    <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center rounded-full">
                      <PersonStanding className="h-3 w-3" />
                    </div>
                  )}
                </Avatar>
                <label 
                  htmlFor={`stylist-${stylist.id}`} 
                  className="text-sm cursor-pointer"
                >
                  {stylist.name}
                </label>
              </div>
              <Badge 
                style={{ backgroundColor: stylist.color || '#CBD5E0' }} 
                className="ml-auto"
              >
                &nbsp;
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StylistToggle;
