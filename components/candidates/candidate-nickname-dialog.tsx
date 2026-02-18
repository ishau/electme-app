"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateCandidateNickname } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface CandidateNicknameDialogProps {
  candidateId: string;
  currentNickname?: string;
}

export function CandidateNicknameDialog({ candidateId, currentNickname }: CandidateNicknameDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setNickname(currentNickname ?? "");
    }
    setOpen(isOpen);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updateCandidateNickname(candidateId, { nickname: nickname.trim() });
        queryClient.invalidateQueries({ queryKey: ["group"] });
        toast.success(nickname.trim() ? "Nickname updated" : "Nickname removed");
        setOpen(false);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1" />}>
        <Pencil className="size-3.5" />
        {currentNickname ? "Edit Nickname" : "Add Nickname"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Candidate Nickname</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nickname</Label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Bodu Ahmed"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              This name will show alongside the candidate&apos;s full name everywhere in the system. Leave empty to remove.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
