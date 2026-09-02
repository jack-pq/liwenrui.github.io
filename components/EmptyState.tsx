import { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-ink-200 mb-3">
        {icon || <Inbox size={36} strokeWidth={1.5} />}
      </div>
      <p className="text-ink-500 font-medium">{title}</p>
      {hint && <p className="text-sm text-ink-300 mt-1 max-w-xs">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
