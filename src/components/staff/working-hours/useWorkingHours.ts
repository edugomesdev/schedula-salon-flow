
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkingDay, DEFAULT_START_TIME, DEFAULT_END_TIME } from './types';

export const useWorkingHours = (staffId: string, onChange: (workingHours: WorkingDay[]) => void) => {
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

  const handleRemoveDay = (index: number) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays.splice(index, 1);
    setWorkingDays(newWorkingDays);
  };

  return {
    workingDays,
    loading,
    handleToggleDay,
    handleDayOffToggle,
    handleTimeChange,
    handleRemoveDay
  };
};
