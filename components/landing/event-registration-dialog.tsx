"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { REGISTER_FOR_EVENT } from "@/lib/graphql/public-content-queries";

interface RegisterForEventResponse {
  registerForEvent: {
    success: boolean;
    message: string;
    registration: {
      id: string;
      guestName: string;
      guestPhone: string | null;
      status: string;
      registeredAt: string;
    } | null;
  };
}

interface RegisterForEventVariables {
  eventId: string;
  name: string;
  phone?: string | null;
}

interface EventRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
}

/** Extract a 9-digit local phone (e.g. "712345678") from a stored "254XXXXXXXXX" number. */
function getDefaultPhone(phoneNumber?: string | null): string {
  if (!phoneNumber) return "";
  const phone = phoneNumber.replace(/^\+?254/, "");
  return phone.length === 9 ? phone : "";
}

export function EventRegistrationDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
}: EventRegistrationDialogProps) {
  const { user: authUser } = useAuth();

  // Pre-fill from the logged-in member's profile (if any) as the initial state.
  // The parent only mounts this dialog while it's open and unmounts it on close,
  // so lazy initial state here is equivalent to "pre-fill once per open".
  const [name, setName] = useState(() => authUser?.fullName || "");
  const [phone, setPhone] = useState(() => getDefaultPhone(authUser?.phoneNumber));
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [registerForEvent, { loading }] = useMutation<
    RegisterForEventResponse,
    RegisterForEventVariables
  >(REGISTER_FOR_EVENT);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setError("");

    try {
      const fullPhone = phone.trim() ? `254${phone.trim()}` : undefined;
      const { data } = await registerForEvent({
        variables: {
          eventId,
          name: name.trim(),
          phone: fullPhone,
        },
      });

      const result = data?.registerForEvent;
      if (result?.success) {
        setConfirmed(true);
        toast.success(result.message || "You're registered!");
      } else {
        const message = result?.message || "Could not complete registration. Please try again.";
        setError(message);
        toast.error(message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {confirmed ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                You&apos;re registered!
              </DialogTitle>
              <DialogDescription>
                Thanks, {name.trim()}. We&apos;ve recorded your registration for{" "}
                <span className="font-medium text-foreground">{eventTitle}</span>. See you there!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Register for {eventTitle}</DialogTitle>
              <DialogDescription>
                Let us know you&apos;re coming. Phone number is optional.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registration-name">Full name</Label>
                <Input
                  id="registration-name"
                  placeholder="Jane Wanjiku"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration-phone">Phone number (optional)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">+254</span>
                  <Input
                    id="registration-phone"
                    placeholder="712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    disabled={loading}
                    maxLength={9}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm registration
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
