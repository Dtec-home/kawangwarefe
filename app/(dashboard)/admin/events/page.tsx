"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { GET_ALL_EVENTS, EVENT_GIVING_SUMMARY, EVENT_REGISTRATIONS } from "@/lib/graphql/event-queries";
import {
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  TOGGLE_EVENT_ACTIVE,
  REORDER_EVENTS,
  CANCEL_REGISTRATION,
} from "@/lib/graphql/event-mutations";
import { GET_ALL_CATEGORIES } from "@/lib/graphql/category-mutations";
import { GET_DEPARTMENT_PURPOSES } from "@/lib/graphql/queries";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { SortableList } from "@/components/ui/sortable-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ArrowUp,
  ArrowDown,
  GripVertical,
  Users,
  Wallet,
  Download,
} from "lucide-react";
import { format, isPast, isFuture, parseISO } from "date-fns";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface DepartmentPurpose {
  id: string;
  name: string;
  code: string;
  description: string;
}

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
  isPayable?: boolean;
  category?: { id: string; name: string } | null;
  purpose?: { id: string; name: string } | null;
  suggestedAmount?: string | null;
  displayOrder?: number;
  requiresRegistration?: boolean;
  registrationCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface EventMutationResponse {
  success: boolean;
  message: string;
  event?: Event;
}

interface EventRegistration {
  id: string;
  guestName: string;
  guestPhone?: string | null;
  status: string;
  registeredAt: string;
  member?: { id: string; fullName: string } | null;
}

const NONE_VALUE = "__none__";

function EventsManagementPageContent() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showGivingDialog, setShowGivingDialog] = useState(false);
  const [showRegistrationsDialog, setShowRegistrationsDialog] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newRegistrationLink, setNewRegistrationLink] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newPurposeId, setNewPurposeId] = useState("");
  const [newSuggestedAmount, setNewSuggestedAmount] = useState("");
  const [newRequiresRegistration, setNewRequiresRegistration] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventTime, setEditEventTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editRegistrationLink, setEditRegistrationLink] = useState("");
  const [editIsActive, setEditIsActive] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editPurposeId, setEditPurposeId] = useState("");
  const [editSuggestedAmount, setEditSuggestedAmount] = useState("");
  const [editRequiresRegistration, setEditRequiresRegistration] = useState(false);

  const { data, loading, refetch } = useQuery<{ events: Event[] }>(GET_ALL_EVENTS, {
    variables: { limit: 1000 },
  });

  const { data: categoriesData } = useQuery<{ contributionCategories: Category[] }>(
    GET_ALL_CATEGORIES,
    { variables: { includeInactive: false } }
  );

  const { data: newPurposesData } = useQuery<{ departmentPurposes: DepartmentPurpose[] }>(
    GET_DEPARTMENT_PURPOSES,
    {
      variables: { categoryId: newCategoryId, isActive: true },
      skip: !newCategoryId,
    }
  );

  const { data: editPurposesData } = useQuery<{ departmentPurposes: DepartmentPurpose[] }>(
    GET_DEPARTMENT_PURPOSES,
    {
      variables: { categoryId: editCategoryId, isActive: true },
      skip: !editCategoryId,
    }
  );

  const [createEvent, { loading: creating }] = useMutation<{ createEvent: EventMutationResponse }>(CREATE_EVENT);
  const [updateEvent, { loading: updating }] = useMutation<{ updateEvent: EventMutationResponse }>(UPDATE_EVENT);
  const [deleteEvent] = useMutation<{ deleteEvent: EventMutationResponse }>(DELETE_EVENT);
  const [toggleActive] = useMutation<{ toggleEventActive: EventMutationResponse }>(TOGGLE_EVENT_ACTIVE);
  const [reorderEvents] = useMutation<{ reorderEvents: { success: boolean; message: string } }>(REORDER_EVENTS);

  const events: Event[] = data?.events || [];
  const categories: Category[] = categoriesData?.contributionCategories || [];

  // Optimistic local ordering applied on top of the server result.
  const [orderOverride, setOrderOverride] = useState<string[] | null>(null);
  const serverIdsKey = events.map((e) => e.id).join(",");
  useEffect(() => {
    setOrderOverride(null);
  }, [serverIdsKey]);

  const orderedEvents: Event[] = orderOverride
    ? (orderOverride
        .map((id) => events.find((e) => e.id === id))
        .filter(Boolean) as Event[])
    : events;

  // Filter events
  const filteredEvents = orderedEvents.filter((event) => {
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

  const resetCreateForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewEventDate("");
    setNewEventTime("");
    setNewLocation("");
    setNewRegistrationLink("");
    setNewIsActive(true);
    setNewImageUrl("");
    setNewCategoryId("");
    setNewPurposeId("");
    setNewSuggestedAmount("");
    setNewRequiresRegistration(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim() || !newDescription.trim() || !newEventDate || !newEventTime || !newLocation.trim()) {
      toast.error("Title, description, date, time, and location are required");
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
          categoryId: newCategoryId || undefined,
          purposeId: newPurposeId || undefined,
          suggestedAmount: newSuggestedAmount.trim() || undefined,
          requiresRegistration: newRequiresRegistration,
        },
      });

      if (data?.createEvent?.success) {
        toast.success(data.createEvent.message || "Event created");
        resetCreateForm();
        setShowCreateDialog(false);
        refetch();
      } else {
        toast.error(data?.createEvent?.message || "Failed to create event");
      }
    } catch (err: any) {
      toast.error(err.message || "Error creating event");
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
    setEditCategoryId(event.category?.id || "");
    setEditPurposeId(event.purpose?.id || "");
    setEditSuggestedAmount(event.suggestedAmount || "");
    setEditRequiresRegistration(!!event.requiresRegistration);
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!currentEvent) return;

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
          categoryId: editCategoryId || null,
          purposeId: editPurposeId || null,
          suggestedAmount: editSuggestedAmount.trim() || null,
          requiresRegistration: editRequiresRegistration,
        },
      });

      if (data?.updateEvent?.success) {
        toast.success(data.updateEvent.message || "Event updated");
        setShowEditDialog(false);
        refetch();
      } else {
        toast.error(data?.updateEvent?.message || "Failed to update event");
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating event");
    }
  };

  const handleDelete = async (eventId: string, title: string) => {
    const confirmed = await confirm({
      title: "Delete Event",
      description: `Are you sure you want to delete "${title}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      const { data } = await deleteEvent({
        variables: { eventId },
      });

      if (data?.deleteEvent?.success) {
        toast.success(data.deleteEvent.message || "Event deleted");
        refetch();
      } else {
        toast.error(data?.deleteEvent?.message || "Failed to delete event");
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting event");
    }
  };

  const handleToggleActive = async (eventId: string) => {
    try {
      const { data } = await toggleActive({
        variables: { eventId },
      });

      if (data?.toggleEventActive?.success) {
        toast.success(data.toggleEventActive.message || "Status updated");
        refetch();
      } else {
        toast.error(data?.toggleEventActive?.message || "Failed to toggle active status");
      }
    } catch (err: any) {
      toast.error(err.message || "Error toggling active status");
    }
  };

  const handleBulkToggleActive = async () => {
    if (selectedEvents.size === 0) return;

    try {
      for (const eventId of selectedEvents) {
        await toggleActive({ variables: { eventId } });
      }
      toast.success(`Updated ${selectedEvents.size} event(s)`);
      setSelectedEvents(new Set());
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Error in bulk operation");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEvents.size === 0) return;
    const confirmed = await confirm({
      title: "Delete Events",
      description: `Are you sure you want to delete ${selectedEvents.size} event(s)? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      for (const eventId of selectedEvents) {
        await deleteEvent({ variables: { eventId } });
      }
      toast.success(`Deleted ${selectedEvents.size} event(s)`);
      setSelectedEvents(new Set());
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Error in bulk delete");
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

  // Persist a new ordering (from drag-drop or keyboard move). Optimistically
  // applies locally, then calls the backend reorder mutation.
  const persistOrder = async (newOrderedIds: string[]) => {
    setOrderOverride(newOrderedIds);
    try {
      const { data } = await reorderEvents({
        variables: { ids: newOrderedIds },
      });
      if (data?.reorderEvents?.success) {
        toast.success(data.reorderEvents.message || "Order updated");
        refetch();
      } else {
        toast.error(data?.reorderEvents?.message || "Failed to reorder events");
        setOrderOverride(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Error reordering events");
      setOrderOverride(null);
    }
  };

  // Keyboard-accessible fallback: move a row up/down by one position.
  const moveEvent = (eventId: string, direction: "up" | "down") => {
    const ids = filteredEvents.map((e) => e.id);
    const idx = ids.indexOf(eventId);
    if (idx === -1) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[idx], next[target]] = [next[target], next[idx]];
    persistOrder(next);
  };

  const activeCount = events.filter((e) => e.isActive).length;
  const upcomingCount = events.filter((e) => isFuture(parseISO(e.eventDate))).length;
  const pastCount = events.filter((e) => isPast(parseISO(e.eventDate))).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Events"
          description="Manage church events and gatherings"
          actions={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          }
        />

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

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredEvents.length} of {events.length} event(s)
              </p>

              {selectedEvents.size > 0 && (
                <div className="flex flex-wrap gap-2">
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
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <Empty
                icon={CalendarIcon}
                title="No events found"
                description={
                  searchQuery || timeFilter !== "all" || activeFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first event to get started"
                }
              />
            ) : (
              <SortableList
                items={filteredEvents}
                onReorder={persistOrder}
                className="space-y-4"
                renderItem={(event, index, handle) => {
                  const eventDate = parseISO(event.eventDate);
                  const isUpcoming = isFuture(eventDate);

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
                              aria-label={`Drag to reorder "${event.title}"`}
                              title="Drag to reorder"
                              className="mt-0.5 cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <Checkbox
                              checked={selectedEvents.has(event.id)}
                              onCheckedChange={() => toggleEventSelection(event.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <CardTitle className="text-lg break-words">{event.title}</CardTitle>
                                <div className="flex flex-wrap gap-2">
                                  {event.isActive ? (
                                    <StatusBadge variant="success">Active</StatusBadge>
                                  ) : (
                                    <StatusBadge variant="neutral">Inactive</StatusBadge>
                                  )}
                                  {isUpcoming ? (
                                    <StatusBadge variant="info">Upcoming</StatusBadge>
                                  ) : (
                                    <StatusBadge variant="neutral">Past Event</StatusBadge>
                                  )}
                                  {event.isPayable && (
                                    <StatusBadge variant="success">Payable</StatusBadge>
                                  )}
                                  {event.requiresRegistration && (
                                    <StatusBadge variant="info">
                                      <Users className="h-3 w-3" />
                                      {event.registrationCount ?? 0} registered
                                    </StatusBadge>
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
                                    className="flex items-center gap-1 text-info hover:underline"
                                  >
                                    <Link2 className="h-4 w-4" />
                                    Register
                                  </a>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-3 mt-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">Order:</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={index === 0}
                                    onClick={() => moveEvent(event.id, "up")}
                                    aria-label={`Move "${event.title}" up`}
                                    title="Move up (keyboard fallback)"
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={index === filteredEvents.length - 1}
                                    onClick={() => moveEvent(event.id, "down")}
                                    aria-label={`Move "${event.title}" down`}
                                    title="Move down (keyboard fallback)"
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                </div>
                                {event.isPayable && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setCurrentEvent(event);
                                      setShowGivingDialog(true);
                                    }}
                                  >
                                    <Wallet className="mr-2 h-4 w-4" />
                                    Giving Summary
                                  </Button>
                                )}
                                {event.requiresRegistration && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setCurrentEvent(event);
                                      setShowRegistrationsDialog(true);
                                    }}
                                  >
                                    <Users className="mr-2 h-4 w-4" />
                                    Registrations
                                  </Button>
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
                }}
              />
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

              <div className="rounded-lg border p-4 space-y-4">
                <p className="text-sm font-medium">Giving (optional)</p>
                <p className="text-xs text-muted-foreground">
                  Set a department and purpose to make this event payable. The
                  public event card will show a &quot;Give to this event&quot; button.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newCategory">Department</Label>
                    <Select
                      value={newCategoryId || NONE_VALUE}
                      onValueChange={(val) => {
                        setNewCategoryId(val === NONE_VALUE ? "" : val);
                        setNewPurposeId("");
                      }}
                    >
                      <SelectTrigger id="newCategory">
                        <SelectValue placeholder="No department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>No department</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newCategoryId && (
                    <div className="space-y-2">
                      <Label htmlFor="newPurpose">Purpose</Label>
                      <Select
                        value={newPurposeId || NONE_VALUE}
                        onValueChange={(val) => setNewPurposeId(val === NONE_VALUE ? "" : val)}
                      >
                        <SelectTrigger id="newPurpose">
                          <SelectValue placeholder="No purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>No purpose</SelectItem>
                          {newPurposesData?.departmentPurposes?.map((purpose) => (
                            <SelectItem key={purpose.id} value={purpose.id}>
                              {purpose.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="newSuggestedAmount">Suggested Amount (KES)</Label>
                    <Input
                      id="newSuggestedAmount"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 1000"
                      value={newSuggestedAmount}
                      onChange={(e) => setNewSuggestedAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="newRequiresRegistration">Requires registration</Label>
                  <p className="text-xs text-muted-foreground">
                    Visitors will be able to RSVP in-app and the admin can see a headcount.
                  </p>
                </div>
                <Switch
                  id="newRequiresRegistration"
                  checked={newRequiresRegistration}
                  onCheckedChange={setNewRequiresRegistration}
                />
              </div>

              <div>
                <Label htmlFor="registrationLink">External Registration Link</Label>
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

              <div className="rounded-lg border p-4 space-y-4">
                <p className="text-sm font-medium">Giving (optional)</p>
                <p className="text-xs text-muted-foreground">
                  Set a department and purpose to make this event payable. The
                  public event card will show a &quot;Give to this event&quot; button.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="editCategory">Department</Label>
                    <Select
                      value={editCategoryId || NONE_VALUE}
                      onValueChange={(val) => {
                        setEditCategoryId(val === NONE_VALUE ? "" : val);
                        setEditPurposeId("");
                      }}
                    >
                      <SelectTrigger id="editCategory">
                        <SelectValue placeholder="No department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>No department</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editCategoryId && (
                    <div className="space-y-2">
                      <Label htmlFor="editPurpose">Purpose</Label>
                      <Select
                        value={editPurposeId || NONE_VALUE}
                        onValueChange={(val) => setEditPurposeId(val === NONE_VALUE ? "" : val)}
                      >
                        <SelectTrigger id="editPurpose">
                          <SelectValue placeholder="No purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>No purpose</SelectItem>
                          {editPurposesData?.departmentPurposes?.map((purpose) => (
                            <SelectItem key={purpose.id} value={purpose.id}>
                              {purpose.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="editSuggestedAmount">Suggested Amount (KES)</Label>
                    <Input
                      id="editSuggestedAmount"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 1000"
                      value={editSuggestedAmount}
                      onChange={(e) => setEditSuggestedAmount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label htmlFor="editRequiresRegistration">Requires registration</Label>
                  <p className="text-xs text-muted-foreground">
                    Visitors will be able to RSVP in-app and the admin can see a headcount.
                  </p>
                </div>
                <Switch
                  id="editRequiresRegistration"
                  checked={editRequiresRegistration}
                  onCheckedChange={setEditRequiresRegistration}
                />
              </div>

              <div>
                <Label htmlFor="editRegistrationLink">External Registration Link</Label>
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
                        className="text-info hover:underline flex items-center gap-1"
                      >
                        <Link2 className="h-4 w-4" />
                        Registration Link
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {currentEvent.isActive && (
                      <StatusBadge variant="success">Active</StatusBadge>
                    )}
                    {isFuture(parseISO(currentEvent.eventDate)) && (
                      <StatusBadge variant="info">Upcoming</StatusBadge>
                    )}
                    {currentEvent.isPayable && (
                      <StatusBadge variant="success">Payable</StatusBadge>
                    )}
                    {currentEvent.requiresRegistration && (
                      <StatusBadge variant="info">Requires Registration</StatusBadge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Giving Summary Dialog */}
        <EventGivingSummaryDialog
          event={showGivingDialog ? currentEvent : null}
          open={showGivingDialog}
          onOpenChange={setShowGivingDialog}
        />

        {/* Registrations Dialog */}
        <EventRegistrationsDialog
          event={showRegistrationsDialog ? currentEvent : null}
          open={showRegistrationsDialog}
          onOpenChange={setShowRegistrationsDialog}
          onChanged={refetch}
        />

        <ConfirmDialog />
      </div>
    </AdminLayout>
  );
}

function EventGivingSummaryDialog({
  event,
  open,
  onOpenChange,
}: {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, loading } = useQuery<{
    eventGivingSummary: { totalAmount: string; contributionCount: number } | null;
  }>(EVENT_GIVING_SUMMARY, {
    variables: { eventId: event?.id },
    skip: !event,
    fetchPolicy: "cache-and-network",
  });

  const summary = data?.eventGivingSummary;
  const amount = Number(summary?.totalAmount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Giving Summary</DialogTitle>
          <DialogDescription>{event?.title}</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  KES {amount.toLocaleString("en-KE")}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.contributionCount ?? 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventRegistrationsDialog({
  event,
  open,
  onOpenChange,
  onChanged,
}: {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const { data, loading, refetch } = useQuery<{
    eventRegistrations: EventRegistration[];
  }>(EVENT_REGISTRATIONS, {
    variables: { eventId: event?.id },
    skip: !event,
    fetchPolicy: "cache-and-network",
  });

  const [cancelRegistration, { loading: cancelling }] = useMutation<{
    cancelRegistration: { success: boolean; message: string };
  }>(CANCEL_REGISTRATION);

  const registrations = data?.eventRegistrations || [];

  const handleCancel = async (registrationId: string) => {
    try {
      const { data } = await cancelRegistration({ variables: { registrationId } });
      if (data?.cancelRegistration?.success) {
        toast.success(data.cancelRegistration.message || "Registration cancelled");
        refetch();
        onChanged();
      } else {
        toast.error(data?.cancelRegistration?.message || "Failed to cancel registration");
      }
    } catch (err: any) {
      toast.error(err.message || "Error cancelling registration");
    }
  };

  const handleExportCsv = () => {
    if (!event || registrations.length === 0) return;

    const header = ["Name", "Phone", "Status", "Registered At"];
    const rows = registrations.map((r) => [
      r.member?.fullName || r.guestName,
      r.guestPhone || "",
      r.status,
      r.registeredAt,
    ]);

    const escapeCell = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => escapeCell(String(cell ?? ""))).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-registrations.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrations</DialogTitle>
          <DialogDescription>{event?.title}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {registrations.length} registration(s)
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={registrations.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <Empty icon={Users} title="No registrations yet" description="Nobody has registered for this event yet." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell>{registration.member?.fullName || registration.guestName}</TableCell>
                  <TableCell>{registration.guestPhone || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge variant={registration.status === "cancelled" ? "destructive" : "success"}>
                      {registration.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(registration.registeredAt), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell className="text-right">
                    {registration.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        disabled={cancelling}
                        onClick={() => handleCancel(registration.id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EventsManagementPage() {
  return (
    <AdminProtectedRoute requiredAccess="content-admin">
      <EventsManagementPageContent />
    </AdminProtectedRoute>
  );
}
