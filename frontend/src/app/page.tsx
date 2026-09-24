import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileSearch, LayoutDashboard, ShieldCheck, Star, UserRound } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";

const stats = [
  { value: "3", label: "Cell businesses on one profile" },
  { value: "360°", label: "View of the customer relationship" },
  { value: "4", label: "Claim signals a person can read" },
  { value: "2", label: "Doors: customer and Cell team" },
];

const services = [
  {
    title: "Customer 360",
    body: "Policies, medical aid, dependants, visits, and support in one profile.",
    href: "/login?as=claims",
    tone: "solid" as const,
    icon: UserRound,
  },
  {
    title: "Claims intelligence",
    body: "A claim is explained with amount, timing, frequency, and missing documents.",
    href: "/login?as=claims",
    tone: "light" as const,
    icon: FileSearch,
  },
  {
    title: "Command centre",
    body: "See what was submitted today and which claims still need a person.",
    href: "/login",
    tone: "light" as const,
    icon: LayoutDashboard,
  },
  {
    title: "Customer access",
    body: "Customers see their own cover, claims, and the document that was requested.",
    href: "/login?as=customer",
    tone: "light" as const,
    icon: ShieldCheck,
  },
];

const stories = [
  {
    title: "Motor renewal, already in view",
    body: "John Moyo’s motor policy renews on 15 Oct 2026. He is digitally engaged, so the next step is a renewal note, not a cold call.",
    tags: ["Renewal", "Digital", "Service"],
    href: "/login?as=service",
  },
  {
    title: "A medical claim with reasons",
    body: "CLM-10924 is higher than the provider’s usual amount, follows a recent similar claim, and is missing the specialist report.",
    tags: ["Claims", "Explainable", "Review"],
    href: "/login?as=claims",
  },
  {
    title: "Healthcare in the same timeline",
    body: "Nectacare visits and pharmacy activity sit beside insurance, so a service conversation starts with the whole relationship.",
    tags: ["Nectacare", "CellMed", "Journey"],
    href: "/login?as=claims",
  },
  {
    title: "The customer sends the missing file",
    body: "John sees one message: the claim needs the specialist report. He can mark it received without seeing anyone else’s record.",
    tags: ["Portal", "Documents", "Customer"],
    href: "/login?as=customer",
  },
];

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center rounded-full border border-border bg-white px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <div id="top" className="min-h-screen bg-white text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <section className="mx-auto max-w-6xl px-8 md:px-14 pt-10 pb-6 text-center md:pt-14">
          <h1 className="mx-auto max-w-xl text-2xl font-semibold tracking-tight text-balance md:text-3xl md:leading-snug">
            One customer view, tailored to the next action
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            CustomerIQ brings Cell Insurance, CellMed, and Nectacare into one working profile, then shows the team what to do next.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80"
            >
              Get started
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
            <Link
              href="/login?as=claims"
              className="inline-flex h-9 items-center rounded-full border border-border bg-white px-3.5 text-sm font-semibold hover:bg-secondary"
            >
              Open the claims desk
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-3 px-8 md:px-14 pb-10 md:grid-cols-[1.15fr_0.85fr_1.15fr] md:pb-14" aria-label="CustomerIQ preview">
          <article className="relative h-52 overflow-hidden rounded-2xl md:h-64">
            <Image
              src="/images/office-advisor.jpg"
              alt="Advisor in a tan coat, working on a laptop outside an office"
              fill
              priority
              className="object-cover object-[68%_center]"
              sizes="(min-width: 768px) 36vw, 100vw"
            />
          </article>

          <div className="grid gap-3">
            <article className="flex flex-col justify-between rounded-2xl bg-primary p-4 text-primary-foreground">
              <p className="text-xs font-medium">Complete view</p>
              <div>
                <p className="text-xl font-semibold tracking-tight">360°</p>
                <p className="mt-1 text-xs leading-relaxed">Insurance, medical aid, and healthcare on one profile.</p>
              </div>
            </article>
            <article className="flex flex-col justify-between rounded-2xl bg-foreground p-4 text-background">
              <p className="text-xs text-background/70">Group businesses</p>
              <div>
                <p className="text-xl font-semibold tracking-tight">3</p>
                <p className="mt-1 text-xs leading-relaxed text-background/75">Cell Insurance, CellMed, and Nectacare.</p>
              </div>
            </article>
          </div>

          <article className="relative h-52 overflow-hidden rounded-2xl md:h-64">
            <Image
              src="/images/portrait-member.jpg"
              alt="Team member with glasses, working at a laptop"
              fill
              priority
              className="object-cover object-center"
              sizes="(min-width: 768px) 36vw, 100vw"
            />
          </article>
        </section>

        <section id="platform" className="mx-auto max-w-3xl scroll-mt-24 px-8 py-8 text-center md:px-14 md:py-12">
          <Pill>Platform</Pill>
          <p className="mt-4 text-sm leading-relaxed font-medium tracking-tight md:text-base">
            CustomerIQ does not replace Cell’s systems. It gives authorised people the full relationship, explains unusual claims, and leaves the decision with a person.
          </p>
        </section>

        <section className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-8 md:px-14 py-12 md:grid-cols-4 md:py-16" aria-label="Platform facts">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-semibold tracking-tight md:text-3xl">{stat.value}</p>
              <p className="mx-auto mt-2 max-w-[12rem] text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </section>

        <section id="services" className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-10 px-8 py-16 md:grid-cols-[0.85fr_1.15fr] md:px-14 md:py-24">
          <div>
            <Pill>Services</Pill>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-balance md:text-3xl">The work Cell teams already do, in one place</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              Search a customer, read the claim with its reasons, and take the next step. Customers only ever see their own record.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80"
            >
              Get started
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => {
              const Icon = service.icon;
              const solid = service.tone === "solid";
              return (
                <article
                  key={service.title}
                  className={
                    solid
                      ? "flex flex-col justify-between rounded-2xl bg-primary p-4 text-primary-foreground"
                      : "flex flex-col justify-between rounded-2xl border border-border bg-white p-4"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{service.title}</h3>
                      <p className={solid ? "mt-2 text-sm leading-relaxed" : "mt-2 text-sm leading-relaxed text-muted-foreground"}>
                        {service.body}
                      </p>
                    </div>
                    <Icon aria-hidden="true" className="size-5 shrink-0" />
                  </div>
                  <Link
                    href={service.href}
                    className={
                      solid
                        ? "mt-4 inline-flex size-8 items-center justify-center self-start rounded-full bg-foreground text-background"
                        : "mt-4 inline-flex size-8 items-center justify-center self-start rounded-full border border-border hover:bg-secondary"
                    }
                    aria-label={`Open ${service.title}`}
                  >
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section id="stories" className="mx-auto max-w-6xl scroll-mt-24 px-8 py-12 md:px-14 md:py-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <Pill>Stories</Pill>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">One customer, four moments</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              John Moyo’s record, from the renewal already in view to the report he sends back.
            </p>
          </div>
          <ol className="mt-8 grid gap-3 md:grid-cols-4">
            {stories.map((story, index) => {
              const featured = index === 1;
              return (
                <li
                  key={story.title}
                  className={
                    featured
                      ? "flex flex-col rounded-2xl bg-foreground p-4 text-background"
                      : "flex flex-col rounded-2xl border border-border bg-white p-4"
                  }
                >
                  <span className={featured ? "text-xs font-medium text-primary" : "text-xs font-medium text-muted-foreground"}>
                    0{index + 1}
                  </span>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight">{story.title}</h3>
                  <p className={featured ? "mt-2 flex-1 text-xs leading-relaxed text-background/75" : "mt-2 flex-1 text-xs leading-relaxed text-muted-foreground"}>
                    {story.body}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {story.tags.map((tag) => (
                      <span
                        key={tag}
                        className={
                          featured
                            ? "rounded-full bg-background/10 px-2 py-0.5 text-[11px] text-background/80"
                            : "rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
                        }
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={story.href}
                    className={
                      featured
                        ? "mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary"
                        : "mt-4 inline-flex items-center gap-1 text-sm font-medium"
                    }
                  >
                    Open
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mx-auto max-w-3xl px-8 md:px-14 py-16 md:py-20">
          <div className="flex items-center gap-1 text-primary" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="size-4 fill-primary" />
            ))}
          </div>
          <p className="sr-only">Decorative marks beside a demo story, not a published rating.</p>
          <blockquote className="mt-4 text-base leading-snug font-medium tracking-tight md:text-lg">
            “The claim did not arrive as a score. It arrived with the amount, the recent visit, and the missing report, so the officer knew what to ask for.”
          </blockquote>
          <p className="mt-6 text-sm text-muted-foreground">CustomerIQ demo · claim CLM-10924 · John Moyo</p>
        </section>
      </main>

      <footer id="contact" className="scroll-mt-24 bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-8 md:px-14 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Wordmark light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-background/70">
              One working profile for insurance, medical aid, and healthcare. Unusual claims are explained, and the decision stays with a person.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-background/50 uppercase">Explore</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><a href="/#top" className="text-background/80 hover:text-background">Home</a></li>
              <li><a href="#platform" className="text-background/80 hover:text-background">Platform</a></li>
              <li><a href="#services" className="text-background/80 hover:text-background">Services</a></li>
              <li><a href="#stories" className="text-background/80 hover:text-background">Stories</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-background/50 uppercase">Access</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/login" className="text-background/80 hover:text-background">Sign in</Link></li>
              <li><Link href="/login?as=customer" className="text-background/80 hover:text-background">Customer access</Link></li>
              <li><Link href="/login?as=claims" className="text-background/80 hover:text-background">Claims desk</Link></li>
              <li><a href="#contact" className="text-background/80 hover:text-background">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-8 md:px-14 py-4 text-xs text-background/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 CustomerIQ</p>
            <p>Harare</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
