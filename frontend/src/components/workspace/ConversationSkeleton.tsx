export function ConversationSkeleton() {
  return (
    <div className="flex h-full flex-col p-6 animate-pulse">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 rounded bg-black-10" />
          <div className="h-5 w-16 rounded bg-black-10" />
          <div className="h-5 w-14 rounded bg-black-10" />
        </div>
        <div className="h-5 w-3/4 rounded bg-black-10" />
        <div className="space-y-1">
          <div className="h-3 w-1/3 rounded bg-black-10" />
          <div className="h-3 w-1/2 rounded bg-black-10" />
        </div>
      </div>
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}>
            <div className="h-8 w-8 shrink-0 rounded-full bg-black-10" />
            <div className={`space-y-1.5 ${i % 2 === 0 ? "" : "items-end"} flex flex-col`}>
              <div className="h-3 w-16 rounded bg-black-10" />
              <div className={`rounded-lg bg-black-10 p-3 ${i % 2 === 0 ? "rounded-bl-sm" : "rounded-br-sm"}`}>
                <div className="h-3 w-48 bg-light rounded" />
                <div className="mt-1.5 h-3 w-36 bg-light rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
