import { createContext, useState, ReactNode } from 'react';
import { format, startOfWeek, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

type CalendarView = 'day' | 'week' | 'month';
type DisplayMode = 'combined' | 'split';

interface StylerVisibility { // Typo in PDF was StylerVisibility, assuming StylistVisibility
  [stylistId: string]: boolean;
}

export interface CalendarContextType { // Exporting type for useCalendar hook
  selectedDate: Date;
  view: CalendarView;
  displayMode: DisplayMode;
  stylistVisibility: StylerVisibility;
  setSelectedDate: (date: Date) => void;
  nextDate: () => void;
  prevDate: () => void;
  setView: (view: CalendarView) => void;
  toggleDisplayMode: () => void;
  toggleStylistVisibility: (stylistId: string) => void;
  setStylistVisibility: (visibility: StylerVisibility) => void;
  showAllStylists: () => void;
  hideAllStylists: () => void;
  viewDisplayText: string;
}

// Export CalendarContext so it can be imported by the useCalendar hook
export const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// useCalendar hook is now moved to src/hooks/useCalendar.ts
// export const useCalendar = () => { ... } // Remove from here

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('combined');
  const [stylistVisibility, setStylistVisibility] = useState<StylerVisibility>({});

  const nextDate = () => {
    if (view === 'day') {
      setSelectedDate(prev => addDays(prev, 1));
    } else if (view === 'week') {
      setSelectedDate(prev => addWeeks(prev, 1));
    } else {
      setSelectedDate(prev => addMonths(prev, 1));
    }
  };

  const prevDate = () => {
    if (view === 'day') {
      setSelectedDate(prev => subDays(prev, 1));
    } else if (view === 'week') {
      setSelectedDate(prev => subWeeks(prev, 1));
    } else {
      setSelectedDate(prev => subMonths(prev, 1));
    }
  };

  const toggleStylistVisibility = (stylistId: string) => {
    setStylistVisibility(prev => ({
      ...prev,
      [stylistId]: !prev[stylistId] // Ensure stylistId exists or initialize
    }));
  };

  const showAllStylists = () => {
    // This should iterate over actual known stylist IDs if possible,
    // or be based on the keys currently in stylistVisibility.
    // For now, assuming it operates on existing keys.
    setStylistVisibility(prev => {
      const allVisible: StylerVisibility = {};
      Object.keys(prev).forEach(id => {
        allVisible[id] = true;
      });
      return allVisible;
    });
  };

  const hideAllStylists = () => {
    setStylistVisibility(prev => {
      const allHidden: StylerVisibility = {};
      Object.keys(prev).forEach(id => {
        allHidden[id] = false;
      });
      return allHidden;
    });
  };

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'combined' ? 'split' : 'combined');
  };

  let viewDisplayText = '';
  if (view === 'day') {
    viewDisplayText = format(selectedDate, 'MMMM d, yyyy');
  } else if (view === 'week') {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Assuming week starts on Monday
    const weekEnd = addDays(weekStart, 6);
    viewDisplayText = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  } else { // month view
    viewDisplayText = format(selectedDate, 'MMMM yyyy');
  }

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        view,
        displayMode,
        stylistVisibility,
        setSelectedDate,
        nextDate,
        prevDate,
        setView,
        toggleDisplayMode,
        toggleStylistVisibility,
        setStylistVisibility, // Pass the actual setter
        showAllStylists,
        hideAllStylists,
        viewDisplayText
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
