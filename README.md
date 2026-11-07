# Job Application Autofill (Edge / Chrome extension)

One click fills job applications from your resume PDF. On Workday it fills each page, clicks **Save and Continue**, and stops at **Review**. It never clicks Submit.

## Install
1. Open `edge://extensions` (or `chrome://extensions`), turn on **Developer mode**.
2. **Load unpacked** → pick this folder.
3. The settings page opens. Upload your main resume (`matthew_kuan_resume_full.pdf`).
4. Optional: choose **Yes** under "Upload a different resume" and upload a tailored PDF. That one gets attached and filled, and each matching entry gets extra bullets (default 2) from the main resume.
5. In **What gets filled**, add your street address and ZIP, fix anything the parser got wrong, and Save.
6. In **Question answers**, fill in work authorization, sponsorship, and "how did you hear" (they're blank, so they get highlighted for you until you do).

## Use
- Open the application (sign in to Workday first), then click the extension icon or press **Alt+Shift+F**.
- Click again to stop.
- Yellow outline = it didn't know the answer. It stops on any page Workday rejects; fix the flagged fields and click again to continue from there.
- Workday: experiences and dated projects go into Work Experience (Workday has no Projects section); projects without dates are skipped. Entries Workday pre-filled from your resume are deleted first, so nothing is duplicated.
- Other sites (Greenhouse, Lever, Ashby, company forms): fills name, contact, links, school, resume upload and known questions on the current page.
- Consent/terms checkboxes are always left for you.

## Develop
- `node --test tests/parse.test.mjs` runs parser and merge tests (plus a smoke test on the full resume if it's in Downloads).
- `python -m http.server 8765`, then open `http://localhost:8765/tests/workday-mock.html` or `generic-mock.html` and press **Run autofill**.
- `lib/` is pdf.js 4.10.38 (legacy build), vendored unchanged.
