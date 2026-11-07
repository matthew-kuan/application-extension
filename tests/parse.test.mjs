import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseResume, parseDates, rowToLine, sectionOf } from '../parse.js';
import { mergeProfiles } from '../merge.js';

const L = (x, ...segs) => ({ x, segs, text: segs.join(' ') });
const lines = [
  L(200, 'Jane Doe'),
  L(90, 'Austin, TX | (555) 123-4567 | jane@x.edu | linkedin.com/in/jane | github.com/jane'),
  L(36, 'Education'),
  L(47, 'State University', 'Austin, TX'),
  L(47, 'B.S. Computer Science | GPA: 3.9', 'Expected May 2027'),
  L(47, 'Honors: Dean’s List, Some'),
  L(47, 'Other Award'),
  L(36, 'Experience'),
  L(47, 'Software Intern', 'Jun 2025 – Present'),
  L(47, 'Acme Corp', 'Remote'),
  L(62, '• Built a thing that does'),
  L(71, 'many useful things'),
  L(62, '• Shipped another thing'),
  L(36, 'Projects'),
  L(47, 'Widget: Tool | Python, Go', 'Mar 2026'),
  L(62, '• Recognition: Won a hackathon'),
  L(62, '• Wrote the widget'),
];

test('parses header, education, experience, projects', () => {
  const p = parseResume(lines);
  assert.equal(p.name.first, 'Jane');
  assert.equal(p.name.last, 'Doe');
  assert.equal(p.phone, '(555) 123-4567');
  assert.equal(p.email, 'jane@x.edu');
  assert.equal(p.links.github, 'github.com/jane');
  assert.equal(p.address.city, 'Austin');
  assert.deepEqual(p.education[0].end, { month: 5, year: 2027 });
  assert.equal(p.education[0].gpa, '3.9');
  assert.equal(p.education[0].degree, 'B.S. Computer Science');
  assert.deepEqual(p.education[0].details, ['Honors: Dean’s List, Some Other Award']);
  const e = p.experience[0];
  assert.equal(e.title, 'Software Intern');
  assert.equal(e.org, 'Acme Corp');
  assert.equal(e.location, 'Remote');
  assert.equal(e.current, true);
  assert.deepEqual(e.bullets, ['Built a thing that does many useful things', 'Shipped another thing']);
  const pr = p.projects[0];
  assert.equal(pr.name, 'Widget: Tool');
  assert.equal(pr.tech, 'Python, Go');
  assert.equal(pr.recognition, 'Won a hackathon');
  assert.deepEqual(pr.bullets, ['Wrote the widget']);
});

test('dates, headings, line joining', () => {
  assert.deepEqual(parseDates('Spring 2025'), { start: { month: 1, year: 2025 }, end: { month: 1, year: 2025 }, current: false });
  assert.deepEqual(parseDates('Sep 2022 – Jul 2024').end, { month: 7, year: 2024 });
  assert.equal(sectionOf('Honors: Presidential Scholarship'), null);
  assert.equal(sectionOf('Research Experience').kind, 'experience');
  const line = rowToLine([{ x: 47, w: 50, str: 'Languages' }, { x: 97, w: 100, str: ': Python' }, { x: 480, w: 60, str: 'Jan 2025' }]);
  assert.deepEqual(line.segs, ['Languages: Python', 'Jan 2025']);
  assert.equal(rowToLine([{ x: 0, w: 10, str: 'L’Or' }, { x: 10, w: 2, str: '´' }, { x: 12, w: 10, str: 'eal' }]).text, 'L’Oréal');
});

test('merge adds up to n non-duplicate bullets from the matching full entry', () => {
  const full = parseResume(lines);
  full.experience[0].bullets.push('Third bullet about testing', 'Fourth bullet about docs');
  const tailored = structuredClone(full);
  tailored.email = '';
  tailored.experience[0].bullets = ['Built a thing that does many useful things today'];
  const m = mergeProfiles(tailored, full, 2);
  assert.deepEqual(m.experience[0].bullets, ['Built a thing that does many useful things today', 'Shipped another thing', 'Third bullet about testing']);
  assert.equal(m.email, 'jane@x.edu');
  assert.equal(mergeProfiles(null, full, 2), full);
  assert.equal(mergeProfiles(structuredClone(tailored), full, 0).experience[0].bullets.length, 1);
});

const FULL = join(homedir(), 'Downloads', 'matthew_kuan_resume_full.pdf');
test('smoke: real full resume', { skip: !existsSync(FULL) && 'full resume PDF not found' }, async () => {
  const lib = new URL('../lib/', import.meta.url);
  const pdfjs = await import(new URL('pdf.min.mjs', lib));
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', lib).href;
  const { pdfToLines } = await import(pathToFileURL(join(import.meta.dirname, '..', 'parse.js')));
  const p = parseResume(await pdfToLines(pdfjs, new Uint8Array(readFileSync(FULL))));
  assert.equal(p.education.length, 2);
  assert.equal(p.experience.filter(e => e.section === 'Research Experience').length, 3);
  assert.equal(p.experience.filter(e => e.section === 'Professional Experience').length, 5);
  assert.equal(p.projects.length, 16);
  assert.ok(p.experience.every(e => e.org && e.bullets.length));
  assert.ok(p.experience[0].bullets[2].includes('cut device failure rate from 30% to 15%'));
});
