/**
 * Admin Members Page
 * Full member management: create, edit, roles, groups, activate/deactivate, delete
 */

"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_MEMBERS_LIST } from "@/lib/graphql/admin-queries";
import { GET_GROUPS_LIST } from "@/lib/graphql/group-management";
import {
  CREATE_MEMBER,
  UPDATE_MEMBER,
  TOGGLE_MEMBER_STATUS,
  DELETE_MEMBER,
  ASSIGN_ROLE,
  REMOVE_ROLE,
  SET_MEMBER_GROUPS,
  SET_MEMBER_DEPARTMENT_IDENTIFIER,
  REMOVE_MEMBER_DEPARTMENT_IDENTIFIER,
} from "@/lib/graphql/member-mutations";
import { GET_ALL_CATEGORIES } from "@/lib/graphql/category-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, RoleBadge, statusToVariant, type RoleTone } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Upload,
  Pencil,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Shield,
  TrendingUp,
  UsersRound,
  Hash,
} from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 100;
const ALL_ROLES = ["admin", "treasurer", "pastor", "content_admin", "member"] as const;

const ROLE_TONES: Record<string, RoleTone> = {
  admin: "warning",
  treasurer: "info",
  pastor: "primary",
  content_admin: "success",
  member: "neutral",
};

interface GroupItem {
  id: string;
  name: string;
}

interface DepartmentIdentifier {
  identifier: string;
  category: { id: string; name: string };
}

interface TrackingCategory {
  id: string;
  name: string;
  tracksMemberIdentifier?: boolean;
  identifierLabel?: string;
}

interface Member {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  memberNumber: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  groups: GroupItem[];
  departmentIdentifiers?: DepartmentIdentifier[];
}

interface CategoriesData {
  contributionCategories: TrackingCategory[];
}

interface MutationResult {
  success: boolean;
  message: string;
  member?: Member;
}

interface MembersData {
  membersList: { items: Member[]; total: number; hasMore: boolean };
}

interface GroupsData {
  groupsList: GroupItem[];
}

interface MemberMutationData {
  [key: string]: MutationResult;
}

// ─── Reusable sub-components (DRY) ────────────────────────────────

function MemberStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <StatusBadge variant={isActive ? "success" : "destructive"}>
      {isActive ? "Active" : "Inactive"}
    </StatusBadge>
  );
}

function RoleBadges({ roles }: { roles: string[] }) {
  if (!roles.length) return <span className="text-xs text-muted-foreground">No roles</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <RoleBadge key={r} tone={ROLE_TONES[r] || "neutral"} className="capitalize">
          {r.replace("_", " ")}
        </RoleBadge>
      ))}
    </div>
  );
}

function GroupBadges({ groups }: { groups: GroupItem[] }) {
  if (!groups.length) return <span className="text-xs text-muted-foreground">No groups</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {groups.map((g) => (
        <Badge key={g.id} variant="outline" className="text-[10px]">
          {g.name}
        </Badge>
      ))}
    </div>
  );
}

/** Checkbox group for selecting multiple items from a list. */
function CheckboxGroup({
  items,
  selected,
  onChange,
  labelKey = "name",
  valueKey = "id",
}: {
  items: { [key: string]: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  labelKey?: string;
  valueKey?: string;
}) {
  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

  return (
    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
      {items.map((item) => (
        <label key={item[valueKey]} className="flex items-center gap-2 text-sm cursor-pointer">
          <Checkbox
            checked={selected.includes(item[valueKey])}
            onCheckedChange={() => toggle(item[valueKey])}
          />
          {item[labelKey]}
        </label>
      ))}
    </div>
  );
}

// ─── Create Member Dialog ──────────────────────────────────────────

function CreateMemberDialog({
  allGroups,
  onSuccess,
}: {
  allGroups: GroupItem[];
  onSuccess: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  const [createMember, { loading }] = useMutation<MemberMutationData>(CREATE_MEMBER);

  const resetForm = () => {
    setForm({ firstName: "", lastName: "", phoneNumber: "", email: "" });
    setSelectedRoles([]);
    setSelectedGroupIds([]);
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const { data } = await createMember({
        variables: {
          ...form,
          email: form.email || null,
          roleNames: selectedRoles.length ? selectedRoles : null,
          groupIds: selectedGroupIds.length ? selectedGroupIds : null,
        },
      });
      const res = data?.createMember;
      if (res?.success) {
        onSuccess(res.message);
        resetForm();
        setOpen(false);
      } else {
        setError(res?.message || "Failed to create member");
      }
    } catch (err: any) {
      setError(err.message || "Error creating member");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>Create a member with optional roles and group assignments.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>First Name *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-1">
              <Label>Last Name *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Phone Number *</Label>
            <Input
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="0712345678"
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@example.com"
              type="email"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Roles
            </Label>
            <CheckboxGroup
              items={ALL_ROLES.map((r) => ({ id: r, name: r.replace("_", " ") }))}
              selected={selectedRoles}
              onChange={setSelectedRoles}
            />
          </div>

          {allGroups.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <UsersRound className="h-3.5 w-3.5" /> Groups
              </Label>
              <CheckboxGroup
                items={allGroups.map((g) => ({ id: g.id, name: g.name }))}
                selected={selectedGroupIds}
                onChange={setSelectedGroupIds}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={loading || !form.firstName || !form.lastName || !form.phoneNumber}>
            {loading ? "Creating..." : "Create Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage Roles Dialog ───────────────────────────────────────────

function ManageRolesDialog({
  member,
  onSuccess,
}: {
  member: Member;
  onSuccess: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [assignRole] = useMutation<MemberMutationData>(ASSIGN_ROLE);
  const [removeRole] = useMutation<MemberMutationData>(REMOVE_ROLE);

  const handleToggleRole = async (role: string, hasRole: boolean) => {
    setError("");
    try {
      const mutation = hasRole ? removeRole : assignRole;
      const { data } = await mutation({ variables: { memberId: member.id, role } });
      const res = data?.assignRole || data?.removeRole;
      if (res?.success) {
        onSuccess(res.message);
      } else {
        setError(res?.message || "Failed to update role");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Manage Roles">
          <Shield className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Roles: {member.fullName}</DialogTitle>
          <DialogDescription>Toggle roles for this member.</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          {ALL_ROLES.map((role) => {
            const hasRole = member.roles.includes(role);
            return (
              <label key={role} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={hasRole}
                  onCheckedChange={() => handleToggleRole(role, hasRole)}
                />
                <RoleBadge tone={ROLE_TONES[role] || "neutral"} className="capitalize">
                  {role.replace("_", " ")}
                </RoleBadge>
              </label>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage Groups Dialog ──────────────────────────────────────────

function ManageGroupsDialog({
  member,
  allGroups,
  onSuccess,
}: {
  member: Member;
  allGroups: GroupItem[];
  onSuccess: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [setMemberGroups, { loading }] = useMutation<MemberMutationData>(SET_MEMBER_GROUPS);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setSelectedIds(member.groups.map((g) => g.id));
    setOpen(isOpen);
    setError("");
  };

  const handleSave = async () => {
    setError("");
    try {
      const { data } = await setMemberGroups({
        variables: { memberId: member.id, groupIds: selectedIds },
      });
      const res = data?.setMemberGroups;
      if (res?.success) {
        onSuccess(res.message);
        setOpen(false);
      } else {
        setError(res?.message || "Failed to update groups");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Manage Groups">
          <UsersRound className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Groups: {member.fullName}</DialogTitle>
          <DialogDescription>Select which groups this member belongs to.</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {allGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No groups created yet. Create groups first.</p>
        ) : (
          <CheckboxGroup
            items={allGroups.map((g) => ({ id: g.id, name: g.name }))}
            selected={selectedIds}
            onChange={setSelectedIds}
          />
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Groups"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage Department IDs Dialog ──────────────────────────────────

function ManageDepartmentIdsDialog({
  member,
  trackingCategories,
  onSuccess,
}: {
  member: Member;
  trackingCategories: TrackingCategory[];
  onSuccess: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [setIdentifier] = useMutation<MemberMutationData>(SET_MEMBER_DEPARTMENT_IDENTIFIER);
  const [removeIdentifier] = useMutation<MemberMutationData>(REMOVE_MEMBER_DEPARTMENT_IDENTIFIER);
  const [saving, setSaving] = useState(false);

  const currentByCategoryId = (member.departmentIdentifiers || []).reduce<Record<string, string>>(
    (acc, di) => { acc[di.category.id] = di.identifier; return acc; },
    {},
  );

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setValues(
        trackingCategories.reduce<Record<string, string>>((acc, cat) => {
          acc[cat.id] = currentByCategoryId[cat.id] || "";
          return acc;
        }, {}),
      );
    }
    setOpen(isOpen);
    setError("");
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      for (const cat of trackingCategories) {
        const next = (values[cat.id] || "").trim();
        const prev = (currentByCategoryId[cat.id] || "").trim();
        if (next === prev) continue;

        if (next) {
          const { data } = await setIdentifier({
            variables: { memberId: member.id, categoryId: cat.id, identifier: next },
          });
          const res = data?.setMemberDepartmentIdentifier;
          if (!res?.success) {
            setError(res?.message || `Failed to set ${cat.identifierLabel || "identifier"}`);
            setSaving(false);
            return;
          }
        } else {
          const { data } = await removeIdentifier({
            variables: { memberId: member.id, categoryId: cat.id },
          });
          const res = data?.removeMemberDepartmentIdentifier;
          if (!res?.success) {
            setError(res?.message || "Failed to remove identifier");
            setSaving(false);
            return;
          }
        }
      }
      onSuccess(`Department numbers updated for ${member.fullName}`);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating department numbers");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Department numbers">
          <Hash className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Department numbers: {member.fullName}</DialogTitle>
          <DialogDescription>
            Set this member&apos;s number for departments that track one (e.g. Welfare).
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {trackingCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No departments track member numbers yet. Enable it on a department first.
          </p>
        ) : (
          <div className="space-y-3">
            {trackingCategories.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <Label className="text-xs">{cat.identifierLabel?.trim() || cat.name}</Label>
                <Input
                  value={values[cat.id] ?? ""}
                  onChange={(e) => setValues({ ...values, [cat.id]: e.target.value })}
                  placeholder={`${cat.name} number`}
                />
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={saving || trackingCategories.length === 0}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Members Page ─────────────────────────────────────────────

function MembersPageContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "" });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { setPage(0); }, [searchTerm, statusFilter]);

  const { data, loading, error: queryError, refetch } = useQuery<MembersData>(GET_MEMBERS_LIST, {
    variables: {
      search: searchTerm || null,
      isActive: statusFilter === "all" ? null : statusFilter === "active",
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    },
  });

  const { data: groupsData } = useQuery<GroupsData>(GET_GROUPS_LIST);
  const allGroups: GroupItem[] = groupsData?.groupsList || [];

  const { data: categoriesData } = useQuery<CategoriesData>(GET_ALL_CATEGORIES);
  const trackingCategories: TrackingCategory[] = (categoriesData?.contributionCategories || [])
    .filter((c) => c.tracksMemberIdentifier);

  const [updateMember, { loading: updating }] = useMutation<MemberMutationData>(UPDATE_MEMBER);
  const [toggleStatus] = useMutation<MemberMutationData>(TOGGLE_MEMBER_STATUS);
  const [deleteMember] = useMutation<MemberMutationData>(DELETE_MEMBER);

  const members: Member[] = data?.membersList?.items || [];
  const totalMembers: number = data?.membersList?.total || 0;
  const hasMore: boolean = data?.membersList?.hasMore || false;
  const pageStart = totalMembers === 0 ? 0 : page * PAGE_SIZE + 1;
  const pageEnd = totalMembers === 0 ? 0 : page * PAGE_SIZE + members.length;

  const clearMessages = () => { setSuccess(""); setError(""); };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError("");
    refetch();
  };

  const handleMutation = async (
    mutationFn: (opts: any) => Promise<any>,
    variables: Record<string, any>,
    resultKey: string,
  ) => {
    clearMessages();
    try {
      const { data } = await mutationFn({ variables });
      const res = data?.[resultKey];
      if (res?.success) {
        showSuccess(res.message);
        return true;
      } else {
        setError(res?.message || "Operation failed");
        return false;
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      return false;
    }
  };

  const handleStartEdit = (member: Member) => {
    setEditingId(member.id);
    setEditData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || "",
      phoneNumber: member.phoneNumber,
    });
    clearMessages();
  };

  const handleSaveEdit = async (memberId: string) => {
    const ok = await handleMutation(updateMember, {
      memberId,
      firstName: editData.firstName,
      lastName: editData.lastName,
      email: editData.email || null,
      phoneNumber: editData.phoneNumber,
    }, "updateMember");
    if (ok) setEditingId(null);
  };

  const handleToggleStatus = async (member: Member) => {
    const action = member.isActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} ${member.fullName}?`)) return;
    await handleMutation(toggleStatus, { memberId: member.id }, "toggleMemberStatus");
  };

  const handleDelete = async (member: Member) => {
    if (!confirm(`Are you sure you want to delete ${member.fullName}? This cannot be undone.`)) return;
    await handleMutation(deleteMember, { memberId: member.id }, "deleteMember");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Members" description="View and manage church members" />

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {members.filter((m) => m.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">on this page</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <UserX className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {members.filter((m) => !m.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">on this page</p>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Name, phone number, member number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap justify-between gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
              >
                Clear Filters
              </Button>
              <div className="flex gap-2">
                <Link href="/admin/members/import">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </Link>
                <CreateMemberDialog allGroups={allGroups} onSuccess={showSuccess} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>
              Showing {pageStart}-{pageEnd} of {totalMembers} member{totalMembers === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            )}
            {queryError && <div className="text-center py-8 text-destructive">Error: {queryError.message}</div>}
            {!loading && !queryError && members.length === 0 && (
              <Empty
                icon={Users}
                title="No members found"
                description="Try adjusting your search or filters, or add a new member to get started."
              />
            )}
            {!loading && !queryError && members.length > 0 && (
              <>
                {/* Mobile card view */}
                <div className="space-y-3 md:hidden">
                  {members.map((member) => (
                    <div key={member.id} className="border border-border rounded-lg p-3 space-y-2">
                      {editingId === member.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Input className="h-10 text-sm" value={editData.firstName} onChange={(e) => setEditData({ ...editData, firstName: e.target.value })} placeholder="First name" />
                            <Input className="h-10 text-sm" value={editData.lastName} onChange={(e) => setEditData({ ...editData, lastName: e.target.value })} placeholder="Last name" />
                          </div>
                          <Input className="h-10 text-sm font-mono" value={editData.phoneNumber} onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })} placeholder="Phone" />
                          <Input className="h-10 text-sm" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} placeholder="email@example.com" />
                          <div className="flex gap-2">
                            <Button className="flex-1" size="sm" onClick={() => handleSaveEdit(member.id)} disabled={updating}>
                              <Save className="h-4 w-4 mr-1" /> Save
                            </Button>
                            <Button className="flex-1" size="sm" variant="outline" onClick={() => { setEditingId(null); clearMessages(); }}>
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">{member.fullName}</div>
                              <div className="text-sm font-mono text-muted-foreground">{member.phoneNumber}</div>
                            </div>
                            <MemberStatusBadge isActive={member.isActive} />
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{member.memberNumber ? `#${member.memberNumber}` : "No member #"}</span>
                            <span>Joined {new Date(member.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          </div>
                          <RoleBadges roles={member.roles} />
                          <GroupBadges groups={member.groups} />
                          <div className="flex gap-2 pt-1 border-t">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleStartEdit(member)}>
                              <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <ManageRolesDialog member={member} onSuccess={showSuccess} />
                            <ManageGroupsDialog member={member} allGroups={allGroups} onSuccess={showSuccess} />
                            {trackingCategories.length > 0 && (
                              <ManageDepartmentIdsDialog member={member} trackingCategories={trackingCategories} onSuccess={showSuccess} />
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleToggleStatus(member)}>
                              {member.isActive ? <UserX className="h-4 w-4 text-warning" /> : <UserCheck className="h-4 w-4 text-success" />}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDelete(member)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-card [&_th]:bg-card [&_tr]:shadow-[inset_0_-1px_0_0_var(--border)]">
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">#</th>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Phone</th>
                        <th className="text-left p-3 font-medium">Roles</th>
                        <th className="text-left p-3 font-medium">Groups</th>
                        <th className="text-center p-3 font-medium">Status</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id} className="border-b border-border hover:bg-muted/60">
                          {editingId === member.id ? (
                            <>
                              <td className="p-3 text-sm font-mono">{member.memberNumber || "-"}</td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <Input className="h-8 text-sm" value={editData.firstName} onChange={(e) => setEditData({ ...editData, firstName: e.target.value })} placeholder="First name" />
                                  <Input className="h-8 text-sm" value={editData.lastName} onChange={(e) => setEditData({ ...editData, lastName: e.target.value })} placeholder="Last name" />
                                </div>
                              </td>
                              <td className="p-3">
                                <Input className="h-8 text-sm font-mono" value={editData.phoneNumber} onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })} />
                              </td>
                              <td className="p-3"><RoleBadges roles={member.roles} /></td>
                              <td className="p-3"><GroupBadges groups={member.groups} /></td>
                              <td className="p-3 text-center"><MemberStatusBadge isActive={member.isActive} /></td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-1">
                                  <Button size="sm" variant="default" onClick={() => handleSaveEdit(member.id)} disabled={updating}>
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setEditingId(null); clearMessages(); }}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 text-sm font-mono">{member.memberNumber || "-"}</td>
                              <td className="p-3 text-sm">
                                <div className="font-medium">{member.fullName}</div>
                                {member.email && <div className="text-xs text-muted-foreground">{member.email}</div>}
                              </td>
                              <td className="p-3 text-sm font-mono">{member.phoneNumber}</td>
                              <td className="p-3"><RoleBadges roles={member.roles} /></td>
                              <td className="p-3"><GroupBadges groups={member.groups} /></td>
                              <td className="p-3 text-center"><MemberStatusBadge isActive={member.isActive} /></td>
                              <td className="p-3 text-center">
                                <div className="flex justify-center gap-1">
                                  <Button size="sm" variant="ghost" onClick={() => handleStartEdit(member)} title="Edit">
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <ManageRolesDialog member={member} onSuccess={showSuccess} />
                                  <ManageGroupsDialog member={member} allGroups={allGroups} onSuccess={showSuccess} />
                                  {trackingCategories.length > 0 && (
                                    <ManageDepartmentIdsDialog member={member} trackingCategories={trackingCategories} onSuccess={showSuccess} />
                                  )}
                                  <Button size="sm" variant="ghost" onClick={() => handleToggleStatus(member)} title={member.isActive ? "Deactivate" : "Activate"}>
                                    {member.isActive ? <UserX className="h-3 w-3 text-warning" /> : <UserCheck className="h-3 w-3 text-success" />}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDelete(member)} title="Delete">
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                  <Link href={`/admin/reports?mode=progress&member=${member.id}`} title="View contribution progress">
                                    <Button size="sm" variant="ghost" asChild>
                                      <span><TrendingUp className="h-3 w-3 text-info" /></span>
                                    </Button>
                                  </Link>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Pagination */}
            {!loading && !queryError && totalMembers > 0 && (
              <div className="flex flex-col gap-3 border-t pt-4 mt-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} · {members.length} member{members.length === 1 ? "" : "s"} on this page
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0 || loading}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                  <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!hasMore || loading}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function MembersPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <MembersPageContent />
    </AdminProtectedRoute>
  );
}
