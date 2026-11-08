// Single-page forms (Greenhouse, Lever, Ashby, company sites): match fields by label, attach resume, answer known questions.
(async () => {
  const AF = window.AF;
  const inputs = [...document.querySelectorAll('input:not([type=hidden]):not([type=file]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), textarea')].filter(AF.visible);
  const files = [...document.querySelectorAll('input[type=file]')];
  if (!inputs.length && !files.length) return; // nothing to do in this frame

  const s = await AF.load();
  const p = s.profile;
  if (!p) return AF.status('No resume set up yet. Right-click the extension icon → Options.', true);
  const ed = p.education[0] || {};
  const major = AF.majors(ed.degree)[0] || '';

  const rules = [
    [/first.?name|given.?name|fname/, p.name.first],
    [/last.?name|family.?name|surname|lname/, p.name.last],
    [/e-?mail/, p.email],
    [/phone|mobile|tel\b/, p.phone],
    [/linkedin/, AF.url(p.links.linkedin)],
    [/github/, AF.url(p.links.github)],
    [/website|portfolio|personal (site|url)|other url/, AF.url(p.links.portfolio)],
    [/address.?(line)?.?2|apt|suite|unit/, p.address.line2],
    [/address.?(line)?.?1|street|^address/, p.address.line1],
    [/\bcity\b/, p.address.city],
    [/zip|postal/, p.address.postal],
    [/\bstate\b|province/, p.address.state],
    [/location/, [p.address.city, p.address.state].filter(Boolean).join(', ')],
    [/school|university|college/, ed.school],
    [/\bgpa\b|grade point/, (ed.gpa || '').split('/')[0]],
    [/major|discipline|field of study/, major],
    [/(company|employer|school|reference|manager|emergency)\W.*name/, null],
    [/\b(full |legal |your )?name\b/, p.name.full],
  ];

  let n = 0;
  for (const el of inputs) {
    if (el.value) continue;
    const hay = `${AF.labelOf(el)} | ${el.name} ${el.id} ${el.placeholder} ${el.getAttribute('autocomplete') || ''}`.toLowerCase();
    const r = rules.find(([re]) => re.test(hay));
    if (r?.[1] && AF.setValue(el, r[1])) n++;
  }

  const pdf = AF.resumeFile(s);
  const resumeInput = files.find(f => /resume|cv/i.test(`${AF.labelOf(f)} ${f.name} ${f.id} ${f.closest('[class*=resume], [id*=resume]') ? 'resume' : ''}`)) || (files.length === 1 && files[0]);
  if (pdf && resumeInput && !resumeInput.files.length) { AF.attachFile(resumeInput, pdf); n++; }

  await AF.answerQuestions(s.allAnswers, p);
  AF.status(`Filled ${n} fields. Review the page before submitting.`);
})();
