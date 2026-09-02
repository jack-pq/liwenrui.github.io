"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  CheckSquare,
  Activity,
  CalendarDays,
  ShoppingCart,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "今日", icon: Home },
  { href: "/finance", label: "记账", icon: Wallet },
  { href: "/habit", label: "习惯", icon: CheckSquare },
  { href: "/fitness", label: "健身", icon: Activity },
  { href: "/schedule", label: "日程", icon: CalendarDays },
  { href: "/shopping", label: "待买", icon: ShoppingCart },
  { href: "/collection", label: "收藏", icon: BookOpen },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-ink-100 bg-ink-50/40 h-screen sticky top-0">
        <div className="px-6 py-7">
          <h1 className="text-lg font-serif text-ink-800 tracking-wide">日常集</h1>
          <p className="text-[11px] text-ink-400 mt-0.5 tracking-wider">LIFE WORKBENCH</p>
        </div>
        <nav className="flex-1 px-3 space-y-0.5" aria-label="主导航">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  active
                    ? "bg-ink-800 text-ink-50 font-medium"
                    : "text-ink-500 hover:bg-ink-100/70 hover:text-ink-700"
                )}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-5 text-[11px] text-ink-300">
          数据直连飞书多维表格
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-ink-100" aria-label="主导航">
        <div className="flex items-center justify-around px-1 py-1.5 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors",
                  active ? "text-ink-800" : "text-ink-300"
                )}
              >
                <Icon size={19} strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
