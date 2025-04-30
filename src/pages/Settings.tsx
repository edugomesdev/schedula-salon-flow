
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSalon } from '@/hooks/dashboard/useSalon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Edit, Save } from 'lucide-react';

const Settings = () => {
  const {
    toast
  } = useToast();
  const {
    salonId,
    salonName,
    isLoading
  } = useSalon();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Load current WhatsApp number if available
  useEffect(() => {
    const loadSalonDetails = async () => {
      if (!salonId) return;
      try {
        const {
          data,
          error
        } = await supabase.from('salons').select('phone').eq('id', salonId).single();
        if (error) {
          console.error('Error loading salon details:', error);
          return;
        }
        if (data && data.phone) {
          setWhatsappNumber(data.phone);
          setIsEditing(false); // Ensure the field starts in read-only mode
        } else {
          setIsEditing(true); // If no number saved yet, start in edit mode
        }
      } catch (error) {
        console.error('Error loading salon details:', error);
      }
    };
    loadSalonDetails();
  }, [salonId]);

  const validateWhatsappNumber = number => {
    // Basic validation: Must start with + and contain only digits after that
    const regex = /^\+\d+$/;
    return regex.test(number);
  };

  const handleSave = async () => {
    if (!salonId) {
      toast({
        title: "Error",
        description: "No salon found. Please create a salon first.",
        variant: "destructive"
      });
      return;
    }

    // Validate the WhatsApp number
    if (whatsappNumber && !validateWhatsappNumber(whatsappNumber)) {
      toast({
        title: "Invalid Format",
        description: "Please enter a valid WhatsApp number starting with + followed by country code and number.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsSaving(true);

      // Update the salon's WhatsApp number
      const {
        error
      } = await supabase.from('salons').update({
        phone: whatsappNumber
      }).eq('id', salonId);
      if (error) {
        console.error('Error updating WhatsApp number:', error);
        setErrorDetails(JSON.stringify(error, null, 2));
        setShowErrorDialog(true);
        throw error;
      }
      toast({
        title: "Success",
        description: "WhatsApp number updated successfully."
      });
      setIsEditing(false); // Exit edit mode after successful save
    } catch (error) {
      console.error('Error updating WhatsApp number:', error);
      toast({
        title: "Error",
        description: "Failed to update WhatsApp number. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  return <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        
        {!isLoading && !salonId && <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-yellow-700">
              You need to create a salon first before you can update settings.
            </p>
          </div>}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Settings</CardTitle>
              <CardDescription>Update your salon's contact information (this is the number that customers will send WhatsApp messages to arrange bookings)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={e => {
              e.preventDefault();
              handleSave();
            }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="whatsappNumber" 
                      placeholder="E.g. +1234567890" 
                      value={whatsappNumber || ''} 
                      onChange={e => setWhatsappNumber(e.target.value)}
                      disabled={!isEditing || isSaving} 
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                    {whatsappNumber && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleEditToggle}
                        disabled={isSaving}
                      >
                        {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                        <span className="ml-1">{isEditing ? "Cancel" : "Edit"}</span>
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your WhatsApp number with the country code (e.g., +1 for US, +44 for UK)
                  </p>
                </div>
                {isEditing && (
                  <Button type="submit" disabled={isSaving || !salonId}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Error details dialog */}
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Error Details</DialogTitle>
              <DialogDescription>
                There was a problem updating your WhatsApp number. Technical details:
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[300px]">
              <pre className="text-xs">{errorDetails}</pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>;
};
export default Settings;
