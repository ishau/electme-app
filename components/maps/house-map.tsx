"use client";

import dynamic from "next/dynamic";
import type { House } from "@/lib/types";

const HouseMapInner = dynamic(
  () => import("./house-map-inner").then((mod) => mod.HouseMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] bg-muted animate-pulse rounded-md" />
    ),
  }
);

interface HouseMapProps {
  houses: House[];
  selectedHouseId: string | null;
  editMode: boolean;
  onLocationSet: (lat: number, lng: number) => void;
  onHouseClick?: (houseId: string) => void;
  className?: string;
}

export function HouseMap(props: HouseMapProps) {
  return <HouseMapInner {...props} />;
}
