// Counts the downloads of every Aether release and saves them: downloads.json has the total and each version's
// files, and downloads.csv gets a line (date,total) each day the total changes. Run by .github/workflows/downloads.yml.
import fs from 'node:fs';

const REPO = process.env.GITHUB_REPOSITORY || 'Redfire3248/aether-download';
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'aether-download' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const releases = [];
for (let page = 1; ; page++) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100&page=${page}`, { headers });
  if (!r.ok) throw new Error(`GitHub answered ${r.status}`);
  const list = await r.json();
  releases.push(...list);
  if (list.length < 100) break;
}

const versions = releases.filter((r) => !r.draft).map((r) => ({
  version: String(r.tag_name).replace(/^v/, ''),
  published: String(r.published_at || '').slice(0, 10),
  downloads: r.assets.reduce((n, a) => n + a.download_count, 0),
  files: Object.fromEntries(r.assets.map((a) => [a.name, a.download_count]))
}));
const total = versions.reduce((n, v) => n + v.downloads, 0);

const read = (f, d) => { try { return fs.readFileSync(f, 'utf8'); } catch { return d; } };
const before = JSON.parse(read('downloads.json', '{}'));
if (before.total === total && JSON.stringify(before.versions) === JSON.stringify(versions)) { console.log(`No change: ${total} downloads`); process.exit(0); }

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync('downloads.json', JSON.stringify({ total, updated: today, versions }, null, 2) + '\n');
const lines = read('downloads.csv', 'date,total\n').trim().split('\n').filter((l) => !l.startsWith(today + ','));
fs.writeFileSync('downloads.csv', [...lines, `${today},${total}`].join('\n') + '\n');
console.log(`${total} downloads`);
