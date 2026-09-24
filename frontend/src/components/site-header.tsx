"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/brand";

const links = [
  { id: "top", href: "/#top", label: "Home" },
  { id: "platform", href: "#platform", label: "Platform" },
  { id: "services", href: "#services", label: "Services" },
  { id: "stories", href: "#stories", label: "Stories" },
  { id: "contact", href: "#contact", label: "Contact" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("top");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const line = window.scrollY + 96;
      let current = "top";
      for (const link of links) {
        const section = document.getElementById(link.id);
        if (!section) continue;
        const top = section.getBoundingClientRect().top + window.scrollY;
        if (top <= line) current = link.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? "border-b border-border bg-background/95 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-8 md:px-14">
        <Link href="/" aria-label="CustomerIQ home">
          <Wordmark />
        </Link>
        <p className="rounded-full bg-foreground px-3 py-1 text-sm font-medium text-background md:hidden" aria-live="polite">
          {links.find((link) => link.id === active)?.label}
        </p>
        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex" aria-label="Page">
          {links.map((link) => {
            const current = active === link.id;
            return (
              <Link
                key={link.id}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`rounded-full px-3 py-1 transition-colors hover:text-foreground ${
                  current ? "bg-foreground font-medium text-background" : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login?as=customer"
            className="inline-flex h-9 items-center rounded-full border border-border bg-white px-3 text-sm font-medium hover:bg-secondary"
          >
            <span className="sm:hidden">Customer</span>
            <span className="hidden sm:inline">Customer access</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
