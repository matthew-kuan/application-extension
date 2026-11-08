// Simple settings answers -> matcher list used by the fillers.
// Each entry: q = pattern for the question text, a = pattern for the option to pick,
// text = what to type into a text box, pick = menu paths for searchable Workday menus ("Job Sites > LinkedIn").

export const DECLINE = "decline|not (wish|want) to|prefer not|don't wish|do not wish|choose not";

export const QUESTIONS = [
  ['auth', 'Legally authorized to work in the US?', ['', 'Yes', 'No']],
  ['sponsor', 'Will you need visa sponsorship now or in the future?', ['', 'Yes', 'No']],
  ['hear', 'How did you hear about us? (use > for sub-menus)', 'text'],
  ['hear2', 'How did you hear about us, if the first isn’t offered', 'text'],
  ['prev', 'Previously worked for this company?', ['No', 'Yes']],
  ['adult', 'At least 18 years old?', ['Yes', 'No']],
  ['gender', 'Gender', ['Decline', 'Male', 'Female', 'Non-binary']],
  ['hispanic', 'Hispanic or Latino?', ['Decline', 'No', 'Yes']],
  ['race', 'Race', ['Decline', 'Asian', 'Black or African American', 'White', 'American Indian or Alaska Native', 'Native Hawaiian or Other Pacific Islander', 'Two or More Races']],
  ['veteran', 'Veteran status', ['Decline', 'Not a protected veteran', 'Protected veteran']],
  ['disability', 'Disability', ['Decline', 'No', 'Yes']],
];

export const DEFAULT_QA = {
  auth: '', sponsor: '', hear: 'Job Sites > LinkedIn', hear2: 'Career Website', prev: 'No', adult: 'Yes',
  gender: 'Decline', hispanic: 'Decline', race: 'Decline', veteran: 'Decline', disability: 'Decline', phoneType: 'Mobile', custom: '',
};

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const yesNo = v => v ? { a: `^${v.toLowerCase()}\\b`, text: v } : { a: '', text: '' };
const leaf = p => p.split('>').pop().trim();

export function buildAnswers(qa) {
  const out = [];
  const add = (q, { a = '', text = '', pick } = {}) => out.push({ q, a, text, ...(pick && { pick }) });
  const choose = (v, map) => v === 'Decline' || !v ? { a: DECLINE } : map(v);

  // custom lines first so they win over the built-in patterns
  for (const line of (qa.custom || '').split('\n')) {
    const [k, ...rest] = line.split('=');
    const v = rest.join('=').trim();
    if (k.trim() && v) add(esc(k.trim()), { a: esc(v), text: v });
  }
  add('authori[sz]ed to work|legally (eligible|permitted|able) to work|right to work|eligible to work', yesNo(qa.auth));
  add('sponsor|visa', yesNo(qa.sponsor));
  const picks = [qa.hear, qa.hear2].map(p => (p || '').trim()).filter(Boolean);
  add('how did you hear|hear about|source', { a: picks.map(p => esc(leaf(p))).join('|'), text: picks[0] ? leaf(picks[0]) : '', pick: picks });
  add('previously (worked|been employed)|former (employee|worker|contractor)|worked (here|for us|for .*) before|currently (work|employed) (for|at|by)', yesNo(qa.prev));
  add('18 years|age of 18|at least 18', yesNo(qa.adult));
  add('phone device type|phone type', { a: `^${esc(qa.phoneType || 'Mobile')}|${qa.phoneType === 'Landline' ? 'home|land' : 'cell'}` });
  add('gender|\\bsex\\b', choose(qa.gender, v => ({ a: `^${esc(v)}\\b` })));
  add('hispanic|latino', choose(qa.hispanic, v => yesNo(v)));
  add('race|ethnic', choose(qa.race, v => ({ a: esc(v) })));
  add('veteran', choose(qa.veteran, v => ({ a: v.startsWith('Not') ? 'not a (protected )?veteran|i am not' : '^i (identify as|am) (one or more|a protected)' })));
  add('disability', choose(qa.disability, v => ({ a: v === 'No' ? "^no\\b|do not have a disability|don't have a disability" : '^yes\\b|i have a disability' })));
  return out.filter(x => x.a || x.text);
}
