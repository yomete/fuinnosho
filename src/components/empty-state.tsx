import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Icon className="h-16 w-16 text-[#3a3430] mb-4" aria-hidden="true" />
      <h3 className="text-lg font-medium text-[#6a6460]">{title}</h3>
      {description && (
        <p className="text-sm text-[#4a4440] mt-1 text-center max-w-md">{description}</p>
      )}
    </div>
  );
}
