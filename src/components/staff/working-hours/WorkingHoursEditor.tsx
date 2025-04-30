
import { WorkingDayItem } from './WorkingDayItem';
import { DayToggleGroup } from './DayToggleGroup';
import { useWorkingHours } from './useWorkingHours';
import { WorkingDay } from './types';

interface WorkingHoursEditorProps {
  staffId: string;
  onChange: (workingHours: WorkingDay[]) => void;
}

const WorkingHoursEditor = ({ staffId, onChange }: WorkingHoursEditorProps) => {
  const { 
    workingDays, 
    loading, 
    handleToggleDay,
    handleDayOffToggle,
    handleTimeChange,
    handleRemoveDay
  } = useWorkingHours(staffId, onChange);

  if (loading) {
    return <div className="text-center py-4">Loading working hours...</div>;
  }

  return (
    <div className="space-y-4">
      <DayToggleGroup workingDays={workingDays} onToggleDay={handleToggleDay} />

      {workingDays.length > 0 ? (
        <div className="space-y-2">
          {workingDays.map((day, index) => (
            <WorkingDayItem
              key={index}
              day={day}
              onRemove={() => handleRemoveDay(index)}
              onDayOffToggle={() => handleDayOffToggle(index)}
              onTimeChange={(field, value) => handleTimeChange(index, field, value)}
            />
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
