import * as XLSX from "xlsx";

export type VoterRow = { nim: string | null; email: string | null; name: string | null };

const ALIASES = {
  nim: ["nim", "nomorindukmahasiswa", "studentid", "nomorinduk"],
  email: ["email", "emailaddress", "alamatemail", "surel"],
  name: ["nama", "name", "namalengkap"],
} as const;

export function normalizeIdentity(value: string) {
  return value.trim().toLowerCase();
}

function normHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

function findColumn(headers: string[], aliases: readonly string[]) {
  return headers.find((h) => aliases.includes(normHeader(h)));
}

/** Baca file .xlsx/.xls/.csv; kolom dikenali dari header: NIM, Email, Nama. */
export function parseVoterFile(buffer: ArrayBuffer): VoterRow[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (records.length === 0) return [];

  const headers = Object.keys(records[0]);
  const nimCol = findColumn(headers, ALIASES.nim);
  const emailCol = findColumn(headers, ALIASES.email);
  const nameCol = findColumn(headers, ALIASES.name);
  if (!nimCol && !emailCol) return [];

  const seenNim = new Set<string>();
  const seenEmail = new Set<string>();
  const rows: VoterRow[] = [];

  for (const record of records) {
    const nim = nimCol ? normalizeIdentity(String(record[nimCol] ?? "")) : "";
    const email = emailCol ? normalizeIdentity(String(record[emailCol] ?? "")) : "";
    const name = nameCol ? String(record[nameCol] ?? "").trim() : "";
    if (!nim && !email) continue;
    if ((nim && seenNim.has(nim)) || (email && seenEmail.has(email))) continue;
    if (nim) seenNim.add(nim);
    if (email) seenEmail.add(email);
    rows.push({ nim: nim || null, email: email || null, name: name || null });
  }
  return rows;
}
