
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, Bell } from "lucide-react";

const Hero = () => {
  return (
    <section className="pt-24 pb-16 hero-gradient min-h-[90vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold playfair leading-tight">
            Your AI Receptionist for
            <span className="gradient-text"> WhatsApp Booking</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto inter">
            Let AI handle your salon's appointments while you focus on creating beautiful hair.
            No more missed calls or booking hassles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              See Demo
            </Button>
          </div>
          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center space-y-2">
              <MessageSquare className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">WhatsApp Booking</h3>
              <p className="text-gray-600">Clients book directly via WhatsApp</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Calendar className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Google Calendar Sync</h3>
              <p className="text-gray-600">Real-time calendar integration</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Bell className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Smart Reminders</h3>
              <p className="text-gray-600">Automated appointment reminders</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
