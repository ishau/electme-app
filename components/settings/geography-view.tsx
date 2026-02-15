"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Globe, MapPin } from "lucide-react";
import { createAtoll, createIsland, createConstituency } from "@/lib/actions/geography";
import { toast } from "sonner";
import type { Atoll, Island, Constituency } from "@/lib/types";

interface GeographyViewProps {
  atolls: Atoll[];
  constituencies: Constituency[];
}

export function GeographyView({ atolls, constituencies }: GeographyViewProps) {
  const [isPending, startTransition] = useTransition();

  const [selectedAtoll, setSelectedAtoll] = useState<string>("");
  const [islands, setIslands] = useState<Island[]>([]);

  // Atoll form
  const [atollOpen, setAtollOpen] = useState(false);
  const [atollCode, setAtollCode] = useState("");
  const [atollName, setAtollName] = useState("");

  // Island form
  const [islandOpen, setIslandOpen] = useState(false);
  const [islandCode, setIslandCode] = useState("");
  const [islandName, setIslandName] = useState("");

  // Constituency form
  const [constOpen, setConstOpen] = useState(false);
  const [constCode, setConstCode] = useState("");
  const [constName, setConstName] = useState("");

  const handleSelectAtoll = async (atollId: string) => {
    setSelectedAtoll(atollId);
    try {
      const res = await fetch(`/api/v1/atolls/${atollId}/islands`);
      if (res.ok) {
        setIslands(await res.json());
      }
    } catch {
      setIslands([]);
    }
  };

  const handleCreateAtoll = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createAtoll({ code: atollCode, name: atollName });
        toast.success("Atoll created");
        setAtollOpen(false);
        setAtollCode("");
        setAtollName("");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const handleCreateIsland = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAtoll) {
      toast.error("Select an atoll first");
      return;
    }
    startTransition(async () => {
      try {
        await createIsland({ atoll_id: selectedAtoll, code: islandCode, name: islandName });
        toast.success("Island created");
        setIslandOpen(false);
        setIslandCode("");
        setIslandName("");
        handleSelectAtoll(selectedAtoll);
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  const handleCreateConstituency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAtoll) {
      toast.error("Select an atoll first");
      return;
    }
    startTransition(async () => {
      try {
        await createConstituency({
          code: constCode,
          name: constName,
          atoll_id: selectedAtoll,
          islands: [],
        });
        toast.success("Constituency created");
        setConstOpen(false);
        setConstCode("");
        setConstName("");
      } catch (err) {
        toast.error(`Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    });
  };

  return (
    <Tabs defaultValue="atolls">
      <TabsList>
        <TabsTrigger value="atolls">Atolls & Islands</TabsTrigger>
        <TabsTrigger value="constituencies">Constituencies</TabsTrigger>
      </TabsList>

      <TabsContent value="atolls" className="space-y-4 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Atolls</CardTitle>
              <Dialog open={atollOpen} onOpenChange={setAtollOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Create Atoll</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateAtoll} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Code</Label>
                      <Input
                        value={atollCode}
                        onChange={(e) => setAtollCode(e.target.value)}
                        placeholder="e.g., B"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={atollName}
                        onChange={(e) => setAtollName(e.target.value)}
                        placeholder="e.g., Baa"
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setAtollOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        Create
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Islands {selectedAtoll ? `(${atolls.find((a) => a.ID === selectedAtoll)?.Name ?? ""})` : ""}
              </CardTitle>
              {selectedAtoll && (
                <Dialog open={islandOpen} onOpenChange={setIslandOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Create Island</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateIsland} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Code</Label>
                        <Input
                          value={islandCode}
                          onChange={(e) => setIslandCode(e.target.value)}
                          placeholder="e.g., B. Fehendhoo"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={islandName}
                          onChange={(e) => setIslandName(e.target.value)}
                          placeholder="e.g., Fehendhoo"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIslandOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                          Create
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
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

      <TabsContent value="constituencies" className="space-y-4 mt-4">
        <div className="flex justify-end">
          <Dialog open={constOpen} onOpenChange={setConstOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Constituency
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Create Constituency</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateConstituency} className="space-y-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={constCode}
                    onChange={(e) => setConstCode(e.target.value)}
                    placeholder="e.g., F12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={constName}
                    onChange={(e) => setConstName(e.target.value)}
                    placeholder="Constituency name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Atoll</Label>
                  <p className="text-xs text-muted-foreground">
                    {selectedAtoll
                      ? `Selected: ${atolls.find((a) => a.ID === selectedAtoll)?.Name}`
                      : "Select an atoll in the Atolls tab first"}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setConstOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending || !selectedAtoll}>
                    Create
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
