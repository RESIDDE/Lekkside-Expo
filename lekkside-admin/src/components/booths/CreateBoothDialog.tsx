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

interface CreateBoothDialogProps {
  eventId: string;
}

export function CreateBoothDialog({ eventId }: CreateBoothDialogProps) {
  const [open, setOpen] = useState(false);
  const [boothNumber, setBoothNumber] = useState("");
  const [boothName, setBoothName] = useState("");
  const createBooth = useCreateBooth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boothNumber.trim() || !boothName.trim()) return;

    await createBooth.mutateAsync({
      event_id: eventId,
      booth_number: boothNumber.trim(),
      booth_name: boothName.trim(),
    });

    setBoothNumber("");
    setBoothName("");
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
              <Label htmlFor="booth-name">Booth Name</Label>
              <Input
                id="booth-name"
                placeholder="e.g., Tech Solutions Inc."
                value={boothName}
                onChange={(e) => setBoothName(e.target.value)}
                required
              />
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
