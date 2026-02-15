"use server";

import { revalidatePath } from "next/cache";
import { post } from "@/lib/api";
import type { VoterImportEntry, ImportResult } from "@/lib/types";

export async function importVoters(entries: VoterImportEntry[]) {
  const result = await post<ImportResult>("/constituents/import", {
    entries,
  });
  revalidatePath("/constituents");
  return result;
}
