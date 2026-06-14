/**
 * Leaders / About Management Page
 * Admin CRUD for church leaders shown on the public About page and home page.
 */

"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  GET_LEADERS,
  CREATE_LEADER,
  UPDATE_LEADER,
  DELETE_LEADER,
  TOGGLE_LEADER_ACTIVE,
  REORDER_LEADERS,
  type Leader,
} from "@/lib/graphql/leaders";
import { GET_ALL_CATEGORIES } from "@/lib/graphql/category-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  Users,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const NONE_CATEGORY = "__none__";

interface CategoryItem {
  id: string;
  name: string;
}

interface GetCategoriesData {
  contributionCategories: CategoryItem[];
}

interface GetLeadersData {
  leaders: Leader[];
}

interface MutationResult {
  success: boolean;
  message: string;
  leader?: Leader;
}

interface CreateLeaderData {
  createLeader: MutationResult;
}
interface UpdateLeaderData {
  updateLeader: MutationResult;
}
interface DeleteLeaderData {
  deleteLeader: { success: boolean; message: string };
}
interface ToggleLeaderData {
  toggleLeaderActive: MutationResult;
}
interface ReorderLeadersData {
  reorderLeaders: { success: boolean; message: string };
}

interface LeaderFormState {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  email: string;
  phone: string;
  categoryId: string;
  isActive: boolean;
}

const emptyForm: LeaderFormState = {
  name: "",
  title: "",
  bio: "",
  photoUrl: "",
  email: "",
  phone: "",
  categoryId: NONE_CATEGORY,
  isActive: true,
};

function LeaderFormFields({
  state,
  setState,
  categories,
  idPrefix,
}: {
  state: LeaderFormState;
  setState: (next: LeaderFormState) => void;
  categories: CategoryItem[];
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-name`}>Name *</Label>
          <Input
            id={`${idPrefix}-name`}
            placeholder="e.g., John Doe"
            value={state.name}
            onChange={(e) => setState({ ...state, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-title`}>Title / Role *</Label>
          <Input
            id={`${idPrefix}-title`}
            placeholder="e.g., Head Pastor"
            value={state.title}
            onChange={(e) => setState({ ...state, title: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-bio`}>Bio</Label>
        <Textarea
          id={`${idPrefix}-bio`}
          placeholder="Short biography..."
          value={state.bio}
          onChange={(e) => setState({ ...state, bio: e.target.value })}
          rows={3}
        />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-photo`}>Photo URL</Label>
          <Input
            id={`${idPrefix}-photo`}
            placeholder="https://..."
            value={state.photoUrl}
            onChange={(e) => setState({ ...state, photoUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-category`}>Department (optional)</Label>
          <Select
            value={state.categoryId}
            onValueChange={(v) => setState({ ...state, categoryId: v })}
          >
            <SelectTrigger id={`${idPrefix}-category`}>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_CATEGORY}>None</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-email`}>Email</Label>
          <Input
            id={`${idPrefix}-email`}
            type="email"
            placeholder="name@example.com"
            value={state.email}
            onChange={(e) => setState({ ...state, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
          <Input
            id={`${idPrefix}-phone`}
            placeholder="07XX XXX XXX"
            value={state.phone}
            onChange={(e) => setState({ ...state, phone: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function SortableLeaderRow({
  leader,
  isEditing,
  editState,
  setEditState,
  categories,
  updating,
  deleting,
  toggling,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleActive,
  onDelete,
}: {
  leader: Leader;
  isEditing: boolean;
  editState: LeaderFormState;
  setEditState: (next: LeaderFormState) => void;
  categories: CategoryItem[];
  updating: boolean;
  deleting: boolean;
  toggling: boolean;
  onStartEdit: (leader: Leader) => void;
  onCancelEdit: () => void;
  onSaveEdit: (leaderId: string) => void;
  onToggleActive: (leader: Leader) => void;
  onDelete: (leader: Leader) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: leader.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-4 flex flex-col md:flex-row md:items-start gap-4 bg-card"
    >
      {!isEditing && (
        <button
          type="button"
          className="flex items-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label={`Drag to reorder ${leader.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}

      {isEditing ? (
        <div className="flex-1 space-y-3">
          <LeaderFormFields
            state={editState}
            setState={setEditState}
            categories={categories}
            idPrefix={`edit-${leader.id}`}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSaveEdit(leader.id)} disabled={updating}>
              <Save className="h-3 w-3 mr-1" />
              {updating ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelEdit}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium">{leader.name}</span>
              <Badge variant="outline" className="text-xs">
                {leader.title}
              </Badge>
              {leader.isActive ? (
                <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              {leader.category?.name && (
                <Badge variant="secondary" className="text-xs">
                  {leader.category.name}
                </Badge>
              )}
            </div>
            {leader.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">{leader.bio}</p>
            )}
            {(leader.email || leader.phone) && (
              <p className="text-xs text-muted-foreground mt-1">
                {[leader.email, leader.phone].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => onStartEdit(leader)}>
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant={leader.isActive ? "secondary" : "default"}
              onClick={() => onToggleActive(leader)}
              disabled={toggling}
            >
              {leader.isActive ? (
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
              onClick={() => onDelete(leader)}
              disabled={deleting}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function LeadersManagementPageContent() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [newForm, setNewForm] = useState<LeaderFormState>(emptyForm);
  const [editForm, setEditForm] = useState<LeaderFormState>(emptyForm);

  // Local ordered list so drag-reorder feels instant before the server confirms.
  const [orderedLeaders, setOrderedLeaders] = useState<Leader[]>([]);

  const { data, loading, refetch } = useQuery<GetLeadersData>(GET_LEADERS, {
    variables: { activeOnly: false },
    fetchPolicy: "cache-and-network",
  });
  const { data: categoriesData } = useQuery<GetCategoriesData>(GET_ALL_CATEGORIES, {
    variables: { includeInactive: false },
  });
  const categories = categoriesData?.contributionCategories || [];

  useEffect(() => {
    if (data?.leaders) {
      setOrderedLeaders([...data.leaders]);
    }
  }, [data?.leaders]);

  const [createLeader, { loading: creating }] = useMutation<CreateLeaderData>(CREATE_LEADER);
  const [updateLeader, { loading: updating }] = useMutation<UpdateLeaderData>(UPDATE_LEADER);
  const [deleteLeader, { loading: deleting }] = useMutation<DeleteLeaderData>(DELETE_LEADER);
  const [toggleLeaderActive, { loading: toggling }] =
    useMutation<ToggleLeaderData>(TOGGLE_LEADER_ACTIVE);
  const [reorderLeaders] = useMutation<ReorderLeadersData>(REORDER_LEADERS);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const clearMessages = () => {
    setSuccess("");
    setError("");
  };

  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

  const toCategoryId = (categoryId: string) =>
    categoryId === NONE_CATEGORY ? null : categoryId;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newForm.name.trim() || !newForm.title.trim()) {
      setError("Name and title are required");
      return;
    }

    try {
      const { data } = await createLeader({
        variables: {
          name: newForm.name.trim(),
          title: newForm.title.trim(),
          bio: newForm.bio.trim(),
          photoUrl: newForm.photoUrl.trim(),
          email: newForm.email.trim(),
          phone: newForm.phone.trim(),
          categoryId: toCategoryId(newForm.categoryId),
          isActive: newForm.isActive,
        },
      });

      if (data?.createLeader?.success) {
        setSuccess(data.createLeader.message);
        setNewForm(emptyForm);
        setShowCreateForm(false);
        refetch();
      } else {
        setError(data?.createLeader?.message || "Failed to create leader");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error creating leader"));
    }
  };

  const handleStartEdit = (leader: Leader) => {
    setEditingId(leader.id);
    setEditForm({
      name: leader.name,
      title: leader.title,
      bio: leader.bio ?? "",
      photoUrl: leader.photoUrl ?? "",
      email: leader.email ?? "",
      phone: leader.phone ?? "",
      categoryId: leader.category?.id ?? NONE_CATEGORY,
      isActive: leader.isActive,
    });
    clearMessages();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    clearMessages();
  };

  const handleSaveEdit = async (leaderId: string) => {
    clearMessages();

    if (!editForm.name.trim() || !editForm.title.trim()) {
      setError("Name and title are required");
      return;
    }

    try {
      const { data } = await updateLeader({
        variables: {
          leaderId,
          name: editForm.name.trim(),
          title: editForm.title.trim(),
          bio: editForm.bio.trim(),
          photoUrl: editForm.photoUrl.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          categoryId: toCategoryId(editForm.categoryId),
        },
      });

      if (data?.updateLeader?.success) {
        setSuccess(data.updateLeader.message);
        setEditingId(null);
        refetch();
      } else {
        setError(data?.updateLeader?.message || "Failed to update leader");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error updating leader"));
    }
  };

  const handleToggleActive = async (leader: Leader) => {
    clearMessages();
    try {
      const { data } = await toggleLeaderActive({
        variables: { leaderId: leader.id },
      });
      if (data?.toggleLeaderActive?.success) {
        setSuccess(
          `Leader '${leader.name}' ${leader.isActive ? "deactivated" : "activated"}`,
        );
        refetch();
      } else {
        setError(data?.toggleLeaderActive?.message || "Failed to update leader");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error updating leader"));
    }
  };

  const handleDelete = async (leader: Leader) => {
    clearMessages();
    const confirmed = await confirm({
      title: "Delete Leader",
      description: `Are you sure you want to delete '${leader.name}'? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    try {
      const { data } = await deleteLeader({ variables: { leaderId: leader.id } });
      if (data?.deleteLeader?.success) {
        setSuccess(data.deleteLeader.message);
        refetch();
      } else {
        setError(data?.deleteLeader?.message || "Failed to delete leader");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Error deleting leader"));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedLeaders.findIndex((l) => l.id === active.id);
    const newIndex = orderedLeaders.findIndex((l) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = orderedLeaders;
    const reordered = arrayMove(orderedLeaders, oldIndex, newIndex);
    setOrderedLeaders(reordered);
    clearMessages();

    try {
      const { data } = await reorderLeaders({
        variables: { ids: reordered.map((l) => l.id) },
      });
      if (data?.reorderLeaders?.success) {
        setSuccess("Leader order updated");
        refetch();
      } else {
        setOrderedLeaders(previous);
        setError(data?.reorderLeaders?.message || "Failed to reorder leaders");
      }
    } catch (err: unknown) {
      setOrderedLeaders(previous);
      setError(getErrorMessage(err, "Error reordering leaders"));
    }
  };

  const activeCount = orderedLeaders.filter((l) => l.isActive).length;
  const inactiveCount = orderedLeaders.filter((l) => !l.isActive).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leaders &amp; About</h1>
            <p className="text-muted-foreground">
              Manage the leadership team shown on the public About and home pages
            </p>
          </div>
          <Button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setNewForm(emptyForm);
              clearMessages();
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Leader
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderedLeaders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{inactiveCount}</div>
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
              <CardTitle>Add New Leader</CardTitle>
              <CardDescription>Add a member of the leadership team</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <LeaderFormFields
                  state={newForm}
                  setState={setNewForm}
                  categories={categories}
                  idPrefix="new"
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Leader"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Leaders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Leaders
            </CardTitle>
            <CardDescription>
              Drag the handle to reorder. Order controls how leaders appear publicly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && orderedLeaders.length === 0 ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading leaders...</span>
              </div>
            ) : orderedLeaders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leaders found. Add one to get started.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedLeaders.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {orderedLeaders.map((leader) => (
                      <SortableLeaderRow
                        key={leader.id}
                        leader={leader}
                        isEditing={editingId === leader.id}
                        editState={editForm}
                        setEditState={setEditForm}
                        categories={categories}
                        updating={updating}
                        deleting={deleting}
                        toggling={toggling}
                        onStartEdit={handleStartEdit}
                        onCancelEdit={handleCancelEdit}
                        onSaveEdit={handleSaveEdit}
                        onToggleActive={handleToggleActive}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog />
    </AdminLayout>
  );
}

export default function LeadersManagementPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <LeadersManagementPageContent />
    </AdminProtectedRoute>
  );
}
