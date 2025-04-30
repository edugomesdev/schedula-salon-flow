
import { useDrop } from 'react-dnd';
import { DRAG_ITEM_TYPE } from './EntryDragItem';
import { ReactNode } from 'react';

interface TimeSlotDropZoneProps {
  time: Date;
  stylistId?: string;
  onDrop: (entryId: string, newTime: Date, stylistId?: string) => void;
  children: ReactNode;
  onSlotClick: (time: Date, stylistId?: string) => void;
}

const TimeSlotDropZone = ({ 
  time, 
  stylistId, 
  onDrop, 
  children, 
  onSlotClick 
}: TimeSlotDropZoneProps) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: DRAG_ITEM_TYPE,
    drop: (item: { entryId: string }) => {
      onDrop(item.entryId, time, stylistId);
      return { moved: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  }));

  return (
    <div 
      ref={drop} 
      className={`${isOver && canDrop ? 'bg-blue-100' : ''}`}
      style={{ 
        position: 'relative',
        height: '100%',
        width: '100%',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSlotClick(time, stylistId);
      }}
    >
      {children}
    </div>
  );
};

export default TimeSlotDropZone;
