"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Drag-handle props produced by `useSortable`. Spread the `attributes` and
 * `listeners` onto whatever element should act as the drag handle (e.g. a
 * grip button). `setActivatorNodeRef` lets the handle be a dedicated activator
 * so the rest of the row stays interactive (buttons, checkboxes, etc.).
 */
export interface SortableDragHandleProps {
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: Record<string, (event: unknown) => void> | undefined;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
  isDragging: boolean;
}

export interface SortableListProps<T extends { id: string }> {
  /** Items to render. Each must have a stable string `id`. */
  items: T[];
  /**
   * Called with the full list of ids in their new order after a drag ends.
   * Use this to optimistically reorder and persist (e.g. a reorder mutation).
   */
  onReorder: (newOrderedIds: string[]) => void;
  /**
   * Render prop for each row. Receives the item, its index, and the drag-handle
   * props that must be spread onto the chosen handle element.
   */
  renderItem: (
    item: T,
    index: number,
    handle: SortableDragHandleProps
  ) => React.ReactNode;
  /** Optional className applied to the list wrapper. */
  className?: string;
  /** Disable dragging entirely (rows still render). */
  disabled?: boolean;
}

/**
 * Generic, reusable drag-to-reorder list built on dnd-kit.
 *
 * - Touch-friendly: PointerSensor with a small activation distance so taps on
 *   row buttons aren't swallowed by the drag.
 * - Keyboard-accessible: KeyboardSensor with sortable coordinate getter; focus
 *   the drag handle and use Space/Enter + arrow keys to reorder.
 *
 * Designed to be shared across announcements, leaders, events, etc.
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
  disabled = false,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a little movement before a drag starts so taps/clicks on
      // interactive children (buttons, checkboxes) still work on touch.
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered.map((i) => i.id));
  };

  if (disabled) {
    return (
      <div className={className}>
        {items.map((item, index) =>
          renderItem(item, index, {
            attributes: {},
            listeners: undefined,
            setActivatorNodeRef: () => {},
            isDragging: false,
          })
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item, index) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, index, handle)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

interface SortableRowProps {
  id: string;
  children: (handle: SortableDragHandleProps) => React.ReactNode;
}

function SortableRow({ id, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : undefined,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        attributes: attributes as React.HTMLAttributes<HTMLElement>,
        listeners: listeners as
          | Record<string, (event: unknown) => void>
          | undefined,
        setActivatorNodeRef,
        isDragging,
      })}
    </div>
  );
}
