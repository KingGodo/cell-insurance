"use client";

import { useState } from "react";
import { receiveCsv } from "@/lib/actions";

const example = `customerCode,firstName,lastName,email,phone,dateOfBirth,location,customerSince,engagement,preferredChannel
CUS-20001,Rudo,Moyo,rudo.moyo@cellgroup.demo,+263 77 555 0101,1990-04-12,Harare,2024-01-15,MEDIUM,WHATSAPP`;

type Result = { received: number; created: number; updated: number; errors: string[] };

export function CsvEntry({ columns }: { columns: string[] }) {
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    setResult(null);
    setError("");
    if (!file) {
      setFileName("");
      setCsv("");
      return;
    }
    setFileName(file.name);
    setCsv(await file.text());
  }

  async function onSubmit() {
    setPending(true);
    setError("");
    setResult(null);
    try {
      setResult(await receiveCsv(csv));
    } catch {
      setError("The file could not be received. Check that the API is running.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold tracking-tight">CSV data entry</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        A customer file is the other way into the book. Policies, medical aid, healthcare, engagement, and payments still arrive through their APIs.
      </p>
      <p className="mt-6 text-xs text-muted-foreground">Columns</p>
      <p className="mt-1 text-sm leading-relaxed">{columns.join(", ")}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        engagement is HIGH, MEDIUM, or LOW. preferredChannel is DIGITAL, WHATSAPP, CALL_CENTRE, or BRANCH. Dates are YYYY-MM-DD.
      </p>
      <label className="mt-8 flex h-24 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border px-4 text-sm text-muted-foreground hover:bg-secondary">
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        {fileName || "Choose a CSV file"}
      </label>
      <button
        type="button"
        disabled={!csv || pending}
        onClick={onSubmit}
        className="mt-4 inline-flex h-9 items-center rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
      >
        {pending ? "Receiving…" : "Receive file"}
      </button>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {result ? (
        <div className="mt-6 text-sm" role="status">
          <p>
            {result.created} added · {result.updated} updated · {result.received} rows read
          </p>
          {result.errors.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {result.errors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <pre className="mt-8 overflow-x-auto text-xs leading-relaxed text-muted-foreground">{example}</pre>
    </div>
  );
}
