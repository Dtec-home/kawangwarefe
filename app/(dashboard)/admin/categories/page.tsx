/**
 * Department Management Page
 * Admin CRUD for contribution departments
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  GET_ALL_CATEGORIES,
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
} from "@/lib/graphql/category-mutations";
import { GET_GROUPS_LIST } from "@/lib/graphql/group-management";
import { GET_FUNDS_WITH_EXPENSE_SETTINGS, UPDATE_FUND_EXPENSE_SETTINGS } from "@/lib/graphql/expenses";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, RoleBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  FolderOpen,
  ListChecks,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Audience = "all" | "adult" | "children";
type RoutingMode = "TOP_LEVEL" | "AUTO_MEMBER_GROUP" | "REQUIRES_PURPOSE" | "OPTIONAL_DETAILS";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  routingMode?: RoutingMode;
  fallbackIfNoGroup?: "TOP_LEVEL" | "REJECT";
  audience?: Audience;
  tracksMemberIdentifier?: boolean;
  identifierLabel?: string;
  identifierFormat?: string;
  allowedGroups?: GroupItem[];
}

interface GroupItem {
  id: string;
  name: string;
}

interface GetGroupsData {
  groupsList: GroupItem[];
}

interface GetCategoriesData {
  contributionCategories: Category[];
}

interface CreateCategoryData {
  createCategory: {
    success: boolean;
    message: string;
    category?: Category;
  };
}

interface UpdateCategoryData {
  updateCategory: {
    success: boolean;
    message: string;
    category?: Category;
  };
}

interface DeleteCategoryData {
  deleteCategory: {
    success: boolean;
    message: string;
  };
}

interface FundExpenseSettings {
  id: string;
  name: string;
  expenseTrackingEnabled: boolean;
  openingBalance: string | null;
  openingBalanceDate: string | null;
  netBalance: string | null;
  totalExpenses: string | null;
}

interface FundsExpenseSettingsData {
  contributionCategories: FundExpenseSettings[];
}

interface UpdateFundExpenseSettingsData {
  updateFundExpenseSettings: {
    success: boolean;
    message: string;
  };
}

/**
 * Dialog to configure per-fund expense tracking: enable toggle + opening
 * balance/date. Enabling shows a live Current Balance for the fund without
 * retroactively deducting historical contributions (backward-compatible, D1).
 */
function FundSettingsDialog({
  fund,
  open,
  onOpenChange,
  onSaved,
}: {
  fund: FundExpenseSettings | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [openingBalanceDate, setOpeningBalanceDate] = useState("");
  const [lastId, setLastId] = useState<string | null>(null);

  const [updateSettings, { loading }] = useMutation<UpdateFundExpenseSettingsData>(
    UPDATE_FUND_EXPENSE_SETTINGS,
  );

  // Sync local form state when a different fund's dialog opens.
  if (open && fund && fund.id !== lastId) {
    setLastId(fund.id);
    setEnabled(fund.expenseTrackingEnabled);
    setOpeningBalance(fund.openingBalance ?? "");
    setOpeningBalanceDate(fund.openingBalanceDate ? fund.openingBalanceDate.slice(0, 10) : "");
  }

  const handleSave = async () => {
    if (!fund) return;
    try {
      const { data } = await updateSettings({
        variables: {
          categoryId: fund.id,
          expenseTrackingEnabled: enabled,
          openingBalance: enabled ? (openingBalance.trim() || "0") : null,
          openingBalanceDate: enabled ? (openingBalanceDate || null) : null,
        },
      });
      if (data?.updateFundExpenseSettings.success) {
        toast.success(data.updateFundExpenseSettings.message || "Fund settings saved");
        onSaved();
        onOpenChange(false);
      } else {
        toast.error(data?.updateFundExpenseSettings.message || "Failed to save settings");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setLastId(null); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Expense Tracking{fund ? ` — ${fund.name}` : ""}</DialogTitle>
          <DialogDescription>
            Enabling shows a live Current Balance for this fund; historical
            contributions are not retroactively deducted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="flex flex-row items-center justify-between p-3">
            <div>
              <Label htmlFor="expense-tracking" className="text-sm font-medium">Expense tracking</Label>
              <p className="text-xs text-muted-foreground">Track money paid out of this fund.</p>
            </div>
            <Switch id="expense-tracking" checked={enabled} onCheckedChange={setEnabled} />
          </Card>

          {enabled && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="opening-balance">Opening Balance (KES)</Label>
                <Input
                  id="opening-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opening-balance-date">Opening Balance Date</Label>
                <Input
                  id="opening-balance-date"
                  type="date"
                  value={openingBalanceDate}
                  onChange={(e) => setOpeningBalanceDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {fund?.expenseTrackingEnabled && fund.netBalance != null && (
            <Card className="p-3 text-sm">
              <span className="text-muted-foreground">Current Balance: </span>
              <span className="font-semibold">KES {Number.parseFloat(fund.netBalance).toLocaleString()}</span>
            </Card>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryManagementPageContent() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Create form state
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRoutingMode, setNewRoutingMode] = useState<RoutingMode>("TOP_LEVEL");
  const [newFallbackIfNoGroup, setNewFallbackIfNoGroup] = useState<"TOP_LEVEL" | "REJECT">("TOP_LEVEL");
  const [newAllowedGroupIds, setNewAllowedGroupIds] = useState<string[]>([]);
  const [newAudience, setNewAudience] = useState<Audience>("all");
  const [newTracksIdentifier, setNewTracksIdentifier] = useState(false);
  const [newIdentifierLabel, setNewIdentifierLabel] = useState("");
  const [newIdentifierFormat, setNewIdentifierFormat] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRoutingMode, setEditRoutingMode] = useState<RoutingMode>("TOP_LEVEL");
  const [editFallbackIfNoGroup, setEditFallbackIfNoGroup] = useState<"TOP_LEVEL" | "REJECT">("TOP_LEVEL");
  const [editAllowedGroupIds, setEditAllowedGroupIds] = useState<string[]>([]);
  const [editAudience, setEditAudience] = useState<Audience>("all");
  const [editTracksIdentifier, setEditTracksIdentifier] = useState(false);
  const [editIdentifierLabel, setEditIdentifierLabel] = useState("");
  const [editIdentifierFormat, setEditIdentifierFormat] = useState("");

  const { data, loading, refetch } = useQuery<GetCategoriesData>(GET_ALL_CATEGORIES, {
    variables: { includeInactive: true },
  });
  const categories = data?.contributionCategories || [];
  const { data: groupsData } = useQuery<GetGroupsData>(GET_GROUPS_LIST);
  const groups = groupsData?.groupsList || [];

  // Per-fund expense-tracking settings + live balances (additive, opt-in).
  const { data: fundSettingsData, refetch: refetchFundSettings } = useQuery<FundsExpenseSettingsData>(
    GET_FUNDS_WITH_EXPENSE_SETTINGS,
    { variables: { includeInactive: true } },
  );
  const fundSettingsById = new Map(
    (fundSettingsData?.contributionCategories || []).map((f) => [f.id, f]),
  );
  const [fundSettingsTarget, setFundSettingsTarget] = useState<FundExpenseSettings | null>(null);

  const [createCategory, { loading: creating }] = useMutation<CreateCategoryData>(CREATE_CATEGORY);
  const [updateCategory, { loading: updating }] = useMutation<UpdateCategoryData>(UPDATE_CATEGORY);
  const [deleteCategory, { loading: deleting }] = useMutation<DeleteCategoryData>(DELETE_CATEGORY);

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return fallback;
  };

  const toggleSelectedGroup = (
    groupId: string,
    selectedGroupIds: string[],
    setSelectedGroupIds: (groupIds: string[]) => void,
  ) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
      return;
    }
    setSelectedGroupIds([...selectedGroupIds, groupId]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newName.trim() || !newCode.trim()) {
      setError("Name and code are required");
      return;
    }

    try {
      const { data } = await createCategory({
        variables: {
          name: newName.trim(),
          code: newCode.trim().toUpperCase(),
          description: newDescription.trim(),
          routingMode: newRoutingMode,
          fallbackIfNoGroup: newRoutingMode === "AUTO_MEMBER_GROUP" ? newFallbackIfNoGroup : undefined,
          allowedGroupIds: newRoutingMode === "AUTO_MEMBER_GROUP" ? newAllowedGroupIds : [],
          audience: newAudience,
          tracksMemberIdentifier: newTracksIdentifier,
          identifierLabel: newTracksIdentifier ? newIdentifierLabel.trim() : "",
          identifierFormat: newTracksIdentifier ? newIdentifierFormat.trim() : "",
        },
      });

      if (data?.createCategory?.success) {
        setSuccess(data.createCategory.message);
        setNewName("");
        setNewCode("");
        setNewDescription("");
        setNewRoutingMode("TOP_LEVEL");
        setNewFallbackIfNoGroup("TOP_LEVEL");
        setNewAllowedGroupIds([]);
        setNewAudience("all");
        setNewTracksIdentifier(false);
        setNewIdentifierLabel("");
        setNewIdentifierFormat("");
        setShowCreateForm(false);
        refetch();
      } else {
        setError(data?.createCategory?.message || "Failed to create department");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error creating department"));
    }
  };

  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditCode(category.code);
    setEditDescription(category.description);
    setEditRoutingMode(category.routingMode ?? "TOP_LEVEL");
    setEditFallbackIfNoGroup(category.fallbackIfNoGroup === "REJECT" ? "REJECT" : "TOP_LEVEL");
    setEditAllowedGroupIds((category.allowedGroups || []).map((group) => group.id));
    setEditAudience((category.audience as Audience) || "all");
    setEditTracksIdentifier(category.tracksMemberIdentifier ?? false);
    setEditIdentifierLabel(category.identifierLabel ?? "");
    setEditIdentifierFormat(category.identifierFormat ?? "");
    clearMessages();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    clearMessages();
  };

  const handleUpdate = async (categoryId: string) => {
    clearMessages();

    if (!editName.trim() || !editCode.trim()) {
      setError("Name and code are required");
      return;
    }

    try {
      const { data } = await updateCategory({
        variables: {
          categoryId,
          name: editName.trim(),
          code: editCode.trim().toUpperCase(),
          description: editDescription.trim(),
          routingMode: editRoutingMode,
          fallbackIfNoGroup: editRoutingMode === "AUTO_MEMBER_GROUP" ? editFallbackIfNoGroup : undefined,
          allowedGroupIds: editRoutingMode === "AUTO_MEMBER_GROUP" ? editAllowedGroupIds : [],
          audience: editAudience,
          tracksMemberIdentifier: editTracksIdentifier,
          identifierLabel: editTracksIdentifier ? editIdentifierLabel.trim() : "",
          identifierFormat: editTracksIdentifier ? editIdentifierFormat.trim() : "",
        },
      });

      if (data?.updateCategory?.success) {
        setSuccess(data.updateCategory.message);
        setEditingId(null);
        refetch();
      } else {
        setError(data?.updateCategory?.message || "Failed to update department");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error updating department"));
    }
  };

  const handleToggleActive = async (category: Category) => {
    clearMessages();

    try {
      const { data } = await updateCategory({
        variables: {
          categoryId: category.id,
          isActive: !category.isActive,
        },
      });

      if (data?.updateCategory?.success) {
        setSuccess(`Department '${category.name}' ${category.isActive ? "deactivated" : "activated"}`);
        refetch();
      } else {
        setError(data?.updateCategory?.message || "Failed to update department");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error updating department"));
    }
  };

  const handleDelete = async (category: Category) => {
    clearMessages();

    const confirmed = await confirm({
      title: 'Delete Department',
      description: `Are you sure you want to delete '${category.name}'? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) {
      return;
    }

    try {
      const { data } = await deleteCategory({
        variables: { categoryId: category.id },
      });

      if (data?.deleteCategory?.success) {
        setSuccess(data.deleteCategory.message);
        refetch();
      } else {
        setError(data?.deleteCategory?.message || "Failed to delete department");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error deleting department"));
    }
  };

  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = categories.filter((c) => !c.isActive).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Contribution Departments"
          description="Manage contribution departments (e.g., Tithe, Offering, Building Fund)"
          actions={
            <Button onClick={() => { setShowCreateForm(!showCreateForm); clearMessages(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{inactiveCount}</div>
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

        {/* Create Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Department</CardTitle>
              <CardDescription>Add a new contribution department</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Building Fund"
                      value={newName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setNewName(name);
                        // Auto-generate code from name
                        const autoCode = name
                          .trim()
                          .split(/\s+/)
                          .map((w) => w.slice(0, 5))
                          .join("_")
                          .toUpperCase()
                          .replace(/[^A-Z0-9_]/g, "")
                          .slice(0, 20);
                        setNewCode(autoCode);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      placeholder="e.g., BUILD"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      maxLength={20}
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-generated from name. Used as M-Pesa account reference.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="routingMode">Department Type *</Label>
                    <Select value={newRoutingMode} onValueChange={(value: RoutingMode) => {
                      setNewRoutingMode(value);
                      if (value !== "AUTO_MEMBER_GROUP") {
                        setNewAllowedGroupIds([]);
                        setNewFallbackIfNoGroup("TOP_LEVEL");
                      }
                    }}>
                      <SelectTrigger id="routingMode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TOP_LEVEL">Top-level Only</SelectItem>
                        <SelectItem value="AUTO_MEMBER_GROUP">Auto-match Member Group</SelectItem>
                        <SelectItem value="REQUIRES_PURPOSE">Requires Purpose</SelectItem>
                        <SelectItem value="OPTIONAL_DETAILS">Optional Details</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience">Audience</Label>
                    <Select value={newAudience} onValueChange={(v: Audience) => setNewAudience(v)}>
                      <SelectTrigger id="audience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All members</SelectItem>
                        <SelectItem value="adult">Adults only</SelectItem>
                        <SelectItem value="children">Children only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newRoutingMode === "AUTO_MEMBER_GROUP" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="fallbackIfNoGroup">If member has no group</Label>
                        <Select value={newFallbackIfNoGroup} onValueChange={(value: "TOP_LEVEL" | "REJECT") => setNewFallbackIfNoGroup(value)}>
                          <SelectTrigger id="fallbackIfNoGroup">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TOP_LEVEL">Fallback to Top-level</SelectItem>
                            <SelectItem value="REJECT">Reject Contribution</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label>Allowed Groups for Auto Route</Label>
                          {groups.length > 0 && (
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setNewAllowedGroupIds(groups.map((g) => g.id))}
                              >
                                Select all
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setNewAllowedGroupIds([])}
                              >
                                Clear all
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="max-h-40 overflow-y-auto rounded-md border p-3 space-y-2">
                          {groups.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No groups available.</p>
                          ) : (
                            groups.map((group) => (
                              <label key={group.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={newAllowedGroupIds.includes(group.id)}
                                  onCheckedChange={() =>
                                    toggleSelectedGroup(group.id, newAllowedGroupIds, setNewAllowedGroupIds)
                                  }
                                />
                                {group.name}
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3 rounded-md border p-3">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <Checkbox
                      checked={newTracksIdentifier}
                      onCheckedChange={(v) => setNewTracksIdentifier(v === true)}
                    />
                    Track a per-member number for this department (e.g. Welfare number)
                  </label>
                  {newTracksIdentifier && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="identifierLabel">Number label</Label>
                        <Input
                          id="identifierLabel"
                          placeholder="e.g., Welfare ID"
                          value={newIdentifierLabel}
                          onChange={(e) => setNewIdentifierLabel(e.target.value)}
                          maxLength={50}
                        />
                        <p className="text-xs text-muted-foreground">
                          Shown to members and admins next to the number.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="identifierFormat">Format (optional regex)</Label>
                        <Input
                          id="identifierFormat"
                          placeholder="e.g., ^[0-9]{1,6}$"
                          value={newIdentifierFormat}
                          onChange={(e) => setNewIdentifierFormat(e.target.value)}
                          maxLength={200}
                        />
                        <p className="text-xs text-muted-foreground">
                          Leave blank to accept any value. Carried on the M-Pesa reference.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Department"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Departments List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              All Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <Empty
                icon={FolderOpen}
                title="No departments yet"
                description="Create your first contribution department to get started."
                action={
                  <Button onClick={() => { setShowCreateForm(true); clearMessages(); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <Card
                    key={category.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {editingId === category.id ? (
                      /* Edit Mode */
                      <div className="flex-1 space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Name</Label>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Code</Label>
                            <Input
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                              maxLength={20}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Department Type</Label>
                            <Select value={editRoutingMode} onValueChange={(value: RoutingMode) => {
                              setEditRoutingMode(value);
                              if (value !== "AUTO_MEMBER_GROUP") {
                                setEditAllowedGroupIds([]);
                                setEditFallbackIfNoGroup("TOP_LEVEL");
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TOP_LEVEL">Top-level Only</SelectItem>
                                <SelectItem value="AUTO_MEMBER_GROUP">Auto-match Member Group</SelectItem>
                                <SelectItem value="REQUIRES_PURPOSE">Requires Purpose</SelectItem>
                                <SelectItem value="OPTIONAL_DETAILS">Optional Details</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Audience</Label>
                            <Select value={editAudience} onValueChange={(v: Audience) => setEditAudience(v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All members</SelectItem>
                                <SelectItem value="adult">Adults only</SelectItem>
                                <SelectItem value="children">Children only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {editRoutingMode === "AUTO_MEMBER_GROUP" && (
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs">If member has no group</Label>
                                <Select value={editFallbackIfNoGroup} onValueChange={(value: "TOP_LEVEL" | "REJECT") => setEditFallbackIfNoGroup(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="TOP_LEVEL">Fallback to Top-level</SelectItem>
                                    <SelectItem value="REJECT">Reject Contribution</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <Label className="text-xs">Allowed Groups for Auto Route</Label>
                                  {groups.length > 0 && (
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditAllowedGroupIds(groups.map((g) => g.id))}
                                      >
                                        Select all
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditAllowedGroupIds([])}
                                      >
                                        Clear all
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <div className="max-h-36 overflow-y-auto rounded-md border p-3 space-y-2">
                                  {groups.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No groups available.</p>
                                  ) : (
                                    groups.map((group) => (
                                      <label key={group.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                        <Checkbox
                                          checked={editAllowedGroupIds.includes(group.id)}
                                          onCheckedChange={() =>
                                            toggleSelectedGroup(group.id, editAllowedGroupIds, setEditAllowedGroupIds)
                                          }
                                        />
                                        {group.name}
                                      </label>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3 rounded-md border p-3">
                          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                            <Checkbox
                              checked={editTracksIdentifier}
                              onCheckedChange={(v) => setEditTracksIdentifier(v === true)}
                            />
                            Track a per-member number (e.g. Welfare number)
                          </label>
                          {editTracksIdentifier && (
                            <div className="grid md:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Number label</Label>
                                <Input
                                  placeholder="e.g., Welfare ID"
                                  value={editIdentifierLabel}
                                  onChange={(e) => setEditIdentifierLabel(e.target.value)}
                                  maxLength={50}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Format (optional regex)</Label>
                                <Input
                                  placeholder="e.g., ^[0-9]{1,6}$"
                                  value={editIdentifierFormat}
                                  onChange={(e) => setEditIdentifierFormat(e.target.value)}
                                  maxLength={200}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(category.id)}
                            disabled={updating}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {updating ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {category.code}
                            </Badge>
                            {category.isActive ? (
                              <StatusBadge variant="success">Active</StatusBadge>
                            ) : (
                              <StatusBadge variant="neutral">Inactive</StatusBadge>
                            )}
                            {category.routingMode === "TOP_LEVEL" && (
                              <Badge variant="outline" className="text-xs">Top-level</Badge>
                            )}
                            {category.routingMode === "REQUIRES_PURPOSE" && (
                              <Badge variant="outline" className="text-xs">Requires Purpose</Badge>
                            )}
                            {category.routingMode === "AUTO_MEMBER_GROUP" && (
                              <Badge variant="outline" className="text-xs">Auto Group Match</Badge>
                            )}
                            {category.routingMode === "OPTIONAL_DETAILS" && (
                              <Badge variant="outline" className="text-xs">Optional Details</Badge>
                            )}
                            {category.routingMode === "AUTO_MEMBER_GROUP" && (category.allowedGroups?.length || 0) > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {category.allowedGroups?.length} allowed group{(category.allowedGroups?.length || 0) === 1 ? "" : "s"}
                              </Badge>
                            )}
                            {category.audience === "adult" && (
                              <RoleBadge tone="neutral">Adults</RoleBadge>
                            )}
                            {category.audience === "children" && (
                              <RoleBadge tone="info">Children</RoleBadge>
                            )}
                            {category.tracksMemberIdentifier && (
                              <Badge className="bg-[color-mix(in_oklch,var(--chart-3)_12%,transparent)] text-[var(--chart-3)] text-xs">
                                {category.identifierLabel?.trim() || "Member #"}
                              </Badge>
                            )}
                            {fundSettingsById.get(category.id)?.expenseTrackingEnabled && (
                              <StatusBadge variant="success">
                                Balance: KES {Number.parseFloat(fundSettingsById.get(category.id)?.netBalance ?? "0").toLocaleString()}
                              </StatusBadge>
                            )}
                          </div>
                          {category.routingMode === "REQUIRES_PURPOSE" && (
                            <Link href={`/admin/categories/${category.id}/purposes`}>
                              <Button variant="outline" size="sm">
                                <ListChecks className="h-4 w-4 mr-1" />
                                Purposes
                              </Button>
                            </Link>
                          )}
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(category)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setFundSettingsTarget(
                              fundSettingsById.get(category.id) || {
                                id: category.id,
                                name: category.name,
                                expenseTrackingEnabled: false,
                                openingBalance: null,
                                openingBalanceDate: null,
                                netBalance: null,
                                totalExpenses: null,
                              },
                            )}
                          >
                            <Wallet className="h-3 w-3 mr-1" />
                            Fund Settings
                          </Button>
                          <Button
                            size="sm"
                            variant={category.isActive ? "secondary" : "default"}
                            onClick={() => handleToggleActive(category)}
                          >
                            {category.isActive ? (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(category)}
                            disabled={deleting}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <FundSettingsDialog
        fund={fundSettingsTarget}
        open={fundSettingsTarget !== null}
        onOpenChange={(v) => { if (!v) setFundSettingsTarget(null); }}
        onSaved={() => void refetchFundSettings()}
      />
      <ConfirmDialog />
    </AdminLayout>
  );
}

export default function CategoryManagementPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <CategoryManagementPageContent />
    </AdminProtectedRoute>
  );
}
