
import { useEffect } from 'react';
import BookingWidget from "@/components/booking/BookingWidget";
import Navbar from "@/components/Navbar";

const BookNow = () => {
  // Set page title when component mounts
  useEffect(() => {
    document.title = 'Book Now | Schedula';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-12 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold playfair gradient-text mb-4">
            Book Your Appointment
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select a time that works for you and secure your appointment in our salon.
            We look forward to seeing you soon!
          </p>
        </div>

        {/* Cal.com booking widget */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden h-[600px]">
          <BookingWidget bookingLink="schedula/salon-session" />
        </div>
      </div>
    </div>
  );
};

export default BookNow;
