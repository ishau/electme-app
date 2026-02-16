"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TeamMemberForm } from "@/components/team/team-member-form";
import { addTeamMember } from "@/lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function AddMemberButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (data: {
    name: string;
    role: string;
    contact_info?: {
      phone_numbers?: string[];
      email?: string;
      notes?: string;
    };
    is_active?: boolean;
    notes?: string;
  }) => {
    startTransition(async () => {
      try {
        await addTeamMember(data);
        queryClient.invalidateQueries({ queryKey: ["group"] });
        toast.success("Team member added");
        setOpen(false);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Member
      </Button>
      <TeamMemberForm
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </>
  );
}
