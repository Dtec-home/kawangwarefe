/**
 * Layout helpers for the totals post (WA-3): a layout is the ordered list of
 * blocks (`fundraising/whatsapp_blocks.py`), read top to bottom. Pure.
 */

import type { PostBlock, PostBlockInput } from "./types";

export type Direction = "up" | "down";

/** The layout with the block at `index` swapped with its neighbour (same array at the ends). */
export function moveBlock<T>(layout: T[], index: number, direction: Direction): T[] {
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || index >= layout.length || target < 0 || target >= layout.length) return layout;
  const next = [...layout];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** Switch one block on or off (flip when `enabled` is left out). */
export function toggleBlock(layout: PostBlock[], key: string, enabled?: boolean): PostBlock[] {
  return layout.map((b) => (b.block === key ? { ...b, enabled: enabled ?? !b.enabled } : b));
}

/**
 * Every available block listed once: the layout's known blocks in its order,
 * then any block it leaves out, switched off. Labels come from `available`.
 */
export function completeLayout(layout: PostBlock[], available: PostBlock[]): PostBlock[] {
  const spec = new Map(available.map((b) => [b.block, b]));
  const seen = new Set<string>();
  const ordered: PostBlock[] = [];
  for (const item of layout) {
    const known = spec.get(item.block);
    if (!known || seen.has(item.block)) continue;
    seen.add(item.block);
    ordered.push({ block: item.block, enabled: item.enabled, label: known.label, description: known.description });
  }
  for (const b of available) {
    if (!seen.has(b.block)) ordered.push({ block: b.block, enabled: false, label: b.label, description: b.description });
  }
  return ordered;
}

export function layoutInput(layout: PostBlock[]): PostBlockInput[] {
  return layout.map(({ block, enabled }) => ({ block, enabled }));
}

export function sameLayout(a: PostBlock[], b: PostBlock[]): boolean {
  return JSON.stringify(layoutInput(a)) === JSON.stringify(layoutInput(b));
}
