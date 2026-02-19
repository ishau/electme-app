"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateWorkplace } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, Plus } from "lucide-react";
import type { WorkplaceAssignment } from "@/lib/types";

const SECTOR_LABELS: Record<string, string> = {
  government: "Government",
  fenaka: "Fenaka",
  stelco: "Stelco",
  road_corporation: "Road Corporation",
  airport: "Airport",
  other: "Other",
};

interface WorkplaceDialogProps {
  constituentId: string;
  workplaces: WorkplaceAssignment[];
}

export function WorkplaceDialog({ constituentId, workplaces }: WorkplaceDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [organization, setOrganization] = useState("");
  const [position, setPosition] = useState("");
  const [sector, setSector] = useState("");
  const [startDate, setStartDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const active = workplaces.find((w) => w.Period.End === null);

  const resetForm = () => {
    setOrganization("");
    setPosition("");
    setSector("");
    setStartDate("");
    setIsActive(true);
    setNotes("");
    setShowForm(false);
  };

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    setOpen(isOpen);
  };

  const handleSubmit = () => {
    if (!organization || !sector) {
      toast.error("Organization and sector are required");
      return;
    }
    startTransition(async () => {
      try {
        await updateWorkplace(constituentId, {
          organization,
          position,
          sector,
          start_date: startDate || undefined,
          is_active: isActive,
          notes: notes || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ["constituent"] });
        toast.success("Workplace updated");
        resetForm();
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1" />}>
        <Briefcase className="size-3.5" />
        Workplace
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workplace</DialogTitle>
        </DialogHeader>

        {active && !showForm && (
          <div className="rounded-md border p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{active.Organization}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px]">
                  {SECTOR_LABELS[active.Sector] ?? active.Sector}
                </Badge>
                <Badge className="text-[10px] bg-green-600 text-white">Active</Badge>
              </div>
            </div>
            {active.Position && (
              <p className="text-sm text-muted-foreground">{active.Position}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Since {new Date(active.Period.Start).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            {active.Notes && (
              <p className="text-xs text-muted-foreground italic">{active.Notes}</p>
            )}
          </div>
        )}

        {!active && !showForm && (
          <p className="text-sm text-muted-foreground">No active workplace recorded.</p>
        )}

        {showForm ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Organization</Label>
              <Input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Ministry of Health"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Position</Label>
                <Input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Officer"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sector</Label>
                <Select
                  value={sector}
                  onValueChange={(v) => setSector(v ?? "")}
                  items={SECTOR_LABELS}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">Leave empty for today</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-center gap-2 w-full h-9 px-3 rounded-md border text-sm transition-colors ${
                    isActive
                      ? "border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "border-input bg-transparent text-muted-foreground"
                  }`}
                >
                  <span className={`size-2 rounded-full ${isActive ? "bg-green-600" : "bg-muted-foreground"}`} />
                  {isActive ? "Currently active" : "Not active"}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending} onClick={handleSubmit}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 w-fit"
            onClick={() => setShowForm(true)}
          >
            <Plus className="size-3.5" />
            {active ? "Change workplace" : "Add workplace"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
