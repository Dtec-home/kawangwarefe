/**
 * Member Profile Page (Sprint 1 / Epic E1.1)
 *
 * Authenticated member self-service: change department & groups.
 * Mirrors the USSD group/department selection flow (see
 * church_BE/ussd/member_resolver.py) without duplicating its logic —
 * the backend `ProfileUpdateService` is the single source of truth for
 * validation rules.
 */

"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MemberLayout } from "@/components/layouts/member-layout";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  GET_CONTRIBUTION_CATEGORIES,
  GET_MY_CONTRIBUTION_STATS,
} from "@/lib/graphql/queries";
import { GET_GROUPS_LIST } from "@/lib/graphql/group-management";
import {
  GET_ME,
  UPDATE_MEMBER_PROFILE,
} from "@/lib/graphql/profile-mutations";
import { RESET_ALL_TUTORIALS } from "@/lib/graphql/tutorial-mutations";
import { ONBOARDING_STORAGE_KEY } from "@/lib/hooks/use-onboarding";
import { uploadAvatar } from "@/lib/profile/avatar-upload";
import { useAuth } from "@/lib/auth/auth-context";
import { useTour } from "@/hooks/use-tour";
import { PROFILE_TOUR_CONFIG } from "@/lib/tours/configs/profile";
import { ReplayTourButton } from "@/components/help/ReplayTourButton";
import { Camera, UserRound, Users, Bell, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { useRouter } from "next/navigation";

interface GroupItem {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  allowedGroups?: GroupItem[];
}

interface MeData {
  me: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    memberNumber: string;
    email: string | null;
    fullName: string;
    avatarUrl: string | null;
    department: Department | null;
    groups: GroupItem[];
  } | null;
}

interface CategoriesData {
  contributionCategories: Department[];
}

interface GroupsData {
  groupsList: GroupItem[];
}

interface UpdateProfileData {
  updateMemberProfile: {
    success: boolean;
    message: string;
    member: {
      id: string;
      fullName: string;
      department: { id: string; name: string } | null;
      groups: GroupItem[];
    } | null;
  };
}

interface ResetAllTutorialsData {
  resetAllTutorials: {
    success: boolean;
    message: string;
  };
}

interface ContributionGroupStats {
  group: { id: string; name: string } | null;
  totalAmount: string;
  totalCount: number;
  isTopLevel: boolean;
}

interface ContributionPurposeStats {
  purpose: { id: string; name: string; code: string };
  totalAmount: string;
  totalCount: number;
}

interface ContributionDepartmentStats {
  department: { id: string; name: string; code: string };
  totalAmount: string;
  totalCount: number;
  byPurpose: ContributionPurposeStats[];
  byGroup: ContributionGroupStats[];
}

interface ContributionStatsData {
  myContributionStats: {
    totalAmount: string;
    totalCount: number;
    byDepartment: ContributionDepartmentStats[];
  };
}

/**
 * Resolve the eligible group pool for the chosen department.
 * Extracted (SRP) so tests can exercise it in isolation.
 */
function eligibleGroupsFor(
  department: Department | null,
  allGroups: GroupItem[]
): GroupItem[] {
  if (department?.allowedGroups && department.allowedGroups.length > 0) {
    return department.allowedGroups;
  }
  return allGroups;
}

function ProfileContent() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { data: meData, loading: meLoading, refetch: refetchMe } =
    useQuery<MeData>(GET_ME, { fetchPolicy: "cache-and-network" });
  const { data: statsData, loading: statsLoading } = useQuery<ContributionStatsData>(
    GET_MY_CONTRIBUTION_STATS,
    { fetchPolicy: "cache-and-network" }
  );
  const { data: catData } = useQuery<CategoriesData>(GET_CONTRIBUTION_CATEGORIES);
  // groupsList is staff-only on the backend; ignore auth errors silently
  // and fall back to department.allowedGroups which every user can read.
  const { data: groupsData } = useQuery<GroupsData>(GET_GROUPS_LIST, {
    errorPolicy: "ignore",
  });

  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string> | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [updateProfile, { loading: saving }] = useMutation<UpdateProfileData>(
    UPDATE_MEMBER_PROFILE,
    { refetchQueries: [{ query: GET_ME }] }
  );

  const [resetAllTutorials, { loading: resettingTutorials }] =
    useMutation<ResetAllTutorialsData>(RESET_ALL_TUTORIALS);

  const { start: startProfileTour, isReady: isProfileTourReady } = useTour({
    tourKey: "profile_v1",
    steps: PROFILE_TOUR_CONFIG.steps || [],
    autoStart: false,
  });

  const handleResetTutorials = async () => {
    try {
      const { data } = await resetAllTutorials();
      const result = data?.resetAllTutorials;
      if (result?.success) {
        // Clear the onboarding carousel's local fast-path cache too, so it
        // (and the driver.js tours) re-surface right away instead of
        // waiting for the next backend sync — see lib/hooks/use-onboarding.ts.
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        }
        toast.success("All tutorials reset — they'll show again as you revisit each page.");
      } else {
        toast.error(result?.message || "Could not reset tutorials");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  // First paint after the `me` query resolves: seed the form from current state.
  if (
    meData?.me &&
    departmentId === null &&
    selectedGroupIds === null
  ) {
    setDepartmentId(meData.me.department?.id ?? "");
    setSelectedGroupIds(new Set(meData.me.groups.map((g) => g.id)));
  }

  const departments = catData?.contributionCategories ?? [];
  const allGroups = groupsData?.groupsList ?? [];
  const chosenDepartment = useMemo(
    () => departments.find((d) => d.id === departmentId) ?? null,
    [departments, departmentId]
  );
  const visibleGroups = useMemo(
    () => eligibleGroupsFor(chosenDepartment, allGroups),
    [chosenDepartment, allGroups]
  );

  const toggleGroup = (id: string, checked: boolean) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev ?? []);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      const { data } = await updateProfile({
        variables: {
          departmentId: departmentId || null,
          groupIds: selectedGroupIds ? Array.from(selectedGroupIds) : null,
        },
      });
      const result = data?.updateMemberProfile;
      if (result?.success) {
        toast.success(result.message || "Profile updated");
      } else {
        toast.error(result?.message || "Could not update profile");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!accessToken) {
      toast.error("Please sign in to upload a photo");
      return;
    }
    setUploading(true);
    try {
      await uploadAvatar(file, accessToken);
      await refetchMe();
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  // Scroll to the contribution totals section if the URL contains the hash.
  useEffect(() => {
    const scrollToAnchor = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash;
      if (!hash) return;
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        // Use smooth scroll for a pleasant UX
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // For accessibility, move focus briefly
        (el as HTMLElement).focus?.();
      }
    };

    // Try once on mount
    scrollToAnchor();
    // Also respond to later hash changes
    window.addEventListener("hashchange", scrollToAnchor);
    return () => window.removeEventListener("hashchange", scrollToAnchor);
  }, []);

  if (meLoading && !meData) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const me = meData?.me;
  if (!me) {
    return (
      <Alert>
        <AlertDescription>
          Your member record is not available. Please sign in again.
        </AlertDescription>
      </Alert>
    );
  }

  const stats = statsData?.myContributionStats;

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <Card>
        <CardHeader data-tour="profile-header">
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Update the department and groups you belong to.
          </CardDescription>
          <CardAction>
            <ReplayTourButton
              onClick={() => startProfileTour()}
              disabled={!isProfileTourReady}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-6">
          <div data-tour="profile-avatar" className="flex items-center gap-4">
            <div
              aria-label="Profile picture"
              className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center"
            >
              {me.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={me.avatarUrl}
                  alt={`${me.fullName} avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserRound className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                id="avatar-file"
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <input
                ref={cameraInputRef}
                id="avatar-camera"
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Uploading…" : me.avatarUrl ? "Change photo" : "Upload photo"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Take photo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG or JPEG — automatically resized.
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Name</Label>
            <p className="font-medium">{me.fullName}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Phone</Label>
            <p className="font-medium">{me.phoneNumber}</p>
          </div>

          <Card id="contribution-totals" data-tour="profile-totals" tabIndex={-1}>
            <CardHeader>
              <CardTitle className="text-base">My Contribution Breakdown</CardTitle>
              <CardDescription>
                Your completed totals by department, purpose, and group.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {statsLoading && !stats ? (
              <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            ) : stats ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-semibold">{stats.totalAmount}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Contributions</p>
                    <p className="text-xl font-semibold">{stats.totalCount}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {stats.byDepartment.length === 0 ? (
                    <Empty
                      icon={UserRound}
                      title="No contributions yet"
                      description="No completed contributions found yet."
                    />
                  ) : (
                    stats.byDepartment.map((department) => (
                      <Card key={department.department.id} className="gap-0 py-0 p-3 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{department.department.name}</p>
                            <p className="text-xs text-muted-foreground">{department.department.code}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{department.totalAmount}</p>
                            <p className="text-xs text-muted-foreground">{department.totalCount} contributions</p>
                          </div>
                        </div>

                        {department.byPurpose.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              By Purpose
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {department.byPurpose.map((purpose) => (
                                <div key={purpose.purpose.id} className="rounded-md bg-muted/40 p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-medium">{purpose.purpose.name}</p>
                                      <p className="text-xs text-muted-foreground">{purpose.purpose.code}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold">{purpose.totalAmount}</p>
                                      <p className="text-xs text-muted-foreground">{purpose.totalCount} gifts</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {department.byGroup.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              By Group
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {department.byGroup.map((groupItem, index) => (
                                <div key={`${department.department.id}-${groupItem.group?.id ?? index}`} className="rounded-md bg-muted/40 p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-medium">
                                        {groupItem.group?.name ?? "Top-level"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {groupItem.isTopLevel ? "No group routed" : "Member group routed"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold">{groupItem.totalAmount}</p>
                                      <p className="text-xs text-muted-foreground">{groupItem.totalCount} gifts</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Your contribution totals will appear here.</p>
            )}
            </CardContent>
          </Card>

          <div data-tour="profile-department">
            <Label htmlFor="department">Department</Label>
            <Select
              value={departmentId ?? ""}
              onValueChange={(v) => {
                setDepartmentId(v || null);
                // Reset group selections when department changes so the
                // user re-picks from the newly-eligible pool.
                setSelectedGroupIds(new Set());
              }}
            >
              <SelectTrigger id="department" aria-label="Select department">
                <SelectValue placeholder="Choose a department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Groups</Label>
            {visibleGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No groups available yet.
              </p>
            ) : (
              <ul className="space-y-2 mt-2">
                {visibleGroups.map((g) => {
                  const checked = selectedGroupIds?.has(g.id) ?? false;
                  return (
                    <li key={g.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`group-${g.id}`}
                        checked={checked}
                        onCheckedChange={(v) =>
                          toggleGroup(g.id, Boolean(v))
                        }
                      />
                      <Label htmlFor={`group-${g.id}`}>{g.name}</Label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div data-tour="profile-links" className="flex justify-between items-center gap-2 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/profile/family")}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage family
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/profile/notifications")}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tutorials &amp; walkthroughs</CardTitle>
          <CardDescription>
            Replay the first-run intro and every page&apos;s guided tour, as if you were seeing
            them for the first time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" disabled={resettingTutorials}>
                <RotateCcw className="h-4 w-4 mr-2" />
                {resettingTutorials ? "Resetting…" : "Replay all tutorials"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Replay all tutorials?</AlertDialogTitle>
                <AlertDialogDescription>
                  This resets the intro carousel and every guided tour you&apos;ve already
                  dismissed, so they show again the next time you visit those pages.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetTutorials}>
                  Reset tutorials
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <MemberLayout>
        <ProfileContent />
      </MemberLayout>
    </ProtectedRoute>
  );
}

// Exported for unit testing (SRP helper).
export { eligibleGroupsFor };
