
import { create } from 'zustand';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface ServiceModalStore {
  isOpen: boolean;
  service: Service | null;
  openModal: (service?: Service) => void;
  closeModal: () => void;
}

export const useServiceModal = create<ServiceModalStore>((set) => ({
  isOpen: false,
  service: null,
  openModal: (service = null) => set({ isOpen: true, service }),
  closeModal: () => set({ isOpen: false, service: null }),
}));
