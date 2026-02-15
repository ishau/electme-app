"use server";

import { revalidatePath } from "next/cache";
import { get, post, put, del } from "@/lib/api";
import type { Atoll, Island, Constituency, AddressLocation, AddressWithCount, HeatMapPoint } from "@/lib/types";

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

export async function saveAddressLocation(data: {
  island_id: string;
  address_name: string;
  latitude: number;
  longitude: number;
}) {
  await put<AddressLocation>("/address-locations", data);
  revalidatePath("/settings/geography");
  revalidatePath("/maps");
}

export async function deleteAddressLocation(id: string) {
  await del(`/address-locations/${id}`);
  revalidatePath("/settings/geography");
  revalidatePath("/maps");
}

export async function getIslandsByAtoll(atollId: string) {
  return (await get<Island[]>(`/atolls/${atollId}/islands`)) ?? [];
}

export async function getAddressLocationsByIsland(islandId: string) {
  return (await get<AddressLocation[]>(`/islands/${islandId}/address-locations`)) ?? [];
}

export async function getUniqueAddresses(islandId: string) {
  return (await get<AddressWithCount[]>(`/islands/${islandId}/unique-addresses`)) ?? [];
}

export async function getAddressesWithCounts(islandId: string, groupId: string) {
  return (await get<AddressWithCount[]>(`/islands/${islandId}/addresses`, { group_id: groupId })) ?? [];
}

export async function getHeatMapData(islandId: string, groupId: string) {
  return (await get<HeatMapPoint[]>(`/islands/${islandId}/heat-map`, { group_id: groupId })) ?? [];
}
