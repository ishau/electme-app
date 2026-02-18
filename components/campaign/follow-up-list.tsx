"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { outreachMethodLabel, formatDate } from "@/lib/utils";
import type { OutreachLog } from "@/lib/types";

interface FollowUpListProps {
  followUps: OutreachLog[];
}

export function FollowUpList({ followUps }: FollowUpListProps) {
  return (
    <div className="space-y-2">
      {followUps.map((fu) => (
        <Card key={fu.ID}>
          <CardContent>
            <div className="flex items-center justify-between">
              <Link
                href={`/constituents/${fu.ConstituentID}`}
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                {fu.ConstituentID.slice(0, 8)}...
              </Link>
              <Badge variant="outline">{outreachMethodLabel(fu.Method)}</Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Follow-up: {formatDate(fu.FollowUpDate)}</span>
              <span>|</span>
              <span>Last contact by {fu.ContactedBy}</span>
            </div>
            {fu.Notes && <p className="text-xs mt-1">{fu.Notes}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
