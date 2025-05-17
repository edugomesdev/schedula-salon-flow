
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DayToggleGroup } from './DayToggleGroup';
import { DAYS_OF_WEEK, WorkingDay, DEFAULT_START_TIME, DEFAULT_END_TIME } from './types';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface WorkingHoursEditorProps {
  staffId: string;
  onChange: (workingHours: WorkingDay[]) => void;
}

const WorkingHoursEditor = ({ staffId, onChange }: WorkingHoursEditorProps) => {
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch existing working hours on mount
  useEffect(() => {
    const fetchWorkingHours = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('working_hours')
          .select('*')
          .eq('stylist_id', staffId);

        if (error) throw error;

        if (data && data.length > 0) {
          setWorkingDays(data as WorkingDay[]);
          onChange(data as WorkingDay[]);
        }
      } catch (error) {
        console.error('Error fetching working hours:', error);
        toast({
          title: "Error",
          description: "Could not load working hours data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (staffId) {
      fetchWorkingHours();
    }
  }, [staffId, toast, onChange]);

  // Handle day toggle
  const handleDayToggle = (dayValue: string) => {
    const dayNumber = parseInt(dayValue, 10);
    const dayExists = workingDays.some(day => day.day_of_week === dayNumber);

    let newWorkingDays: WorkingDay[];

    if (dayExists) {
      // Remove day if it exists
      newWorkingDays = workingDays.filter(day => day.day_of_week !== dayNumber);
    } else {
      // Add day if it doesn't exist
      const newDay: WorkingDay = {
        day_of_week: dayNumber,
        start_time: DEFAULT_START_TIME,
        end_time: DEFAULT_END_TIME,
        is_day_off: false,
        stylist_id: staffId,
      };
      newWorkingDays = [...workingDays, newDay];
    }

    setWorkingDays(newWorkingDays);
    onChange(newWorkingDays);
  };

  // Handle time change for a specific day
  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays[index] = {
      ...newWorkingDays[index],
      [field]: value,
    };
    setWorkingDays(newWorkingDays);
    onChange(newWorkingDays);
  };

  // Handle day off toggle for a specific day
  const handleDayOffToggle = (index: number) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays[index] = {
      ...newWorkingDays[index],
      is_day_off: !newWorkingDays[index].is_day_off,
    };
    setWorkingDays(newWorkingDays);
    onChange(newWorkingDays);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading working hours...</div>;
  }

  return (
    <Card className="p-4 border border-gray-200 rounded-md">
      <DayToggleGroup 
        workingDays={workingDays} 
        onToggleDay={handleDayToggle} 
      />

      {workingDays.length === 0 ? (
        <div className="text-center text-muted-foreground py-2">
          No working days selected. Select days above to set working hours.
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {workingDays
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((day, index) => (
              <div key={day.day_of_week} className="flex items-center justify-between border-b pb-2">
                <div className="font-medium">
                  {DAYS_OF_WEEK.find(d => parseInt(d.value, 10) === day.day_of_week)?.label}
                </div>
                
                <div className="flex items-center gap-2">
                  {!day.is_day_off ? (
                    <>
                      <input
                        type="time"
                        value={day.start_time}
                        onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                        className="border rounded-md p-1"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={day.end_time}
                        onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                        className="border rounded-md p-1"
                      />
                    </>
                  ) : (
                    <span className="text-muted-foreground">Day Off</span>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDayOffToggle(index)}
                  >
                    {day.is_day_off ? "Set Working" : "Set Day Off"}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
};

export default WorkingHoursEditor;
