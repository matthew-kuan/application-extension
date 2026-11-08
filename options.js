import * as pdfjs from './lib/pdf.min.mjs';
import { pdfToLines, parseResume } from './parse.js';
import { mergeProfiles } from './merge.js';
import { QUESTIONS, DEFAULT_QA, buildAnswers } from './answers.js';

pdfjs.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.mjs');

const $ = id => document.getElementById(id);
const store = chrome.storage.local;

function toB64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const summary = p => `${p.name.full || '(no name)'}: ${p.experience.length} experiences, ${p.projects.length} projects, ${p.education.length} schools`;

function saved() {
  $('saved').textContent = 'Saved';
  clearTimeout(saved.t);
  saved.t = setTimeout(() => ($('saved').textContent = ''), 1500);
}

async function readPdf(input) {
  const file = input.files[0];
  const buf = await file.arrayBuffer();
  const pdf = { name: file.name, b64: toB64(buf) }; // before parsing: pdf.js takes ownership of the buffer
  return { pdf, profile: parseResume(await pdfToLines(pdfjs, new Uint8Array(buf))) };
}

async function rebuild() {
  const s = await store.get(['fullProfile', 'tailoredProfile', 'useTailored', 'extraBullets', 'address', 'qa']);
  if (!s.fullProfile) return;
  const profile = mergeProfiles(s.useTailored ? s.tailoredProfile : null, s.fullProfile, s.extraBullets ?? 2);
  await store.set({ profile });
  // city/state from the resume until you type your own
  if (!s.address?.city && !s.address?.state) {
    await store.set({ address: { ...s.address, city: profile.address.city, state: profile.address.state } });
  }
  await render();
}

// Settings form <- storage
async function render() {
  const s = await store.get(null);
  const qa = { ...DEFAULT_QA, ...s.qa };
  const address = { country: 'United States of America', ...s.address };
  if (s.fullProfile) $('fullInfo').textContent = `${s.fullPdf.name} — ${summary(s.fullProfile)}`;
  if (s.tailoredProfile) $('tailoredInfo').textContent = `${s.tailoredPdf.name} — ${summary(s.tailoredProfile)}`;
  document.querySelector(`input[name=useTailored][value=${s.useTailored ? 'yes' : 'no'}]`).checked = true;
  $('tailoredBox').hidden = !s.useTailored;
  $('extra').value = s.extraBullets ?? 2;
  for (const el of document.querySelectorAll('[data-addr]')) el.value = address[el.dataset.addr] || '';
  for (const el of document.querySelectorAll('[data-qa]')) el.value = qa[el.dataset.qa] ?? '';
  $('skills').value = qa.skills ?? (s.profile?.skillList || []).join(', ');
  $('certs').value = qa.certs ?? (s.profile?.certifications || []).join('\n');
  $('profile').value = s.profile ? JSON.stringify(s.profile, null, 2) : '';
}

// Settings form -> storage (answers rebuilt every time)
async function saveForm() {
  const s = await store.get(['qa']);
  const qa = { ...DEFAULT_QA, ...s.qa };
  for (const el of document.querySelectorAll('[data-qa]')) qa[el.dataset.qa] = el.value;
  const address = {};
  for (const el of document.querySelectorAll('[data-addr]')) address[el.dataset.addr] = el.value.trim();
  await store.set({ qa, address, answers: buildAnswers(qa) });
  saved();
}

function buildQuestions() {
  for (const [key, label, opts] of QUESTIONS) {
    const span = document.createElement('span');
    span.textContent = label;
    span.id = 'q-' + key;
    let input;
    if (opts === 'text') {
      input = Object.assign(document.createElement('input'), { type: 'text' });
    } else {
      input = document.createElement('select');
      for (const o of opts) input.add(new Option(o === '' ? 'Leave for me' : o === 'Decline' ? 'Decline to answer' : o, o));
    }
    input.dataset.qa = key;
    input.setAttribute('aria-labelledby', span.id);
    $('questions').append(span, input);
  }
}

buildQuestions();
document.addEventListener('change', e => {
  if (e.target.matches('[data-qa], [data-addr]')) saveForm();
});

$('skills').onchange = async () => {
  const s = await store.get(['qa']);
  await store.set({ qa: { ...DEFAULT_QA, ...s.qa, skills: $('skills').value } });
  saved();
};
$('certs').onchange = async () => {
  const s = await store.get(['qa']);
  await store.set({ qa: { ...DEFAULT_QA, ...s.qa, certs: $('certs').value } });
  saved();
};

$('fullFile').onchange = async () => {
  try {
    const { pdf, profile } = await readPdf($('fullFile'));
    await store.set({ fullPdf: pdf, fullProfile: profile });
    await rebuild();
  } catch (e) { $('fullInfo').textContent = 'Could not read that PDF: ' + e.message; }
};

$('tailoredFile').onchange = async () => {
  try {
    const { pdf, profile } = await readPdf($('tailoredFile'));
    await store.set({ tailoredPdf: pdf, tailoredProfile: profile });
    await rebuild();
  } catch (e) { $('tailoredInfo').textContent = 'Could not read that PDF: ' + e.message; }
};

for (const r of document.querySelectorAll('input[name=useTailored]')) r.onchange = async () => {
  $('tailoredBox').hidden = r.value !== 'yes';
  await store.set({ useTailored: r.value === 'yes' });
  await rebuild();
};

$('extra').onchange = async () => {
  await store.set({ extraBullets: Math.max(0, +$('extra').value || 0) });
  await rebuild();
};

$('saveProfile').onclick = async () => {
  try {
    const v = JSON.parse($('profile').value);
    if (!v.name || !Array.isArray(v.experience) || !Array.isArray(v.projects) || !Array.isArray(v.education)) throw new Error('Needs name, experience, projects, education');
    await store.set({ profile: v });
    $('profileStatus').textContent = 'Saved';
    $('profileStatus').className = 'status ok';
  } catch (e) {
    $('profileStatus').textContent = e.message;
    $('profileStatus').className = 'status err';
  }
};

(async () => {
  const s = await store.get(['qa', 'answers']);
  if (!s.qa) await store.set({ qa: DEFAULT_QA, answers: buildAnswers(DEFAULT_QA) });
  await render();
})();
