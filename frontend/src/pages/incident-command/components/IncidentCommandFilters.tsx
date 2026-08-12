export function IncidentCommandFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {["Environment", "Severity", "Status", "Region", "Service"].map((label) => (
        <div key={label} className="relative">
          <button type="button" className="flex items-center gap-1 rounded-full border border-black-10 bg-white px-3 py-1.5 text-xs font-medium text-black-45 transition-colors hover:border-[#2563EB] hover:text-primary">
            {label}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      ))}
      <div className="ml-auto">
        <input type="text" placeholder="Search incident..." className="rounded-lg border border-black-10 bg-white px-3 py-1.5 text-xs text-black-85 outline-none placeholder:text-black-25 focus:border-[#2563EB] w-48" />
      </div>
    </div>
  );
}
