import { Badge } from "@/components/ui/badge";
import { labelize } from "@/lib/format";

export function SignalBadge({ signal }: { signal: string }) {
  if (signal === "HIGH_PRIORITY") {
    return <Badge className="bg-foreground text-primary">High priority</Badge>;
  }
  if (signal === "REVIEW_REQUIRED") {
    return <Badge variant="outline">Review required</Badge>;
  }
  return <Badge variant="secondary">{labelize(signal)}</Badge>;
}
