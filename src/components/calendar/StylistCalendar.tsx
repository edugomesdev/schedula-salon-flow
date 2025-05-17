
import { CalendarEntry, Stylist } from '@/types/calendar';
// Removed 'view' from useCalendar import as it's not used here
// import { useCalendar } from '@/contexts/CalendarContext'; // [✓] Source 910
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
  // const { view } = useCalendar(); // 'view' was unused (Source 910)

  // Filter entries for just this stylist
  const stylistEntries = useMemo(() => {
    return entries.filter(entry => entry.stylist_id === stylist.id);
  }, [entries, stylist.id]);

  // Enhanced slot click handler that always includes stylist ID
  const handleSlotClick = (time: Date) => {
    console.log(`[StylistCalendar] Slot clicked for stylist ${stylist.name} at ${time.toISOString()}`); // [✓] Source 913
    onSlotClick(time, stylist.id);
  };

  // Handle drag and drop for this stylist's calendar
  const handleEntryDrop = (entryId: string, newTime: Date) => {
    console.log(`[StylistCalendar] Entry dropped for stylist ${stylist.name}: ${entryId} at ${newTime.toISOString()}`); // [✓] Source 914
    onEntryDrop(entryId, newTime, stylist.id);
  };

  return (
    <div className="flex flex-col border rounded-md overflow-hidden">
      <div className="bg-white p-3 border-b flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: stylist.color || '#CBD5E0' }} // [✓] Source 916
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
          onSlotClick={handleSlotClick} // Pass the wrapped handler
          onEntryClick={onEntryClick}   // Pass original handler
          onEntryDrop={handleEntryDrop} // Pass the wrapped handler
        />
      </div>
    </div>
  );
};

export default StylistCalendar;
