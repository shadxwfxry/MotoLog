export default function GarageLoading() {
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 bg-muted rounded-xl" />
        <div className="h-10 w-32 bg-muted rounded-xl" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-3xl border border-border bg-card/50 p-6" />
        ))}
      </div>
    </div>
  );
}
