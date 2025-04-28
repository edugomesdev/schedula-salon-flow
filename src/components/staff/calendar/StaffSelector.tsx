
import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  name: string;
}

interface StaffSelectorProps {
  selectedStaffIds: string[];
  onSelectionChange: (staffIds: string[]) => void;
}

export const StaffSelector = ({ selectedStaffIds, onSelectionChange }: StaffSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStaffMembers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('stylists')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setStaffMembers(data || []);
      } catch (error) {
        console.error('Error fetching staff members:', error);
        toast({
          title: "Error",
          description: "Failed to load staff members",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStaffMembers();
  }, [toast]);

  const toggleStaffMember = (staffId: string) => {
    if (selectedStaffIds.includes(staffId)) {
      onSelectionChange(selectedStaffIds.filter(id => id !== staffId));
    } else {
      onSelectionChange([...selectedStaffIds, staffId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start">
          {selectedStaffIds.length > 0 
            ? `${selectedStaffIds.length} staff selected` 
            : "Select staff..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No staff found</CommandEmpty>
            <CommandGroup>
              {staffMembers.map(staff => (
                <CommandItem 
                  key={staff.id}
                  onSelect={() => toggleStaffMember(staff.id)}
                  className="flex items-center gap-2"
                >
                  <div className={`flex h-4 w-4 items-center justify-center rounded-sm border
                    ${selectedStaffIds.includes(staff.id) 
                      ? 'bg-primary border-primary' 
                      : 'border-input'}`
                  }>
                    {selectedStaffIds.includes(staff.id) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span>{staff.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
