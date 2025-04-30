
import React, { useState } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface SalonData {
  id: string;
  name: string;
  description?: string;
  location?: string;
  phone?: string;
}

interface EditSalonDialogProps {
  salon: SalonData;
  onClose: () => void;
  onSaved: () => void;
}

const EditSalonDialog = ({ salon, onClose, onSaved }: EditSalonDialogProps) => {
  const [name, setName] = useState(salon.name || '');
  const [description, setDescription] = useState(salon.description || '');
  const [location, setLocation] = useState(salon.location || '');
  const [phone, setPhone] = useState(salon.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Salon name required",
        description: "Please provide a name for your salon.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('salons')
        .update({
          name,
          description,
          location,
          phone
        })
        .eq('id', salon.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Salon updated",
        description: "Your salon details have been updated."
      });
      
      onSaved();
    } catch (error) {
      console.error("Error updating salon:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your salon details.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Salon Details</DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="salon-name">Salon Name <span className="text-destructive">*</span></Label>
          <Input 
            id="salon-name" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter salon name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="salon-description">Description</Label>
          <Textarea 
            id="salon-description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your salon"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="salon-location">Address</Label>
          <Input 
            id="salon-location" 
            value={location} 
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Salon address"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="salon-phone">Phone Number</Label>
          <Input 
            id="salon-phone" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Salon phone number"
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default EditSalonDialog;
