
import { useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  format, 
  isSameMonth, 
  isSameDay,
  parseISO
} from 'date-fns';
import { CalendarViewProps } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';

const MonthView = ({ stylists, entries, onSlotClick, onEntryClick }: CalendarViewProps) => {
  const { selectedDate, stylistVisibility } = useCalendar();
  
  // Get all days for the current month view
  const daysInMonthView = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [selectedDate]);
  
  // Filter entries for visible stylists
  const visibleEntries = useMemo(() => {
    return entries.filter(entry => stylistVisibility[entry.stylist_id] !== false);
  }, [entries, stylistVisibility]);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const result: Record<string, typeof visibleEntries> = {};
    
    visibleEntries.forEach(entry => {
      const dateKey = format(parseISO(entry.start_time), 'yyyy-MM-dd');
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      result[dateKey].push(entry);
    });
    
    return result;
  }, [visibleEntries]);

  // Enhanced slot click handler with debugging
  const handleDayClick = (day: Date, e: React.MouseEvent) => {
    console.log(`[MonthView] Day clicked: ${format(day, 'yyyy-MM-dd')}`, {
      target: e.target, 
      currentTarget: e.currentTarget
    });
    e.stopPropagation();
    onSlotClick(day);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-7 gap-0 divide-x divide-y">
        {/* Days of week header */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="h-10 flex items-center justify-center font-medium bg-gray-50">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {daysInMonthView.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEntries = entriesByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, selectedDate);
          
          return (
            <div 
              key={idx}
              className={`min-h-[100px] p-1 cursor-pointer ${
                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
              } ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''} hover:bg-gray-50`}
              onClick={(e) => handleDayClick(day, e)}
              data-testid="calendar-month-day"
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1">
                {dayEntries.slice(0, 3).map(entry => {
                  const stylist = stylists.find(s => s.id === entry.stylist_id);
                  
                  return (
                    <div 
                      key={entry.id}
                      className="text-xs p-1 rounded truncate cursor-pointer z-20 relative"
                      style={{ backgroundColor: stylist?.color || '#CBD5E0' }}
                      onClick={(e) => {
                        console.log('[MonthView] Entry clicked:', entry);
                        e.stopPropagation();
                        onEntryClick(entry);
                      }}
                    >
                      {format(parseISO(entry.start_time), 'h:mm a')} - {entry.title}
                    </div>
                  );
                })}
                
                {dayEntries.length > 3 && (
                  <div className="text-xs text-gray-500 pl-1">
                    + {dayEntries.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
