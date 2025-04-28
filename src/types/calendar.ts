
export interface CalendarEntry {
  id: string;
  stylist_id: string;
  title: string;
  start_time: string;
  end_time: string;
  client_name?: string;
  service_name?: string;
  description?: string;
  status: string;
}

export interface Stylist {
  id: string;
  name: string;
  profile_image_url?: string;
  color?: string;
  expertise?: string[];
  bio?: string;
}

export interface TimeSlot {
  time: Date;
  hour: number;
  minute: number;
  entries: CalendarEntry[];
  isBooked: boolean;
}

export type DayEvents = {
  [hour: number]: {
    [minute: number]: CalendarEntry[];
  };
};

export interface CalendarViewProps {
  stylists: Stylist[];
  entries: CalendarEntry[];
  onSlotClick: (time: Date, stylistId?: string) => void;
  onEntryClick: (entry: CalendarEntry) => void;
}
