import { useContext } from 'react';
// Assuming CalendarContext and CalendarContextType are correctly defined and exported
// from where CalendarProvider is. If CalendarContext is not exported, this needs adjustment.
// For this to work, CalendarContext must be exported from CalendarContext.tsx
import { CalendarContext, CalendarContextType } from '@/contexts/CalendarContext'; // Adjust path if needed

export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
