export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 rounded-full bg-secondary" />
      <div className="h-14 w-80 max-w-full rounded-2xl bg-secondary" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-32 rounded-2xl bg-secondary" />
        <div className="h-32 rounded-2xl bg-secondary" />
        <div className="h-32 rounded-2xl bg-secondary" />
      </div>
    </div>
  );
}
