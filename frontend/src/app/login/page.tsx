import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { LoginForm } from "@/app/login/login-form";

const emails: Record<string, string> = {
  customer: "john.moyo@cellgroup.demo",
  admin: "admin@cellgroup.demo",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string }>;
}) {
  const { as } = await searchParams;
  const defaultEmail = emails[as ?? "admin"] ?? emails.admin;

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="relative hidden min-h-screen md:flex">
        <Image
          src="/images/portrait-member.jpg"
          alt="Team member with glasses, working at a laptop"
          fill
          priority
          className="object-cover object-[68%_center]"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative z-10 flex flex-1 flex-col justify-between px-10 py-8 text-background">
          <Link href="/" aria-label="CustomerIQ home">
            <Wordmark light />
          </Link>
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">CustomerIQ</p>
            <h1 className="mt-3 max-w-sm text-2xl font-semibold tracking-tight text-balance md:text-3xl">
              The customer is already in the room. The record should be too.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-background/85">
            Insurance, medical aid, and healthcare. One sign-in for the team, and a separate door for the customer.
          </p>
        </div>
      </section>
      <section className="flex items-center px-8 py-12 md:px-14">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex md:hidden" aria-label="CustomerIQ home">
            <Wordmark />
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose a desk, then continue with the demo password.</p>
          <div className="mt-8">
            <LoginForm key={defaultEmail} defaultEmail={defaultEmail} />
          </div>
        </div>
      </section>
    </main>
  );
}
