
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { useSalon } from '@/hooks/dashboard/useSalon';
import { Loader2 } from 'lucide-react';

const AddSalon = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { salon: existingSalon, isLoading: salonLoading } = useSalon();

  useEffect(() => {
    // If salon exists, redirect to services page
    if (!salonLoading && existingSalon) {
      toast({
        title: "Salon already exists",
        description: "You already have a salon. You can edit it on the services page.",
      });
      navigate('/dashboard/services');
    }
    
    setCheckingExisting(salonLoading);
  }, [existingSalon, salonLoading, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Salon name is required",
        description: "Please enter a name for your salon.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user?.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create a salon.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Check again if a salon already exists to prevent race conditions
      const { data: existingSalons, error: checkError } = await supabase
        .from('salons')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);
        
      if (checkError) throw checkError;
      
      if (existingSalons && existingSalons.length > 0) {
        // Update existing salon instead of creating a new one
        console.log("Updating existing salon:", existingSalons[0].id);
        
        const { error: updateError } = await supabase
          .from('salons')
          .update({ 
            name, 
            description 
          })
          .eq('id', existingSalons[0].id);
          
        if (updateError) throw updateError;
        
        toast({
          title: "Salon updated successfully",
          description: "Your existing salon has been updated.",
        });
      } else {
        // Create a new salon
        console.log("Creating salon with data:", { name, description, owner_id: user.id });
        
        const { data, error } = await supabase
          .from('salons')
          .insert([
            { 
              name, 
              description,
              owner_id: user?.id
            }
          ])
          .select();
          
        if (error) throw error;
        
        console.log("Salon created successfully:", data);
        
        toast({
          title: "Salon created successfully",
          description: "Your salon has been created. You can now add services.",
        });
      }
      
      // Redirect back to services page
      navigate('/dashboard/services');
    } catch (error: any) {
      toast({
        title: "Error saving salon",
        description: error.message || "There was a problem with your salon.",
        variant: "destructive",
      });
      console.error("Error with salon operation:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (checkingExisting) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking existing salon data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Add Salon</h1>
          <Button variant="outline" onClick={() => navigate('/dashboard/services')}>
            Cancel
          </Button>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Salon Information</CardTitle>
            <CardDescription>
              Create a salon to start adding services and managing appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Salon Name *</Label>
                <Input 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your salon name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your salon"
                  rows={4}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Salon"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddSalon;
