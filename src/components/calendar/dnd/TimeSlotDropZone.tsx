
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
      className={`relative w-full h-full transition-colors duration-150 
        ${isOver && canDrop ? 'bg-blue-100 ring-2 ring-inset ring-blue-300' : ''} 
        ${canDrop && !isOver ? 'hover:bg-blue-50' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onSlotClick(time, stylistId);
      }}
    >
      {isOver && canDrop && (
        <div className="absolute inset-0 bg-blue-100 bg-opacity-40 pointer-events-none z-10 flex items-center justify-center">
          <div className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded shadow-sm">
            Drop to reschedule
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default TimeSlotDropZone;
