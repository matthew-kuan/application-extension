// Tailored resume profile + full resume profile -> tailored entries with up to n extra bullets each.

const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const words = s => new Set(norm(s).split(' ').filter(w => w.length > 2));

export function similar(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return false;
  let both = 0;
  for (const w of A) if (B.has(w)) both++;
  return both / (A.size + B.size - both) >= 0.5;
}

const sameExp = (a, b) => (norm(a.org) && norm(a.org) === norm(b.org) && (norm(a.title) === norm(b.title) || similar(a.title, b.title)))
  || (norm(a.title) && norm(a.title) === norm(b.title) && (!norm(a.org) || !norm(b.org) || similar(a.org, b.org)));
const projKey = p => norm(p.name.split(':')[0]);
const sameProj = (a, b) => (projKey(a) && projKey(a) === projKey(b)) || similar(a.name, b.name);

function addExtra(list, fullList, same, n) {
  for (const e of list) {
    const m = fullList.find(f => same(e, f));
    if (!m) continue;
    e.bullets.push(...m.bullets.filter(b => !e.bullets.some(x => similar(x, b))).slice(0, n));
    if ('recognition' in e && !e.recognition) e.recognition = m.recognition;
  }
}

export function mergeProfiles(tailored, full, n = 2) {
  if (!tailored) return full;
  const out = structuredClone(tailored);
  if (n > 0) {
    addExtra(out.experience, full.experience, sameExp, n);
    addExtra(out.projects, full.projects, sameProj, n);
  }
  // contact info missing from a trimmed resume falls back to the full one
  for (const k of ['email', 'phone']) out[k] ||= full[k];
  for (const grp of ['name', 'address', 'links']) for (const k in full[grp]) out[grp][k] ||= full[grp][k];
  return out;
}
