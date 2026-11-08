// Resume PDF -> profile object. Pure functions; used by options.js and tests.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const SEASONS = { spring: 1, summer: 6, fall: 9, autumn: 9, winter: 12 };
const ONE_DATE = String.raw`(?:(?:Expected|Anticipated)\s+)?(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+|(?:Spring|Summer|Fall|Autumn|Winter)\s+)?\d{4}`;
const DATE_AT_END = new RegExp(String.raw`\s*(${ONE_DATE}(?:\s*[–—-]\s*(?:${ONE_DATE}|Present|Current|Now))?)\s*$`, 'i');

const SECTIONS = [
  [/^education$/i, 'education'],
  [/^(technical )?skills( & .*)?$/i, 'skills'],
  [/^(research |professional |work |relevant |industry )?experience$/i, 'experience'],
  [/^(leadership|activities|leadership & activities|leadership & involvement|involvement|extracurriculars?)$/i, 'experience'],
  [/^(technical |personal |selected |academic )?projects$/i, 'projects'],
  [/^(licenses (&|and) )?certifications?( (&|and) licenses)?$/i, 'certs'],
  [/^(poster presentations|presentations|publications|honors.*|awards.*|relevant coursework|coursework|interests)$/i, 'other'],
];

export function sectionOf(text) {
  const t = text.trim();
  if (t.includes(':') || t.length > 40) return null; // "Honors: ..." is a detail line, not a heading
  for (const [re, kind] of SECTIONS) if (re.test(t)) return { name: t, kind };
  return null;
}

// pdf.js document bytes -> [{x, segs, text}] in reading order. segs split on wide horizontal gaps
// (right-aligned dates/locations end up in their own segment).
export async function pdfToLines(pdfjs, data) {
  const doc = await pdfjs.getDocument({ data, verbosity: 0, isEvalSupported: false }).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const { items } = await (await doc.getPage(p)).getTextContent();
    const rows = [];
    for (const it of items) {
      if (!it.str.trim()) continue;
      const x = it.transform[4], y = it.transform[5];
      let row = rows.find(r => Math.abs(r.y - y) <= 2.5); // bullet glyphs sit ~1pt off their text
      if (!row) rows.push(row = { y, items: [] });
      row.items.push({ x, w: it.width, str: it.str });
    }
    rows.sort((a, b) => b.y - a.y);
    for (const r of rows) lines.push(rowToLine(r.items));
  }
  return lines;
}

export function rowToLine(items) {
  items.sort((a, b) => a.x - b.x);
  const segs = [];
  let end = -Infinity;
  for (const it of items) {
    const gap = it.x - end;
    if (gap > 12 || !segs.length) segs.push(it.str);
    else segs[segs.length - 1] += (gap > 1 && !/^[,.;:)]/.test(it.str) ? ' ' : '') + it.str;
    end = it.x + it.w;
  }
  const clean = segs.map(s => s.replace(/\s+/g, ' ').replace(/´\s?(\w)/g, (_, c) => (c + '́').normalize('NFC')).trim()).filter(Boolean);
  return { x: items[0].x, segs: clean, text: clean.join(' ') };
}

function oneDate(s) {
  if (!s || /present|current|now/i.test(s)) return null;
  const year = +s.match(/\d{4}/)[0];
  const word = (s.replace(/^(expected|anticipated)\s+/i, '').match(/^[a-z]+/i) || [''])[0].toLowerCase();
  const month = SEASONS[word] || (MONTHS.indexOf(word.slice(0, 3)) + 1) || null;
  return { month, year };
}

export function parseDates(s) {
  if (!s) return { start: null, end: null, current: false };
  const [a, b] = s.split(/\s*[–—]\s*|\s+-\s+/);
  if (b === undefined) {
    const d = oneDate(a);
    return /expected|anticipated/i.test(a) ? { start: null, end: d, current: false } : { start: d, end: d, current: false };
  }
  return { start: oneDate(a), end: oneDate(b), current: /present|current|now/i.test(b) };
}

function splitDate(text) {
  const m = text.match(DATE_AT_END);
  return m ? { rest: text.slice(0, m.index).replace(/[\s|,–-]+$/, ''), date: m[1] } : { rest: text, date: '' };
}

function parseHeader(head, out) {
  out.name.full = head[0] || '';
  const parts = out.name.full.split(/\s+/);
  out.name.first = parts[0] || '';
  out.name.last = parts.length > 1 ? parts[parts.length - 1] : '';
  for (const tok of head.slice(1).join(' | ').split(/\s*[|•·]\s*/)) {
    const t = tok.trim();
    if (!t) continue;
    if (/@/.test(t)) out.email = t;
    else if (/^\+?[\d\s().-]{10,}$/.test(t)) out.phone = t;
    else if (/linkedin\./i.test(t)) out.links.linkedin = t;
    else if (/github\./i.test(t)) out.links.github = t;
    else if (/^\S+\.\S+$/.test(t)) out.links.portfolio = t;
    else if (/^[A-Za-z .'-]+,\s*[A-Za-z .]+$/.test(t)) {
      const [city, state] = t.split(/,\s*/);
      out.address.city = city;
      out.address.state = state;
    }
  }
}

export function parseResume(lines) {
  const out = {
    name: { first: '', last: '', full: '' }, email: '', phone: '',
    address: { line1: '', city: '', state: '', postal: '', country: 'United States of America' },
    links: { linkedin: '', github: '', portfolio: '' },
    education: [], skills: {}, experience: [], projects: [], skillList: [], certifications: [],
  };
  let i = 0;
  const head = [];
  while (i < lines.length && !sectionOf(lines[i].text)) head.push(lines[i++].text);
  parseHeader(head, out);

  let section = null, cur = null, baseX = null, expectOrg = false, lastSkill = null;
  for (; i < lines.length; i++) {
    const L = lines[i], t = L.text;
    const s = sectionOf(t);
    if (s) { section = s; cur = null; baseX = null; expectOrg = false; lastSkill = null; continue; }
    if (!section || section.kind === 'other') continue;
    if (baseX === null) baseX = L.x;
    const bullet = /^[•●▪◦‣∙*]\s*/.test(t) ? t.replace(/^[•●▪◦‣∙*]\s*/, '') : null;
    const indented = L.x > baseX + 8;

    if (section.kind === 'certs') {
      out.certifications.push((bullet ?? t).replace(/\s+(\||–|-)\s+.*$/, '').trim());
      continue;
    }
    if (section.kind === 'skills') {
      const m = t.match(/^([^:]{1,40}):\s*(.*)$/);
      if (m && !indented) out.skills[lastSkill = m[1].trim()] = m[2];
      else if (lastSkill) out.skills[lastSkill] += ' ' + t;
      continue;
    }
    if (bullet !== null) {
      if (!cur) continue;
      if (section.kind === 'projects' && /^recognition:/i.test(bullet)) cur.recognition = bullet.replace(/^recognition:\s*/i, '');
      else (cur.bullets ||= []).push(bullet);
      expectOrg = false;
      continue;
    }
    if (indented && cur) { // wrapped line: glue onto the last bullet
      if (cur.bullets?.length) cur.bullets[cur.bullets.length - 1] += ' ' + t;
      else if (cur.recognition) cur.recognition += ' ' + t;
      continue;
    }

    if (section.kind === 'experience') {
      if (expectOrg && cur) {
        const segs = L.segs.length > 1 ? L.segs : [t];
        cur.org = segs.length > 1 ? segs.slice(0, -1).join(' ') : segs[0];
        cur.location = segs.length > 1 ? segs[segs.length - 1] : '';
        expectOrg = false;
        continue;
      }
      const { rest, date } = splitDate(t);
      cur = { section: section.name, title: rest, org: '', location: '', ...parseDates(date), bullets: [] };
      out.experience.push(cur);
      expectOrg = true;
    } else if (section.kind === 'projects') {
      const { rest, date } = splitDate(t);
      const [name, ...tech] = rest.split(/\s+\|\s+/);
      cur = { name: name.trim(), tech: tech.join(', '), recognition: '', ...parseDates(date), bullets: [] };
      out.projects.push(cur);
    } else if (section.kind === 'education') {
      const { rest, date } = splitDate(t);
      const looksSchool = !date && (L.segs.length > 1 || /universit|college|institute|school|academy/i.test(t));
      if (looksSchool || !cur) {
        cur = { school: L.segs.length > 1 ? L.segs.slice(0, -1).join(' ') : rest, location: L.segs.length > 1 ? L.segs[L.segs.length - 1] : '',
          degree: '', gpa: '', start: null, end: null, current: false, details: [] };
        out.education.push(cur);
      } else if (!cur.degree) {
        const gpa = rest.match(/GPA:?\s*([\d.]+(?:\s*\/\s*[\d.]+)?)/i);
        cur.gpa = gpa ? gpa[1].replace(/\s/g, '') : '';
        cur.degree = rest.replace(/\s*\|?\s*GPA:?\s*[\d.]+(\s*\/\s*[\d.]+)?/i, '').replace(/[\s|]+$/, '');
        Object.assign(cur, parseDates(date));
      } else if (/^[A-Z][^:]{1,40}:/.test(t) || !cur.details.length) cur.details.push(t);
      else cur.details[cur.details.length - 1] += ' ' + t;
    }
  }
  out.skillList = skillList(out.skills);
  out.certifications = [...new Set([...out.certifications, ...certsFromBullets(out)])];
  return out;
}

// "Python, Microsoft Office (Excel, Word), MATLAB (coursework)" -> ["Python", "Microsoft Office", "MATLAB"]
export function skillList(skills) {
  const all = Object.values(skills).join(', ').replace(/\([^)]*\)/g, '').split(/\s*,\s*/);
  const seen = new Set();
  return all.map(x => x.trim()).filter(x => x && !seen.has(x.toLowerCase()) && seen.add(x.toLowerCase()));
}

// "...earned the Example Program certificate" -> "Example Program Certificate"
export function certsFromBullets(p) {
  const out = [];
  for (const e of [...p.experience, ...p.projects]) for (const b of e.bullets) {
    for (const m of b.matchAll(/(?:earned|received|obtained|completed|awarded) (?:the |a |an |my )?([A-Z][\w&.'’ -]{1,60}?) (certificate|certification)\b/g)) {
      out.push(`${m[1].trim()} ${m[2][0].toUpperCase()}${m[2].slice(1)}`);
    }
  }
  return out;
}
