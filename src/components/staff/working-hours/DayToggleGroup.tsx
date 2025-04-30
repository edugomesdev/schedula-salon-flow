
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DAYS_OF_WEEK } from './types';
import { WorkingDay } from './types';

interface DayToggleGroupProps {
  workingDays: WorkingDay[];
  onToggleDay: (dayValue: string) => void;
}

export const DayToggleGroup = ({ workingDays, onToggleDay }: DayToggleGroupProps) => {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium mb-1 block">Select Working Days</label>
      <ToggleGroup type="multiple" variant="outline" className="justify-start flex-wrap">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = workingDays.some(
            workDay => workDay.day_of_week === parseInt(day.value, 10)
          );
          return (
            <ToggleGroupItem
              key={day.value}
              value={day.value}
              aria-label={`Toggle ${day.label}`}
              data-state={isSelected ? "on" : "off"}
              onClick={() => onToggleDay(day.value)}
            >
              {day.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
};
