import { type LucideIcon } from "lucide-react";
import { Button } from "./Button";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-light">
          <Icon size={28} className="text-black-45" />
        </div>
        <h3 className="text-base font-semibold text-black-85">{title}</h3>
        <p className="mt-1 text-sm text-black-45">{description}</p>
        {actionLabel && onAction && (
          <Button variant="primary" size="sm" className="mt-4" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
