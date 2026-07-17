import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Video, Copy, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

export default function Meetings() {
  const [roomName, setRoomName] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateRoomName = () => {
    const randomChars = Math.random().toString(36).substring(2, 8);
    setRoomName(`room-${randomChars}`);
  };

  const joinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast({
        title: "Room Name Required",
        description: "Please enter or generate a room name.",
        variant: "destructive",
      });
      return;
    }
    navigate(`/meetings/${roomName}`);
  };

  const copyLink = () => {
    if (!roomName.trim()) return;
    const link = `${window.location.origin}/meetings/${roomName}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Meeting link copied to clipboard. You can share this link with participants.",
    });
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Meetings</h1>
          <p className="text-muted-foreground">
            Create and manage live video meetings for your events and teams.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Join or Create a Meeting
              </CardTitle>
              <CardDescription>
                Enter a room name to join an existing meeting, or generate a new one.
              </CardDescription>
            </CardHeader>
            <form onSubmit={joinMeeting}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="roomName"
                      placeholder="e.g. daily-standup"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={generateRoomName}>
                      Generate
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={copyLink}
                  disabled={!roomName.trim()}
                  className="flex gap-2 items-center"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </Button>
                <Button type="submit" className="flex gap-2 items-center">
                  <Play className="h-4 w-4" />
                  Join Meeting
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
