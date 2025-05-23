
import { Stylist, CalendarEntry, TimeSlot } from '@/types/calendar';
import DayViewHeader from './DayViewHeader';
import DayViewSlot from './DayViewSlot';

interface DayViewGridProps {
  selectedDate: Date;
  slotsWithEntries: TimeSlot[];
  stylists: Stylist[];
  entriesByStyle: Record<string, CalendarEntry[]>;
  onSlotClick: (time: Date, stylistId?: string) => void;
  onEntryClick: (entry: CalendarEntry) => void;
  onEntryDrop: (entryId: string, newTime: Date, stylistId?: string) => void;
}

const DayViewGrid = ({ 
  selectedDate,
  slotsWithEntries, 
  stylists, 
  entriesByStyle, 
  onSlotClick, 
  onEntryClick,
  onEntryDrop
}: DayViewGridProps) => {
  return (
    <div className="flex-1">
      {/* Header with date */}
      <DayViewHeader selectedDate={selectedDate} />
      
      {/* Slots grid with enhanced click handling */}
      <div className="day-slots-container">
        {slotsWithEntries.map((slot, index) => (
          <DayViewSlot 
            key={`slot-${slot.hour}-${slot.minute}-${index}`}
            slot={slot}
            stylists={stylists}
            entriesByStyle={entriesByStyle}
            onSlotClick={(time) => {
              console.log(`[DayViewGrid] Slot click at ${time.toISOString()}`);
              onSlotClick(time, undefined);
            }}
            onEntryClick={onEntryClick}
            onEntryDrop={onEntryDrop}
          />
        ))}
      </div>
    </div>
  );
};

export default DayViewGrid;
