/**
 * Pre-download unique gender/age-matched patient avatars into public/avatars.
 *
 * Usage (with backend running):
 *   node scripts/download-avatars.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public/avatars');
const API = process.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

async function login() {
  const body = new URLSearchParams({
    username: 'doctor@longcare.ca',
    password: 'demo1234',
  });
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function listPatients(token) {
  const res = await fetch(`${API}/patients`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Patients failed: ${res.status}`);
  return res.json();
}

async function fetchPortraitPool(pages = 20) {
  const seen = new Set();
  const pool = [];
  for (let page = 1; page <= pages; page += 1) {
    const res = await fetch('https://randomuser.me/api/?results=100&inc=dob,picture,gender&noinfo');
    const data = await res.json();
    for (const p of data.results || []) {
      const url = p.picture?.large;
      if (!url || seen.has(url)) continue;
      seen.add(url);
      pool.push({ gender: p.gender, age: Number(p.dob.age), url });
    }
    process.stdout.write(`pool=${pool.length}\n`);
  }
  return pool;
}

function pickBest(pool, gender, age, used) {
  let best = null;
  let bestDiff = Infinity;
  for (const p of pool) {
    if (p.gender !== gender || used.has(p.url)) continue;
    const diff = Math.abs(p.age - age);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = p;
      if (diff === 0) break;
    }
  }
  return { best, bestDiff };
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const token = await login();
  const patients = await listPatients(token);
  const pool = await fetchPortraitPool(20);
  const used = new Set();
  const manifest = {};

  for (const patient of patients) {
    const gender = String(patient.gender || '').toLowerCase().startsWith('f') ? 'female' : 'male';
    const age = Number(patient.age) || 40;
    const { best, bestDiff } = pickBest(pool, gender, age, used);
    if (!best) throw new Error(`No unused portrait for ${patient.mrn} (${gender})`);
    used.add(best.url);
    const file = `${patient.mrn}.jpg`;
    await download(best.url, path.join(outDir, file));
    manifest[patient.mrn] = {
      file,
      gender,
      patientAge: age,
      photoAge: best.age,
      ageDiff: bestDiff,
      source: best.url,
    };
    process.stdout.write(`${patient.mrn} age=${age} photoAge=${best.age} diff=${bestDiff}\n`);
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Downloaded ${Object.keys(manifest).length} avatars -> ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
