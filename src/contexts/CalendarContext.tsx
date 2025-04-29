
import { createContext, useContext, useState, ReactNode } from 'react';
import { format, startOfWeek, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

type CalendarView = 'day' | 'week' | 'month';
type DisplayMode = 'combined' | 'split';

interface StylerVisibility {
  [stylistId: string]: boolean;
}

interface CalendarContextType {
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
  showAllStylists: () => void;
  hideAllStylists: () => void;
  viewDisplayText: string;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('combined');
  const [stylistVisibility, setStylistVisibility] = useState<StylerVisibility>({});

  const nextDate = () => {
    if (view === 'day') {
      setSelectedDate(prevDate => addDays(prevDate, 1));
    } else if (view === 'week') {
      setSelectedDate(prevDate => addWeeks(prevDate, 1));
    } else {
      setSelectedDate(prevDate => addMonths(prevDate, 1));
    }
  };

  const prevDate = () => {
    if (view === 'day') {
      setSelectedDate(prevDate => subDays(prevDate, 1));
    } else if (view === 'week') {
      setSelectedDate(prevDate => subWeeks(prevDate, 1));
    } else {
      setSelectedDate(prevDate => subMonths(prevDate, 1));
    }
  };

  const toggleStylistVisibility = (stylistId: string) => {
    setStylistVisibility(prev => ({
      ...prev,
      [stylistId]: !prev[stylistId]
    }));
  };

  const showAllStylists = () => {
    const allVisible: StylerVisibility = {};
    Object.keys(stylistVisibility).forEach(id => {
      allVisible[id] = true;
    });
    setStylistVisibility(allVisible);
  };

  const hideAllStylists = () => {
    const allHidden: StylerVisibility = {};
    Object.keys(stylistVisibility).forEach(id => {
      allHidden[id] = false;
    });
    setStylistVisibility(allHidden);
  };

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'combined' ? 'split' : 'combined');
  };

  // Generate display text for the current view
  let viewDisplayText = '';
  if (view === 'day') {
    viewDisplayText = format(selectedDate, 'MMMM d, yyyy');
  } else if (view === 'week') {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    viewDisplayText = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  } else {
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
        showAllStylists,
        hideAllStylists,
        viewDisplayText
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};
