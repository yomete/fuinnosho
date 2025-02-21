import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] p-4">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {description}
      </p>
    </div>
  );
}
