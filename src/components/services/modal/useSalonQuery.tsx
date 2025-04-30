
import { useSalon } from '@/hooks/dashboard/useSalon';

export const useSalonQuery = () => {
  const { salon, isLoading, error } = useSalon();
  
  return {
    data: salon ? { id: salon.id } : null,
    isLoading,
    error
  };
};
