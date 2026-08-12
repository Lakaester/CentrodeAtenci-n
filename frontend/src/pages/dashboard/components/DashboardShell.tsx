interface Props {
  children: React.ReactNode;
  header: React.ReactNode;
}

export function DashboardShell({ children, header }: Props) {
  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-3 pb-2 md:px-6">
        {header}
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5 md:px-6 md:pb-6">
        {children}
      </div>
    </div>
  );
}
