"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  TableProperties,
  Users2,
  Boxes
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/crm";

const baseItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    href: "/crm",
    label: "CRM Table",
    icon: TableProperties
  }
] as const;

const ownerItems = [
  {
    href: "/dashboard/groups",
    label: "Groups",
    icon: Boxes
  },
  {
    href: "/dashboard/team",
    label: "Team",
    icon: Users2
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3
  }
] as const;

const navIconStyles: Record<string, string> = {
  "/dashboard": "text-sky-600",
  "/crm": "text-emerald-600",
  "/dashboard/groups": "text-violet-600",
  "/dashboard/team": "text-amber-600",
  "/dashboard/analytics": "text-rose-600"
};

export function AppNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = role === "owner" ? [...baseItems, ...ownerItems] : baseItems;

  return (
    <nav className="grid grid-cols-2 gap-2 sm:inline-flex sm:flex-wrap sm:justify-end">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-black text-white"
                : "bg-white text-ink/70 hover:bg-neutral-50 hover:text-ink"
            )}
          >
            <Icon
              className={cn(
                "size-4",
                isActive ? "text-white" : navIconStyles[item.href] ?? "text-ink"
              )}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
