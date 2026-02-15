"use server";

import { revalidatePath } from "next/cache";
import { post } from "@/lib/api";
import type { Atoll, Island, Constituency } from "@/lib/types";

export async function createAtoll(data: { code: string; name: string }) {
  await post<Atoll>("/atolls", data);
  revalidatePath("/settings/geography");
}

export async function createIsland(data: { atoll_id: string; code: string; name: string }) {
  await post<Island>("/islands", data);
  revalidatePath("/settings/geography");
}

export async function createConstituency(data: {
  code: string;
  name: string;
  atoll_id: string;
  islands: string[];
}) {
  await post<Constituency>("/constituencies", data);
  revalidatePath("/settings/geography");
}
