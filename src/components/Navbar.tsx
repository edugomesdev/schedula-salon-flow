
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth';
import { LogIn } from "lucide-react";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold playfair gradient-text">
              Schedula
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/#features" className="text-gray-600 hover:text-primary">Features</Link>
            <Link to="/#how-it-works" className="text-gray-600 hover:text-primary">How It Works</Link>
            <Link to="/#pricing" className="text-gray-600 hover:text-primary">Pricing</Link>
            
            {user ? (
              <Button variant="default" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login" className="flex items-center gap-2">
                    <LogIn size={18} />
                    Login
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
