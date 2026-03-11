"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ALL_ANNOUNCEMENTS } from "@/lib/graphql/announcement-queries";
import {
  CREATE_ANNOUNCEMENT,
  UPDATE_ANNOUNCEMENT,
  DELETE_ANNOUNCEMENT,
  TOGGLE_ANNOUNCEMENT_ACTIVE,
} from "@/lib/graphql/announcement-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
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
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

function AnnouncementsManagementPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedAnnouncements, setSelectedAnnouncements] = useState<Set<string>>(new Set());

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPublishDate, setNewPublishDate] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newPriority, setNewPriority] = useState(0);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPublishDate, setEditPublishDate] = useState("");
  const [editIsActive, setEditIsActive] = useState(false);
  const [editPriority, setEditPriority] = useState(0);

  const { data, loading, refetch } = useQuery(GET_ALL_ANNOUNCEMENTS, {
    variables: { limit: 1000 },
  });

  const [createAnnouncement, { loading: creating }] = useMutation(CREATE_ANNOUNCEMENT);
  const [updateAnnouncement, { loading: updating }] = useMutation(UPDATE_ANNOUNCEMENT);
  const [deleteAnnouncement, { loading: deleting }] = useMutation(DELETE_ANNOUNCEMENT);
  const [toggleActive] = useMutation(TOGGLE_ANNOUNCEMENT_ACTIVE);

  const announcements: Announcement[] = data?.announcements || [];

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      searchQuery === "" ||
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && announcement.isActive) ||
      (activeFilter === "inactive" && !announcement.isActive);

    return matchesSearch && matchesActive;
  });

  // Sort by priority (descending) then by publish date (descending)
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const resetCreateForm = () => {
    setNewTitle("");
    setNewContent("");
    setNewPublishDate("");
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
          publishDate: newPublishDate || undefined,
          isActive: newIsActive,
          priority: newPriority,
        },
      });

      if (data?.createAnnouncement?.success) {
        setSuccess(data.createAnnouncement.message);
        resetCreateForm();
        setShowCreateDialog(false);
        refetch();
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
    setEditPublishDate(announcement.publishDate ? announcement.publishDate.split("T")[0] : "");
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
          publishDate: editPublishDate || undefined,
          isActive: editIsActive,
          priority: editPriority,
        },
      });

      if (data?.updateAnnouncement?.success) {
        setSuccess(data.updateAnnouncement.message);
        setShowEditDialog(false);
        refetch();
      } else {
        setError(data?.updateAnnouncement?.message || "Failed to update announcement");
      }
    } catch (err: any) {
      setError(err.message || "Error updating announcement");
    }
  };

  const handleDelete = async (announcementId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    clearMessages();

    try {
      const { data } = await deleteAnnouncement({
        variables: { announcementId },
      });

      if (data?.deleteAnnouncement?.success) {
        setSuccess(data.deleteAnnouncement.message);
        refetch();
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
        refetch();
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
        refetch();
      } else {
        setError(data?.updateAnnouncement?.message || "Failed to update priority");
      }
    } catch (err: any) {
      setError(err.message || "Error updating priority");
    }
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
      refetch();
    } catch (err: any) {
      setError(err.message || "Error in bulk operation");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAnnouncements.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedAnnouncements.size} announcement(s)?`)) return;

    clearMessages();

    try {
      for (const announcementId of selectedAnnouncements) {
        await deleteAnnouncement({ variables: { announcementId } });
      }
      setSuccess(`Deleted ${selectedAnnouncements.size} announcement(s)`);
      setSelectedAnnouncements(new Set());
      refetch();
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

  const toggleSelectAll = () => {
    if (selectedAnnouncements.size === sortedAnnouncements.length) {
      setSelectedAnnouncements(new Set());
    } else {
      setSelectedAnnouncements(new Set(sortedAnnouncements.map((a) => a.id)));
    }
  };

  const activeCount = announcements.filter((a) => a.isActive).length;
  const highPriorityCount = announcements.filter((a) => a.priority > 0).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">Manage church announcements and notices</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{announcements.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highPriorityCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{announcements.length - activeCount}</div>
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
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {sortedAnnouncements.length} of {announcements.length} announcement(s)
              </p>

              {selectedAnnouncements.size > 0 && (
                <div className="flex gap-2">
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
                Announcements ({sortedAnnouncements.length})
              </CardTitle>
              {sortedAnnouncements.length > 0 && (
                <Button size="sm" variant="ghost" onClick={toggleSelectAll}>
                  <Checkbox
                    checked={selectedAnnouncements.size === sortedAnnouncements.length}
                    className="mr-2"
                  />
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
              <div className="space-y-4">
                {sortedAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={selectedAnnouncements.has(announcement.id)}
                            onCheckedChange={() => toggleAnnouncementSelection(announcement.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{announcement.title}</CardTitle>
                              <div className="flex gap-2">
                                {announcement.isActive && (
                                  <Badge variant="default" className="bg-green-500">
                                    Active
                                  </Badge>
                                )}
                                {!announcement.isActive && <Badge variant="secondary">Inactive</Badge>}
                                {announcement.priority > 0 && (
                                  <Badge variant="default" className="bg-red-500">
                                    Priority {announcement.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <CardDescription className="line-clamp-2 mb-3">
                              {announcement.content}
                            </CardDescription>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(announcement.publishDate), "MMM d, yyyy")}
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleChangePriority(announcement.id, announcement.priority + 1)
                                  }
                                  title="Increase priority"
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
                ))}
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
                  <Label htmlFor="publishDate">Publish Date</Label>
                  <Input
                    id="publishDate"
                    type="date"
                    value={newPublishDate}
                    onChange={(e) => setNewPublishDate(e.target.value)}
                  />
                </div>

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
                  <Label htmlFor="editPublishDate">Publish Date</Label>
                  <Input
                    id="editPublishDate"
                    type="date"
                    value={editPublishDate}
                    onChange={(e) => setEditPublishDate(e.target.value)}
                  />
                </div>

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
      </div>
    </AdminLayout>
  );
}

export default function AnnouncementsManagementPage() {
  return (
    <AdminProtectedRoute>
      <AnnouncementsManagementPageContent />
    </AdminProtectedRoute>
  );
}
