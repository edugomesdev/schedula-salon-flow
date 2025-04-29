
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

const AddSalon = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

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
      
      console.log("Creating salon with data:", { name, description, owner_id: user.id });
      
      // Insert the new salon into the database
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
      
      // Redirect back to services page
      navigate('/dashboard/services');
    } catch (error: any) {
      toast({
        title: "Error creating salon",
        description: error.message || "There was a problem creating your salon.",
        variant: "destructive",
      });
      console.error("Error creating salon:", error);
    } finally {
      setLoading(false);
    }
  };
  
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
                {loading ? "Creating..." : "Create Salon"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddSalon;
