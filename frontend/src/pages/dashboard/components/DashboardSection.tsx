import { cn } from "@/lib/utils";

interface Props {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({ title, children, className }: Props) {
  return (
    <section className={cn(className)}>
      <h2 className="text-xs font-semibold text-black-85 tracking-wide mb-3 pb-2 border-b border-black-5">
        {title}
      </h2>
      {children}
    </section>
  );
}
