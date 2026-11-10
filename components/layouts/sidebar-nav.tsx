"use client";

/**
 * Admin sidebar navigation: groups of items, where an item may hold a submenu
 * (e.g. Members → All members, Merge duplicates, Recent merges, Import).
 * Role filtering happens in `visibleNavGroups`, so a child the viewer can't use
 * is never rendered, and a parent left with one child shows as a plain item.
 */

import { useState, type ComponentType, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminFeature } from "@/lib/hooks/use-user-role";

export interface NavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  feature: AdminFeature;
  children?: NavItem[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export function visibleNavGroups(groups: NavGroup[], canAccess: (feature: AdminFeature) => boolean): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => canAccess(item.feature))
        .map((item) => {
          const children = item.children?.filter((child) => canAccess(child.feature));
          return children && children.length > 1 ? { ...item, children } : { ...item, children: undefined };
        }),
    }))
    .filter((group) => group.items.length > 0);
}

interface SidebarNavProps {
  groups: NavGroup[];
  pathname: string;
  onNavigate: (href: string) => void;
  /** Extra content after an item's label (e.g. a count badge). */
  renderBadge?: (item: NavItem) => ReactNode;
}

export function SidebarNav({ groups, pathname, onNavigate, renderBadge }: SidebarNavProps) {
  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-0.5">
          {/* F2.3 — subtle separator between groups */}
          {gi > 0 && <div className="h-px bg-sidebar-border mx-2 mb-3" />}
          {group.label && (
            <p className="px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 select-none">
              {group.label}
            </p>
          )}
          {group.items.map((item) =>
            item.children ? (
              <SubMenu key={item.name} item={item} pathname={pathname} onNavigate={onNavigate} renderBadge={renderBadge} />
            ) : (
              <NavButton
                key={item.name}
                item={item}
                active={pathname === item.href}
                onClick={() => onNavigate(item.href)}
                badge={renderBadge?.(item)}
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

function SubMenu({
  item, pathname, onNavigate, renderBadge,
}: { item: NavItem; pathname: string; onNavigate: (href: string) => void; renderBadge?: (item: NavItem) => ReactNode }) {
  const children = item.children ?? [];
  const inside = children.some((child) => pathname === child.href) || pathname.startsWith(`${item.href}/`);
  const [open, setOpen] = useState(inside);
  const expanded = open || inside;
  // The most specific child that matches the current page is the active one.
  const current = children.find((child) => pathname === child.href)?.href;

  return (
    <div>
      <NavButton
        item={item}
        active={false}
        highlighted={inside}
        onClick={() => setOpen((value) => !value)}
        expanded={expanded}
      />
      {expanded && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
          {children.map((child) => (
            <NavButton
              key={child.href + child.name}
              item={child}
              active={child.href === current}
              onClick={() => onNavigate(child.href)}
              badge={renderBadge?.(child)}
              small
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NavButton({
  item, active, onClick, badge, expanded, highlighted = false, small = false,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  badge?: ReactNode;
  expanded?: boolean;
  highlighted?: boolean;
  small?: boolean;
}) {
  const Icon = item.icon;
  const emphasis = active || highlighted;
  return (
    <Button
      variant="ghost"
      aria-current={active ? "page" : undefined}
      aria-expanded={expanded}
      className={`w-full justify-start ${small ? "h-8" : "h-9"} px-3 relative transition-all rounded-lg ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold hover:bg-sidebar-accent"
          : highlighted
            ? "text-sidebar-foreground font-medium hover:bg-sidebar-accent/40"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
      }`}
      onClick={onClick}
    >
      {/* F2.5 — left accent bar for active item */}
      {active && <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-sidebar-primary rounded-r-full" />}
      <Icon className={`h-4 w-4 mr-2.5 flex-shrink-0 ${emphasis ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/50"}`} />
      <span className="text-sm">{item.name}</span>
      {badge}
      {expanded !== undefined && (
        <ChevronDown
          aria-hidden
          className={`ml-auto h-4 w-4 text-sidebar-foreground/50 transition-transform ${expanded ? "" : "-rotate-90"}`}
        />
      )}
    </Button>
  );
}
