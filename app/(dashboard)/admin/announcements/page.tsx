"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  GET_ADMIN_ANNOUNCEMENTS,
  GET_ADMIN_ANNOUNCEMENT_COUNTS,
} from "@/lib/graphql/announcement-queries";
import {
  CREATE_ANNOUNCEMENT,
  UPDATE_ANNOUNCEMENT,
  DELETE_ANNOUNCEMENT,
  TOGGLE_ANNOUNCEMENT_ACTIVE,
  REORDER_ANNOUNCEMENTS,
} from "@/lib/graphql/announcement-mutations";
import { SortableList } from "@/components/ui/sortable-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { BulkAnnouncementsDialog } from "@/components/admin/bulk-announcements-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Bell,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Calendar,
  Clock,
  CalendarClock,
  CalendarPlus,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

const isExpired = (a: { expiryDate?: string | null }) =>
  !!a.expiryDate && new Date(a.expiryDate).getTime() <= Date.now();

const isScheduled = (a: { publishDate: string }) =>
  new Date(a.publishDate).getTime() > Date.now();

const formatDateTime = (value?: string | null) =>
  value ? format(new Date(value), "MMM d, yyyy h:mm a") : "—";

// datetime-local inputs produce "YYYY-MM-DDTHH:MM"; backend expects
// "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD". Convert before sending.
const toBackendDateTime = (value: string): string | undefined => {
  if (!value) return undefined;
  const [d, t] = value.split("T");
  if (!t) return d;
  const seconds = t.length === 5 ? `${t}:00` : t;
  return `${d} ${seconds}`;
};

interface Announcement {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  expiryDate?: string | null;
  isActive: boolean;
  priority: number;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementMutationResponse {
  success: boolean;
  message: string;
  announcement?: Announcement;
}

interface AnnouncementCounts {
  total: number;
  active: number;
  inactive: number;
  scheduled: number;
  expired: number;
  highPriority: number;
}

interface PaginatedAdminAnnouncementsResult {
  adminAnnouncements: {
    total: number;
    hasMore: boolean;
    items: Announcement[];
  };
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function AnnouncementsManagementPageContent() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedAnnouncements, setSelectedAnnouncements] = useState<Set<string>>(new Set());

  // Debounce search-driven server queries.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset to first page when filters/search change.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, activeFilter, pageSize]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPublishDate, setNewPublishDate] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newPriority, setNewPriority] = useState(0);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPublishDate, setEditPublishDate] = useState("");
  const [editExpiryDate, setEditExpiryDate] = useState("");
  const [editIsActive, setEditIsActive] = useState(false);
  const [editPriority, setEditPriority] = useState(0);

  const { data, loading, refetch } = useQuery<PaginatedAdminAnnouncementsResult>(
    GET_ADMIN_ANNOUNCEMENTS,
    {
      variables: {
        limit: pageSize,
        offset: page * pageSize,
        search: debouncedSearch || undefined,
        status: activeFilter,
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const { data: countsData, refetch: refetchCounts } = useQuery<{
    adminAnnouncementCounts: AnnouncementCounts;
  }>(GET_ADMIN_ANNOUNCEMENT_COUNTS, { fetchPolicy: "cache-and-network" });

  const refetchAll = () => {
    refetch();
    refetchCounts();
  };

  const [createAnnouncement, { loading: creating }] = useMutation<{ createAnnouncement: AnnouncementMutationResponse }>(CREATE_ANNOUNCEMENT);
  const [updateAnnouncement, { loading: updating }] = useMutation<{ updateAnnouncement: AnnouncementMutationResponse }>(UPDATE_ANNOUNCEMENT);
  const [deleteAnnouncement, { loading: deleting }] = useMutation<{ deleteAnnouncement: AnnouncementMutationResponse }>(DELETE_ANNOUNCEMENT);
  const [toggleActive] = useMutation<{ toggleAnnouncementActive: AnnouncementMutationResponse }>(TOGGLE_ANNOUNCEMENT_ACTIVE);
  const [reorderAnnouncements] = useMutation<{ reorderAnnouncements: { success: boolean; message: string } }>(REORDER_ANNOUNCEMENTS);

  const announcements: Announcement[] = data?.adminAnnouncements?.items ?? [];
  const totalForFilter = data?.adminAnnouncements?.total ?? 0;
  const hasMore = data?.adminAnnouncements?.hasMore ?? false;

  // Optimistic local ordering applied on top of the server result. When the
  // server data changes (refetch/pagination/filter), we fall back to its order
  // by keying the override to the current set of ids.
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null);

  const serverIdsKey = announcements.map((a) => a.id).join(",");
  useEffect(() => {
    setOrderOverride(null);
  }, [serverIdsKey]);

  const sortedAnnouncements: Announcement[] = orderOverride
    ? (orderOverride
        .map((id) => announcements.find((a) => a.id === id))
        .filter(Boolean) as Announcement[])
    : announcements;

  const counts: AnnouncementCounts = countsData?.adminAnnouncementCounts ?? {
    total: 0,
    active: 0,
    inactive: 0,
    scheduled: 0,
    expired: 0,
    highPriority: 0,
  };

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const resetCreateForm = () => {
    setNewTitle("");
    setNewContent("");
    setNewPublishDate("");
    setNewExpiryDate("");
    setNewIsActive(true);
    setNewPriority(0);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newTitle.trim() || !newContent.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      const { data } = await createAnnouncement({
        variables: {
          title: newTitle.trim(),
          content: newContent.trim(),
          publishDate: toBackendDateTime(newPublishDate),
          expiryDate: toBackendDateTime(newExpiryDate),
          isActive: newIsActive,
          priority: newPriority,
        },
      });

      if (data?.createAnnouncement?.success) {
        setSuccess(data.createAnnouncement.message);
        resetCreateForm();
        setShowCreateDialog(false);
        refetchAll();
      } else {
        setError(data?.createAnnouncement?.message || "Failed to create announcement");
      }
    } catch (err: any) {
      setError(err.message || "Error creating announcement");
    }
  };

  const handleStartEdit = (announcement: Announcement) => {
    setCurrentAnnouncement(announcement);
    setEditTitle(announcement.title);
    setEditContent(announcement.content);
    setEditPublishDate(announcement.publishDate ? announcement.publishDate.slice(0, 16) : "");
    setEditExpiryDate(announcement.expiryDate ? announcement.expiryDate.slice(0, 16) : "");
    setEditIsActive(announcement.isActive);
    setEditPriority(announcement.priority);
    setShowEditDialog(true);
    clearMessages();
  };

  const handleUpdate = async () => {
    if (!currentAnnouncement) return;
    clearMessages();

    try {
      const { data } = await updateAnnouncement({
        variables: {
          announcementId: currentAnnouncement.id,
          title: editTitle.trim() || undefined,
          content: editContent.trim() || undefined,
          publishDate: toBackendDateTime(editPublishDate),
          expiryDate: editExpiryDate ? toBackendDateTime(editExpiryDate) : "",
          isActive: editIsActive,
          priority: editPriority,
        },
      });

      if (data?.updateAnnouncement?.success) {
        setSuccess(data.updateAnnouncement.message);
        setShowEditDialog(false);
        refetchAll();
      } else {
        setError(data?.updateAnnouncement?.message || "Failed to update announcement");
      }
    } catch (err: any) {
      setError(err.message || "Error updating announcement");
    }
  };

  const handleDelete = async (announcementId: string, title: string) => {
    const confirmed = await confirm({
      title: 'Delete Announcement',
      description: `Are you sure you want to delete "${title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    clearMessages();

    try {
      const { data } = await deleteAnnouncement({
        variables: { announcementId },
      });

      if (data?.deleteAnnouncement?.success) {
        setSuccess(data.deleteAnnouncement.message);
        refetchAll();
      } else {
        setError(data?.deleteAnnouncement?.message || "Failed to delete announcement");
      }
    } catch (err: any) {
      setError(err.message || "Error deleting announcement");
    }
  };

  const handleToggleActive = async (announcementId: string) => {
    clearMessages();

    try {
      const { data } = await toggleActive({
        variables: { announcementId },
      });

      if (data?.toggleAnnouncementActive?.success) {
        setSuccess(data.toggleAnnouncementActive.message);
        refetchAll();
      } else {
        setError(data?.toggleAnnouncementActive?.message || "Failed to toggle active status");
      }
    } catch (err: any) {
      setError(err.message || "Error toggling active status");
    }
  };

  const handleChangePriority = async (announcementId: string, newPriority: number) => {
    clearMessages();

    try {
      const { data } = await updateAnnouncement({
        variables: {
          announcementId,
          priority: newPriority,
        },
      });

      if (data?.updateAnnouncement?.success) {
        setSuccess("Priority updated successfully");
        refetchAll();
      } else {
        setError(data?.updateAnnouncement?.message || "Failed to update priority");
      }
    } catch (err: any) {
      setError(err.message || "Error updating priority");
    }
  };

  // Persist a new ordering (from drag-drop or keyboard move). Optimistically
  // applies locally, then calls the backend reorder mutation.
  const persistOrder = async (newOrderedIds: string[]) => {
    setOrderOverride(newOrderedIds);
    clearMessages();
    try {
      const { data } = await reorderAnnouncements({
        variables: { ids: newOrderedIds },
      });
      if (data?.reorderAnnouncements?.success) {
        setSuccess(data.reorderAnnouncements.message || "Order updated");
        refetchAll();
      } else {
        setError(data?.reorderAnnouncements?.message || "Failed to reorder announcements");
        setOrderOverride(null);
      }
    } catch (err: any) {
      setError(err.message || "Error reordering announcements");
      setOrderOverride(null);
    }
  };

  // Keyboard-accessible fallback: move a row up/down by one position.
  const moveAnnouncement = (announcementId: string, direction: "up" | "down") => {
    const ids = sortedAnnouncements.map((a) => a.id);
    const idx = ids.indexOf(announcementId);
    if (idx === -1) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[idx], next[target]] = [next[target], next[idx]];
    persistOrder(next);
  };

  const handleBulkToggleActive = async () => {
    if (selectedAnnouncements.size === 0) return;
    clearMessages();

    try {
      for (const announcementId of selectedAnnouncements) {
        await toggleActive({ variables: { announcementId } });
      }
      setSuccess(`Updated ${selectedAnnouncements.size} announcement(s)`);
      setSelectedAnnouncements(new Set());
      refetchAll();
    } catch (err: any) {
      setError(err.message || "Error in bulk operation");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAnnouncements.size === 0) return;

    const confirmed = await confirm({
      title: 'Delete Announcements',
      description: `Are you sure you want to delete ${selectedAnnouncements.size} announcement(s)? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    clearMessages();

    try {
      for (const announcementId of selectedAnnouncements) {
        await deleteAnnouncement({ variables: { announcementId } });
      }
      setSuccess(`Deleted ${selectedAnnouncements.size} announcement(s)`);
      setSelectedAnnouncements(new Set());
      refetchAll();
    } catch (err: any) {
      setError(err.message || "Error in bulk delete");
    }
  };

  const toggleAnnouncementSelection = (announcementId: string) => {
    const newSelection = new Set(selectedAnnouncements);
    if (newSelection.has(announcementId)) {
      newSelection.delete(announcementId);
    } else {
      newSelection.add(announcementId);
    }
    setSelectedAnnouncements(newSelection);
  };

  const allOnPageSelected =
    sortedAnnouncements.length > 0 &&
    sortedAnnouncements.every((a) => selectedAnnouncements.has(a.id));

  const toggleSelectAll = () => {
    const next = new Set(selectedAnnouncements);
    if (allOnPageSelected) {
      sortedAnnouncements.forEach((a) => next.delete(a.id));
    } else {
      sortedAnnouncements.forEach((a) => next.add(a.id));
    }
    setSelectedAnnouncements(next);
  };

  const totalPages = Math.max(1, Math.ceil(totalForFilter / pageSize));
  const currentPage = totalForFilter === 0 ? 0 : page + 1;
  const rangeStart = totalForFilter === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = page * pageSize + announcements.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">Manage church announcements and notices</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(true)}
              className="w-full sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              Bulk Add
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.inactive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.scheduled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.expired}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.highPriority}</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="live">Live (Active &amp; Visible)</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {totalForFilter === 0
                  ? "No announcements match these filters"
                  : `Showing ${rangeStart}–${rangeEnd} of ${totalForFilter} announcement(s)`}
              </p>

              {selectedAnnouncements.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkToggleActive}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Toggle Active ({selectedAnnouncements.size})
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedAnnouncements.size})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Announcements List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Announcements ({totalForFilter})
              </CardTitle>
              {sortedAnnouncements.length > 0 && (
                <Button size="sm" variant="ghost" onClick={toggleSelectAll}>
                  <Checkbox checked={allOnPageSelected} className="mr-2" />
                  Select All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Loading announcements...</div>
            ) : sortedAnnouncements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">No announcements found</p>
                <p className="text-sm">
                  {searchQuery || activeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first announcement to get started"}
                </p>
              </div>
            ) : (
              <SortableList
                items={sortedAnnouncements}
                onReorder={persistOrder}
                className="space-y-4"
                renderItem={(announcement, index, handle) => {
                  const expired = isExpired(announcement);
                  const scheduled = isScheduled(announcement);
                  const live = announcement.isActive && !expired && !scheduled;

                  return (
                  <Card className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            ref={handle.setActivatorNodeRef}
                            {...handle.attributes}
                            {...handle.listeners}
                            aria-label={`Drag to reorder "${announcement.title}"`}
                            title="Drag to reorder"
                            className="mt-0.5 cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <Checkbox
                            checked={selectedAnnouncements.has(announcement.id)}
                            onCheckedChange={() => toggleAnnouncementSelection(announcement.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <CardTitle className="text-lg break-words">{announcement.title}</CardTitle>
                              <div className="flex flex-wrap gap-2">
                                {announcement.isActive ? (
                                  <Badge variant="default" className="bg-green-500">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                                {live && (
                                  <Badge variant="outline" className="border-green-500 text-green-700">
                                    Live
                                  </Badge>
                                )}
                                {scheduled && (
                                  <Badge variant="default" className="bg-blue-500">
                                    <CalendarPlus className="h-3 w-3 mr-1" />
                                    Scheduled
                                  </Badge>
                                )}
                                {expired && (
                                  <Badge variant="default" className="bg-amber-500">
                                    <CalendarClock className="h-3 w-3 mr-1" />
                                    Expired
                                  </Badge>
                                )}
                                {announcement.priority > 0 && (
                                  <Badge variant="default" className="bg-red-500">
                                    Priority {announcement.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <CardDescription className="mb-3 whitespace-pre-wrap break-words">
                              {announcement.content}
                            </CardDescription>

                            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                              <div className="flex items-start gap-2">
                                <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
                                <div>
                                  <div className="text-xs uppercase tracking-wide">Publish</div>
                                  <div>{formatDateTime(announcement.publishDate)}</div>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <CalendarClock className="h-4 w-4 mt-0.5 shrink-0" />
                                <div>
                                  <div className="text-xs uppercase tracking-wide">Expires</div>
                                  <div>
                                    {announcement.expiryDate
                                      ? formatDateTime(announcement.expiryDate)
                                      : "Never"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                                <div>
                                  <div className="text-xs uppercase tracking-wide">Created</div>
                                  <div>{formatDateTime(announcement.createdAt)}</div>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                                <div>
                                  <div className="text-xs uppercase tracking-wide">Updated</div>
                                  <div>{formatDateTime(announcement.updatedAt)}</div>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 sm:col-span-2">
                                <span className="text-xs uppercase tracking-wide pt-0.5">ID</span>
                                <code className="text-xs break-all">{announcement.id}</code>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Order:</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={index === 0}
                                  onClick={() => moveAnnouncement(announcement.id, "up")}
                                  aria-label={`Move "${announcement.title}" up`}
                                  title="Move up (keyboard fallback)"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={index === sortedAnnouncements.length - 1}
                                  onClick={() => moveAnnouncement(announcement.id, "down")}
                                  aria-label={`Move "${announcement.title}" down`}
                                  title="Move down (keyboard fallback)"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Priority:</span>
                                <span className="text-sm font-medium">{announcement.priority}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleChangePriority(announcement.id, announcement.priority + 1)
                                  }
                                  title="Increase priority"
                                  aria-label={`Increase priority of "${announcement.title}"`}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleChangePriority(
                                      announcement.id,
                                      Math.max(0, announcement.priority - 1)
                                    )
                                  }
                                  title="Decrease priority"
                                  aria-label={`Decrease priority of "${announcement.title}"`}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStartEdit(announcement)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(announcement.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {announcement.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(announcement.id, announcement.title)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                  </Card>
                  );
                }}
              />
            )}

            {totalForFilter > 0 && (
              <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Label htmlFor="pageSize" className="text-sm font-normal">
                    Per page
                  </Label>
                  <select
                    id="pageSize"
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={pageSize}
                    onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="ml-2">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 0 || loading}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!hasMore || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
              <DialogDescription>Add a new church announcement or notice</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Announcement title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  rows={6}
                  placeholder="Announcement content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="publishDate">Publish Date &amp; Time</Label>
                  <Input
                    id="publishDate"
                    type="datetime-local"
                    value={newPublishDate}
                    onChange={(e) => setNewPublishDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Future dates schedule the announcement for later.
                  </p>
                </div>

                <div>
                  <Label htmlFor="expiryDate">Expiry Date &amp; Time (Optional)</Label>
                  <Input
                    id="expiryDate"
                    type="datetime-local"
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to keep announcement indefinitely.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="priority">Priority (0 = normal, higher = more important)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    value={newPriority}
                    onChange={(e) => setNewPriority(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={newIsActive}
                  onCheckedChange={(checked) => setNewIsActive(checked as boolean)}
                />
                <Label htmlFor="active">Announcement is active</Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Announcement"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
              <DialogDescription>Update announcement details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Title</Label>
                <Input
                  id="editTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="editContent">Content</Label>
                <Textarea
                  id="editContent"
                  rows={6}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="editPublishDate">Publish Date &amp; Time</Label>
                  <Input
                    id="editPublishDate"
                    type="datetime-local"
                    value={editPublishDate}
                    onChange={(e) => setEditPublishDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="editExpiryDate">Expiry Date &amp; Time (Optional)</Label>
                  <Input
                    id="editExpiryDate"
                    type="datetime-local"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to keep announcement indefinitely.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="editPriority">Priority</Label>
                  <Input
                    id="editPriority"
                    type="number"
                    min="0"
                    value={editPriority}
                    onChange={(e) => setEditPriority(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editActive"
                  checked={editIsActive}
                  onCheckedChange={(checked) => setEditIsActive(checked as boolean)}
                />
                <Label htmlFor="editActive">Announcement is active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? "Updating..." : "Update Announcement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <BulkAnnouncementsDialog
          open={showBulkDialog}
          onOpenChange={setShowBulkDialog}
          onCreated={(count) => {
            setSuccess(`Created ${count} announcement(s)`);
            refetchAll();
          }}
        />

        <ConfirmDialog />
      </div>
    </AdminLayout>
  );
}

export default function AnnouncementsManagementPage() {
  return (
    <AdminProtectedRoute requiredAccess="content-admin">
      <AnnouncementsManagementPageContent />
    </AdminProtectedRoute>
  );
}
