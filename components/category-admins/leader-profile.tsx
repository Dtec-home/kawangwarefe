/**
 * Department leader profile (R3: one leader record). The Dept. Admins
 * assignment carries the profile shown on the website Leaders page and in the
 * yearly report's Leaders section. Name and phone always come from the member.
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Globe, EyeOff, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UPDATE_DEPARTMENT_LEADER_PROFILE } from "@/lib/graphql/category-admin-queries";

export interface LeaderProfile {
  title: string;
  bio: string;
  photoUrl: string;
  showOnWebsite: boolean;
  displayOrder: number;
}

/** The form state: the order stays a string while it is typed. */
export interface LeaderProfileDraft {
  title: string;
  bio: string;
  photoUrl: string;
  showOnWebsite: boolean;
  displayOrder: string;
}

export const EMPTY_PROFILE_DRAFT: LeaderProfileDraft = {
  title: "",
  bio: "",
  photoUrl: "",
  showOnWebsite: true,
  displayOrder: "0",
};

export function draftFromProfile(profile: LeaderProfile | null | undefined): LeaderProfileDraft {
  if (!profile) return { ...EMPTY_PROFILE_DRAFT };
  return {
    title: profile.title ?? "",
    bio: profile.bio ?? "",
    photoUrl: profile.photoUrl ?? "",
    showOnWebsite: !!profile.showOnWebsite,
    displayOrder: String(profile.displayOrder ?? 0),
  };
}

export function profileFromDraft(draft: LeaderProfileDraft): LeaderProfile {
  const order = Number.parseInt(draft.displayOrder, 10);
  return {
    title: draft.title.trim(),
    bio: draft.bio.trim(),
    photoUrl: draft.photoUrl.trim(),
    showOnWebsite: draft.showOnWebsite,
    displayOrder: Number.isFinite(order) && order >= 0 ? order : 0,
  };
}

/** True when the admin typed anything worth keeping as a profile. */
export function draftHasProfile(draft: LeaderProfileDraft): boolean {
  return !!(draft.title.trim() || draft.bio.trim() || draft.photoUrl.trim());
}

interface LeaderProfileFieldsProps {
  idPrefix: string;
  value: LeaderProfileDraft;
  onChange: (next: LeaderProfileDraft) => void;
}

export function LeaderProfileFields({ idPrefix, value, onChange }: LeaderProfileFieldsProps) {
  const set = <K extends keyof LeaderProfileDraft>(key: K, v: LeaderProfileDraft[K]) => onChange({ ...value, [key]: v });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          placeholder='e.g. "Head Elder"'
          value={value.title}
          maxLength={200}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-photo`}>Photo URL</Label>
        <Input
          id={`${idPrefix}-photo`}
          type="url"
          placeholder="https://…"
          value={value.photoUrl}
          onChange={(e) => set("photoUrl", e.target.value)}
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`${idPrefix}-bio`}>Bio</Label>
        <Textarea
          id={`${idPrefix}-bio`}
          rows={3}
          value={value.bio}
          onChange={(e) => set("bio", e.target.value)}
        />
      </div>
      <div className="flex items-start justify-between gap-3 rounded-md border p-3">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-website`}>Show on the website</Label>
          <p className="text-xs text-muted-foreground">Listed on the church Leaders page.</p>
        </div>
        <Switch
          id={`${idPrefix}-website`}
          checked={value.showOnWebsite}
          onCheckedChange={(checked) => set("showOnWebsite", checked)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-order`}>Order</Label>
        <Input
          id={`${idPrefix}-order`}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={value.displayOrder}
          onChange={(e) => set("displayOrder", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Lower numbers appear first on the Leaders page.</p>
      </div>
    </div>
  );
}

/** Title and website status of one assignment. */
export function LeaderProfileStatus({ profile }: { profile: LeaderProfile | null | undefined }) {
  if (!profile) {
    return (
      <span data-testid="leader-profile-status" className="text-xs text-muted-foreground">
        No profile
      </span>
    );
  }
  return (
    <span data-testid="leader-profile-status" className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="font-medium text-foreground">{profile.title || "Department leader"}</span>
      {profile.showOnWebsite ? (
        <span className="inline-flex items-center gap-1 text-success">
          <Globe aria-hidden="true" className="size-3" />
          On the website
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <EyeOff aria-hidden="true" className="size-3" />
          Not on the website
        </span>
      )}
    </span>
  );
}

interface UpdateProfileResult {
  updateDepartmentLeaderProfile: { success: boolean; message: string };
}

interface EditLeaderProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryAdminId: string;
  memberName: string;
  departmentName: string;
  profile: LeaderProfile | null | undefined;
  onSaved?: () => void;
}

export function EditLeaderProfileDialog({
  open,
  onOpenChange,
  categoryAdminId,
  memberName,
  departmentName,
  profile,
  onSaved,
}: EditLeaderProfileDialogProps) {
  // Mounted per assignment (keyed by the caller), so it starts from the saved profile.
  const [draft, setDraft] = useState<LeaderProfileDraft>(() => draftFromProfile(profile));
  const [save, { loading }] = useMutation<UpdateProfileResult>(UPDATE_DEPARTMENT_LEADER_PROFILE);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await save({
        variables: { categoryAdminId, profile: profileFromDraft(draft) },
      });
      const result = data?.updateDepartmentLeaderProfile;
      if (result?.success) {
        toast.success(result.message || "Profile saved");
        onOpenChange(false);
        onSaved?.();
      } else {
        toast.error(result?.message || "Couldn't save the profile");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the profile");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Leader profile: {memberName}</DialogTitle>
            <DialogDescription>
              {departmentName}. Shown on the website Leaders page and in the yearly report. Name and phone come from
              the member record.
            </DialogDescription>
          </DialogHeader>
          <LeaderProfileFields idPrefix={`edit-profile-${categoryAdminId}`} value={draft} onChange={setDraft} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditProfileButton({ memberName, onClick }: { memberName: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} aria-label={`Edit profile for ${memberName}`}>
      <Pencil className="h-4 w-4" />
      <span className="ml-1 hidden lg:inline">Edit profile</span>
    </Button>
  );
}
