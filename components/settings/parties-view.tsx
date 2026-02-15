"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Trash2, Building2 } from "lucide-react";
import { createParty, deleteParty } from "@/lib/actions/parties";
import { toast } from "sonner";
import type { Party } from "@/lib/types";

interface PartiesViewProps {
  parties: Party[];
}

export function PartiesView({ parties }: PartiesViewProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createParty({ code, name });
        toast.success("Party created");
        setOpen(false);
        setCode("");
        setName("");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const handleDelete = (partyId: string) => {
    if (!confirm("Delete this party?")) return;
    startTransition(async () => {
      try {
        await deleteParty(partyId);
        toast.success("Party deleted");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Party
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Create Party</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g., MDP"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full party name"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {parties.length === 0 ? (
        <EmptyState icon={Building2} title="No parties" description="Add your first political party." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parties.map((party) => (
                <TableRow key={party.ID}>
                  <TableCell className="font-medium">{party.Code}</TableCell>
                  <TableCell>{party.Name}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(party.ID)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
