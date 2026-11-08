// Workday: fill the current step, click Save and Continue, repeat. Never clicks Submit.
(async () => {
  const AF = window.AF;
  if (AF.running) { AF.stop = true; AF.status('Stopping after this field…'); return; }
  AF.running = true;
  AF.stop = false;
  AF.note = '';

  const STATES = 'AL Alabama|AK Alaska|AZ Arizona|AR Arkansas|CA California|CO Colorado|CT Connecticut|DE Delaware|DC District of Columbia|FL Florida|GA Georgia|HI Hawaii|ID Idaho|IL Illinois|IN Indiana|IA Iowa|KS Kansas|KY Kentucky|LA Louisiana|ME Maine|MD Maryland|MA Massachusetts|MI Michigan|MN Minnesota|MS Mississippi|MO Missouri|MT Montana|NE Nebraska|NV Nevada|NH New Hampshire|NJ New Jersey|NM New Mexico|NY New York|NC North Carolina|ND North Dakota|OH Ohio|OK Oklahoma|OR Oregon|PA Pennsylvania|RI Rhode Island|SC South Carolina|SD South Dakota|TN Tennessee|TX Texas|UT Utah|VT Vermont|VA Virginia|WA Washington|WV West Virginia|WI Wisconsin|WY Wyoming'
    .split('|').reduce((m, s) => (m[s.slice(0, 2)] = s.slice(3), m), {});

  // Fields: Workday id keys, then on-screen label.
  const F = {
    first: [['legalNameSection_firstName', 'legalName--firstName'], /^(legal )?first name/i],
    last: [['legalNameSection_lastName', 'legalName--lastName'], /^(legal )?last name/i],
    line1: [['addressSection_addressLine1', 'address--addressLine1'], /^address line 1/i],
    line2: [['addressSection_addressLine2', 'address--addressLine2'], /^address line 2/i],
    city: [['addressSection_city', 'address--city'], /^city/i],
    state: [['addressSection_countryRegion', 'address--countryRegion'], /^(state|province|region)/i],
    postal: [['addressSection_postalCode', 'address--postalCode'], /^(postal|zip)/i],
    email: [['email', 'emailAddress--emailAddress'], /^email/i],
    phoneType: [['phone-device-type', 'phoneNumber--phoneType'], /^phone device type/i],
    phone: [['phone-number', 'phoneNumber--phoneNumber'], /^phone number/i],
    jobTitle: [['jobTitle'], /^job title/i],
    company: [['companyName', 'company'], /^company/i],
    location: [['location'], /^location/i],
    current: [['currentlyWorkHere'], /currently work here/i],
    from: [['startDate'], /^from\b/i],
    to: [['endDate'], /^to\b/i],
    role: [['roleDescription', 'description'], /^(role )?description/i],
    school: [['schoolName', 'school'], /^(school|university|college|school or university)\b/i],
    degree: [['degree'], /^degree/i],
    field: [['fieldOfStudy'], /^field of study/i],
    gpa: [['gradeAverage', 'gpa'], /overall result|\bgpa\b/i],
    eduFrom: [['firstYearAttended', 'startDate'], /^(from|start)/i],
    eduTo: [['lastYearAttended', 'endDate'], /^(to|end|expected)/i],
    cert: [['certification', 'certificationName'], /^certification( name)?$/i],
    url: [['url'], /^url/i],
    linkedin: [['linkedinQuestion', 'linkedInAccount'], /^linkedin/i],
    skills: [['skills', 'skillsPrompt'], /^(type to add )?skills$/i],
  };
  const get = (root, f) => AF.find(root, F[f][0], F[f][1]);

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

  async function put(el, value, patterns) {
    if (!el || !value) return false;
    const ok = await AF.fill(el, value, patterns);
    if (!ok) AF.flag(el);
    return ok;
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

  // Click Add in the section, find the new entry's block by its first field, and fill it.
  async function addEntry(title, f, fillPanel) {
    const sec = section(title);
    if (!sec) return false;
    const all = root => AF.findAll(root, F[f][0], F[f][1]);
    const before = all(sec.root).length;
    AF.click(sec.add);
    if (!(await AF.waitFor(() => all(section(title)?.root || document).length > before, 5000))) return false;
    const root = section(title).root;
    let panel = all(root).at(-1);
    // climb to the largest block holding only this entry (label lookups see 0 until the block includes the label)
    while (panel.parentElement && panel.parentElement !== root && all(panel.parentElement).length < 2) panel = panel.parentElement;
    await fillPanel(panel);
    return true;
  }

  const describe = e => [e.tech && `Tech: ${e.tech}`, ...e.bullets.map(b => '• ' + b)].filter(Boolean).join('\n');

  async function fillJob(panel, e) {
    await put(get(panel, 'jobTitle'), e.title);
    await put(get(panel, 'company'), e.org);
    await put(get(panel, 'location'), e.location);
    const cur = get(panel, 'current');
    if (cur && cur.checked !== !!e.current) { AF.click(cur); await AF.sleep(300); }
    if (!(await AF.setDate(panel, ...F.from, e.start))) AF.flag(panel);
    if (!e.current) await AF.setDate(panel, ...F.to, e.end);
    await put(get(panel, 'role'), describe(e));
  }

  const degreeInfo = d => {
    if (/\b(M\.?\s?S|M\.?\s?Eng|M\.?\s?A|Master)\b/i.test(d)) return { word: 'Master', pats: [/master.*(science|engineering)/i, /master/i] };
    if (/ph\.?\s?d|doctor/i.test(d)) return { word: 'Doctorate', pats: [/doctor|ph\.?\s?d/i] };
    if (/associate/i.test(d)) return { word: 'Associate', pats: [/associate/i] };
    return { word: 'Bachelor', pats: [/bachelor.*(science|engineering)/i, /bachelor/i, /^b\.?\s?s\b/i] }; // default
  };

  async function fillEdu(panel, ed) {
    await put(get(panel, 'school'), ed.school);
    const deg = get(panel, 'degree');
    const { word, pats } = degreeInfo(ed.degree || '');
    if (deg) await put(deg, word, pats);
    const field = get(panel, 'field');
    const majors = AF.majors(ed.degree);
    if (field && majors.length) {
      let ok = false;
      for (const m of majors) if ((ok = await AF.fill(field, m))) break;
      if (!ok) AF.flag(field);
    }
    if (ed.gpa) await put(get(panel, 'gpa'), ed.gpa.split('/')[0]);
    await AF.setDate(panel, ...F.eduFrom, ed.start);
    await AF.setDate(panel, ...F.eduTo, ed.end);
  }

  async function fillSkills(skills) {
    let added = 0;
    for (const [i, skill] of skills.entries()) {
      if (AF.stop) break;
      const input = get(document, 'skills');
      if (!input) return;
      const have = [...document.querySelectorAll('[data-automation-id="selectedItem"]')].map(x => AF.norm(AF.text(x)));
      if (have.includes(AF.norm(skill))) continue;
      AF.status(`Skills ${i + 1}/${skills.length}: ${skill}`);
      if (await AF.pickPrompt(input, skill, 2500)) added++;
    }
    if (added < skills.length) AF.note += ` Added ${added}/${skills.length} skills (the rest aren't in this Workday's list).`;
  }

  async function fillInfo(s) {
    const p = s.profile, a = p.address;
    await put(get(document, 'first'), p.name.first);
    await put(get(document, 'last'), p.name.last);
    await put(get(document, 'line1'), a.line1);
    await put(get(document, 'line2'), a.line2);
    await put(get(document, 'city'), a.city);
    const state = STATES[(a.state || '').toUpperCase()] || a.state;
    if (state) await put(get(document, 'state'), state, [new RegExp('^' + AF.esc(state) + '$', 'i'), new RegExp(AF.esc(state), 'i')]);
    await put(get(document, 'postal'), a.postal);
    await put(get(document, 'email'), p.email);
    const type = s.qa?.phoneType || 'Mobile';
    await put(get(document, 'phoneType'), type, [new RegExp('^' + type, 'i'), type === 'Mobile' ? /cell/i : /home|land/i]);
    await put(get(document, 'phone'), p.phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''));
  }

  async function fillExperience(s) {
    const p = s.profile, pdf = AF.resumeFile(s);
    const input = document.querySelector('input[type=file][data-automation-id="file-upload-input-ref"]') || document.querySelector('input[type=file]');
    if (input && pdf && !document.querySelector('[data-automation-id="file-upload-successful"], [data-automation-id="delete-file"]')) {
      AF.status('Attaching ' + pdf.name);
      AF.attachFile(input, pdf);
      await AF.sleep(4000); // let Workday finish its own upload/parse before we clear what it added
    }
    for (const t of ['Work Experience', 'Education', 'Certifications', 'Websites']) await clearSection(t);

    // Workday requires a From date on every entry; dateless projects would block the page.
    const dated = p.projects.filter(pr => pr.start);
    const skipped = p.projects.length - dated.length;
    if (skipped) AF.note += ` Skipped ${skipped} projects with no dates; add dates in Options to include them.`;
    const jobs = [...p.experience, ...dated.map(pr => ({
      title: pr.name, org: pr.recognition ? `Project (${pr.recognition})` : 'Project', location: '',
      start: pr.start, end: pr.end, current: pr.current, tech: pr.tech, bullets: pr.bullets,
    }))];
    for (const [i, e] of jobs.entries()) {
      if (AF.stop) return;
      AF.status(`Work Experience ${i + 1}/${jobs.length}: ${e.title}`);
      if (!(await addEntry('Work Experience', 'jobTitle', panel => fillJob(panel, e)))) { AF.note += ' Could not add Work Experience entries.'; break; }
    }
    for (const ed of p.education) {
      if (AF.stop) return;
      AF.status('Education: ' + ed.school);
      if (!(await addEntry('Education', 'school', panel => fillEdu(panel, ed)))) break;
    }
    for (const c of s.certs) {
      if (AF.stop) return;
      AF.status('Certification: ' + c);
      if (!(await addEntry('Certifications', 'cert', async panel => put(get(panel, 'cert'), c)))) break;
    }
    await fillSkills(s.skills);
    for (const u of [p.links.linkedin, p.links.github, p.links.portfolio].filter(Boolean)) {
      if (AF.stop) return;
      if (!(await addEntry('Websites', 'url', panel => put(get(panel, 'url'), AF.url(u))))) break;
    }
    await put(get(document, 'linkedin'), AF.url(p.links.linkedin));
  }

  async function fillSelf(s) {
    await put(AF.find(document, ['name'], /^name\b/i), s.profile.name.full);
    const now = new Date();
    await AF.setDate(document, ['dateSignedOn'], /^date\b/i, { month: now.getMonth() + 1, year: now.getFullYear() }, true);
  }

  async function main() {
    const s = await AF.load();
    if (!s.profile) return AF.status('No resume set up yet. Right-click the extension icon → Options.', true);

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
      if (st !== 'experience') await AF.answerQuestions(s.allAnswers, s.profile);

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
