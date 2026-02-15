"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { importVoters } from "@/lib/actions/constituents";
import type { VoterImportEntry, ImportResult } from "@/lib/types";
import { Upload } from "lucide-react";

interface ImportVotersDialogProps {
  constituencyId: string;
}

export function ImportVotersDialog({
  constituencyId,
}: ImportVotersDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<VoterImportEntry[]>([]);
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  function reset() {
    setRawText("");
    setParsed([]);
    setParseError("");
    setResult(null);
  }

  function handleParse() {
    setParseError("");
    setResult(null);

    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setParseError("No data to parse.");
      return;
    }

    const entries: VoterImportEntry[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].split("\t");
      if (cols.length < 5) {
        errors.push(
          `Line ${i + 1}: expected at least 5 tab-separated columns, got ${cols.length}`
        );
        continue;
      }

      const [masked_national_id, full_name, sex, island_id, address] = cols.map(
        (c) => c.trim()
      );

      if (!masked_national_id || !full_name || !sex || !island_id || !address) {
        errors.push(`Line ${i + 1}: missing required field(s)`);
        continue;
      }

      entries.push({
        masked_national_id,
        full_name,
        sex,
        island_id,
        address,
        constituency_id: constituencyId,
      });
    }

    if (errors.length > 0) {
      setParseError(errors.join("\n"));
    }

    setParsed(entries);
  }

  function handleSubmit() {
    if (parsed.length === 0) return;

    startTransition(async () => {
      try {
        const res = await importVoters(parsed);
        setResult(res);

        const parts: string[] = [];
        if (res.Created > 0) parts.push(`${res.Created} created`);
        if (res.Updated > 0) parts.push(`${res.Updated} updated`);
        if (res.Skipped > 0) parts.push(`${res.Skipped} skipped`);
        if (res.Errors?.length > 0)
          parts.push(`${res.Errors.length} errors`);

        toast.success(`Import complete: ${parts.join(", ")}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Import failed"
        );
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="size-4 mr-1.5" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Voters</DialogTitle>
          <DialogDescription>
            Paste tab-separated data with columns: masked_national_id, full_name,
            sex, island_id, address
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <Textarea
              rows={8}
              placeholder={
                "AXXX001\tAhmed Ali\tM\t<island-uuid>\tMale, Hdh. Kulhudhuffushi\n" +
                "AXXX002\tFatima Hassan\tF\t<island-uuid>\tDhondheenimaage, Hdh. Kulhudhuffushi"
              }
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setParsed([]);
                setParseError("");
              }}
            />

            {parseError && (
              <pre className="text-sm text-destructive whitespace-pre-wrap">
                {parseError}
              </pre>
            )}

            {parsed.length > 0 && (
              <div className="border rounded-md overflow-auto max-h-60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Masked ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Island ID</TableHead>
                      <TableHead>Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.map((entry, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {entry.masked_national_id}
                        </TableCell>
                        <TableCell>{entry.full_name}</TableCell>
                        <TableCell>{entry.sex}</TableCell>
                        <TableCell className="font-mono text-xs max-w-24 truncate">
                          {entry.island_id}
                        </TableCell>
                        <TableCell>{entry.address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter>
              {parsed.length === 0 ? (
                <Button
                  type="button"
                  onClick={handleParse}
                  disabled={!rawText.trim()}
                >
                  Parse
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setParsed([]);
                      setParseError("");
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending}
                  >
                    {isPending
                      ? "Importing..."
                      : `Import ${parsed.length} voter${parsed.length === 1 ? "" : "s"}`}
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-md border p-3">
                <div className="text-2xl font-bold">{result.Created}</div>
                <div className="text-sm text-muted-foreground">Created</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-2xl font-bold">{result.Updated}</div>
                <div className="text-sm text-muted-foreground">Updated</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-2xl font-bold">{result.Skipped}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
            </div>

            {result.Errors && result.Errors.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-destructive">
                  {result.Errors.length} error{result.Errors.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-2 space-y-1 list-disc pl-5">
                  {result.Errors.map((e, i) => (
                    <li key={i}>
                      <span className="font-mono">
                        {e.Entry.masked_national_id}
                      </span>
                      : {e.Reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              <Button type="button" onClick={reset}>
                Import More
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
