"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { Globe, MapPin } from "lucide-react";
import { get } from "@/lib/api";
import type { Atoll, Island, Constituency } from "@/lib/types";

interface GeographyViewProps {
  atolls: Atoll[];
  constituencies: Constituency[];
}

export function GeographyView({ atolls, constituencies }: GeographyViewProps) {
  const [selectedAtoll, setSelectedAtoll] = useState<string>("");
  const [islands, setIslands] = useState<Island[]>([]);

  const handleSelectAtoll = async (atollId: string) => {
    setSelectedAtoll(atollId);
    try {
      setIslands((await get<Island[]>(`/group/atolls/${atollId}/islands`)) ?? []);
    } catch {
      setIslands([]);
    }
  };

  return (
    <Tabs defaultValue="atolls">
      <TabsList variant="line" className="border-b w-full justify-start px-0">
        <TabsTrigger value="atolls" className="gap-1.5">
          <Globe className="h-4 w-4" />
          Atolls & Islands
        </TabsTrigger>
        <TabsTrigger value="constituencies" className="gap-1.5">
          <MapPin className="h-4 w-4" />
          Constituencies
        </TabsTrigger>
      </TabsList>

      <TabsContent value="atolls" className="space-y-4 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atolls</CardTitle>
            </CardHeader>
            <CardContent>
              {atolls.length === 0 ? (
                <EmptyState icon={Globe} title="No atolls" />
              ) : (
                <div className="space-y-1">
                  {atolls.map((atoll) => (
                    <button
                      key={atoll.ID}
                      onClick={() => handleSelectAtoll(atoll.ID)}
                      className={`w-full text-left p-2 rounded text-sm hover:bg-muted transition-colors ${
                        selectedAtoll === atoll.ID ? "bg-muted font-medium" : ""
                      }`}
                    >
                      <Badge variant="outline" className="mr-2">
                        {atoll.Code}
                      </Badge>
                      {atoll.Name}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Islands {selectedAtoll ? `(${atolls.find((a) => a.ID === selectedAtoll)?.Name ?? ""})` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedAtoll ? (
                <p className="text-sm text-muted-foreground">Select an atoll to view islands</p>
              ) : islands.length === 0 ? (
                <EmptyState icon={MapPin} title="No islands" />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {islands.map((island) => (
                        <TableRow key={island.ID}>
                          <TableCell className="font-medium">{island.Code}</TableCell>
                          <TableCell>{island.Name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="constituencies" className="space-y-4 mt-6">
        {constituencies.length === 0 ? (
          <EmptyState icon={Globe} title="No constituencies" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Islands</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {constituencies.map((c) => (
                  <TableRow key={c.ID}>
                    <TableCell className="font-medium">{c.Code}</TableCell>
                    <TableCell>{c.Name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {c.Islands?.length ?? 0} islands
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
