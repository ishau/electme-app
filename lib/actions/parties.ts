"use server";

import { revalidatePath } from "next/cache";
import { post, del } from "@/lib/api";
import type { Party } from "@/lib/types";

export async function createParty(data: { code: string; name: string }) {
  await post<Party>("/parties", data);
  revalidatePath("/settings/parties");
}

export async function deleteParty(partyId: string) {
  await del(`/parties/${partyId}`);
  revalidatePath("/settings/parties");
}
