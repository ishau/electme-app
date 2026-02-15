"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { importVoters } from "@/lib/actions/constituents";
import type { Island } from "@/lib/types";
import { UserPlus } from "lucide-react";

interface AddVoterFormProps {
  constituencyId: string;
  islands: Island[];
}

export function AddVoterForm({ constituencyId, islands }: AddVoterFormProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [maskedNationalId, setMaskedNationalId] = useState("");
  const [fullNationalId, setFullNationalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [sex, setSex] = useState("");
  const [dob, setDob] = useState("");
  const [islandId, setIslandId] = useState("");
  const [address, setAddress] = useState("");

  function resetForm() {
    setMaskedNationalId("");
    setFullNationalId("");
    setFullName("");
    setSex("");
    setDob("");
    setIslandId("");
    setAddress("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      try {
        const result = await importVoters([
          {
            masked_national_id: maskedNationalId,
            full_national_id: fullNationalId || undefined,
            full_name: fullName,
            sex,
            dob: dob || undefined,
            island_id: islandId,
            address,
            constituency_id: constituencyId,
          },
        ]);

        if (result.Errors && result.Errors.length > 0) {
          toast.error(result.Errors[0].Reason);
        } else if (result.Created > 0) {
          toast.success("1 voter created");
          resetForm();
          setOpen(false);
        } else if (result.Updated > 0) {
          toast.success("1 voter updated");
          resetForm();
          setOpen(false);
        } else {
          toast.info("Voter skipped (no changes)");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add voter");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4 mr-1.5" />
          Add Voter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Voter</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="masked-nid">Masked National ID</Label>
            <Input
              id="masked-nid"
              placeholder="AXXX###"
              value={maskedNationalId}
              onChange={(e) => setMaskedNationalId(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="full-nid">Full National ID (optional)</Label>
            <Input
              id="full-nid"
              placeholder="A######"
              value={fullNationalId}
              onChange={(e) => setFullNationalId(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Gender</Label>
              <Select value={sex} onValueChange={setSex} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dob">Date of Birth (optional)</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Island</Label>
            <Select value={islandId} onValueChange={setIslandId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select island" />
              </SelectTrigger>
              <SelectContent>
                {islands.map((island) => (
                  <SelectItem key={island.ID} value={island.ID}>
                    {island.Code} — {island.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !sex || !islandId}>
              {isPending ? "Adding..." : "Add Voter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
