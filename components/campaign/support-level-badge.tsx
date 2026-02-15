import { Badge } from "@/components/ui/badge";
import { supportLevelColor, supportLevelLabel } from "@/lib/utils";

export function SupportLevelBadge({ level }: { level: string }) {
  return (
    <Badge className={supportLevelColor(level)}>
      {supportLevelLabel(level)}
    </Badge>
  );
}
