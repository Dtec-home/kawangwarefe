"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ALL_EVENTS } from "@/lib/graphql/event-queries";
import {
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  TOGGLE_EVENT_ACTIVE,
} from "@/lib/graphql/event-mutations";
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
  Eye,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Link2,
} from "lucide-react";
import { format, isPast, isFuture, parseISO } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  location: string;
  registrationLink: string;
  isActive: boolean;
  featuredImageUrl: string;
  createdAt: string;
  updatedAt: string;
}

function EventsManagementPageContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newRegistrationLink, setNewRegistrationLink] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventTime, setEditEventTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editRegistrationLink, setEditRegistrationLink] = useState("");
  const [editIsActive, setEditIsActive] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState("");

  const { data, loading, refetch } = useQuery(GET_ALL_EVENTS, {
    variables: { limit: 1000 },
  });

  const [createEvent, { loading: creating }] = useMutation(CREATE_EVENT);
  const [updateEvent, { loading: updating }] = useMutation(UPDATE_EVENT);
  const [deleteEvent, { loading: deleting }] = useMutation(DELETE_EVENT);
  const [toggleActive] = useMutation(TOGGLE_EVENT_ACTIVE);

  const events: Event[] = data?.events || [];

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchQuery === "" ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    const eventDate = parseISO(event.eventDate);
    const matchesTime =
      timeFilter === "all" ||
      (timeFilter === "upcoming" && isFuture(eventDate)) ||
      (timeFilter === "past" && isPast(eventDate));

    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "active" && event.isActive) ||
      (activeFilter === "inactive" && !event.isActive);

    return matchesSearch && matchesTime && matchesActive;
  });

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const resetCreateForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewEventDate("");
    setNewEventTime("");
    setNewLocation("");
    setNewRegistrationLink("");
    setNewIsActive(true);
    setNewImageUrl("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newTitle.trim() || !newDescription.trim() || !newEventDate || !newEventTime || !newLocation.trim()) {
      setError("Title, description, date, time, and location are required");
      return;
    }

    try {
      const { data } = await createEvent({
        variables: {
          title: newTitle.trim(),
          description: newDescription.trim(),
          eventDate: newEventDate,
          eventTime: newEventTime,
          location: newLocation.trim(),
          registrationLink: newRegistrationLink.trim() || undefined,
          isActive: newIsActive,
          featuredImageUrl: newImageUrl.trim() || undefined,
        },
      });

      if (data?.createEvent?.success) {
        setSuccess(data.createEvent.message);
        resetCreateForm();
        setShowCreateDialog(false);
        refetch();
      } else {
        setError(data?.createEvent?.message || "Failed to create event");
      }
    } catch (err: any) {
      setError(err.message || "Error creating event");
    }
  };

  const handleStartEdit = (event: Event) => {
    setCurrentEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description);
    setEditEventDate(event.eventDate);
    setEditEventTime(event.eventTime);
    setEditLocation(event.location);
    setEditRegistrationLink(event.registrationLink);
    setEditIsActive(event.isActive);
    setEditImageUrl(event.featuredImageUrl);
    setShowEditDialog(true);
    clearMessages();
  };

  const handleUpdate = async () => {
    if (!currentEvent) return;
    clearMessages();

    try {
      const { data } = await updateEvent({
        variables: {
          eventId: currentEvent.id,
          title: editTitle.trim() || undefined,
          description: editDescription.trim() || undefined,
          eventDate: editEventDate || undefined,
          eventTime: editEventTime || undefined,
          location: editLocation.trim() || undefined,
          registrationLink: editRegistrationLink.trim() || undefined,
          isActive: editIsActive,
          featuredImageUrl: editImageUrl.trim() || undefined,
        },
      });

      if (data?.updateEvent?.success) {
        setSuccess(data.updateEvent.message);
        setShowEditDialog(false);
        refetch();
      } else {
        setError(data?.updateEvent?.message || "Failed to update event");
      }
    } catch (err: any) {
      setError(err.message || "Error updating event");
    }
  };

  const handleDelete = async (eventId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    clearMessages();

    try {
      const { data } = await deleteEvent({
        variables: { eventId },
      });

      if (data?.deleteEvent?.success) {
        setSuccess(data.deleteEvent.message);
        refetch();
      } else {
        setError(data?.deleteEvent?.message || "Failed to delete event");
      }
    } catch (err: any) {
      setError(err.message || "Error deleting event");
    }
  };

  const handleToggleActive = async (eventId: string) => {
    clearMessages();

    try {
      const { data } = await toggleActive({
        variables: { eventId },
      });

      if (data?.toggleEventActive?.success) {
        setSuccess(data.toggleEventActive.message);
        refetch();
      } else {
        setError(data?.toggleEventActive?.message || "Failed to toggle active status");
      }
    } catch (err: any) {
      setError(err.message || "Error toggling active status");
    }
  };

  const handleBulkToggleActive = async () => {
    if (selectedEvents.size === 0) return;
    clearMessages();

    try {
      for (const eventId of selectedEvents) {
        await toggleActive({ variables: { eventId } });
      }
      setSuccess(`Updated ${selectedEvents.size} event(s)`);
      setSelectedEvents(new Set());
      refetch();
    } catch (err: any) {
      setError(err.message || "Error in bulk operation");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEvents.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedEvents.size} event(s)?`)) return;

    clearMessages();

    try {
      for (const eventId of selectedEvents) {
        await deleteEvent({ variables: { eventId } });
      }
      setSuccess(`Deleted ${selectedEvents.size} event(s)`);
      setSelectedEvents(new Set());
      refetch();
    } catch (err: any) {
      setError(err.message || "Error in bulk delete");
    }
  };

  const toggleEventSelection = (eventId: string) => {
    const newSelection = new Set(selectedEvents);
    if (newSelection.has(eventId)) {
      newSelection.delete(eventId);
    } else {
      newSelection.add(eventId);
    }
    setSelectedEvents(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  const activeCount = events.filter((e) => e.isActive).length;
  const upcomingCount = events.filter((e) => isFuture(parseISO(e.eventDate))).length;
  const pastCount = events.filter((e) => isPast(parseISO(e.eventDate))).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">Manage church events and gatherings</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Past Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pastCount}</div>
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
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label>Time</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming Only</option>
                  <option value="past">Past Only</option>
                </select>
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
                Showing {filteredEvents.length} of {events.length} event(s)
              </p>

              {selectedEvents.size > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleBulkToggleActive}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Toggle Active ({selectedEvents.size})
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete ({selectedEvents.size})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Events ({filteredEvents.length})
              </CardTitle>
              {filteredEvents.length > 0 && (
                <Button size="sm" variant="ghost" onClick={toggleSelectAll}>
                  <Checkbox
                    checked={selectedEvents.size === filteredEvents.length}
                    className="mr-2"
                  />
                  Select All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Loading events...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium mb-2">No events found</p>
                <p className="text-sm">
                  {searchQuery || timeFilter !== "all" || activeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first event to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => {
                  const eventDate = parseISO(event.eventDate);
                  const isUpcoming = isFuture(eventDate);

                  return (
                    <Card key={event.id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <Checkbox
                              checked={selectedEvents.has(event.id)}
                              onCheckedChange={() => toggleEventSelection(event.id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">{event.title}</CardTitle>
                                <div className="flex gap-2">
                                  {event.isActive && (
                                    <Badge variant="default" className="bg-green-500">
                                      Active
                                    </Badge>
                                  )}
                                  {!event.isActive && <Badge variant="secondary">Inactive</Badge>}
                                  {isUpcoming && (
                                    <Badge variant="default" className="bg-blue-500">
                                      Upcoming
                                    </Badge>
                                  )}
                                  {!isUpcoming && (
                                    <Badge variant="outline">Past Event</Badge>
                                  )}
                                </div>
                              </div>
                              <CardDescription className="line-clamp-2 mb-3">
                                {event.description}
                              </CardDescription>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  {format(eventDate, "MMM d, yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {event.eventTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </span>
                                {event.registrationLink && (
                                  <a
                                    href={event.registrationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-blue-600 hover:underline"
                                  >
                                    <Link2 className="h-4 w-4" />
                                    Register
                                  </a>
                                )}
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
                                  setCurrentEvent(event);
                                  setShowPreviewDialog(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStartEdit(event)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(event.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {event.isActive ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                              {event.registrationLink && (
                                <DropdownMenuItem
                                  onClick={() => window.open(event.registrationLink, "_blank")}
                                >
                                  <Link2 className="h-4 w-4 mr-2" />
                                  Open Registration
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(event.id, event.title)}
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
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>Add a new church event or gathering</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Event title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Event description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="eventDate">Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="eventTime">Time *</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="Event venue/location"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="registrationLink">Registration Link</Label>
                <Input
                  id="registrationLink"
                  type="url"
                  placeholder="https://example.com/register"
                  value={newRegistrationLink}
                  onChange={(e) => setNewRegistrationLink(e.target.value)}
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={newIsActive}
                  onCheckedChange={(checked) => setNewIsActive(checked as boolean)}
                />
                <Label htmlFor="active">Event is active</Label>
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
                  {creating ? "Creating..." : "Create Event"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>Update event details</DialogDescription>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="editEventDate">Date</Label>
                  <Input
                    id="editEventDate"
                    type="date"
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="editEventTime">Time</Label>
                  <Input
                    id="editEventTime"
                    type="time"
                    value={editEventTime}
                    onChange={(e) => setEditEventTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editLocation">Location</Label>
                <Input
                  id="editLocation"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="editRegistrationLink">Registration Link</Label>
                <Input
                  id="editRegistrationLink"
                  type="url"
                  value={editRegistrationLink}
                  onChange={(e) => setEditRegistrationLink(e.target.value)}
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editActive"
                  checked={editIsActive}
                  onCheckedChange={(checked) => setEditIsActive(checked as boolean)}
                />
                <Label htmlFor="editActive">Event is active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? "Updating..." : "Update Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentEvent?.title}</DialogTitle>
              <DialogDescription>
                {currentEvent?.eventDate &&
                  format(parseISO(currentEvent.eventDate), "EEEE, MMMM d, yyyy")} at{" "}
                {currentEvent?.eventTime}
              </DialogDescription>
            </DialogHeader>
            {currentEvent && (
              <div className="space-y-4">
                {currentEvent.featuredImageUrl && (
                  <img
                    src={currentEvent.featuredImageUrl}
                    alt={currentEvent.title}
                    className="w-full rounded-lg"
                  />
                )}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{currentEvent.location}</span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{currentEvent.description}</p>
                  </div>
                  {currentEvent.registrationLink && (
                    <div className="pt-2">
                      <a
                        href={currentEvent.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Link2 className="h-4 w-4" />
                        Registration Link
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {currentEvent.isActive && (
                      <Badge variant="default" className="bg-green-500">
                        Active
                      </Badge>
                    )}
                    {isFuture(parseISO(currentEvent.eventDate)) && (
                      <Badge variant="default" className="bg-blue-500">
                        Upcoming
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default function EventsManagementPage() {
  return (
    <AdminProtectedRoute>
      <EventsManagementPageContent />
    </AdminProtectedRoute>
  );
}
