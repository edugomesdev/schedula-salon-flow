
import { Card } from "@/components/ui/card";
import { MessageSquare, Calendar, Bell, Users, CalendarClock, CalendarPlus } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "WhatsApp Integration",
      description: "Clients book appointments through familiar WhatsApp chats. No app downloads needed."
    },
    {
      icon: Calendar,
      title: "Multi-Stylist Support",
      description: "Manage multiple stylists' calendars with ease. Perfect for growing salons."
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Automatic appointment reminders and follow-ups to reduce no-shows."
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Keep track of client preferences and history automatically."
    },
    {
      icon: CalendarClock,
      title: "Real-time Availability",
      description: "Always up-to-date calendar sync prevents double bookings."
    },
    {
      icon: CalendarPlus,
      title: "Smart Rescheduling",
      description: "AI suggests alternative times when clients need to reschedule."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold playfair mb-4">
            Everything You Need to Run Your Salon
          </h2>
          <p className="text-lg text-gray-600">
            Powerful features that make appointment management a breeze
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6 card-hover">
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
