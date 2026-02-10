const vm = require('vm');
const fs = require('fs');
const code = fs.readFileSync('/home/user/Main/hijri.js', 'utf8');
const ctx = {
  console, Date, Math, parseInt, parseFloat, isNaN,
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = v; },
    removeItem(k) { delete this.store[k]; }
  }
};
const context = vm.createContext(ctx);
const H = vm.runInContext(code + '\nHijriCalendar;', context);

// ═══════════════════════════════════════════════════════════
//  Well-Known Hijri -> Gregorian Date Pairs
// ═══════════════════════════════════════════════════════════

const testCases = [
  { hY: 1,    hM: 1,  hD: 1,  gY: 622,  gM: 7,  gD: 16, label: '1 Muharram 1 AH' },
  { hY: 1445, hM: 1,  hD: 1,  gY: 2023, gM: 7,  gD: 19, label: '1 Muharram 1445' },
  { hY: 1445, hM: 9,  hD: 1,  gY: 2024, gM: 3,  gD: 11, label: '1 Ramadan 1445' },
  { hY: 1445, hM: 10, hD: 1,  gY: 2024, gM: 4,  gD: 10, label: '1 Shawwal 1445 (Eid al-Fitr)' },
  { hY: 1445, hM: 12, hD: 10, gY: 2024, gM: 6,  gD: 17, label: '10 Dhul-Hijjah 1445 (Eid al-Adha)' },
  { hY: 1446, hM: 1,  hD: 1,  gY: 2024, gM: 7,  gD: 8,  label: '1 Muharram 1446' },
  { hY: 1446, hM: 9,  hD: 1,  gY: 2025, gM: 3,  gD: 1,  label: '1 Ramadan 1446' },
  { hY: 1446, hM: 10, hD: 1,  gY: 2025, gM: 3,  gD: 31, label: '1 Shawwal 1446 (Eid al-Fitr)' },
  { hY: 1446, hM: 12, hD: 10, gY: 2025, gM: 6,  gD: 7,  label: '10 Dhul-Hijjah 1446 (Eid al-Adha)' },
  { hY: 1447, hM: 1,  hD: 1,  gY: 2025, gM: 6,  gD: 27, label: '1 Muharram 1447' },
  { hY: 1447, hM: 9,  hD: 1,  gY: 2026, gM: 2,  gD: 18, label: '1 Ramadan 1447' },
  { hY: 1447, hM: 10, hD: 1,  gY: 2026, gM: 3,  gD: 20, label: '1 Shawwal 1447' },
  { hY: 1400, hM: 1,  hD: 1,  gY: 1979, gM: 11, gD: 21, label: '1 Muharram 1400' },
  { hY: 1440, hM: 1,  hD: 1,  gY: 2018, gM: 9,  gD: 12, label: '1 Muharram 1440' },
  { hY: 1444, hM: 1,  hD: 1,  gY: 2022, gM: 7,  gD: 30, label: '1 Muharram 1444' },
];

// ═══════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════

function pad(s, len) {
  s = String(s);
  return s.length >= len ? s : s + ' '.repeat(len - s.length);
}

function padLeft(s, len) {
  s = String(s);
  return s.length >= len ? s : ' '.repeat(len - s.length) + s;
}

function fmtDate(y, m, d) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${padLeft(String(d), 2)} ${months[m - 1]} ${y}`;
}

function diffDays(y1, m1, d1, y2, m2, d2) {
  const jdn1 = H.gregorianToJDN(y1, m1, d1);
  const jdn2 = H.gregorianToJDN(y2, m2, d2);
  return jdn2 - jdn1;
}

function fmtDiff(diff) {
  if (diff === 0) return '    OK';
  const sign = diff > 0 ? '+' : '';
  return padLeft(`${sign}${diff}d`, 6);
}

// ═══════════════════════════════════════════════════════════
//  Run Tests
// ═══════════════════════════════════════════════════════════

const W = 112;
const SEP = '='.repeat(W);
const THIN = '-'.repeat(W);

console.log('');
console.log(SEP);
console.log('  HIJRI CALENDAR ACCURACY TEST');
console.log('  Testing HijriCalendar against well-known Hijri-Gregorian date pairs');
console.log('  Modes: Tabular (al-Tawfiqat al-Ilhamiyyah) & Astronomical (Lunar Conjunction)');
console.log(SEP);
console.log('');

const COL = {
  label: 40,
  expected: 16,
  result: 16,
  diff: 6,
  gap: 3,
};

console.log(
  '  ' +
  pad('Hijri Date', COL.label) +
  pad('Expected', COL.expected) +
  pad('Tabular', COL.result) +
  padLeft('Diff', COL.diff) +
  ' '.repeat(COL.gap) +
  pad('Astronomical', COL.result) +
  padLeft('Diff', COL.diff)
);
console.log('  ' + THIN.substring(2));

let tabErrors = [];
let astroErrors = [];

for (const tc of testCases) {
  const expected = fmtDate(tc.gY, tc.gM, tc.gD);

  // --- Tabular mode ---
  H.setMode('tabular');
  const tabRes = H.hijriToGregorian(tc.hY, tc.hM, tc.hD);
  const tabStr = fmtDate(tabRes.year, tabRes.month, tabRes.day);
  const tabDiff = diffDays(tc.gY, tc.gM, tc.gD, tabRes.year, tabRes.month, tabRes.day);
  tabErrors.push(Math.abs(tabDiff));

  // --- Astronomical mode ---
  H.setMode('astronomical');
  const astRes = H.hijriToGregorian(tc.hY, tc.hM, tc.hD);
  const astStr = fmtDate(astRes.year, astRes.month, astRes.day);
  const astroDiff = diffDays(tc.gY, tc.gM, tc.gD, astRes.year, astRes.month, astRes.day);
  astroErrors.push(Math.abs(astroDiff));

  const tabMark  = tabDiff === 0   ? ' ' : '*';
  const astMark  = astroDiff === 0 ? ' ' : '*';

  console.log(
    '  ' +
    pad(tc.label, COL.label) +
    pad(expected, COL.expected) +
    pad(tabStr + tabMark, COL.result) +
    padLeft(fmtDiff(tabDiff), COL.diff) +
    ' '.repeat(COL.gap) +
    pad(astStr + astMark, COL.result) +
    padLeft(fmtDiff(astroDiff), COL.diff)
  );
}

console.log('  ' + THIN.substring(2));
console.log('  * = differs from expected reference date');
console.log('');

// ═══════════════════════════════════════════════════════════
//  Summary Statistics
// ═══════════════════════════════════════════════════════════

const total = testCases.length;
const tabSum   = tabErrors.reduce((a, b) => a + b, 0);
const astroSum = astroErrors.reduce((a, b) => a + b, 0);
const tabAvg   = (tabSum / total).toFixed(2);
const astroAvg = (astroSum / total).toFixed(2);
const tabMax   = Math.max(...tabErrors);
const astroMax = Math.max(...astroErrors);
const tabExact   = tabErrors.filter(e => e === 0).length;
const astroExact = astroErrors.filter(e => e === 0).length;
const tabWithin1   = tabErrors.filter(e => e <= 1).length;
const astroWithin1 = astroErrors.filter(e => e <= 1).length;

console.log(SEP);
console.log('  SUMMARY  (' + total + ' test cases)');
console.log(SEP);
console.log('');
console.log('                        Avg Error       Max Error       Exact (0d)      Within 1d');
console.log('  ' + '-'.repeat(88));
console.log(
  '  Tabular           ' +
  padLeft(tabAvg + ' days', 14) +
  padLeft(tabMax + ' days', 16) +
  padLeft(tabExact + '/' + total, 16) +
  padLeft(tabWithin1 + '/' + total, 14)
);
console.log(
  '  Astronomical      ' +
  padLeft(astroAvg + ' days', 14) +
  padLeft(astroMax + ' days', 16) +
  padLeft(astroExact + '/' + total, 16) +
  padLeft(astroWithin1 + '/' + total, 14)
);
console.log('');

if (parseFloat(astroAvg) < parseFloat(tabAvg)) {
  console.log('  --> Astronomical mode is MORE accurate on this test set.');
} else if (parseFloat(tabAvg) < parseFloat(astroAvg)) {
  console.log('  --> Tabular mode is MORE accurate on this test set.');
} else {
  console.log('  --> Both modes have equal average accuracy on this test set.');
}

console.log('');
console.log('  Note: Differences of +/-1 day are common between computed and officially');
console.log('  announced Hijri dates. The Islamic calendar traditionally relies on lunar');
console.log('  crescent sighting, which can vary by geographic location and local conditions.');
console.log('');
console.log(SEP);
console.log('');
