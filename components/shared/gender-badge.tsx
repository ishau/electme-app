import { Badge } from "@/components/ui/badge";

export function GenderBadge({ sex }: { sex: string }) {
  const isFemale = sex === "F" || sex === "Female";
  return (
    <Badge
      variant="outline"
      className={
        isFemale
          ? "leading-snug pb-0 border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-950 dark:text-pink-300"
          : "leading-snug pb-0 border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
      }
    >
      {sex}
    </Badge>
  );
}
