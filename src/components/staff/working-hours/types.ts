
export interface WorkingDay {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
  stylist_id: string;
}

export const DAYS_OF_WEEK = [
  { value: '0', label: 'Sun' },
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
];

export const DEFAULT_START_TIME = '09:00';
export const DEFAULT_END_TIME = '17:00';
