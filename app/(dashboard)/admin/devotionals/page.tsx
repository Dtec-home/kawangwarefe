"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ALL_DEVOTIONALS } from "@/lib/graphql/devotional-queries";
import {
  CREATE_DEVOTIONAL,
  UPDATE_DEVOTIONAL,
  DELETE_DEVOTIONAL,
  TOGGLE_DEVOTIONAL_FEATURED,
  TOGGLE_DEVOTIONAL_PUBLISHED,
} from "@/lib/graphql/devotional-mutations";
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
  Star,
  Eye,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  BookOpen,
  Calendar,
  User,
} from "lucide-react";
import { format } from "date-fns";

interface Devotional {
  id: string;
  title: string;
  content: string;
  author: string;
  scriptureReference: string;
  publishDate: string;
  isPublished: boolean;
  isFeatured: boolean;
  featuredImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

function DevotionalsManagementPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [selectedDevotionals, setSelectedDevotionals] = useState<Set<string>>(new Set());

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [currentDevotional, setCurrentDevotional] = useState<Devotional | null>(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newScripture, setNewScripture] = useState("");
  const [newPublishDate, setNewPublishDate] = useState("");
  const [newIsPublished, setNewIsPublished] = useState(false);
  const [newIsFeatured, setNewIsFeatured] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editScripture, setEditScripture] = useState("");
  const [editPublishDate, setEditPublishDate] = useState("");
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState("");

  const { data, loading, refetch } = useQuery(GET_ALL_DEVOTIONALS, {
    variables: { limit: 1000 },
  });

  const [createDevotional, { loading: creating }] = useMutation(CREATE_DEVOTIONAL);
  const [updateDevotional, { loading: updating }] = useMutation(UPDATE_DEVOTIONAL);
  const [deleteDevotional, { loading: deleting }] = useMutation(DELETE_DEVOTIONAL);
  const [toggleFeatured] = useMutation(TOGGLE_DEVOTIONAL_FEATURED);
  const [togglePublished] = useMutation(TOGGLE_DEVOTIONAL_PUBLISHED);

  const devotionals: Devotional[] = data?.devotionals || [];

  // Filter devotionals
  const filteredDevotionals = devotionals.filter((devotional) => {
    const matchesSearch =
      searchQuery === "" ||
      devotional.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      devotional.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      devotional.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      devotional.scriptureReference.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPublished =
      publishedFilter === "all" ||
      (publishedFilter === "published" && devotional.isPublished) ||
      (publishedFilter === "unpublished" && !devotional.isPublished);

    const matchesFeatured =
      featuredFilter === "all" ||
      (featuredFilter === "featured" && devotional.isFeatured) ||
      (featuredFilter === "not-featured" && !devotional.isFeatured);

    return matchesSearch && matchesPublished && matchesFeatured;
  });

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const resetCreateForm = () => {
    setNewTitle("");
    setNewContent("");
    setNewAuthor("");
    setNewScripture("");
    setNewPublishDate("");
    setNewIsPublished(false);
    setNewIsFeatured(false);
    setNewImageUrl("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newTitle.trim() || !newContent.trim() || !newAuthor.trim()) {
      setError("Title, content, and author are required");
      return;
    }

    try {
      const { data } = await createDevotional({
        variables: {
          title: newTitle.trim(),
          content: newContent.trim(),
          author: newAuthor.trim(),
          scriptureReference: newScripture.trim() || undefined,
          publishDate: newPublishDate || undefined,
          isPublished: newIsPublished,
          isFeatured: newIsFeatured,
          featuredImageUrl: newImageUrl.trim() || undefined,
        },
      });

      if (data?.createDevotional?.success) {
        setSuccess(data.createDevotional.message);
        resetCreateForm();
        setShowCreateDialog(false);
        refetch();
      } else {
        setError(data?.createDevotional?.message || "Failed to create devotional");
      }
    } catch (err: any) {
      setError(err.message || "Error creating devotional");
    }
  };

  const handleStartEdit = (devotional: Devotional) => {
    setCurrentDevotional(devotional);
    setEditTitle(devotional.title);
    setEditContent(devotional.content);
    setEditAuthor(devotional.author);
    setEditScripture(devotional.scriptureReference);
    setEditPublishDate(devotional.publishDate ? devotional.publishDate.split("T")[0] : "");
    setEditIsPublished(devotional.isPublished);
    setEditIsFeatured(devotional.isFeatured);
    setEditImageUrl(devotional.featuredImageUrl);
    setShowEditDialog(true);
    clearMessages();
  };

  const handleUpdate = async () => {
    if (!currentDevotional) return;
    clearMessages();

    try {
      const { data } = await updateDevotional({
        variables: {
          devotionalId: currentDevotional.id,
          title: editTitle.trim() || undefined,
          content: editContent.trim() || undefined,
          author: editAuthor.trim() || undefined,
          scriptureReference: editScripture.trim() || undefined,
          publishDate: editPublishDate || undefined,
          isPublished: editIsPublished,
          isFeatured: editIsFeatured,
          featuredImageUrl: editImageUrl.trim() || undefined,
        },
      });

      if (data?.updateDevotional?.success) {
        setSuccess(data.updateDevotional.message);
        setShowEditDialog(false);
        refetch();
      } else {
        setError(data?.updateDevotional?.message || "Failed to update devotional");
      }
    } catch (err: any) {
      setError(err.message || "Error updating devotional");
    }
  };

  const handleDelete = async (devotionalId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    clearMessages();

    try {
      const { data } = await deleteDevotional({
        variables: { devotionalId },
      });

      if (data?.deleteDevotional?.success) {
        setSuccess(data.deleteDevotional.message);
        refetch();
      } else {
        setError(data?.deleteDevotional?.message || "Failed to delete devotional");
      }
    } catch (err: any) {
      setError(err.message || "Error deleting devotional");
    }
  };

  const handleToggleFeatured = async (devotionalId: string) => {
    clearMessages();

    try {
      const { data } = await toggleFeatured({
        variables: { devotionalId },
      });

      if (data?.toggleDevotionalFeatured?.success) {
        setSuccess(data.toggleDevotionalFeatured.message);
        refetch();
      } else {
        setError(data?.toggleDevotionalFeatured?.message || "Failed to toggle featured status");
      }
    } catch (err: any) {
      setError(err.message || "Error toggling featured status");
    }
  };

  const handleTogglePublished = async (devotionalId: string) => {
    clearMessages();

    try {
      const { data } = await togglePublished({
        variables: { devotionalId },
      });

      if (data?.toggleDevotionalPublished?.success) {
        setSuccess(data.toggleDevotionalPublished.message);
        refetch();
      } else {
        setError(data?.toggleDevotionalPublished?.message || "Failed to toggle published status");
      }
    } catch (err: any) {
      setError(err.message || "Error toggling published status");
    }
  };

  const handleBulkToggleFeatured = async () => {
    if (selectedDevotionals.size === 0) return;
    clearMessages();

    try {
      for (const devotionalId of selectedDevotionals) {
        await toggleFeatured({ variables: { devotionalId } });
      }
      setSuccess(`Updated ${selectedDevotionals.size} devotional(s)`);
      setSelectedDevotionals(new Set());
      refetch();
    } catch (err: any) {
      setError(err.message || "Error in bulk operation");
    }
  };

  const handleBulkTogglePublished = async () => {
    if (selectedDevotionals.size === 0) return;
    clearMessages();

    try {
      for (const devotionalId of selectedDevotionals) {
        await togglePublished({ variables: { devotionalId } });
      }
      setSuccess(`Updated ${selectedDevotionals.size} devotional(s)`);
      setSelectedDevotionals(new Set());
      refetch();
    } catch (err: any) {
      setError(err.message || "Error in bulk operation");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDevotionals.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedDevotionals.size} devotional(s)?`)) return;

    clearMessages();

    try {
      for (const devotionalId of selectedDevotionals) {
        await deleteDevotional({ variables: { devotionalId } });
      }
      setSuccess(`Deleted ${selectedDevotionals.size} devotional(s)`);
      setSelectedDevotionals(new Set());
      refetch();
    } catch (err: any) {
      setError(err.message || "Error in bulk delete");
    }
  };

  const toggleDevotionalSelection = (devotionalId: string) => {
    const newSelection = new Set(selectedDevotionals);
    if (newSelection.has(devotionalId)) {
      newSelection.delete(devotionalId);
    } else {
      newSelection.add(devotionalId);
    }
    setSelectedDevotionals(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedDevotionals.size === filteredDevotionals.length) {
      setSelectedDevotionals(new Set());
    } else {
      setSelectedDevotionals(new Set(filteredDevotionals.map((d) => d.id)));
    }
  };

  const publishedCount = devotionals.filter((d) => d.isPublished).length;
  const featuredCount = devotionals.filter((d) => d.isFeatured).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Devotionals</h1>
            <p className="text-muted-foreground">Manage daily devotionals and inspirational content</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Devotional
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devotionals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publishedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Featured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{featuredCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devotionals.length - publishedCount}</div>
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
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search devotionals..."
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
                  value={publishedFilter}
                  onChange={(e) => setPublishedFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="published">Published Only</option>
                  <option value="unpublished">Drafts Only</option>
                </select>
              </div>

              <div>
                <Label>Featured</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value)}
                >
                  <option value="all">All Devotionals</option>
                  <option value="featured">Featured Only</option>
                  <option value="not-featured">Not Featured</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredDevotionals.length} of {devotionals.length} devotional(s)
              </p>

              {selectedDevotionals.size > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkToggleFeatured}>
                    <Star className="mr-2 h-4 w-4" />
                    Toggle Featured ({selectedDevotionals.size})
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkTogglePublished}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Toggle Published ({selectedDevotionals.size})
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedDevotionals.size})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Devotionals List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Devotionals ({filteredDevotionals.length})
              </CardTitle>
              {filteredDevotionals.length > 0 && (
                <Button size="sm" variant="ghost" onClick={toggleSelectAll}>
                  <Checkbox
                    checked={selectedDevotionals.size === filteredDevotionals.length}
                    className="mr-2"
                  />
                  Select All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Loading devotionals...</div>
            ) : filteredDevotionals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">No devotionals found</p>
                <p className="text-sm">
                  {searchQuery || publishedFilter !== "all" || featuredFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first devotional to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDevotionals.map((devotional) => (
                  <Card key={devotional.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={selectedDevotionals.has(devotional.id)}
                            onCheckedChange={() => toggleDevotionalSelection(devotional.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{devotional.title}</CardTitle>
                              <div className="flex gap-2">
                                {devotional.isPublished && (
                                  <Badge variant="default" className="bg-green-500">
                                    Published
                                  </Badge>
                                )}
                                {!devotional.isPublished && (
                                  <Badge variant="secondary">Draft</Badge>
                                )}
                                {devotional.isFeatured && (
                                  <Badge variant="default" className="bg-yellow-500">
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <CardDescription className="line-clamp-2">
                              {devotional.content}
                            </CardDescription>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                {devotional.author}
                              </span>
                              {devotional.scriptureReference && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-4 w-4" />
                                  {devotional.scriptureReference}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(devotional.publishDate), "MMM d, yyyy")}
                              </span>
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
                            <DropdownMenuItem
                              onClick={() => {
                                setCurrentDevotional(devotional);
                                setShowPreviewDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartEdit(devotional)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(devotional.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              {devotional.isFeatured ? "Unfeature" : "Feature"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePublished(devotional.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {devotional.isPublished ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(devotional.id, devotional.title)}
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Devotional</DialogTitle>
              <DialogDescription>Add a new devotional or inspirational content</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Devotional title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  placeholder="Author name"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="scripture">Scripture Reference</Label>
                <Input
                  id="scripture"
                  placeholder="e.g., John 3:16"
                  value={newScripture}
                  onChange={(e) => setNewScripture(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="content">Content * (Supports Markdown)</Label>
                <Textarea
                  id="content"
                  rows={10}
                  placeholder="Write your devotional content here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                />
              </div>

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
                <Label htmlFor="imageUrl">Featured Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="published"
                    checked={newIsPublished}
                    onCheckedChange={(checked) => setNewIsPublished(checked as boolean)}
                  />
                  <Label htmlFor="published">Publish immediately</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={newIsFeatured}
                    onCheckedChange={(checked) => setNewIsFeatured(checked as boolean)}
                  />
                  <Label htmlFor="featured">Mark as featured</Label>
                </div>
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
                  {creating ? "Creating..." : "Create Devotional"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Devotional</DialogTitle>
              <DialogDescription>Update devotional details</DialogDescription>
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
                <Label htmlFor="editAuthor">Author</Label>
                <Input
                  id="editAuthor"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="editScripture">Scripture Reference</Label>
                <Input
                  id="editScripture"
                  value={editScripture}
                  onChange={(e) => setEditScripture(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="editContent">Content (Supports Markdown)</Label>
                <Textarea
                  id="editContent"
                  rows={10}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </div>

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
                <Label htmlFor="editImageUrl">Featured Image URL</Label>
                <Input
                  id="editImageUrl"
                  type="url"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editPublished"
                    checked={editIsPublished}
                    onCheckedChange={(checked) => setEditIsPublished(checked as boolean)}
                  />
                  <Label htmlFor="editPublished">Published</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editFeatured"
                    checked={editIsFeatured}
                    onCheckedChange={(checked) => setEditIsFeatured(checked as boolean)}
                  />
                  <Label htmlFor="editFeatured">Featured</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? "Updating..." : "Update Devotional"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentDevotional?.title}</DialogTitle>
              <DialogDescription>
                By {currentDevotional?.author} •{" "}
                {currentDevotional?.publishDate &&
                  format(new Date(currentDevotional.publishDate), "MMMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            {currentDevotional && (
              <div className="space-y-4">
                {currentDevotional.scriptureReference && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {currentDevotional.scriptureReference}
                    </p>
                  </div>
                )}
                {currentDevotional.featuredImageUrl && (
                  <img
                    src={currentDevotional.featuredImageUrl}
                    alt={currentDevotional.title}
                    className="w-full rounded-lg"
                  />
                )}
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{currentDevotional.content}</p>
                </div>
                <div className="flex gap-2">
                  {currentDevotional.isPublished && (
                    <Badge variant="default" className="bg-green-500">
                      Published
                    </Badge>
                  )}
                  {currentDevotional.isFeatured && (
                    <Badge variant="default" className="bg-yellow-500">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default function DevotionalsManagementPage() {
  return (
    <AdminProtectedRoute>
      <DevotionalsManagementPageContent />
    </AdminProtectedRoute>
  );
}
