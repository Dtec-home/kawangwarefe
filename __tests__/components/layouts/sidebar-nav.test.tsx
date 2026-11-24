/**
 * Sidebar navigation with submenus (F3 UX): "Members" holds All members,
 * Merge duplicates, Recent merges and Import. Children are filtered by role
 * like any other item.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Users, GitMerge, History, Upload, DollarSign } from "lucide-react";

import { SidebarNav, visibleNavGroups, type NavGroup } from "@/components/layouts/sidebar-nav";

const groups: NavGroup[] = [
  {
    items: [
      { name: "Contributions", href: "/admin/contributions", icon: DollarSign, feature: "contributions" },
      {
        name: "Members", href: "/admin/members", icon: Users, feature: "members",
        children: [
          { name: "All members", href: "/admin/members", icon: Users, feature: "members" },
          { name: "Merge duplicates", href: "/admin/members/merge", icon: GitMerge, feature: "member-merge" },
          { name: "Recent merges", href: "/admin/members/merges", icon: History, feature: "member-merge" },
          { name: "Import", href: "/admin/members/import", icon: Upload, feature: "members" },
        ],
      },
    ],
  },
];

const everyone = () => true;
const noMerge = (f: string) => f !== "member-merge";

describe("visibleNavGroups", () => {
  it("drops children the role cannot use", () => {
    const [group] = visibleNavGroups(groups, noMerge);
    const members = group.items.find((i) => i.name === "Members")!;
    expect(members.children!.map((c) => c.name)).toEqual(["All members", "Import"]);
  });

  it("drops a parent the role cannot use, with its children", () => {
    const [group] = visibleNavGroups(groups, (f) => f === "contributions");
    expect(group.items.map((i) => i.name)).toEqual(["Contributions"]);
  });
});

describe("SidebarNav", () => {
  it("opens the Members submenu while on a members page and marks the current item", () => {
    render(<SidebarNav groups={visibleNavGroups(groups, everyone)} pathname="/admin/members/merge" onNavigate={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Merge duplicates/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: /Recent merges/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Members/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps the submenu closed elsewhere and opens it on click", () => {
    const onNavigate = vi.fn();
    render(<SidebarNav groups={visibleNavGroups(groups, everyone)} pathname="/admin/contributions" onNavigate={onNavigate} />);

    expect(screen.queryByRole("button", { name: /Merge duplicates/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Members/ }));
    expect(screen.getByRole("button", { name: /Merge duplicates/ })).toBeInTheDocument();
    expect(onNavigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Merge duplicates/ }));
    expect(onNavigate).toHaveBeenCalledWith("/admin/members/merge");
  });

  it("without merge rights, Members has no merge entries", () => {
    render(<SidebarNav groups={visibleNavGroups(groups, noMerge)} pathname="/admin/members" onNavigate={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /Merge duplicates/ })).toBeNull();
    expect(screen.getByRole("button", { name: /All members/ })).toHaveAttribute("aria-current", "page");
  });

  it("renders an item marked asLink as a real link that still navigates through onNavigate (DR-6)", () => {
    const onNavigate = vi.fn();
    const linkGroups: NavGroup[] = [
      { items: [{ name: "Department Reports", href: "/admin/department-reports", icon: DollarSign, feature: "department-reports", asLink: true }] },
    ];
    render(<SidebarNav groups={linkGroups} pathname="/admin/department-reports" onNavigate={onNavigate} />);

    const link = screen.getByRole("link", { name: "Department Reports" });
    expect(link).toHaveAttribute("href", "/admin/department-reports");
    expect(link).toHaveAttribute("aria-current", "page");
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledWith("/admin/department-reports");
  });

  it("lets a modified click on a link through (open in a new tab)", () => {
    const onNavigate = vi.fn();
    const linkGroups: NavGroup[] = [
      { items: [{ name: "Department Reports", href: "/admin/department-reports", icon: DollarSign, feature: "department-reports", asLink: true }] },
    ];
    render(<SidebarNav groups={linkGroups} pathname="/admin" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("link", { name: "Department Reports" }), { ctrlKey: true });
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
