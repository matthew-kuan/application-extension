// Shared helpers for the fillers. Injected before workday.js / generic.js; safe to inject twice.
(() => {
  if (window.AF) return;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  async function waitFor(fn, timeout = 8000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const v = fn();
      if (v) return v;
      await sleep(150);
    }
    return null;
  }

  function nativeSet(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Type like a person: execCommand('insertText') fires trusted beforeinput/input events, which Workday's
  // date sections and React inputs accept. Falls back to the native value setter.
  function setValue(el, value) {
    if (!el || value == null || value === '') return false;
    const v = String(value);
    el.focus();
    try { el.select(); } catch { /* not selectable */ }
    let ok = false;
    try { ok = document.execCommand('insertText', false, v); } catch { /* unsupported */ }
    if (!ok || norm(el.value) !== norm(v)) nativeSet(el, v);
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    return true;
  }
  const clear = el => { if (el.value) nativeSet(el, ''); };

  function key(el, k) {
    const code = { Enter: 13, Escape: 27 }[k];
    for (const type of ['keydown', 'keyup']) el.dispatchEvent(new KeyboardEvent(type, { key: k, code: k, keyCode: code, which: code, bubbles: true }));
  }

  function click(el) {
    el.scrollIntoView({ block: 'center' });
    el.click();
  }

  // Workday ids come in two styles: data-automation-id="jobTitle" (older) and id="workExperience-2--jobTitle" (newer).
  const sel = k => `[data-automation-id="${k}"], [data-automation-id="formField-${k}"], [id="${k}"], [id$="--${k}"], [name="${k}"]`;
  const CONTROLS = 'input:not([type=hidden]), textarea, select, button[aria-haspopup]';
  const control = el => !el ? null : el.matches('input, textarea, select, button') ? el : el.querySelector(CONTROLS);
  const field = (keys, root = document) => { for (const k of keys) { const el = root.querySelector(sel(k)); if (el) return control(el); } return null; };
  const fieldAll = (keys, root = document) => keys.flatMap(k => [...root.querySelectorAll(sel(k))]).filter((el, i, a) => a.indexOf(el) === i && !a.some(o => o !== el && o.contains(el)));

  // Controls by their on-screen label ("Job Title", "Overall Result (GPA)"), for tenants whose ids differ.
  const LABELS = 'label, legend, [data-automation-id="formLabel"]';
  const labelText = lab => text(lab).replace(/[*\s]+$/, '').replace(/^\*\s*/, '');
  function controlForLabel(lab, root) {
    const byFor = lab.htmlFor && document.getElementById(lab.htmlFor);
    if (byFor && root.contains(byFor)) return control(byFor);
    const inner = lab.querySelector('input, textarea, select, button');
    if (inner) return inner;
    for (let p = lab.parentElement; p && root.contains(p); p = p.parentElement) {
      const c = [...p.querySelectorAll(CONTROLS)].find(c => lab.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
      if (c) return c;
      if (p === root) break;
    }
    return null;
  }
  const byLabelAll = (root, re) => [...root.querySelectorAll(LABELS)].filter(l => re.test(labelText(l))).map(l => controlForLabel(l, root)).filter(Boolean);
  const byLabel = (root, re) => byLabelAll(root, re)[0] || null;
  // ids first, then label
  const find = (root, keys, re) => field(keys, root) || (re ? byLabel(root, re) : null);
  const findAll = (root, keys, re) => { const a = fieldAll(keys, root).map(control).filter(Boolean); return a.length || !re ? a : byLabelAll(root, re); };

  // Month/day/year boxes of a date: by id ("--startDate-dateSectionMonth-input"), else next to the label ("From").
  function dateParts(root, keys, re) {
    const pick = (box, part) => box.querySelector(`[id*="dateSection${part}"], [data-automation-id="dateSection${part}-input"], input[aria-label*="${part}" i], input[placeholder="${{ Month: 'MM', Day: 'DD', Year: 'YYYY' }[part]}"]`);
    for (const k of keys) {
      const m = root.querySelector(`[id$="--${k}-dateSectionMonth-input"]`);
      const y = root.querySelector(`[id$="--${k}-dateSectionYear-input"]`);
      if (m || y) return { m, y, d: root.querySelector(`[id$="--${k}-dateSectionDay-input"]`) };
      const box = root.querySelector(`[data-automation-id="${k}"], [data-automation-id="formField-${k}"]`);
      if (box && (pick(box, 'Month') || pick(box, 'Year'))) return { m: pick(box, 'Month'), y: pick(box, 'Year'), d: pick(box, 'Day') };
    }
    if (!re) return null;
    for (const lab of [...root.querySelectorAll(LABELS)].filter(l => re.test(labelText(l)))) {
      for (let p = lab.parentElement; p && root.contains(p); p = p.parentElement) {
        if (pick(p, 'Month') || pick(p, 'Year')) return { m: pick(p, 'Month'), y: pick(p, 'Year'), d: pick(p, 'Day') };
        if (p === root) break;
      }
      const single = controlForLabel(lab, root); // one "MM/YYYY" box
      if (single?.matches('input')) return { single };
    }
    return null;
  }

  async function setDate(root, keys, re, d, withDay = false) {
    if (!d?.year) return false;
    const parts = dateParts(root, keys, re);
    if (!parts) return false;
    const mm = String(d.month || 1).padStart(2, '0');
    if (parts.single) return !parts.single.value && setValue(parts.single, d.month ? `${mm}/${d.year}` : String(d.year));
    if (parts.m && d.month) { setValue(parts.m, mm); await sleep(100); }
    if (parts.d && withDay) { setValue(parts.d, String(new Date().getDate()).padStart(2, '0')); await sleep(100); }
    if (parts.y) setValue(parts.y, String(d.year));
    return true;
  }

  const options = () => [...document.querySelectorAll('[role="option"], [data-automation-id="promptOption"], [data-automation-id="menuItem"]')].filter(visible);

  // 1 = same text, 0.9 = one contains the other, else share of the wanted words found in the option.
  function score(optText, want) {
    const o = norm(optText), w = norm(want);
    if (!o || !w) return 0;
    if (o === w) return 1;
    if (o.includes(w) || (w.includes(o) && o.length > 3)) return 0.9;
    const ws = w.split(' ').filter(x => x.length > 1), os = new Set(o.split(' '));
    return ws.length ? 0.8 * ws.filter(x => os.has(x)).length / ws.length : 0;
  }
  const best = (opts, want, min = 0.6) => {
    let top = null, s = min;
    for (const o of opts) { const v = score(text(o), want); if (v >= s && (!top || v > s)) { top = o; s = v; } }
    return top;
  };

  // patterns: list of RegExp tried in order against option text.
  async function pickOption(button, patterns) {
    click(button);
    const opts = await waitFor(() => options().length && options(), 3000);
    if (opts) for (const re of patterns) {
      const hit = opts.find(o => re.test(text(o)));
      if (hit) { click(hit); await sleep(300); return true; }
    }
    key(document.activeElement || button, 'Escape');
    await sleep(200);
    return false;
  }

  // Searchable Workday "prompt" fields (school, field of study, skills): type, Enter, pick the closest result.
  async function pickPrompt(input, value, timeout = 4000) {
    setValue(input, value);
    input.focus();
    key(input, 'Enter');
    const hit = await waitFor(() => best(options(), value), timeout);
    if (hit) { click(hit); await sleep(400); return true; }
    key(input, 'Escape');
    clear(input);
    return false;
  }

  // "Job Sites > LinkedIn": search for the last part; if that finds nothing, click through the menus level by level.
  async function pickPath(input, path) {
    const levels = path.split('>').map(s => s.trim()).filter(Boolean);
    if (await pickPrompt(input, levels[levels.length - 1], 2500)) return true;
    click(input);
    for (const lvl of levels) {
      const hit = await waitFor(() => best(options(), lvl), 3000);
      if (!hit) { key(input, 'Escape'); return false; }
      click(hit);
      await sleep(500);
    }
    return true;
  }

  const isDropdown = el => !!el?.matches('button[aria-haspopup="listbox"], button[aria-haspopup="true"]');
  const isPrompt = el => !!el?.matches('input') && (el.dataset.automationId === 'searchBox' || el.dataset.uxiWidgetType === 'selectinput' || !!el.closest('[data-automation-id="multiSelectContainer"], [data-uxi-widget-type="multiselect"]'));
  const dropdownEmpty = b => /^(select one|select\.*|choose\.*|)$/i.test(text(b));
  const promptHasValue = el => !!el.closest('[data-automation-id="multiSelectContainer"], [data-uxi-widget-type="multiselect"]')?.parentElement?.querySelector('[data-automation-id="selectedItem"]');

  // Fill whatever kind of control `el` is with a plain value.
  async function fill(el, value, patterns) {
    if (!el || value == null || value === '') return false;
    if (isDropdown(el)) {
      if (!dropdownEmpty(el)) return true;
      return pickOption(el, patterns || [new RegExp('^' + esc(String(value)), 'i'), new RegExp(esc(String(value)), 'i')]);
    }
    if (isPrompt(el)) return promptHasValue(el) || pickPrompt(el, String(value));
    if (el.matches('select')) {
      const re = patterns?.[0] || new RegExp(esc(String(value)), 'i');
      const opt = [...el.options].find(o => o.value && re.test(o.text));
      if (!opt) return false;
      el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    if (el.matches('input[type=checkbox], input[type=radio]')) return false;
    if (el.value) return true; // never overwrite what's already there
    return setValue(el, value);
  }

  function attachFile(input, pdf) {
    const bytes = Uint8Array.from(atob(pdf.b64), c => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], pdf.name, { type: 'application/pdf' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Question text for a control: aria-labelledby, <label for>, enclosing fieldset legend, or the nearest label above it.
  function labelOf(el) {
    const by = el.getAttribute('aria-labelledby');
    const parts = [];
    if (by) parts.push(...by.split(/\s+/).map(id => text(document.getElementById(id))));
    if (el.id) parts.push(text(document.querySelector(`label[for="${CSS.escape(el.id)}"]`)));
    parts.push(text(el.closest('label')));
    parts.push(text(el.closest('fieldset')?.querySelector('legend')));
    const own = parts.filter(Boolean).join(' ').trim();
    if (own && !/^(select one|yes|no)$/i.test(own)) return own;
    for (let p = el.parentElement, i = 0; p && i < 6; p = p.parentElement, i++) {
      const lab = p.querySelector('label, legend, [data-automation-id="richText"], [id$="-label"]');
      if (lab && !lab.contains(el) && text(lab).length > 2) return text(lab);
    }
    return el.getAttribute('aria-label') || el.placeholder || '';
  }

  const answerFor = (answers, q) => answers.find(x => { try { return new RegExp(x.q, 'i').test(q); } catch { return false; } });

  const majors = degree => (degree || '').split(/,|;|\band\b(?= [A-Z]\.)/)
    .map(s => s.trim())
    .filter(s => /^(B|M)\.?\s?(S|E|A|Eng|Sc)\.?\s|^(Bachelor|Master|Doctor)/i.test(s))
    .map(s => s.replace(/^(B|M)\.?\s?(S|E|A|Eng|Sc)\.?\s+(in\s+)?/i, '').replace(/^(Bachelor|Master|Doctor)\S*\s+of\s+\S+\s+(in\s+)?/i, '').trim());

  // Answers that come straight from the resume. Your own answers are checked first.
  function derivedAnswers(p) {
    if (!p) return [];
    const ed = p.education?.[0] || {};
    const end = ed.end;
    const now = new Date();
    const enrolled = end && (end.year > now.getFullYear() || (end.year === now.getFullYear() && (end.month || 12) >= now.getMonth() + 1));
    const gpa = (ed.gpa || '').split('/')[0];
    const major = majors(ed.degree)[0] || '';
    const level = /\b(M\.?\s?S|M\.?\s?Eng|M\.?\s?A|Master)\b/i.test(ed.degree) ? 'master' : /ph\.?\s?d|doctor/i.test(ed.degree) ? 'doctor' : 'bachelor';
    return [
      { q: 'currently (enrolled|a student|attending|pursuing)|are you a (current )?student', a: enrolled ? '^yes\\b' : '^no\\b', text: enrolled ? 'Yes' : 'No' },
      { q: '\\bgpa\\b|grade point|overall result', a: esc(gpa), text: gpa },
      { q: 'graduat', a: end ? `${end.year}|${MONTHS[(end.month || 1) - 1]} ${end.year}` : '', text: end ? `${end.month ? MONTHS[end.month - 1] + ' ' : ''}${end.year}` : '' },
      { q: 'highest (level of )?(education|degree)|degree (level|type)|level of education|^degree', a: level, text: level === 'bachelor' ? "Bachelor's Degree" : level === 'master' ? "Master's Degree" : 'Doctorate' },
      { q: 'major|field of study|discipline|area of study', a: esc(major), text: major },
      { q: 'school|university|college|institution', a: esc(ed.school || ''), text: ed.school || '' },
      { q: 'linkedin', a: '', text: url(p.links?.linkedin) },
      { q: 'github', a: '', text: url(p.links?.github) },
      { q: 'website|portfolio|personal url', a: '', text: url(p.links?.portfolio) },
    ].filter(x => x.a || x.text);
  }

  const flagged = new Set();
  function flag(el) {
    if (!el) return;
    el.style.outline = '3px solid #f5c400';
    el.style.outlineOffset = '2px';
    flagged.add(el);
  }

  // Answer the remaining questions on the page. Anything required and unanswered gets flagged.
  async function answerQuestions(answers, profile, root = document) {
    const vis = [...root.querySelectorAll('button[aria-haspopup="listbox"], select, input, textarea')].filter(visible);
    const re = a => { try { return new RegExp(a, 'i'); } catch { return new RegExp(esc(a), 'i'); } };

    for (const b of vis.filter(isDropdown)) {
      if (!dropdownEmpty(b)) continue;
      const m = answerFor(answers, labelOf(b));
      const pats = m && [m.a, m.text && esc(m.text)].filter(Boolean).map(re);
      if (pats?.length && await pickOption(b, pats)) continue;
      flag(b);
    }

    for (const s of vis.filter(el => el.matches('select'))) {
      if (s.value) continue;
      const m = answerFor(answers, labelOf(s));
      if (!(m?.a && await fill(s, m.a, [re(m.a)]))) flag(s);
    }

    // radio groups and checkbox groups (Workday self-identify uses checkboxes for one-of-many)
    const groups = new Map();
    for (const el of vis.filter(el => el.matches('input[type=radio], input[type=checkbox]'))) {
      const g = el.closest('fieldset, [role="radiogroup"], [role="group"]') || (el.name && document.querySelector(`[name="${CSS.escape(el.name)}"]`)?.parentElement?.parentElement);
      if (!g) continue;
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(el);
    }
    for (const [g, inputs] of groups) {
      if (inputs.length < 2 || inputs.some(i => i.checked)) continue; // lone checkbox = consent/agreement: left for you
      const q = text(g.querySelector('legend, label, [data-automation-id="richText"]')) || labelOf(inputs[0]);
      const m = answerFor(answers, q);
      const optLabel = i => text(i.closest('label')) || text(document.querySelector(`label[for="${CSS.escape(i.id)}"]`)) || i.value;
      const hit = m?.a && inputs.find(i => re(m.a).test(optLabel(i)));
      if (hit) { click(hit); await sleep(150); } else flag(g);
    }

    for (const el of vis.filter(el => el.matches('textarea, input[type=text], input:not([type])'))) {
      if (el.value || el.closest('[aria-hidden="true"]') || (isPrompt(el) && promptHasValue(el))) continue;
      const required = el.required || el.getAttribute('aria-required') === 'true';
      const q = labelOf(el);
      if (/^(full |your )?name\b/i.test(q) && profile?.name?.full) { setValue(el, profile.name.full); continue; }
      const m = answerFor(answers, q);
      let ok = false;
      if (m && isPrompt(el) && m.pick?.length) for (const path of m.pick) if ((ok = await pickPath(el, path))) break;
      if (!ok && m) ok = await fill(el, m.text || m.a.replace(/^\^|\$$|\\b/g, ''));
      if (!ok && required) flag(el);
    }
  }

  let box;
  function status(msg, warn = false) {
    if (!box) {
      box = document.createElement('div');
      box.setAttribute('role', 'status');
      box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;max-width:360px;padding:10px 14px;border-radius:8px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.25);color:#fff;cursor:pointer';
      box.title = 'Click to hide';
      box.onclick = () => box.remove();
    }
    if (!box.isConnected) document.body.appendChild(box);
    box.style.background = warn ? '#b3261e' : '#1f3b63';
    const n = [...flagged].filter(e => e.isConnected).length;
    box.textContent = 'Autofill: ' + msg + (n ? ` (${n} highlighted for you)` : '') + (window.AF.note ? ' ' + window.AF.note.trim() : '');
  }

  // Storage -> one object. Settings-page address and answers win over what came from the resume.
  async function load() {
    const s = await chrome.storage.local.get(['profile', 'answers', 'qa', 'address', 'fullPdf', 'tailoredPdf', 'useTailored']);
    if (!s.profile) return s;
    const addr = Object.fromEntries(Object.entries(s.address || {}).filter(([, v]) => v));
    s.profile = { ...s.profile, address: { ...s.profile.address, ...addr } };
    const qa = s.qa || {};
    s.skills = qa.skills != null ? qa.skills.split(/\s*,\s*/).filter(Boolean) : s.profile.skillList || [];
    s.certs = qa.certs != null ? qa.certs.split('\n').map(x => x.trim()).filter(Boolean) : s.profile.certifications || [];
    s.allAnswers = [...(s.answers || []), ...derivedAnswers(s.profile)];
    return s;
  }
  const resumeFile = s => (s.useTailored && s.tailoredPdf) || s.fullPdf;
  function url(u) { return !u ? '' : /^https?:\/\//.test(u) ? u : 'https://' + u; }

  window.AF = { sleep, visible, text, norm, esc, waitFor, setValue, clear, key, click, field, fieldAll, byLabel, byLabelAll, find, findAll,
    setDate, options, best, pickOption, pickPrompt, pickPath, fill, isDropdown, isPrompt, attachFile, labelOf, answerFor, majors,
    derivedAnswers, answerQuestions, flag, flagged, status, load, resumeFile, url, running: false, stop: false };
})();
