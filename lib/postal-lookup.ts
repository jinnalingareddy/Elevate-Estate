interface PostalEntry {
  municipio: string;
  estado: string;
  ciudad: string;
  colonias: string[];
}

// Module-level singleton — fetched once, reused for all lookups
let _promise: Promise<Record<string, PostalEntry>> | null = null;

function getDataset(): Promise<Record<string, PostalEntry>> {
  if (!_promise) {
    _promise = fetch("/postal-codes.json").then((r) => r.json());
  }
  return _promise;
}

/** Call on component mount to pre-warm the dataset before the user finishes typing. */
export function prewarmPostalLookup(): void {
  getDataset();
}

/** Look up a 5-digit Mexican postal code. Returns null if not found. */
export async function lookupPostalCode(cp: string): Promise<PostalEntry | null> {
  const dataset = await getDataset();
  return dataset[cp] ?? null;
}
