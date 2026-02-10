/**
 * اختبارات التقويم الهجري — Node.js
 * التحقق من صحة الخوارزمية مقابل تواريخ كتاب "التوفيقات الإلهامية"
 */

// Load the module (it's an IIFE that sets HijriCalendar globally)
const fs = require('fs');
const vm = require('vm');
vm.runInThisContext(fs.readFileSync('./hijri.js', 'utf8'));

const H = HijriCalendar;
let passed = 0, failed = 0;

function assert(condition, description) {
    if (condition) {
        console.log(`  \x1b[32m✓ ${description}\x1b[0m`);
        passed++;
    } else {
        console.log(`  \x1b[31m✗ ${description}\x1b[0m`);
        failed++;
    }
}

function header(title) {
    console.log(`\n\x1b[33m═══ ${title} ═══\x1b[0m`);
}

// ═══ 1. Leap Year Pattern ═══
header('1. Leap Year Pattern (15-based variant)');
const expectedLeap = [2, 5, 7, 10, 13, 15, 18, 21, 24, 26, 29];
for (let i = 1; i <= 30; i++) {
    const shouldBeLeap = expectedLeap.includes(i);
    assert(H.isLeapYear(i) === shouldBeLeap,
        `Year ${i}: ${shouldBeLeap ? 'LEAP' : 'normal'}`);
}

// ═══ 2. 30-year cycle total ═══
header('2. 30-year Cycle Total');
let totalIn30 = 0;
for (let i = 1; i <= 30; i++) totalIn30 += H.daysInYear(i);
assert(totalIn30 === 10631, `30-year cycle = ${totalIn30} days (expected 10631)`);

// ═══ 3. Epoch ═══
header('3. Epoch');
const epochJDN = H.hijriToJDN(1, 1, 1);
assert(epochJDN === 1948440, `1 Muharram 1 AH → JDN ${epochJDN} (expected 1948440)`);

const epochGreg = H.jdnToGregorian(epochJDN);
assert(epochGreg.year === 622 && epochGreg.month === 7 && epochGreg.day === 19,
    `Epoch = ${epochGreg.year}-${epochGreg.month}-${epochGreg.day} (expected 622-7-19 proleptic Gregorian)`);

const epochDOW = H.dayOfWeek(epochJDN);
assert(epochDOW === 6, `Epoch = ${H.DAY_NAMES[epochDOW]} (expected الجمعة, index 6)`);

// ═══ 4. Known Dates from the Book ═══
header('4. Known Dates from التوفيقات الإلهامية');

// 1 Ramadan 1446 = March 1, 2025
const ram1446 = H.hijriToGregorian(1446, 9, 1);
assert(ram1446.year === 2025 && ram1446.month === 3 && ram1446.day === 1,
    `1 Ramadan 1446 → ${ram1446.year}-${ram1446.month}-${ram1446.day} (expected 2025-3-1)`);

// 1 Ramadan 1447 = Feb 18, 2026 (Wednesday)
const ram1447 = H.hijriToGregorian(1447, 9, 1);
const ram1447DOW = H.dayOfWeek(H.hijriToJDN(1447, 9, 1));
assert(ram1447.year === 2026 && ram1447.month === 2 && ram1447.day === 18,
    `1 Ramadan 1447 → ${ram1447.year}-${ram1447.month}-${ram1447.day} (expected 2026-2-18)`);
assert(ram1447DOW === 4,
    `1 Ramadan 1447 = ${H.DAY_NAMES[ram1447DOW]} (expected الأربعاء)`);

// 1 Shawwal 1447 = March 20, 2026 (Friday)
const shaw1447 = H.hijriToGregorian(1447, 10, 1);
const shaw1447DOW = H.dayOfWeek(H.hijriToJDN(1447, 10, 1));
assert(shaw1447.year === 2026 && shaw1447.month === 3 && shaw1447.day === 20,
    `1 Shawwal 1447 → ${shaw1447.year}-${shaw1447.month}-${shaw1447.day} (expected 2026-3-20)`);
assert(shaw1447DOW === 6,
    `1 Shawwal 1447 = ${H.DAY_NAMES[shaw1447DOW]} (expected الجمعة)`);

// 1 Ramadan 1441 = April 24, 2020 (Friday)
const ram1441 = H.hijriToGregorian(1441, 9, 1);
const ram1441DOW = H.dayOfWeek(H.hijriToJDN(1441, 9, 1));
assert(ram1441.year === 2020 && ram1441.month === 4 && ram1441.day === 24,
    `1 Ramadan 1441 → ${ram1441.year}-${ram1441.month}-${ram1441.day} (expected 2020-4-24)`);
assert(ram1441DOW === 6,
    `1 Ramadan 1441 = ${H.DAY_NAMES[ram1441DOW]} (expected الجمعة)`);

// 1 Shawwal 1441 = May 24, 2020 (Sunday)
const shaw1441 = H.hijriToGregorian(1441, 10, 1);
const shaw1441DOW = H.dayOfWeek(H.hijriToJDN(1441, 10, 1));
assert(shaw1441.year === 2020 && shaw1441.month === 5 && shaw1441.day === 24,
    `1 Shawwal 1441 → ${shaw1441.year}-${shaw1441.month}-${shaw1441.day} (expected 2020-5-24)`);
assert(shaw1441DOW === 1,
    `1 Shawwal 1441 = ${H.DAY_NAMES[shaw1441DOW]} (expected الأحد)`);

// ═══ 5. Roundtrip Conversions ═══
header('5. Roundtrip Conversions');
const testDates = [
    [1, 1, 1], [1, 6, 15], [1, 12, 29],
    [2, 12, 30], // leap year, last day
    [100, 1, 1], [500, 6, 15], [1000, 12, 29],
    [1400, 1, 1], [1446, 9, 1], [1447, 10, 1], [1500, 12, 29]
];

testDates.forEach(([y, m, d]) => {
    const jdn = H.hijriToJDN(y, m, d);
    const back = H.jdnToHijri(jdn);
    assert(back.year === y && back.month === m && back.day === d,
        `Hijri ${y}-${m}-${d} → JDN ${jdn} → ${back.year}-${back.month}-${back.day}`);
});

const gregDates = [
    [2025, 3, 1], [2026, 2, 18], [2026, 3, 20],
    [2000, 1, 1], [1990, 6, 15], [622, 7, 19]
];

gregDates.forEach(([y, m, d]) => {
    const hijri = H.gregorianToHijri(y, m, d);
    const back = H.hijriToGregorian(hijri.year, hijri.month, hijri.day);
    assert(back.year === y && back.month === m && back.day === d,
        `Greg ${y}-${m}-${d} → Hijri ${hijri.year}-${hijri.month}-${hijri.day} → ${back.year}-${back.month}-${back.day}`);
});

// ═══ 6. Today ═══
header('6. Today\'s Date');
const today = H.todayHijri();
const now = new Date();
console.log(`  Today: ${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} → Hijri: ${today.year}-${today.month}-${today.day} (${H.MONTH_NAMES[today.month-1]})`);

// ═══ Summary ═══
header('SUMMARY');
console.log(`  Total: ${passed + failed} tests — \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m`);
if (failed === 0) {
    console.log('  \x1b[32m✓ ALL TESTS PASSED\x1b[0m');
} else {
    console.log(`  \x1b[31m✗ ${failed} TESTS FAILED\x1b[0m`);
    process.exit(1);
}
