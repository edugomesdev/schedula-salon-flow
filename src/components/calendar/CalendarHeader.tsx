
import { useCalendar } from '@/contexts/CalendarContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, LayoutGrid, LayoutList } from 'lucide-react';

const CalendarHeader = () => {
  const { 
    viewDisplayText, 
    prevDate, 
    nextDate, 
    view, 
    setView, 
    setSelectedDate,
    displayMode,
    toggleDisplayMode
  } = useCalendar();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={prevDate}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-medium">{viewDisplayText}</h3>
        <Button variant="outline" size="icon" onClick={nextDate}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedDate(new Date())}
        >
          Today
        </Button>
      </div>

      <div className="flex space-x-2">
        <Button 
          variant={view === 'day' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setView('day')}
        >
          Day
        </Button>
        <Button 
          variant={view === 'week' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setView('week')}
        >
          Week
        </Button>
        <Button 
          variant={view === 'month' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setView('month')}
        >
          Month
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleDisplayMode}
          title={displayMode === 'combined' ? 'Switch to split view' : 'Switch to combined view'}
        >
          {displayMode === 'combined' ? <LayoutGrid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;
