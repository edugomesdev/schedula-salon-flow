
import { useAuth } from '@/lib/auth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4">
        <div className="flex justify-end gap-4 mb-4">
          {user ? (
            <Button asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <Navbar />
      <Hero />
      <Features />
    </div>
  );
};

export default Index;
