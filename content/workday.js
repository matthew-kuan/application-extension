// Workday: fill the current step, click Save and Continue, repeat. Never clicks Submit.
(async () => {
  const AF = window.AF;
  if (AF.running) { AF.stop = true; AF.status('Stopping after this field…'); return; }
  AF.running = true;
  AF.stop = false;

  const STATES = 'AL Alabama|AK Alaska|AZ Arizona|AR Arkansas|CA California|CO Colorado|CT Connecticut|DE Delaware|DC District of Columbia|FL Florida|GA Georgia|HI Hawaii|ID Idaho|IL Illinois|IN Indiana|IA Iowa|KS Kansas|KY Kentucky|LA Louisiana|ME Maine|MD Maryland|MA Massachusetts|MI Michigan|MN Minnesota|MS Mississippi|MO Missouri|MT Montana|NE Nebraska|NV Nevada|NH New Hampshire|NJ New Jersey|NM New Mexico|NY New York|NC North Carolina|ND North Dakota|OH Ohio|OK Oklahoma|OR Oregon|PA Pennsylvania|RI Rhode Island|SC South Carolina|SD South Dakota|TN Tennessee|TX Texas|UT Utah|VT Vermont|VA Virginia|WA Washington|WV West Virginia|WI Wisconsin|WY Wyoming'
    .split('|').reduce((m, s) => (m[s.slice(0, 2)] = s.slice(3), m), {});

  const nextButton = () => document.querySelector('[data-automation-id="bottom-navigation-next-button"]')
    || [...document.querySelectorAll('button')].find(b => AF.visible(b) && /^(save and continue|next|continue)$/i.test(AF.text(b)));

  function step() {
    const page = document.querySelector('[data-automation-id^="applyFlow"][data-automation-id$="Page"]')?.dataset.automationId || '';
    const active = AF.text(document.querySelector('[data-automation-id="progressBarActiveStep"]'));
    const h = AF.text(document.querySelector('main h2, h2'));
    const s = `${page} ${active} ${h}`.toLowerCase();
    if (/review/.test(s)) return 'review';
    if (/myinfo|my information/.test(s)) return 'info';
    if (/myexp|my experience/.test(s)) return 'experience';
    if (/selfidentif|self identif|disability/.test(s)) return 'self';
    if (/voluntary|disclosure/.test(s)) return 'voluntary';
    if (/question/.test(s)) return 'questions';
    return 'other';
  }
  const pageSig = () => step() + '|' + AF.text(document.querySelector('[data-automation-id="progressBarActiveStep"]')) + '|' + AF.text(document.querySelector('main h2, h2'));
  const errorShown = () => [...document.querySelectorAll('[data-automation-id="errorBanner"], [data-automation-id="errorMessage"], [role="alert"]')].some(e => AF.visible(e) && AF.text(e));

  const set = async (root, keys, value, patterns) => {
    const el = AF.field(keys, root);
    if (!el) return;
    if (!(await AF.fill(el, value, patterns)) && value) AF.flag(el);
  };

  async function setDate(root, key, d, today = false) {
    if (!d) return;
    const one = part => root.querySelector(`[data-automation-id="${key}"] [data-automation-id="dateSection${part}-input"], [data-automation-id="formField-${key}"] [data-automation-id="dateSection${part}-input"], [id$="--${key}-dateSection${part}-input"]`);
    const m = one('Month'), y = one('Year'), dd = one('Day');
    if (m && d.month) AF.setValue(m, String(d.month).padStart(2, '0'));
    if (dd && today) AF.setValue(dd, String(new Date().getDate()).padStart(2, '0'));
    if (y && d.year) AF.setValue(y, String(d.year));
    if (!m && !y) { // some tenants use one MM/YYYY text box
      const box = AF.field([key], root);
      if (box?.matches('input') && !box.value) AF.setValue(box, d.month ? `${String(d.month).padStart(2, '0')}/${d.year}` : String(d.year));
    }
  }

  // Section = nearest ancestor of the heading that has its own Add button.
  function section(title) {
    const re = new RegExp('^' + title + '\\b', 'i');
    const head = [...document.querySelectorAll('h2, h3, h4, legend, [role="heading"]')].find(h => AF.visible(h) && re.test(AF.text(h)) && !/\d$/.test(AF.text(h)));
    for (let p = head?.parentElement; p; p = p.parentElement) {
      const add = [...p.querySelectorAll('button')].find(b => /^add( another)?$/i.test(AF.text(b)) || b.dataset.automationId === 'Add' || b.dataset.automationId === 'add-button');
      if (add) return { root: p, add };
    }
    return null;
  }

  async function clearSection(title) {
    for (let i = 0; i < 40 && !AF.stop; i++) {
      const sec = section(title);
      const del = sec && [...sec.root.querySelectorAll('button')].find(b => AF.visible(b) && (/^delete$/i.test(AF.text(b)) || /^delete/i.test(b.getAttribute('aria-label') || '') || b.dataset.automationId === 'panel-set-delete-button'));
      if (!del) return;
      AF.click(del);
      await AF.sleep(400);
    }
  }

  async function addEntry(title, keys, fillPanel) {
    const sec = section(title);
    if (!sec) { AF.status(`No "${title}" section on this page, skipped`); return; }
    const before = AF.fieldAll(keys, sec.root).length;
    AF.click(sec.add);
    if (!(await AF.waitFor(() => AF.fieldAll(keys, section(title)?.root || document).length > before, 5000))) return;
    const root = section(title).root;
    let panel = AF.fieldAll(keys, root).at(-1);
    while (panel.parentElement && panel.parentElement !== root && AF.fieldAll(keys, panel.parentElement).length === 1) panel = panel.parentElement;
    await fillPanel(panel);
  }

  const describe = e => [e.tech && `Tech: ${e.tech}`, ...e.bullets.map(b => '• ' + b)].filter(Boolean).join('\n');

  async function fillJob(panel, e) {
    await set(panel, ['jobTitle'], e.title);
    await set(panel, ['companyName', 'company'], e.org);
    await set(panel, ['location'], e.location);
    if (e.current) { const c = AF.field(['currentlyWorkHere'], panel); if (c && !c.checked) { AF.click(c); await AF.sleep(200); } }
    await setDate(panel, 'startDate', e.start);
    if (!e.current) await setDate(panel, 'endDate', e.end);
    if (!e.start) AF.flag(AF.field(['startDate'], panel) || panel);
    await set(panel, ['roleDescription', 'description'], describe(e));
  }

  const degreePatterns = deg => {
    const d = deg || '';
    if (/\b(B\.?\s?S|B\.?\s?E|B\.?\s?A|Bachelor)/i.test(d)) return [/bachelor.*(science|engineering)/i, /bachelor/i, /^b\.?s/i];
    if (/\b(M\.?\s?S|M\.?\s?Eng|M\.?\s?A|Master)/i.test(d)) return [/master.*(science|engineering)/i, /master/i];
    if (/ph\.?\s?d|doctor/i.test(d)) return [/doctor|ph\.?\s?d/i];
    if (/associate/i.test(d)) return [/associate/i];
    return null;
  };
  const major = deg => (deg || '').split(/,|\band\b/)[0].replace(/^\s*(B|M)\.?\s?(S|E|A|Eng)\.?\s+(in\s+)?/i, '').replace(/^(Bachelor|Master)\S*\s+of\s+\S+\s+(in\s+)?/i, '').trim();

  async function fillEdu(panel, ed) {
    await set(panel, ['schoolName', 'school'], ed.school);
    const pats = degreePatterns(ed.degree);
    const deg = AF.field(['degree'], panel);
    if (deg && pats) { if (!(await AF.fill(deg, ed.degree, pats))) AF.flag(deg); } else if (deg) AF.flag(deg);
    if (pats) await set(panel, ['fieldOfStudy'], major(ed.degree));
    await set(panel, ['gradeAverage', 'gpa'], ed.gpa.split('/')[0]);
    await setDate(panel, 'firstYearAttended', ed.start);
    await setDate(panel, 'lastYearAttended', ed.end);
    await setDate(panel, 'startDate', ed.start);
    await setDate(panel, 'endDate', ed.end);
  }

  async function fillInfo(s) {
    const p = s.profile;
    await set(document, ['legalNameSection_firstName', 'legalName--firstName'], p.name.first);
    await set(document, ['legalNameSection_lastName', 'legalName--lastName'], p.name.last);
    await set(document, ['addressSection_addressLine1', 'address--addressLine1'], p.address.line1);
    await set(document, ['addressSection_city', 'address--city'], p.address.city);
    await set(document, ['addressSection_postalCode', 'address--postalCode'], p.address.postal);
    const state = STATES[p.address.state] || p.address.state;
    const region = AF.field(['addressSection_countryRegion', 'address--countryRegion'], document);
    if (region && state && (!AF.isDropdown(region) || /select one/i.test(AF.text(region)))) await AF.fill(region, state, [new RegExp('^' + AF.esc(state) + '$', 'i')]);
    await set(document, ['email', 'emailAddress--emailAddress'], p.email);
    await set(document, ['phone-number', 'phoneNumber--phoneNumber'], p.phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''));
  }

  async function fillExperience(s) {
    const p = s.profile, pdf = AF.resumeFile(s);
    const input = document.querySelector('input[type=file][data-automation-id="file-upload-input-ref"]') || document.querySelector('input[type=file]');
    if (input && pdf && !document.querySelector('[data-automation-id="file-upload-successful"], [data-automation-id="delete-file"]')) {
      AF.status('Attaching ' + pdf.name);
      AF.attachFile(input, pdf);
      await AF.sleep(4000); // let Workday finish its own upload/parse before we clear what it added
    }
    for (const t of ['Work Experience', 'Education', 'Websites']) await clearSection(t);

    // Workday requires a From date on every entry; dateless projects would block the page.
    const dated = p.projects.filter(pr => pr.start);
    const skipped = p.projects.length - dated.length;
    const jobs = [...p.experience, ...dated.map(pr => ({
      title: pr.name, org: pr.recognition ? `Project (${pr.recognition})` : 'Project', location: '',
      start: pr.start, end: pr.end, current: pr.current, tech: pr.tech, bullets: pr.bullets,
    }))];
    for (const [i, e] of jobs.entries()) {
      if (AF.stop) return;
      AF.status(`Work Experience ${i + 1}/${jobs.length}: ${e.title}`);
      await addEntry('Work Experience', ['jobTitle'], panel => fillJob(panel, e));
    }
    for (const ed of p.education) {
      if (AF.stop) return;
      AF.status('Education: ' + ed.school);
      await addEntry('Education', ['schoolName', 'school'], panel => fillEdu(panel, ed));
    }
    for (const u of [p.links.linkedin, p.links.github, p.links.portfolio].filter(Boolean)) {
      if (AF.stop) return;
      await addEntry('Websites', ['url'], panel => set(panel, ['url'], AF.url(u)));
    }
    await set(document, ['linkedinQuestion', 'linkedInAccount'], AF.url(p.links.linkedin));
    if (skipped) AF.note = `Skipped ${skipped} projects with no dates; add dates in Options to include them.`;
  }

  async function fillSelf(s) {
    await set(document, ['name'], s.profile.name.full);
    const now = new Date();
    await setDate(document, 'dateSignedOn', { month: now.getMonth() + 1, year: now.getFullYear() }, true);
  }

  async function main() {
    const s = await AF.load();
    if (!s.profile) return AF.status('No resume set up yet. Right-click the extension icon → Options.', true);
    const answers = s.answers || [];

    const manual = document.querySelector('[data-automation-id="applyManually"]');
    if (manual) { AF.click(manual); await AF.waitFor(() => step() !== 'other' || document.querySelector('input[type=password]'), 10000); }
    if (document.querySelector('input[type=password]')) return AF.status('Sign in or create your Workday account, then click again.', true);

    for (let n = 0; n < 15; n++) {
      if (AF.stop) return AF.status('Stopped.');
      const st = step();
      if (st === 'review') return AF.status('Reached Review. Check everything, then submit yourself.');
      AF.status('Filling ' + st);
      if (st === 'info') await fillInfo(s);
      if (st === 'experience') await fillExperience(s);
      if (st === 'self') await fillSelf(s);
      if (AF.stop) return AF.status('Stopped.');
      if (st !== 'experience') await AF.answerQuestions(answers, s.profile);

      const next = nextButton();
      if (!next) return AF.status('No Save and Continue button found. Stopped here.', true);
      if (/submit/i.test(AF.text(next))) return AF.status('Next button says Submit. Stopped so you can review.');
      const before = pageSig();
      AF.click(next);
      await AF.waitFor(() => pageSig() !== before || errorShown(), 20000);
      await AF.sleep(800);
      if (pageSig() === before) return AF.status('Workday wants changes on this page. Fix the highlighted or flagged fields, then click again.', true);
      await AF.sleep(1200);
    }
  }

  try { await main(); }
  catch (e) { console.error('autofill', e); AF.status('Error: ' + e.message, true); }
  finally { AF.running = false; }
})();
