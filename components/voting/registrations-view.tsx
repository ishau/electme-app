"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ClipboardList } from "lucide-react";
import { updateTransport } from "@/lib/actions/voting";
import { transportStatusLabel, transportStatusColor } from "@/lib/utils";
import { toast } from "sonner";
import type { VoterRegistration, Constituency } from "@/lib/types";

interface RegistrationsViewProps {
  registrations: VoterRegistration[];
  constituencies: Constituency[];
  currentConstituencyId: string;
  showTransportOnly: boolean;
}

export function RegistrationsView({
  registrations,
  constituencies,
  currentConstituencyId,
  showTransportOnly,
}: RegistrationsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleConstituencyChange = (value: string) => {
    const params = new URLSearchParams();
    if (value && value !== "all") params.set("constituency_id", value);
    if (showTransportOnly) params.set("transport_only", "true");
    const qs = params.toString();
    router.push(`/registrations${qs ? `?${qs}` : ""}`);
  };

  const handleTransportToggle = () => {
    const params = new URLSearchParams();
    if (currentConstituencyId) params.set("constituency_id", currentConstituencyId);
    if (!showTransportOnly) params.set("transport_only", "true");
    const qs = params.toString();
    router.push(`/registrations${qs ? `?${qs}` : ""}`);
  };

  const handleTransportUpdate = (registrationId: string, status: string) => {
    startTransition(async () => {
      try {
        await updateTransport(registrationId, { status });
        toast.success("Transport status updated");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={currentConstituencyId || "all"} onValueChange={handleConstituencyChange}>
          <SelectTrigger>
            <SelectValue placeholder="All constituencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All constituencies</SelectItem>
            {constituencies.map((c) => (
              <SelectItem key={c.ID} value={c.ID}>
                {c.Code} — {c.Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showTransportOnly ? "default" : "outline"}
          onClick={handleTransportToggle}
        >
          Transport Needed
        </Button>
      </div>

      {registrations.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No registrations" description="No registrations match the current filters." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Constituent</TableHead>
                <TableHead className="hidden sm:table-cell">Re-registered</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead className="w-[140px]">Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg) => (
                <TableRow key={reg.ID}>
                  <TableCell className="font-mono text-xs">
                    {reg.ConstituentID.slice(0, 12)}...
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {reg.IsReregistered ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${transportStatusColor(reg.TransportStatus)}`}>
                      {transportStatusLabel(reg.TransportStatus)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={reg.TransportStatus}
                      onValueChange={(value) => handleTransportUpdate(reg.ID, value)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_needed">Not Needed</SelectItem>
                        <SelectItem value="needed">Needed</SelectItem>
                        <SelectItem value="arranged">Arranged</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
