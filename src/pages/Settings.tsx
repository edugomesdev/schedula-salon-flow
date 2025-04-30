
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSalon } from '@/hooks/dashboard/useSalon';

const Settings = () => {
  const { toast } = useToast();
  const { salonId, salonName, isLoading } = useSalon();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load current WhatsApp number if available
  useEffect(() => {
    const loadSalonDetails = async () => {
      if (!salonId) return;
      
      try {
        const { data, error } = await supabase
          .from('salons')
          .select('phone')
          .eq('id', salonId)
          .single();
          
        if (error) throw error;
        
        if (data && data.phone) {
          setWhatsappNumber(data.phone);
        }
      } catch (error) {
        console.error('Error loading salon details:', error);
      }
    };
    
    loadSalonDetails();
  }, [salonId]);

  const handleSave = async () => {
    if (!salonId) {
      toast({
        title: "Error",
        description: "No salon found. Please create a salon first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Update the salon's WhatsApp number
      const { error } = await supabase
        .from('salons')
        .update({ phone: whatsappNumber })
        .eq('id', salonId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "WhatsApp number updated successfully.",
      });
    } catch (error) {
      console.error('Error updating WhatsApp number:', error);
      toast({
        title: "Error",
        description: "Failed to update WhatsApp number.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        
        {!isLoading && !salonId && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-700">
              You need to create a salon first before you can update settings.
            </p>
          </div>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Settings</CardTitle>
              <CardDescription>
                Update your salon's contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input
                    id="whatsappNumber"
                    placeholder="E.g. +1234567890"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter your WhatsApp number with the country code (e.g., +1 for US, +44 for UK)
                  </p>
                </div>
                <Button type="submit" disabled={isSaving || !salonId}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
