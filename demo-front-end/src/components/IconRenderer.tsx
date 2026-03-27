import * as LucideIcons from "lucide-react";
import { LucideProps } from "lucide-react";

interface IconRendererProps extends LucideProps {
  name: string;
}

export default function IconRenderer({ name, ...props }: IconRendererProps) {
  // Map PascalCase string (e.g., 'Smile') to Lucide icon component
  const IconComponent = (LucideIcons as any)[name];

  if (!IconComponent) {
    // Show a fallback icon if the string name is invalid/missing
    return <LucideIcons.HelpCircle {...props} />;
  }

  return <IconComponent {...props} />;
}
