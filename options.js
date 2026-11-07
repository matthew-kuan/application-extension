import * as pdfjs from './lib/pdf.min.mjs';
import { pdfToLines, parseResume } from './parse.js';
import { mergeProfiles } from './merge.js';

pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.mjs');

const DECLINE = "decline|not (wish|want)|prefer not|don't wish|do not wish";
const DEFAULT_ANSWERS = [
  { q: 'authori[sz]ed to work|legally (eligible|permitted|able) to work|right to work', a: '' },
  { q: 'sponsor|visa', a: '' },
  { q: 'how did you hear|source', a: '' },
  { q: 'previously (worked|been employed)|former (employee|worker|contractor)|currently work for', a: '^no' },
  { q: '18 years|age of 18|at least 18', a: '^yes' },
  { q: 'phone device type|phone type', a: 'mobile|cell' },
  { q: 'gender|\\bsex\\b', a: DECLINE },
  { q: 'hispanic|latino', a: DECLINE },
  { q: 'race|ethnic', a: DECLINE },
  { q: 'veteran', a: DECLINE },
  { q: 'disability', a: "do not want|don't want|" + DECLINE },
];

const $ = id => document.getElementById(id);
const store = chrome.storage.local;

function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const summary = p => `${p.name.full || '(no name)'}: ${p.experience.length} experiences, ${p.projects.length} projects, ${p.education.length} schools`;

async function readPdf(input) {
  const file = input.files[0];
  const buf = await file.arrayBuffer();
  const pdf = { name: file.name, b64: toB64(buf) }; // before parsing: pdf.js takes ownership of the buffer
  return { pdf, profile: parseResume(await pdfToLines(pdfjs, new Uint8Array(buf))) };
}

async function rebuild() {
  const s = await store.get(['fullProfile', 'tailoredProfile', 'useTailored', 'extraBullets', 'profile']);
  if (!s.fullProfile) return;
  const next = mergeProfiles(s.useTailored ? s.tailoredProfile : null, s.fullProfile, s.extraBullets ?? 2);
  next.address = { ...next.address, line1: s.profile?.address?.line1 || '', postal: s.profile?.address?.postal || '' };
  await store.set({ profile: next });
  $('profile').value = JSON.stringify(next, null, 2);
}

function flash(id, msg, ok = true) {
  $(id).textContent = msg;
  $(id).className = 'status ' + (ok ? 'ok' : 'err');
}

async function load() {
  const s = await store.get(null);
  if (!s.answers) await store.set({ answers: s.answers = DEFAULT_ANSWERS });
  if (s.fullProfile) $('fullInfo').textContent = `${s.fullPdf.name} — ${summary(s.fullProfile)}`;
  if (s.tailoredProfile) $('tailoredInfo').textContent = `${s.tailoredPdf.name} — ${summary(s.tailoredProfile)}`;
  document.querySelector(`input[name=useTailored][value=${s.useTailored ? 'yes' : 'no'}]`).checked = true;
  $('tailoredBox').hidden = !s.useTailored;
  $('extra').value = s.extraBullets ?? 2;
  $('profile').value = s.profile ? JSON.stringify(s.profile, null, 2) : '';
  $('answers').value = JSON.stringify(s.answers, null, 2);
}

$('fullFile').onchange = async () => {
  try {
    const { pdf, profile } = await readPdf($('fullFile'));
    await store.set({ fullPdf: pdf, fullProfile: profile });
    $('fullInfo').textContent = `${pdf.name} — ${summary(profile)}`;
    await rebuild();
  } catch (e) { $('fullInfo').textContent = 'Could not read that PDF: ' + e.message; }
};

$('tailoredFile').onchange = async () => {
  try {
    const { pdf, profile } = await readPdf($('tailoredFile'));
    await store.set({ tailoredPdf: pdf, tailoredProfile: profile });
    $('tailoredInfo').textContent = `${pdf.name} — ${summary(profile)}`;
    await rebuild();
  } catch (e) { $('tailoredInfo').textContent = 'Could not read that PDF: ' + e.message; }
};

for (const r of document.querySelectorAll('input[name=useTailored]')) r.onchange = async () => {
  const useTailored = r.value === 'yes';
  $('tailoredBox').hidden = !useTailored;
  await store.set({ useTailored });
  await rebuild();
};

$('extra').onchange = async () => {
  await store.set({ extraBullets: Math.max(0, +$('extra').value || 0) });
  await rebuild();
};

function saveJson(textId, key, statusId, check) {
  return async () => {
    try {
      const v = JSON.parse($(textId).value);
      check(v);
      await store.set({ [key]: v });
      flash(statusId, 'Saved');
    } catch (e) { flash(statusId, e.message, false); }
  };
}
$('saveProfile').onclick = saveJson('profile', 'profile', 'profileStatus', v => {
  if (!v.name || !Array.isArray(v.experience) || !Array.isArray(v.projects) || !Array.isArray(v.education)) throw new Error('Needs name, experience, projects, education');
});
$('saveAnswers').onclick = saveJson('answers', 'answers', 'answersStatus', v => {
  if (!Array.isArray(v) || v.some(x => typeof x.q !== 'string' || typeof x.a !== 'string')) throw new Error('Needs a list of {"q": "...", "a": "..."}');
  v.forEach(x => { new RegExp(x.q, 'i'); new RegExp(x.a || '.', 'i'); }); // reject broken patterns now, not mid-application
});

load();
