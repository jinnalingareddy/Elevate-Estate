/**
 * Converts the official SEPOMEX TXT export into mexico-postal-codes.json.
 *
 * Usage:
 *   node scripts/build-postal-codes.mjs <path-to-sepomex-file.txt>
 *
 * Download the source file from:
 *   https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/CodigoPostal_Exportar.aspx
 *   → select format TXT (pipe-delimited)
 *
 * Output: data/mexico-postal-codes.json
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT = path.resolve(__dirname, "../data/mexico-postal-codes.json");

const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Usage: node scripts/build-postal-codes.mjs <path-to-sepomex-file.txt>");
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`File not found: ${inputFile}`);
  process.exit(1);
}

// SEPOMEX TXT files are Windows-1252 encoded
const stream = fs.createReadStream(inputFile, { encoding: "latin1" });
const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

const result = {};
let headers = null;
let lineCount = 0;

function idx(name) {
  const i = headers.indexOf(name);
  if (i === -1) throw new Error(`Column "${name}" not found in headers: ${headers.join("|")}`);
  return i;
}

rl.on("line", (raw) => {
  const line = raw.trim();
  if (!line) return;

  const cols = line.split("|");

  if (!headers) {
    // Skip preamble lines (no pipe delimiter); first pipe-delimited line is the header
    if (!line.includes("|")) return;
    headers = cols.map((h) => h.trim());
    return;
  }

  lineCount++;

  const cp = cols[idx("d_codigo")]?.trim();
  const colonia = cols[idx("d_asenta")]?.trim();
  const municipio = cols[idx("D_mnpio")]?.trim();
  const estado = cols[idx("d_estado")]?.trim();
  const ciudad = cols[idx("d_ciudad")]?.trim() ?? "";

  if (!cp || !/^\d{5}$/.test(cp)) return;

  if (!result[cp]) {
    result[cp] = { municipio, estado, ciudad, colonias: [] };
  }

  // Fill in municipio/estado/ciudad from first row that has them
  if (!result[cp].municipio && municipio) result[cp].municipio = municipio;
  if (!result[cp].estado && estado) result[cp].estado = estado;
  if (!result[cp].ciudad && ciudad) result[cp].ciudad = ciudad;

  if (colonia && !result[cp].colonias.includes(colonia)) {
    result[cp].colonias.push(colonia);
  }
});

rl.on("close", () => {
  const cpCount = Object.keys(result).length;
  console.log(`Parsed ${lineCount} rows → ${cpCount} unique postal codes`);

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 0), "utf8");
  const sizeMB = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(1);
  console.log(`Written to ${OUTPUT} (${sizeMB} MB)`);

  // Quick spot-checks
  const checks = ["11230", "64000", "44100", "72000", "06600"];
  console.log("\nSpot-checks:");
  for (const cp of checks) {
    const entry = result[cp];
    if (entry) {
      console.log(`  ✓ ${cp}: ${entry.municipio}, ${entry.estado} (${entry.colonias.length} colonias)`);
    } else {
      console.log(`  ✗ ${cp}: NOT FOUND`);
    }
  }
});
