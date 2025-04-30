
import { useDrag } from 'react-dnd';
import { CalendarEntry, Stylist } from '@/types/calendar';
import { ReactNode } from 'react';

export const DRAG_ITEM_TYPE = 'CALENDAR_ENTRY';

interface EntryDragItemProps {
  entry: CalendarEntry;
  stylist?: Stylist;
  children: ReactNode;
  onEntryClick: (entry: CalendarEntry) => void;
}

const EntryDragItem = ({ entry, stylist, children, onEntryClick }: EntryDragItemProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_ITEM_TYPE,
    item: { 
      entryId: entry.id,
      stylistId: entry.stylist_id,
      title: entry.title,
      entryData: entry
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  return (
    <div 
      ref={drag}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEntryClick(entry);
      }}
    >
      {children}
    </div>
  );
};

export default EntryDragItem;
