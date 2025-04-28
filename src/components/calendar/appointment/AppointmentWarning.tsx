
import { AlertTriangle } from 'lucide-react';

interface AppointmentWarningProps {
  message: string;
}

const AppointmentWarning = ({ message }: AppointmentWarningProps) => (
  <div className="bg-yellow-50 p-3 rounded-md mb-4 flex items-center gap-2">
    <AlertTriangle className="h-5 w-5 text-yellow-500" />
    <p className="text-sm text-yellow-700">{message}</p>
  </div>
);

export default AppointmentWarning;
