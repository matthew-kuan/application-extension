// Shared helpers for the fillers. Injected before workday.js / generic.js; safe to inject twice.
(() => {
  if (window.AF) return;

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  async function waitFor(fn, timeout = 8000) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const v = fn();
      if (v) return v;
      await sleep(150);
    }
    return null;
  }

  // React/Workday ignore plain `el.value = x`; go through the native setter and fire the events React listens to.
  function setValue(el, value) {
    if (!el || value == null || value === '') return false;
    el.focus();
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    return true;
  }

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
  const control = el => !el ? null : el.matches('input, textarea, select, button') ? el : el.querySelector('input:not([type=hidden]), textarea, select, button');
  const field = (keys, root = document) => { for (const k of keys) { const el = root.querySelector(sel(k)); if (el) return control(el); } return null; };
  const fieldAll = (keys, root = document) => keys.flatMap(k => [...root.querySelectorAll(sel(k))]).filter((el, i, a) => a.indexOf(el) === i && !a.some(o => o !== el && o.contains(el)));

  const options = () => [...document.querySelectorAll('[role="option"], [data-automation-id="promptOption"], [data-automation-id="menuItem"]')].filter(visible);

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

  // Searchable Workday "prompt" fields (school, field of study, how did you hear): type, Enter, pick the matching result.
  async function pickPrompt(input, value) {
    setValue(input, value);
    input.focus();
    key(input, 'Enter');
    const want = norm(value);
    const hit = await waitFor(() => options().find(o => { const t = norm(text(o)); return t && (t.includes(want) || want.includes(t)); }), 4000);
    if (hit) { click(hit); await sleep(400); return true; }
    key(input, 'Escape');
    return false;
  }

  const isDropdown = el => el?.matches('button[aria-haspopup="listbox"], button[aria-haspopup="true"]');
  const isPrompt = el => el?.matches('input') && (el.dataset.automationId === 'searchBox' || el.dataset.uxiWidgetType === 'selectinput' || !!el.closest('[data-automation-id="multiSelectContainer"], [data-uxi-widget-type="multiselect"]'));
  const dropdownEmpty = b => /^(select one|select\.*|choose\.*|)$/i.test(text(b));

  // Fill whatever kind of control `el` is with a plain value.
  async function fill(el, value, patterns) {
    if (!el || value == null || value === '') return false;
    if (isDropdown(el)) return pickOption(el, patterns || [new RegExp('^' + esc(String(value)), 'i'), new RegExp(esc(String(value)), 'i')]);
    if (isPrompt(el)) return pickPrompt(el, String(value));
    if (el.matches('select')) {
      const re = patterns?.[0] || new RegExp(esc(String(value)), 'i');
      const opt = [...el.options].find(o => o.value && re.test(o.text));
      if (!opt) return false;
      el.value = opt.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
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

  const flagged = new Set();
  function flag(el) {
    if (!el) return;
    el.style.outline = '3px solid #f5c400';
    el.style.outlineOffset = '2px';
    flagged.add(el);
  }

  // Answer the remaining questions on the page from the saved answer list. Anything unanswered gets flagged.
  async function answerQuestions(answers, profile, root = document) {
    const vis = [...root.querySelectorAll('button[aria-haspopup="listbox"], select, input, textarea')].filter(visible);

    for (const b of vis.filter(isDropdown)) {
      if (!dropdownEmpty(b)) continue;
      const m = answerFor(answers, labelOf(b));
      if (m?.a && await pickOption(b, [new RegExp(m.a, 'i')])) continue;
      flag(b);
    }

    for (const s of vis.filter(el => el.matches('select'))) {
      if (s.value) continue;
      const m = answerFor(answers, labelOf(s));
      if (!(m?.a && await fill(s, m.a, [new RegExp(m.a, 'i')]))) flag(s);
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
      const hit = m?.a && inputs.find(i => new RegExp(m.a, 'i').test(text(i.closest('label')) || text(document.querySelector(`label[for="${CSS.escape(i.id)}"]`)) || i.value));
      if (hit) { click(hit); await sleep(150); } else flag(g);
    }

    for (const el of vis.filter(el => el.matches('textarea, input[type=text], input:not([type])'))) {
      if (el.value || !(el.required || el.getAttribute('aria-required') === 'true') || el.closest('[aria-hidden="true"]')) continue;
      const q = labelOf(el);
      if (/^(full |your )?name\b/i.test(q) && profile?.name?.full) { setValue(el, profile.name.full); continue; }
      const m = answerFor(answers, q);
      if (!(m?.a && await fill(el, m.a.replace(/^\^|\$$/g, '')))) flag(el);
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
    box.textContent = 'Autofill: ' + msg + ([...flagged].some(e => e.isConnected) ? ` (${[...flagged].filter(e => e.isConnected).length} highlighted for you)` : '') + (window.AF.note ? ' ' + window.AF.note : '');
  }

  const load = () => chrome.storage.local.get(['profile', 'answers', 'fullPdf', 'tailoredPdf', 'useTailored']);
  const resumeFile = s => (s.useTailored && s.tailoredPdf) || s.fullPdf;
  const url = u => !u ? '' : /^https?:\/\//.test(u) ? u : 'https://' + u;

  window.AF = { sleep, visible, text, norm, esc, waitFor, setValue, key, click, field, fieldAll, options, pickOption, pickPrompt,
    fill, isDropdown, attachFile, labelOf, answerFor, answerQuestions, flag, flagged, status, load, resumeFile, url, running: false, stop: false };
})();
