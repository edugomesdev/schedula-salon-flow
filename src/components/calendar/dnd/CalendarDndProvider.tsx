
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactNode } from 'react';

interface CalendarDndProviderProps {
  children: ReactNode;
}

/**
 * Provides drag and drop context for the calendar components
 */
const CalendarDndProvider = ({ children }: CalendarDndProviderProps) => {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  );
};

export default CalendarDndProvider;
