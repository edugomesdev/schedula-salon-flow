
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { X } from 'lucide-react';
import { DAYS_OF_WEEK } from './types';
import { WorkingDay } from './types';

interface WorkingDayItemProps {
  day: WorkingDay;
  onRemove: () => void;
  onDayOffToggle: () => void;
  onTimeChange: (field: 'start_time' | 'end_time', value: string) => void;
}

export const WorkingDayItem = ({ 
  day, 
  onRemove, 
  onDayOffToggle, 
  onTimeChange 
}: WorkingDayItemProps) => {
  const dayLabel = DAYS_OF_WEEK.find(d => parseInt(d.value) === day.day_of_week)?.label;
  
  return (
    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
      <div className="w-10 font-medium">
        {dayLabel}
      </div>
      
      <Toggle
        pressed={day.is_day_off}
        onPressedChange={onDayOffToggle}
        aria-label="Toggle day off"
        className={`text-xs ${day.is_day_off ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' : ''}`}
      >
        {day.is_day_off ? 'Day Off' : 'Working'}
      </Toggle>
      
      {!day.is_day_off && (
        <>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={day.start_time}
              onChange={(e) => onTimeChange('start_time', e.target.value)}
              className="w-[120px]"
            />
            <span>to</span>
            <Input
              type="time"
              value={day.end_time}
              onChange={(e) => onTimeChange('end_time', e.target.value)}
              className="w-[120px]"
            />
          </div>
        </>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto p-0 h-8 w-8"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
