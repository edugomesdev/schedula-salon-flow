import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useSalon } from '@/hooks/dashboard/useSalon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Edit, Save, Loader2 } from 'lucide-react'; // Added Loader2

const Settings = () => {
  const { toast } = useToast();
  const { salon, isLoading: isSalonLoading, refetch: refetchSalon } = useSalon(); // Added refetchSalon
  const salonId = salon?.id;
  // const salonName = salon?.name; // 'salonName' was unused (Source 1306)
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load current WhatsApp number if available
  useEffect(() => {
    if (salonId && !initialLoadDone) { // Only run if salonId is available and initial load not done
      const loadSalonDetails = async () => {
        try {
          // Using the phone number from the useSalon hook directly if available
          // This avoids an extra fetch if the data is already there.
          if (salon?.phone) {
            setWhatsappNumber(salon.phone);
            setIsEditing(false);
          } else if (salonId) { // Fallback to fetch if not in initial salon object
            const { data, error } = await supabase.from('salons').select('phone').eq('id', salonId).single();
            if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
              console.error('Error loading salon phone details:', error);
              // Potentially toast an error if fetching phone specifically fails
            }
            if (data && data.phone) {
              setWhatsappNumber(data.phone);
              setIsEditing(false);
            } else {
              setIsEditing(true); // No number saved, start in edit mode
            }
          } else {
             setIsEditing(true); // No salonId, default to edit mode (though save will be disabled)
          }
        } catch (error: any) {
          console.error('Error loading salon phone details:', error);
          toast({
            title: "Error",
            description: "Could not load WhatsApp number: " + error.message,
            variant: "destructive",
          });
        } finally {
          setInitialLoadDone(true);
        }
      };
      loadSalonDetails();
    } else if (!salonId && !isSalonLoading) {
        // If there's no salonId and we are not loading salon data, it implies no salon exists.
        setIsEditing(true); // Allow input, though save might be disabled or create a salon.
        setInitialLoadDone(true);
    }
  }, [salonId, salon?.phone, toast, initialLoadDone, isSalonLoading]);

  const validateWhatsappNumber = (number: string) => {
    const regex = /^\+\d{7,}$/; // Basic validation: starts with +, then at least 7 digits
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

    if (whatsappNumber && !validateWhatsappNumber(whatsappNumber)) {
      toast({
        title: "Invalid Format",
        description: "Please enter a valid WhatsApp number starting with + followed by country code and number (e.g., +1234567890).",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('salons').update({
        phone: whatsappNumber
      }).eq('id', salonId);

      if (error) {
        console.error('Error updating WhatsApp number:', error); // [✓] Source 1315
        setErrorDetails(JSON.stringify(error, null, 2));
        setShowErrorDialog(true);
        throw error;
      }
      toast({
        title: "Success",
        description: "WhatsApp number updated successfully."
      });
      setIsEditing(false);
      refetchSalon(); // Refetch salon data to ensure UI consistency
    } catch (error: any) {
      console.error('Error updating WhatsApp number:', error); // [✓] Source 1317
      // Error already toasted by the block above or will be by the generic catch
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && salon?.phone) { // If toggling to view mode, reset to saved number
        setWhatsappNumber(salon.phone);
    }
  };

  if (isSalonLoading && !initialLoadDone) {
    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        {!isSalonLoading && !salonId && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
            <p className="font-bold">Salon Not Found</p>
            <p>You need to create a salon first before you can update communication settings. Please go to the Services page to add a salon.</p>
          </div>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Settings</CardTitle>
              <CardDescription>Update your salon's WhatsApp contact number. This is the number clients will use for bookings via WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={e => {
                e.preventDefault();
                handleSave();
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="whatsappNumber"
                      placeholder="E.g. +1234567890"
                      value={whatsappNumber || ''}
                      onChange={e => setWhatsappNumber(e.target.value)}
                      disabled={!isEditing || isSaving || !salonId}
                      className={!isEditing ? "bg-muted border-transparent" : ""}
                      readOnly={!isEditing}
                    />
                    {salonId && ( // Only show edit/save if a salon exists
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleEditToggle}
                            disabled={isSaving}
                            aria-label={isEditing ? "Cancel editing" : "Edit WhatsApp number"}
                        >
                            {isEditing ? "Cancel" : <Edit className="h-4 w-4" />}
                        </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your WhatsApp Business number with the country code (e.g., +1 for US, +44 for UK).
                  </p>
                </div>
                {isEditing && salonId && ( // Only show save if editing and salon exists
                  <Button type="submit" disabled={isSaving || !salonId}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Error Details</DialogTitle>
              <DialogDescription>
                There was a problem updating your WhatsApp number. Technical details:
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[300px]">
              <pre className="text-xs whitespace-pre-wrap">{errorDetails}</pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
