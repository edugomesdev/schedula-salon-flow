
import { format } from 'date-fns';

interface DayViewHeaderProps {
  selectedDate: Date;
}

const DayViewHeader = ({ selectedDate }: DayViewHeaderProps) => {
  return (
    <div className="grid grid-cols-1 h-16 border-b">
      <div className="flex items-center justify-center font-medium">
        {format(selectedDate, 'EEEE, MMMM d')}
      </div>
    </div>
  );
};

export default DayViewHeader;
