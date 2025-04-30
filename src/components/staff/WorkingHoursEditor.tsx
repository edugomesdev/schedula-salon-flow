
import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface WorkingDay {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
  stylist_id: string;
}

interface WorkingHoursEditorProps {
  staffId: string;
  onChange: (workingHours: WorkingDay[]) => void;
}

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sun' },
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
];

const DEFAULT_START_TIME = '09:00';
const DEFAULT_END_TIME = '17:00';

const WorkingHoursEditor = ({ staffId, onChange }: WorkingHoursEditorProps) => {
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkingHours = async () => {
      if (!staffId) return;

      try {
        const { data, error } = await supabase
          .from('working_hours')
          .select('*')
          .eq('stylist_id', staffId)
          .order('day_of_week', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Format times for input elements
          const formattedData = data.map(day => ({
            ...day,
            start_time: day.start_time ? day.start_time.slice(0, 5) : DEFAULT_START_TIME,
            end_time: day.end_time ? day.end_time.slice(0, 5) : DEFAULT_END_TIME,
          }));
          setWorkingDays(formattedData);
        } else {
          // Create default working days for weekdays (Mon-Fri)
          const defaultDays = [1, 2, 3, 4, 5].map(day => ({
            day_of_week: day,
            start_time: DEFAULT_START_TIME,
            end_time: DEFAULT_END_TIME,
            is_day_off: false,
            stylist_id: staffId
          }));
          setWorkingDays(defaultDays);
        }
      } catch (error) {
        console.error('Error fetching working hours:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkingHours();
  }, [staffId]);

  useEffect(() => {
    onChange(workingDays);
  }, [workingDays, onChange]);

  const handleToggleDay = (dayValue: string) => {
    const dayNum = parseInt(dayValue, 10);
    
    // Check if this day already exists in our working days
    const existingDayIndex = workingDays.findIndex(day => day.day_of_week === dayNum);
    
    if (existingDayIndex >= 0) {
      // Day exists - remove it
      const newDays = [...workingDays];
      newDays.splice(existingDayIndex, 1);
      setWorkingDays(newDays);
    } else {
      // Day doesn't exist - add it
      const newDay: WorkingDay = {
        day_of_week: dayNum,
        start_time: DEFAULT_START_TIME,
        end_time: DEFAULT_END_TIME,
        is_day_off: false,
        stylist_id: staffId
      };
      setWorkingDays([...workingDays, newDay].sort((a, b) => a.day_of_week - b.day_of_week));
    }
  };

  const handleDayOffToggle = (index: number) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays[index].is_day_off = !newWorkingDays[index].is_day_off;
    setWorkingDays(newWorkingDays);
  };

  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays[index][field] = value;
    setWorkingDays(newWorkingDays);
  };

  if (loading) {
    return <div className="text-center py-4">Loading working hours...</div>;
  }

  return (
    <div className="space-y-4">
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
                onClick={() => handleToggleDay(day.value)}
              >
                {day.label}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {workingDays.length > 0 ? (
        <div className="space-y-2">
          {workingDays.map((day, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-50 p-2 rounded">
              <div className="w-10 font-medium">
                {DAYS_OF_WEEK.find(d => parseInt(d.value) === day.day_of_week)?.label}
              </div>
              
              <Toggle
                pressed={day.is_day_off}
                onPressedChange={() => handleDayOffToggle(index)}
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
                      onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                      className="w-[120px]"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={day.end_time}
                      onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                      className="w-[120px]"
                    />
                  </div>
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto p-0 h-8 w-8"
                onClick={() => {
                  const newWorkingDays = [...workingDays];
                  newWorkingDays.splice(index, 1);
                  setWorkingDays(newWorkingDays);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No working days selected. Click on days above to add them.
        </div>
      )}
    </div>
  );
};

export default WorkingHoursEditor;
