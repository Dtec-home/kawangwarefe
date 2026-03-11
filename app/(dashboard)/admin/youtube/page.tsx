"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ALL_YOUTUBE_VIDEOS } from "@/lib/graphql/youtube-queries";
import {
  CREATE_YOUTUBE_VIDEO,
  UPDATE_YOUTUBE_VIDEO,
  DELETE_YOUTUBE_VIDEO,
  TOGGLE_VIDEO_FEATURED,
  SYNC_YOUTUBE_CHANNEL,
  SYNC_YOUTUBE_PLAYLIST,
} from "@/lib/graphql/youtube-mutations";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Play,
  Eye,
  ThumbsUp,
  Clock,
  RefreshCw,
  Download,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Youtube,
  List,
} from "lucide-react";
import { format } from "date-fns";

interface YoutubeVideo {
  id: string;
  title: string;
  videoId: string;
  description: string;
  category: string;
  isFeatured: boolean;
  source: string;
  channelId: string;
  playlistId: string;
  publishDate: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  embedUrl: string;
  watchUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  lastSyncedAt?: string;
  youtubePublishedAt?: string;
}

const CATEGORIES = [
  { value: "sermon", label: "Sermon" },
  { value: "worship", label: "Worship" },
  { value: "testimony", label: "Testimony" },
  { value: "teaching", label: "Teaching" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

const SOURCES = [
  { value: "all", label: "All Sources" },
  { value: "manual", label: "Manual Entry" },
  { value: "channel", label: "YouTube Channel" },
  { value: "playlist", label: "YouTube Playlist" },
];

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function YouTubeManagementPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<YoutubeVideo | null>(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Create form state
  const [newVideoId, setNewVideoId] = useState("");
  const [newCategory, setNewCategory] = useState("sermon");
  const [newIsFeatured, setNewIsFeatured] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editIsFeatured, setEditIsFeatured] = useState(false);

  // Sync form state
  const [syncType, setSyncType] = useState<"channel" | "playlist">("channel");
  const [syncPlaylistId, setSyncPlaylistId] = useState("");
  const [syncMaxResults, setSyncMaxResults] = useState(50);
  const [syncCategory, setSyncCategory] = useState("sermon");

  const { data, loading, refetch } = useQuery(GET_ALL_YOUTUBE_VIDEOS, {
    variables: { limit: 1000 },
  });

  const [createVideo, { loading: creating }] = useMutation(CREATE_YOUTUBE_VIDEO);
  const [updateVideo, { loading: updating }] = useMutation(UPDATE_YOUTUBE_VIDEO);
  const [deleteVideo, { loading: deleting }] = useMutation(DELETE_YOUTUBE_VIDEO);
  const [toggleFeatured] = useMutation(TOGGLE_VIDEO_FEATURED);
  const [syncChannel, { loading: syncingChannel }] = useMutation(SYNC_YOUTUBE_CHANNEL);
  const [syncPlaylist, { loading: syncingPlaylist }] = useMutation(SYNC_YOUTUBE_PLAYLIST);

  const videos: YoutubeVideo[] = data?.youtubeVideos || [];

  // Filter videos
  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      searchQuery === "" ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || video.category === categoryFilter;
    const matchesSource = sourceFilter === "all" || video.source === sourceFilter;
    const matchesFeatured =
      featuredFilter === "all" ||
      (featuredFilter === "featured" && video.isFeatured) ||
      (featuredFilter === "not-featured" && !video.isFeatured);

    return matchesSearch && matchesCategory && matchesSource && matchesFeatured;
  });

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newVideoId.trim()) {
      setError("Video ID is required");
      return;
    }

    try {
      const { data } = await createVideo({
        variables: {
          videoId: newVideoId.trim(),
          category: newCategory,
          isFeatured: newIsFeatured,
        },
      });

      if (data?.createYoutubeVideo?.success) {
        setSuccess(data.createYoutubeVideo.message);
        setNewVideoId("");
        setNewCategory("sermon");
        setNewIsFeatured(false);
        setShowCreateDialog(false);
        refetch();
      } else {
        setError(data?.createYoutubeVideo?.message || "Failed to create video");
      }
    } catch (err: any) {
      setError(err.message || "Error creating video");
    }
  };

  const handleStartEdit = (video: YoutubeVideo) => {
    setCurrentVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description);
    setEditCategory(video.category);
    setEditIsFeatured(video.isFeatured);
    setShowEditDialog(true);
    clearMessages();
  };

  const handleUpdate = async () => {
    if (!currentVideo) return;
    clearMessages();

    try {
      const { data } = await updateVideo({
        variables: {
          videoId: currentVideo.id,
          title: editTitle.trim() || undefined,
          description: editDescription.trim() || undefined,
          category: editCategory || undefined,
          isFeatured: editIsFeatured,
        },
      });

      if (data?.updateYoutubeVideo?.success) {
        setSuccess(data.updateYoutubeVideo.message);
        setShowEditDialog(false);
        refetch();
      } else {
        setError(data?.updateYoutubeVideo?.message || "Failed to update video");
      }
    } catch (err: any) {
      setError(err.message || "Error updating video");
    }
  };

  const handleDelete = async (videoId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    clearMessages();

    try {
      const { data } = await deleteVideo({
        variables: { videoId },
      });

      if (data?.deleteYoutubeVideo?.success) {
        setSuccess(data.deleteYoutubeVideo.message);
        refetch();
      } else {
        setError(data?.deleteYoutubeVideo?.message || "Failed to delete video");
      }
    } catch (err: any) {
      setError(err.message || "Error deleting video");
    }
  };

  const handleToggleFeatured = async (videoId: string) => {
    clearMessages();

    try {
      const { data } = await toggleFeatured({
        variables: { videoId },
      });

      if (data?.toggleVideoFeatured?.success) {
        setSuccess(data.toggleVideoFeatured.message);
        refetch();
      } else {
        setError(data?.toggleVideoFeatured?.message || "Failed to toggle featured status");
      }
    } catch (err: any) {
      setError(err.message || "Error toggling featured status");
    }
  };

  const handleSync = async () => {
    clearMessages();

    try {
      if (syncType === "channel") {
        const { data } = await syncChannel({
          variables: {
            maxResults: syncMaxResults,
            category: syncCategory,
          },
        });

        if (data?.syncYoutubeChannel?.success) {
          setSuccess(
            `Channel sync completed: ${data.syncYoutubeChannel.videosCreated} created, ` +
            `${data.syncYoutubeChannel.videosUpdated} updated, ` +
            `${data.syncYoutubeChannel.videosFailed} failed`
          );
          setShowSyncDialog(false);
          refetch();
        } else {
          setError(data?.syncYoutubeChannel?.message || "Failed to sync channel");
        }
      } else {
        if (!syncPlaylistId.trim()) {
          setError("Playlist ID is required");
          return;
        }

        const { data } = await syncPlaylist({
          variables: {
            playlistId: syncPlaylistId.trim(),
            maxResults: syncMaxResults,
            category: syncCategory,
          },
        });

        if (data?.syncYoutubePlaylist?.success) {
          setSuccess(
            `Playlist sync completed: ${data.syncYoutubePlaylist.videosCreated} created, ` +
            `${data.syncYoutubePlaylist.videosUpdated} updated, ` +
            `${data.syncYoutubePlaylist.videosFailed} failed`
          );
          setShowSyncDialog(false);
          setSyncPlaylistId("");
          refetch();
        } else {
          setError(data?.syncYoutubePlaylist?.message || "Failed to sync playlist");
        }
      }
    } catch (err: any) {
      setError(err.message || "Error syncing videos");
    }
  };

  const handleBulkToggleFeatured = async () => {
    if (selectedVideos.size === 0) return;
    clearMessages();

    try {
      for (const videoId of selectedVideos) {
        await toggleFeatured({ variables: { videoId } });
      }
      setSuccess(`Updated ${selectedVideos.size} video(s)`);
      setSelectedVideos(new Set());
      refetch();
    } catch (err: any) {
      setError(err.message || "Error in bulk operation");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVideos.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedVideos.size} video(s)?`)) return;

    clearMessages();

    try {
      for (const videoId of selectedVideos) {
        await deleteVideo({ variables: { videoId } });
      }
      setSuccess(`Deleted ${selectedVideos.size} video(s)`);
      setSelectedVideos(new Set());
      refetch();
    } catch (err: any) {
      setError(err.message || "Error in bulk delete");
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideos);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideos(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map((v) => v.id)));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">YouTube Videos</h1>
            <p className="text-muted-foreground">Manage church YouTube content</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowSyncDialog(true)} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync from YouTube
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Video
            </Button>
          </div>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Source</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Featured</Label>
                <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Videos</SelectItem>
                    <SelectItem value="featured">Featured Only</SelectItem>
                    <SelectItem value="not-featured">Not Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredVideos.length} of {videos.length} video(s)
              </p>

              {selectedVideos.size > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkToggleFeatured}>
                    <Star className="mr-2 h-4 w-4" />
                    Toggle Featured ({selectedVideos.size})
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedVideos.size})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Youtube className="h-5 w-5" />
                Videos ({filteredVideos.length})
              </CardTitle>
              {filteredVideos.length > 0 && (
                <Button size="sm" variant="ghost" onClick={toggleSelectAll}>
                  <Checkbox
                    checked={selectedVideos.size === filteredVideos.length}
                    className="mr-2"
                  />
                  Select All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Loading videos...</div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Youtube className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">No videos found</p>
                <p className="text-sm">
                  {searchQuery || categoryFilter !== "all" || sourceFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Add your first video or sync from YouTube"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredVideos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 left-2 flex gap-2">
                        <Checkbox
                          checked={selectedVideos.has(video.id)}
                          onCheckedChange={() => toggleVideoSelection(video.id)}
                          className="bg-white"
                        />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2">
                        {video.isFeatured && (
                          <Badge variant="default" className="bg-yellow-500">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        <Badge variant="secondary">{video.category}</Badge>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="default" className="bg-black/70">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(video.duration)}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {video.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {video.viewCount?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {video.likeCount?.toLocaleString() || 0}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {video.source}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setCurrentVideo(video);
                            setShowPreviewDialog(true);
                          }}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Preview
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStartEdit(video)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(video.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              {video.isFeatured ? "Unfeature" : "Feature"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(video.watchUrl, "_blank")}
                            >
                              <Youtube className="h-4 w-4 mr-2" />
                              Watch on YouTube
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(video.id, video.title)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add YouTube Video</DialogTitle>
              <DialogDescription>
                Enter a YouTube video ID to add it to your collection
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="videoId">YouTube Video ID *</Label>
                <Input
                  id="videoId"
                  placeholder="e.g., dQw4w9WgXcQ"
                  value={newVideoId}
                  onChange={(e) => setNewVideoId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  From URL: youtube.com/watch?v=<strong>VIDEO_ID</strong>
                </p>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={newIsFeatured}
                  onCheckedChange={(checked) => setNewIsFeatured(checked as boolean)}
                />
                <Label htmlFor="featured">Mark as featured</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Video"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Video</DialogTitle>
              <DialogDescription>Update video metadata and settings</DialogDescription>
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
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="editCategory">Category</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editFeatured"
                  checked={editIsFeatured}
                  onCheckedChange={(checked) => setEditIsFeatured(checked as boolean)}
                />
                <Label htmlFor="editFeatured">Mark as featured</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? "Updating..." : "Update Video"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{currentVideo?.title}</DialogTitle>
            </DialogHeader>
            {currentVideo && (
              <div className="space-y-4">
                <div className="aspect-video">
                  <iframe
                    src={currentVideo.embedUrl}
                    className="w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Views</p>
                    <p className="font-medium">{currentVideo.viewCount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Likes</p>
                    <p className="font-medium">{currentVideo.likeCount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">{formatDuration(currentVideo.duration)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{currentVideo.description}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Sync Dialog */}
        <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sync from YouTube</DialogTitle>
              <DialogDescription>
                Fetch videos from your YouTube channel or playlist
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Sync From</Label>
                <Select value={syncType} onValueChange={(v) => setSyncType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channel">YouTube Channel</SelectItem>
                    <SelectItem value="playlist">YouTube Playlist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {syncType === "playlist" && (
                <div>
                  <Label htmlFor="playlistId">Playlist ID *</Label>
                  <Input
                    id="playlistId"
                    placeholder="PLxxxxxxxxxxxxxxxx"
                    value={syncPlaylistId}
                    onChange={(e) => setSyncPlaylistId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    From URL: youtube.com/playlist?list=<strong>PLAYLIST_ID</strong>
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="maxResults">Max Videos</Label>
                <Input
                  id="maxResults"
                  type="number"
                  min="1"
                  max="50"
                  value={syncMaxResults}
                  onChange={(e) => setSyncMaxResults(parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="syncCategory">Default Category</Label>
                <Select value={syncCategory} onValueChange={setSyncCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSyncDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSync}
                disabled={syncingChannel || syncingPlaylist}
              >
                {syncingChannel || syncingPlaylist ? "Syncing..." : "Start Sync"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default function YouTubeManagementPage() {
  return (
    <AdminProtectedRoute>
      <YouTubeManagementPageContent />
    </AdminProtectedRoute>
  );
}
