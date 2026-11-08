# Job Application Autofill (Edge / Chrome extension)

One click fills job applications from your resume PDF. On Workday it fills each page, clicks **Save and Continue**, and stops at **Review**. It never clicks Submit.

## Install
1. Open `edge://extensions` (or `chrome://extensions`), turn on **Developer mode**.
2. **Load unpacked** → pick this folder. The settings page opens (later: right-click the icon → Options).

## Settings (save automatically)
1. **Main resume:** upload your full resume PDF (every experience and project you have).
2. **Different resume?** Yes/No. With Yes, the tailored PDF is attached and filled, and each matching entry gets extra bullets (default 2) from the main resume.
3. **Address and phone:** address line 1/2, city, state, postal code, country, phone device type (default Mobile). City/state start from the resume.
4. **Application questions:** a dropdown or text box per question. Defaults: how did you hear = `Job Sites > LinkedIn`, then `Career Website`; previously worked here = No; 18+ = Yes; voluntary disclosures = decline. Work authorization and sponsorship start as "Leave for me". Add anything else as `words in the question = answer`.
   Also answered from the resume: GPA, graduation date, school, major, degree level, currently enrolled, LinkedIn/GitHub/website.
5. **Skills and certifications:** prefilled from the resume, editable.
6. **Advanced:** the full parsed resume as JSON, for fixing titles, dates or bullets.

## Use
- Open the application (sign in to Workday first), then click the extension icon or press **Alt+Shift+F**. Click again to stop.
- Yellow outline = it didn't know the answer. It stops on any page Workday rejects; fix the flagged fields and click again to continue from there.
- Workday **My Experience**: attaches the resume, removes entries Workday pre-filled, then adds
  - Work Experience: Job Title, Company, Location, I currently work here, From/To, Role Description (experiences and dated projects; projects without dates are skipped)
  - Education: School or University, Degree (Bachelor's unless the resume says otherwise), Field of Study, Overall Result (GPA), From/To
  - Certifications, Skills (only ones in that Workday's list), Websites
  Fields are found by Workday's ids, or by their on-screen label when a company's Workday uses different ids.
- Other sites (Greenhouse, Lever, Ashby, company forms): fills name, address, contact, links, school, resume upload and known questions on the current page.
- Consent/terms checkboxes are always left for you.

## Develop
- `node --test tests/parse.test.mjs` runs parser, merge and answer tests (plus a smoke test on a real resume: set `RESUME_PDF=path/to/resume.pdf`).
- `python -m http.server 8765`, then open `http://localhost:8765/tests/workday-mock.html` (press **Run autofill**), `generic-mock.html`, or `options-harness.html` (settings page outside the extension).
- `lib/` is pdf.js 4.10.38 (legacy build), vendored unchanged.
