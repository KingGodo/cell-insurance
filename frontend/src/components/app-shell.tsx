"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Bookmark, ClipboardList, FileSearch, HeartPulse, LayoutDashboard, LogOut, Menu, MessageSquare, Settings, Shield, SlidersHorizontal, Sparkles, Stethoscope, Tags, UserRound, Users, Workflow, X, type LucideIcon } from "lucide-react";
import { logout } from "@/lib/actions";
import { roleDetail, roleLabel } from "@/lib/format";
import { Wordmark } from "@/components/brand";

type NavLink = { href: string; label: string; detail: string; icon: LucideIcon };

const staffSections: Array<{ heading: string; links: NavLink[] }> = [
  {
    heading: "AI",
    links: [
      { href: "/dashboard", label: "Overview", detail: "Both models across the book", icon: LayoutDashboard },
      { href: "/dashboard/ai/value", label: "Value", detail: "What the value model found", icon: Sparkles },
      { href: "/dashboard/ai/risk", label: "Risk", detail: "Risk outcomes and drivers", icon: Shield },
    ],
  },
  {
    heading: "Customers",
    links: [
      { href: "/dashboard/customers", label: "Overview", detail: "A graphical view of the book", icon: LayoutDashboard },
      { href: "/customers", label: "Customers", detail: "Search the relationship", icon: Users },
      { href: "/dashboard/profiles", label: "Profiles", detail: "Full record and history", icon: UserRound },
      { href: "/dashboard/segments", label: "Segments", detail: "Value against risk", icon: Tags },
    ],
  },
  {
    heading: "Configuration",
    links: [
      { href: "/dashboard/configuration/apis", label: "APIs", detail: "Where each feed comes from", icon: Settings },
      { href: "/dashboard/configuration/csv", label: "CSV", detail: "Receive a customer file", icon: FileSearch },
      { href: "/dashboard/configuration/ingestion", label: "Ingestion", detail: "How the feeds are performing", icon: Workflow },
    ],
  },
  {
    heading: "Retention",
    links: [
      { href: "/dashboard/retention/strategies", label: "Strategies", detail: "How each plan evaluates before it goes out", icon: BarChart3 },
      { href: "/dashboard/retention/rules", label: "Rules", detail: "Value and risk thresholds a plan must have", icon: SlidersHorizontal },
      { href: "/dashboard/retention/plans", label: "Plans", detail: "Add, edit, deactivate, or remove an offer", icon: Bookmark },
      { href: "/dashboard/retention/deployed", label: "Deployed", detail: "Report of who received a plan", icon: ClipboardList },
    ],
  },
];

const staffLinks = staffSections.flatMap((section) => section.links);

const customerLinks = [
  { href: "/account", label: "Profile", detail: "Who you are on the book", icon: UserRound },
  { href: "/account/cover", label: "Insurance", detail: "Policies and renewal", icon: Shield },
  { href: "/account/medical", label: "Medical aid", detail: "Plan and dependants", icon: HeartPulse },
  { href: "/account/care", label: "Healthcare", detail: "Visits and pharmacy", icon: Stethoscope },
  { href: "/claims", label: "Claims", detail: "Status of your claims", icon: FileSearch },
  { href: "/account/messages", label: "Messages", detail: "What was requested", icon: MessageSquare },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/account" || href === "/dashboard" || href === "/customers") return pathname === href;
  if (href === "/dashboard/profiles") return pathname === href || /^\/customers\/[^/]+$/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppShell({
  name,
  email,
  role,
  customerCode,
  location,
  today,
  children,
}: {
  name: string;
  email: string;
  role: string;
  customerCode: string | null;
  location: string | null;
  today: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = role === "CUSTOMER" ? customerLinks : staffLinks;
  const current = links.find((link) => isCurrent(pathname, link.href)) ?? links[0];

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-screen md:flex-col">
        <div className="flex h-16 items-center px-4">
          <Link href={role === "CUSTOMER" ? "/account" : "/dashboard"} aria-label="CustomerIQ home">
            <Wordmark light />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" aria-label="Workspace">
          {role === "CUSTOMER"
            ? links.map((link) => <NavItem key={link.href} link={link} active={isCurrent(pathname, link.href)} />)
            : staffSections.map((section, index) => (
                <div key={section.heading} className={index === 0 ? "pt-1" : "pt-4"}>
                  <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-wide text-primary uppercase">{section.heading}</p>
                  {section.links.map((link) => (
                    <NavItem key={link.href} link={link} active={isCurrent(pathname, link.href)} />
                  ))}
                </div>
              ))}
        </nav>
        <div className="flex items-center gap-2.5 border-t border-sidebar-border px-3 py-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {initials(name)}
          </span>
          <div className="min-w-0 flex-1" title={[email, customerCode, location].filter(Boolean).join(" · ")}>
            <p className="truncate text-sm leading-tight font-medium">{name}</p>
            <p className="truncate text-xs text-sidebar-foreground/50">{roleLabel(role)}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              className="inline-flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut aria-hidden="true" className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-6 border-b border-border bg-background/85 px-6 backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border md:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X aria-hidden="true" className="size-4" /> : <Menu aria-hidden="true" className="size-4" />}
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            </button>
            <div className="flex min-w-0 items-baseline gap-2">
              <p className="truncate text-sm font-semibold">{current.label}</p>
              <p className="hidden truncate text-sm text-muted-foreground sm:block">{current.detail}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <p className="hidden text-xs text-muted-foreground md:block">{today}</p>
            <span className="hidden h-4 w-px bg-border md:block" aria-hidden="true" />
            <p className="hidden rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground sm:block">{roleLabel(role)}</p>
            <span
              className="inline-flex size-8 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-primary"
              title={name}
              aria-label={name}
            >
              {initials(name)}
            </span>
          </div>
        </header>
        {open ? (
          <div id="mobile-nav" className="border-b border-border bg-background px-8 py-3 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Workspace">
              {role === "CUSTOMER"
                ? links.map((link) => <MobileItem key={link.href} link={link} active={isCurrent(pathname, link.href)} onNavigate={() => setOpen(false)} />)
                : staffSections.map((section) => (
                    <div key={section.heading} className="pt-2">
                      <p className="px-3 pb-1 text-[11px] font-semibold tracking-wide text-foreground/70 uppercase">{section.heading}</p>
                      {section.links.map((link) => (
                        <MobileItem key={link.href} link={link} active={isCurrent(pathname, link.href)} onNavigate={() => setOpen(false)} />
                      ))}
                    </div>
                  ))}
            </nav>
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{name}</p>
              {email ? <p>{email}</p> : null}
              <p>
                {roleLabel(role)} · {roleDetail(role)}
              </p>
              {customerCode ? (
                <p>
                  {customerCode}
                  {location ? ` · ${location}` : ""}
                </p>
              ) : null}
              <p>{today}</p>
              <form action={logout} className="mt-2">
                <button type="submit" className="text-sm text-foreground">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        ) : null}
        <main className="px-6 py-6 md:px-8 md:py-7">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ link, active }: { link: NavLink; active: boolean }) {
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors ${
        active ? "bg-sidebar-accent font-medium text-sidebar-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
      }`}
    >
      <Icon aria-hidden="true" className={`size-4 shrink-0 ${active ? "text-primary" : "text-sidebar-foreground/70"}`} />
      {link.label}
    </Link>
  );
}

function MobileItem({ link, active, onNavigate }: { link: NavLink; active: boolean; onNavigate: () => void }) {
  return (
    <Link href={link.href} aria-current={active ? "page" : undefined} className={`rounded-xl px-3 py-2 ${active ? "bg-foreground text-background" : ""}`} onClick={onNavigate}>
      <span className="block text-sm font-medium">{link.label}</span>
      <span className={`block text-xs ${active ? "text-background/70" : "text-foreground/70"}`}>{link.detail}</span>
    </Link>
  );
}
