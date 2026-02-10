/**
 * التقويم الهجري الحسابي
 * بناءً على كتاب "التوفيقات الإلهامية في مقارنة التواريخ الهجرية بالسنين الأفرنكية والقبطية"
 * تأليف: محمد مختار باشا المصري (1311هـ / 1893م)
 *
 * يستخدم نظام الدورة الثلاثينية مع 11 سنة كبيسة في كل دورة:
 * السنوات الكبيسة: 2, 5, 7, 10, 13, 15, 18, 21, 24, 26, 29
 * (النمط الخامس عشري - variant 15-based)
 *
 * التقويم المدني (حقبة الجمعة): 1 محرم 1 هـ = 16 يوليو 622م (يولياني)
 * رقم اليوم اليولياني (JDN) للحقبة = 1948440
 */

const HijriCalendar = (() => {
    // ─── الثوابت ────────────────────────────────────────────
    const EPOCH_JDN = 1948440; // JDN لـ 1 محرم 1 هـ (الحقبة المدنية)
    const DAYS_IN_30_YEAR_CYCLE = 10631;
    const LEAP_YEARS_IN_CYCLE = [2, 5, 7, 10, 13, 15, 18, 21, 24, 26, 29];

    // أسماء الشهور الهجرية
    const MONTH_NAMES = [
        'المحرَّم', 'صفر', 'ربيع الأوَّل', 'ربيع الآخِر',
        'جمادى الأولى', 'جمادى الآخِرة', 'رجب', 'شعبان',
        'رمضان', 'شوَّال', 'ذو القَعدة', 'ذو الحِجَّة'
    ];

    // أسماء الأيام (تبدأ بالسبت)
    const DAY_NAMES = [
        'السبت', 'الأحد', 'الإثنين', 'الثلاثاء',
        'الأربعاء', 'الخميس', 'الجمعة'
    ];

    // أسماء الشهور الميلادية بالعربية
    const GREGORIAN_MONTH_NAMES = [
        'يناير', 'فبراير', 'مارس', 'أبريل',
        'مايو', 'يونيو', 'يوليو', 'أغسطس',
        'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // ─── الأرقام العربية ────────────────────────────────────
    const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    function toArabicNumerals(num) {
        return String(num).replace(/\d/g, d => ARABIC_DIGITS[parseInt(d)]);
    }

    // ─── حساب السنة الكبيسة ─────────────────────────────────
    // المعادلة: السنة كبيسة إذا كان (11 × السنة + 15) mod 30 < 11
    function isLeapYear(year) {
        return ((11 * year + 15) % 30) < 11;
    }

    // ─── عدد أيام الشهر ──────────────────────────────────────
    // الأشهر الفردية: 30 يوماً، الأشهر الزوجية: 29 يوماً
    // في السنة الكبيسة: ذو الحجة (الشهر 12) يصبح 30 يوماً
    function daysInMonth(year, month) {
        if (month % 2 === 1) return 30;        // الأشهر الفردية
        if (month === 12 && isLeapYear(year)) return 30; // ذو الحجة في سنة كبيسة
        return 29;                              // الأشهر الزوجية
    }

    // ─── عدد أيام السنة ──────────────────────────────────────
    function daysInYear(year) {
        return isLeapYear(year) ? 355 : 354;
    }

    // ─── عدد الأيام قبل الشهر ────────────────────────────────
    // مجموع أيام الشهور من 1 إلى (month - 1)
    function daysBeforeMonth(month) {
        return Math.ceil(29.5 * (month - 1));
    }

    // ─── عدد أيام الكبس قبل السنة ────────────────────────────
    // عدد السنوات الكبيسة من السنة 1 إلى السنة (year - 1)
    function leapDaysBeforeYear(year) {
        return Math.floor((11 * (year - 1) + 15) / 30);
    }

    // ═══════════════════════════════════════════════════════════
    // تحويل التاريخ الهجري ← رقم اليوم اليولياني (JDN)
    // ═══════════════════════════════════════════════════════════
    function hijriToJDN(year, month, day) {
        return day
            + daysBeforeMonth(month)
            + (year - 1) * 354
            + leapDaysBeforeYear(year)
            + EPOCH_JDN - 1;
    }

    // ═══════════════════════════════════════════════════════════
    // تحويل رقم اليوم اليولياني (JDN) ← التاريخ الهجري
    // ═══════════════════════════════════════════════════════════
    function jdnToHijri(jdn) {
        const k = jdn - EPOCH_JDN; // عدد الأيام من الحقبة (بدءاً من 0)

        // عدد الدورات الثلاثينية الكاملة
        let cycles = Math.floor(k / DAYS_IN_30_YEAR_CYCLE);
        let remainder = k - cycles * DAYS_IN_30_YEAR_CYCLE;

        if (remainder < 0) {
            cycles--;
            remainder += DAYS_IN_30_YEAR_CYCLE;
        }

        // إيجاد السنة داخل الدورة (0-indexed)
        let yearInCycle = Math.floor(30 * remainder / DAYS_IN_30_YEAR_CYCLE);

        // حساب الأيام حتى بداية السنة والتحقق
        let daysToStart = yearInCycle * 354 + Math.floor((11 * yearInCycle + 15) / 30);

        if (daysToStart > remainder) {
            yearInCycle--;
            daysToStart = yearInCycle * 354 + Math.floor((11 * yearInCycle + 15) / 30);
        }

        let daysToNext = (yearInCycle + 1) * 354 + Math.floor((11 * (yearInCycle + 1) + 15) / 30);
        if (daysToNext <= remainder) {
            yearInCycle++;
            daysToStart = daysToNext;
        }

        const year = cycles * 30 + yearInCycle + 1;
        let dayOfYear = remainder - daysToStart;

        // إيجاد الشهر واليوم
        let month = Math.min(Math.ceil((dayOfYear + 1) / 29.5), 12);
        if (month < 1) month = 1;

        let dbm = daysBeforeMonth(month);
        while (dbm > dayOfYear && month > 1) {
            month--;
            dbm = daysBeforeMonth(month);
        }

        const day = dayOfYear - dbm + 1;

        return { year, month, day };
    }

    // ═══════════════════════════════════════════════════════════
    // تحويل التاريخ الميلادي ← رقم اليوم اليولياني (JDN)
    // ═══════════════════════════════════════════════════════════
    function gregorianToJDN(year, month, day) {
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        return day
            + Math.floor((153 * m + 2) / 5)
            + 365 * y
            + Math.floor(y / 4)
            - Math.floor(y / 100)
            + Math.floor(y / 400)
            - 32045;
    }

    // ═══════════════════════════════════════════════════════════
    // تحويل رقم اليوم اليولياني (JDN) ← التاريخ الميلادي
    // ═══════════════════════════════════════════════════════════
    function jdnToGregorian(jdn) {
        const a = jdn + 32044;
        const b = Math.floor((4 * a + 3) / 146097);
        const c = a - Math.floor(146097 * b / 4);
        const d = Math.floor((4 * c + 3) / 1461);
        const e = c - Math.floor(1461 * d / 4);
        const m = Math.floor((5 * e + 2) / 153);
        const day = e - Math.floor((153 * m + 2) / 5) + 1;
        const month = m + 3 - 12 * Math.floor(m / 10);
        const year = 100 * b + d - 4800 + Math.floor(m / 10);
        return { year, month, day };
    }

    // ═══════════════════════════════════════════════════════════
    // تحويلات مباشرة بين الهجري والميلادي
    // ═══════════════════════════════════════════════════════════
    function hijriToGregorian(year, month, day) {
        return jdnToGregorian(hijriToJDN(year, month, day));
    }

    function gregorianToHijri(year, month, day) {
        return jdnToHijri(gregorianToJDN(year, month, day));
    }

    // ─── يوم الأسبوع ────────────────────────────────────────
    // يُرجع 0 = السبت، 1 = الأحد، ...، 6 = الجمعة
    // JDN mod 7: 0=إثنين، 1=ثلاثاء، ...، 4=جمعة، 5=سبت، 6=أحد
    // التحويل: (JDN + 2) mod 7 → 0=سبت، 1=أحد، ...، 6=جمعة
    function dayOfWeek(jdn) {
        return ((jdn % 7) + 2) % 7;
    }

    // ─── التاريخ الهجري لليوم ────────────────────────────────
    function todayHijri() {
        const now = new Date();
        return gregorianToHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    // ─── التاريخ الميلادي لليوم كـ JDN ──────────────────────
    function todayJDN() {
        const now = new Date();
        return gregorianToJDN(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }

    // ─── بيانات الشهر للعرض في التقويم ──────────────────────
    function getMonthData(year, month) {
        const totalDays = daysInMonth(year, month);
        const firstDayJDN = hijriToJDN(year, month, 1);
        const firstDayOfWeek = dayOfWeek(firstDayJDN); // 0=السبت
        const todayJDNValue = todayJDN();

        const days = [];
        for (let d = 1; d <= totalDays; d++) {
            const jdn = firstDayJDN + d - 1;
            const greg = jdnToGregorian(jdn);
            days.push({
                hijriDay: d,
                gregorian: greg,
                dayOfWeek: dayOfWeek(jdn),
                jdn: jdn,
                isToday: jdn === todayJDNValue
            });
        }

        // الشهر السابق (أيام قبل بداية الشهر الحالي)
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthDays = daysInMonth(prevYear, prevMonth);
        const leadingDays = [];
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            const jdn = firstDayJDN - firstDayOfWeek + (firstDayOfWeek - 1 - i);
            const actualJDN = hijriToJDN(prevYear, prevMonth, d);
            const greg = jdnToGregorian(actualJDN);
            leadingDays.push({
                hijriDay: d,
                gregorian: greg,
                dayOfWeek: dayOfWeek(actualJDN),
                jdn: actualJDN,
                isToday: actualJDN === todayJDNValue,
                isOtherMonth: true
            });
        }

        // الشهر التالي (أيام بعد نهاية الشهر الحالي)
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const totalCells = leadingDays.length + totalDays;
        const trailingCount = (7 - (totalCells % 7)) % 7;
        const trailingDays = [];
        for (let d = 1; d <= trailingCount; d++) {
            const actualJDN = hijriToJDN(nextYear, nextMonth, d);
            const greg = jdnToGregorian(actualJDN);
            trailingDays.push({
                hijriDay: d,
                gregorian: greg,
                dayOfWeek: dayOfWeek(actualJDN),
                jdn: actualJDN,
                isToday: actualJDN === todayJDNValue,
                isOtherMonth: true
            });
        }

        // الأشهر الميلادية المقابلة
        const firstGreg = jdnToGregorian(firstDayJDN);
        const lastGreg = jdnToGregorian(firstDayJDN + totalDays - 1);
        let gregorianRange;
        if (firstGreg.month === lastGreg.month && firstGreg.year === lastGreg.year) {
            gregorianRange = `${GREGORIAN_MONTH_NAMES[firstGreg.month - 1]} ${firstGreg.year}`;
        } else if (firstGreg.year === lastGreg.year) {
            gregorianRange = `${GREGORIAN_MONTH_NAMES[firstGreg.month - 1]} – ${GREGORIAN_MONTH_NAMES[lastGreg.month - 1]} ${firstGreg.year}`;
        } else {
            gregorianRange = `${GREGORIAN_MONTH_NAMES[firstGreg.month - 1]} ${firstGreg.year} – ${GREGORIAN_MONTH_NAMES[lastGreg.month - 1]} ${lastGreg.year}`;
        }

        return {
            year,
            month,
            monthName: MONTH_NAMES[month - 1],
            totalDays,
            isLeapYear: isLeapYear(year),
            firstDayOfWeek,
            gregorianRange,
            days: [...leadingDays, ...days, ...trailingDays]
        };
    }

    // ─── الواجهة العامة ──────────────────────────────────────
    return {
        isLeapYear,
        daysInMonth,
        daysInYear,
        hijriToJDN,
        jdnToHijri,
        gregorianToJDN,
        jdnToGregorian,
        hijriToGregorian,
        gregorianToHijri,
        dayOfWeek,
        todayHijri,
        todayJDN,
        getMonthData,
        toArabicNumerals,
        MONTH_NAMES,
        DAY_NAMES,
        GREGORIAN_MONTH_NAMES,
        EPOCH_JDN
    };
})();
