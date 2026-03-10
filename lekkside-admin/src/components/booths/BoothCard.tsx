import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  ExternalLink,
  MoreVertical,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  ExhibitionBooth,
  useUpdateBooth,
  useDeleteBooth,
} from "@/hooks/useExhibitionBooths";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BoothCardProps {
  booth: ExhibitionBooth;
  onViewDetails: (boothId: string) => void;
}

export function BoothCard({ booth, onViewDetails }: BoothCardProps) {
  const { toast } = useToast();
  const updateBooth = useUpdateBooth();
  const deleteBooth = useDeleteBooth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const invitationUrl = `${window.location.origin}/exhibitor/signup?token=${booth.invitation_token}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationUrl);
    toast({
      title: "Link copied",
      description: "Invitation link has been copied to clipboard.",
    });
  };

  const handleToggleActive = async () => {
    await updateBooth.mutateAsync({
      id: booth.id,
      is_active: !booth.is_active,
    });
  };

  const handleDelete = async () => {
    await deleteBooth.mutateAsync(booth.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold">
              {booth.booth_number}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{booth.booth_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={booth.is_active ? "default" : "secondary"}>
              {booth.is_active ? "Active" : "Inactive"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleActive}>
                  {booth.is_active ? (
                    <>
                      <ToggleLeft className="w-4 h-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-4 h-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCopyLink}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewDetails(booth.id)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            <p className="truncate">Token: {booth.invitation_token}</p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booth</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete booth {booth.booth_number}? This
              will also delete all associated exhibitors, leads, and notes. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
