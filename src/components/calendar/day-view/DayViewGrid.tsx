
import { Stylist, CalendarEntry, TimeSlot } from '@/types/calendar';
import DayViewHeader from './DayViewHeader';
import DayViewSlot from './DayViewSlot';

interface DayViewGridProps {
  selectedDate: Date;
  slotsWithEntries: TimeSlot[];
  stylists: Stylist[];
  entriesByStyle: Record<string, CalendarEntry[]>;
  onSlotClick: (time: Date) => void;
  onEntryClick: (entry: CalendarEntry) => void;
}

const DayViewGrid = ({ 
  selectedDate,
  slotsWithEntries, 
  stylists, 
  entriesByStyle, 
  onSlotClick, 
  onEntryClick 
}: DayViewGridProps) => {
  return (
    <div className="flex-1">
      {/* Header with date */}
      <DayViewHeader selectedDate={selectedDate} />
      
      {/* Slots grid */}
      {slotsWithEntries.map((slot, index) => (
        <DayViewSlot 
          key={index}
          slot={slot}
          stylists={stylists}
          entriesByStyle={entriesByStyle}
          onSlotClick={onSlotClick}
          onEntryClick={onEntryClick}
        />
      ))}
    </div>
  );
};

export default DayViewGrid;
