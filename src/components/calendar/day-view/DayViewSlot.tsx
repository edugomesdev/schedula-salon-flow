
import { useState } from 'react';
import { CalendarEntry, Stylist, TimeSlot } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';

interface DayViewSlotProps {
  slot: TimeSlot;
  stylists: Stylist[];
  entriesByStyle: Record<string, CalendarEntry[]>;
  onSlotClick: (time: Date) => void;
  onEntryClick: (entry: CalendarEntry) => void;
}

const DayViewSlot = ({ 
  slot, 
  stylists, 
  entriesByStyle, 
  onSlotClick, 
  onEntryClick 
}: DayViewSlotProps) => {
  const { stylistVisibility } = useCalendar();
  
  return (
    <div className="grid grid-cols-1 h-24 border-b relative">
      {/* Empty slot - make div cover the full area and improve clickability */}
      <div
        className="absolute inset-0 cursor-pointer hover:bg-gray-50 flex items-center justify-center text-sm text-gray-400 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onSlotClick(slot.time);
        }}
      >
        {!slot.isBooked && (
          <span className="opacity-0 hover:opacity-100 transition-opacity duration-200">+ Create Appointment</span>
        )}
      </div>
      
      {/* Appointments */}
      <div className="absolute inset-0 p-1 z-20">
        {stylists.map(stylist => {
          if (stylistVisibility[stylist.id] === false) return null;
          
          const stylistEntries = entriesByStyle[stylist.id] || [];
          const currentEntries = stylistEntries.filter(entry => {
            const startTime = new Date(entry.start_time);
            return startTime.getHours() === slot.hour && startTime.getMinutes() === slot.minute;
          });
          
          return currentEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-2 rounded-md text-xs h-full overflow-hidden cursor-pointer"
              style={{ backgroundColor: stylist.color || '#CBD5E0' }}
              onClick={(e) => {
                e.stopPropagation();
                onEntryClick(entry);
              }}
            >
              <div className="font-medium">{entry.title}</div>
              {entry.client_name && (
                <div className="text-xs opacity-90">{entry.client_name}</div>
              )}
              {entry.service_name && (
                <div className="text-xs opacity-75">{entry.service_name}</div>
              )}
            </div>
          ));
        })}
      </div>
    </div>
  );
};

export default DayViewSlot;
