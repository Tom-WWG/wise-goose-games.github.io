import 'dotenv/config';

const BASE_URL = process.env.CLOUDFRONT_REPORT_URL;
if (!BASE_URL) {
  throw new Error('CLOUDFRONT_REPORT_URL env var is not set. Add it to .env');
}

// Basic auth header — only sent when credentials are present in env
function authHeaders(): Record<string, string> {
  const u = process.env.CLOUDFRONT_USERNAME;
  const p = process.env.CLOUDFRONT_PASSWORD;
  if (!u || !p) return {};
  const encoded = Buffer.from(`${u}:${p}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

// ── Real CloudFront data shapes ───────────────────────────────────────────────

/** One game record as returned by the CloudFront JSON */
export interface GameRecord {
  appid: number;
  title: string;
  tag_ids: number[];
  pct_positive: number;
  review_count: number;
  est_net_per_month: number;   // estimated monthly net revenue (USD)
  hit_class: 'HIT' | 'PROMISING' | 'TOO EARLY' | 'NICHE';
  capsule_231x87?: string;     // full CDN URL if present
  wilson_lb: number;
}

/** Pre-computed per-tag stats included in each report */
export interface TagEntry {
  tag_id: number;
  tag_name: string;
  weighted_score: number;
  total_games: number;
  hits: number;
  promising: number;
  niche: number;
  success_rate: number;        // 0–100
  avg_revenue: number;         // average est_net_per_month for games with this tag
  example_list: [string, string, number, number][]; // [title, hit_class, revenue, appid]
}

/** Full report file as returned by CloudFront */
export interface ReportFile {
  meta: {
    id: string;       // e.g. "20260225_150619"
    title: string;
    days: number;
    generated: string;
    stats: { total: number; hits: number; promising: number; niche: number };
  };
  games: GameRecord[];
  tags: Record<string, TagEntry>;
  /** Derived ISO date string (set by fetchReport, not in raw JSON) */
  period_end: string;
}

// ── Index shapes ──────────────────────────────────────────────────────────────

export interface ReportIndex {
  reports: string[];
  latest: string;
}

export interface IndexEntry {
  id: string;
  filename: string;
  name: string;
  date: string;
  days: number;
  stats: { total: number; hits: number; promising: number; niche: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive an ISO date string from a report meta.id like "20260225_150619" */
function idToIsoDate(id: string): string {
  const d = id.split('_')[0]; // "20260225"
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00Z`;
}

// ── Fetch functions ───────────────────────────────────────────────────────────

export async function fetchIndex(): Promise<ReportIndex> {
  const url = `${BASE_URL}/index.json`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch index: ${res.status} ${res.statusText} (${url})`);
  const data = await res.json() as unknown;

  // Shape A: { reports: string[], latest: string }
  if (typeof data === 'object' && data !== null && 'reports' in data && !Array.isArray(data)) {
    return data as ReportIndex;
  }
  // Shape B: array of strings
  if (Array.isArray(data) && typeof data[0] === 'string') {
    const sorted = [...data as string[]].sort().reverse();
    return { reports: sorted, latest: sorted[0] };
  }
  // Shape C: array of IndexEntry objects (live CloudFront format)
  if (Array.isArray(data) && typeof data[0] === 'object') {
    const entries = data as IndexEntry[];
    const sorted = [...entries].sort((a, b) => b.id.localeCompare(a.id));
    return { reports: sorted.map(e => e.filename), latest: sorted[0].filename };
  }
  throw new Error(`Unexpected index.json shape: ${JSON.stringify(data).slice(0, 200)}`);
}

export async function fetchReport(filename: string): Promise<ReportFile> {
  const url = `${BASE_URL}/${filename}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch ${filename}: ${res.status} ${res.statusText}`);
  const raw = await res.json() as ReportFile;
  // Derive period_end from meta.id
  raw.period_end = idToIsoDate(raw.meta.id);
  return raw;
}

/**
 * Returns all index entries with metadata, sorted oldest-first.
 * Useful for batch processing.
 */
export async function fetchIndexEntries(): Promise<IndexEntry[]> {
  const url = `${BASE_URL}/index.json`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch index: ${res.status} ${res.statusText}`);
  const data = await res.json() as unknown;
  if (Array.isArray(data)) {
    return (data as IndexEntry[]).sort((a, b) => a.id.localeCompare(b.id)); // oldest first
  }
  throw new Error('fetchIndexEntries: unexpected index.json shape');
}
