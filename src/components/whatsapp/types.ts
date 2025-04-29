
export interface WhatsAppMessage {
  id: string;
  client_phone: string;
  message: string;
  direction: 'incoming' | 'outgoing';
  created_at: string;
  appointment_id?: string | null;
  status?: 'booked' | 'canceled' | 'rescheduled' | 'inquiry' | null;
}

export interface WhatsAppSettings {
  id: number;
  system_prompt: string | null;
  updated_at: string;
}
