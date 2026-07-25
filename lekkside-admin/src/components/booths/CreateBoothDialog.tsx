import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useCreateBooth } from "@/hooks/useExhibitionBooths";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateBoothDialogProps {
  eventId: string;
}

export function CreateBoothDialog({ eventId }: CreateBoothDialogProps) {
  const [open, setOpen] = useState(false);
  const [boothNumber, setBoothNumber] = useState("");
  const [boothName, setBoothName] = useState("");
  const [universityId, setUniversityId] = useState<string>("none");
  const createBooth = useCreateBooth();

  const { data: universities } = useQuery({
    queryKey: ['universities-list'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, university_name').eq('role', 'university').order('university_name');
      return data || [];
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boothNumber.trim()) return;

    // Determine a fallback booth name if one isn't provided
    let finalBoothName = boothName.trim();
    if (!finalBoothName) {
      if (universityId !== "none" && universities) {
        const selectedUni = universities.find((u: any) => u.id === universityId);
        finalBoothName = selectedUni?.university_name || `Booth ${boothNumber.trim()}`;
      } else {
        finalBoothName = `Booth ${boothNumber.trim()}`;
      }
    }

    await createBooth.mutateAsync({
      event_id: eventId,
      booth_number: boothNumber.trim(),
      booth_name: finalBoothName,
      university_id: universityId === "none" ? undefined : universityId
    });

    setBoothNumber("");
    setBoothName("");
    setUniversityId("none");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Booth
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Exhibition Booth</DialogTitle>
            <DialogDescription>
              Create a new exhibition booth for this event. A unique invitation
              link will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="booth-number">Booth Number</Label>
              <Input
                id="booth-number"
                placeholder="e.g., A-101"
                value={boothNumber}
                onChange={(e) => setBoothNumber(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="booth-name">Booth Name (Optional)</Label>
              <Input
                id="booth-name"
                placeholder="e.g., Tech Solutions Inc."
                value={boothName}
                onChange={(e) => setBoothName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assign-university">Assign to University (Optional)</Label>
              <Select value={universityId} onValueChange={setUniversityId}>
                <SelectTrigger id="assign-university">
                  <SelectValue placeholder="Select a University" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Assignment</SelectItem>
                  {universities?.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.university_name || 'Unnamed University'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createBooth.isPending}>
              {createBooth.isPending ? "Creating..." : "Create Booth"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
