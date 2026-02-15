"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TeamMemberForm } from "@/components/team/team-member-form";
import { addTeamMember } from "@/lib/actions/groups";
import { toast } from "sonner";

export function AddMemberButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (data: {
    name: string;
    role: string;
    contact_info?: {
      mobile_numbers?: string[];
      email?: string;
      viber?: string;
      notes?: string;
    };
    is_active?: boolean;
    notes?: string;
  }) => {
    startTransition(async () => {
      try {
        await addTeamMember(data);
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
