
import { CalendarEntry, Stylist } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import CalendarContent from './CalendarContent';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

interface StylistCalendarProps {
  stylist: Stylist;
  entries: CalendarEntry[];
  onSlotClick: (time: Date, stylistId?: string) => void;
  onEntryClick: (entry: CalendarEntry) => void;
  onEntryDrop: (entryId: string, newTime: Date, newStylistId?: string) => void;
}

const StylistCalendar = ({
  stylist,
  entries,
  onSlotClick,
  onEntryClick,
  onEntryDrop
}: StylistCalendarProps) => {
  const { view } = useCalendar();
  
  // Filter entries for just this stylist
  const stylistEntries = useMemo(() => {
    return entries.filter(entry => entry.stylist_id === stylist.id);
  }, [entries, stylist.id]);
  
  // Enhanced slot click handler that always includes stylist ID
  const handleSlotClick = (time: Date) => {
    console.log(`[StylistCalendar] Slot clicked for stylist ${stylist.name} at ${time.toISOString()}`);
    onSlotClick(time, stylist.id);
  };

  // Handle drag and drop for this stylist's calendar
  const handleEntryDrop = (entryId: string, newTime: Date) => {
    console.log(`[StylistCalendar] Entry dropped for stylist ${stylist.name}: ${entryId} at ${newTime.toISOString()}`);
    onEntryDrop(entryId, newTime, stylist.id);
  };

  return (
    <div className="flex flex-col border rounded-md overflow-hidden">
      <div className="bg-white p-3 border-b flex items-center gap-2">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: stylist.color || '#CBD5E0' }}
        />
        <h3 className="font-medium">{stylist.name}</h3>
        {stylist.expertise && stylist.expertise.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {stylist.expertise[0]}
            {stylist.expertise.length > 1 && ' +' + (stylist.expertise.length - 1)}
          </Badge>
        )}
      </div>
      
      <div className="flex-1">
        <CalendarContent
          stylists={[stylist]} // Only pass this stylist
          entries={stylistEntries}
          onSlotClick={handleSlotClick}
          onEntryClick={onEntryClick}
          onEntryDrop={handleEntryDrop}
        />
      </div>
    </div>
  );
};

export default StylistCalendar;
