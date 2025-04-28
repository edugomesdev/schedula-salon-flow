
import { useState } from 'react';
import { format, addDays, addMonths, subMonths, subDays } from 'date-fns';
import { useCalendarData } from './useCalendarData';
import { CalendarEvent, CalendarViewType } from '@/types/calendar';
import { getEventsForViewType } from '@/utils/calendar';

export const useCalendarState = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('week');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [staffNames, setStaffNames] = useState<Map<string, string>>(new Map());
  
  const { events, loading, refetch } = useCalendarData(selectedStaffIds, date);
  const filteredEvents = getEventsForViewType(events, viewType, date);
  
  const handleDateSelect = (newDate: Date) => {
    setDate(newDate);
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsAddEntryOpen(true);
  };
  
  const navigatePrevious = () => {
    switch (viewType) {
      case 'day':
        setDate(subDays(date, 1));
        break;
      case 'week':
        setDate(subDays(date, 7));
        break;
      case 'month':
        setDate(subMonths(date, 1));
        break;
    }
  };
  
  const navigateNext = () => {
    switch (viewType) {
      case 'day':
        setDate(addDays(date, 1));
        break;
      case 'week':
        setDate(addDays(date, 7));
        break;
      case 'month':
        setDate(addMonths(date, 1));
        break;
    }
  };
  
  const navigateToday = () => {
    setDate(new Date());
  };
  
  const handleViewChange = (newViewType: CalendarViewType) => {
    setViewType(newViewType);
    if (newViewType !== 'month') {
      setShowSideBySide(false);
    }
  };
  
  const handleAddSuccess = () => {
    setIsAddEntryOpen(false);
    setSelectedEvent(null);
    refetch();
  };
  
  const toggleSideBySide = () => {
    setShowSideBySide(!showSideBySide);
  };

  return {
    date,
    viewType,
    selectedStaffIds,
    isAddEntryOpen,
    selectedEvent,
    showSideBySide,
    staffNames,
    events,
    loading,
    filteredEvents,
    setSelectedStaffIds,
    setIsAddEntryOpen,
    setSelectedEvent, // Added this export
    setStaffNames,
    handleDateSelect,
    handleEventClick,
    navigatePrevious,
    navigateNext,
    navigateToday,
    handleViewChange,
    handleAddSuccess,
    toggleSideBySide,
    refetch
  };
};
