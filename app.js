/**
 * تطبيق التقويم الهجري — الواجهة
 * بناءً على معادلات كتاب "التوفيقات الإلهامية"
 */

const App = (() => {
    const H = HijriCalendar;

    // الحالة الحالية
    let currentYear, currentMonth;

    // ─── تهيئة التطبيق ──────────────────────────────────────
    function init() {
        const today = H.todayHijri();
        currentYear = today.year;
        currentMonth = today.month;

        setupNavigation();
        setupConverter();
        renderCalendar();
        renderTodayInfo();
    }

    // ─── إعداد التنقل ───────────────────────────────────────
    function setupNavigation() {
        document.getElementById('prev-month').addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 1) { currentMonth = 12; currentYear--; }
            renderCalendar();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 12) { currentMonth = 1; currentYear++; }
            renderCalendar();
        });

        document.getElementById('today-btn').addEventListener('click', () => {
            const today = H.todayHijri();
            currentYear = today.year;
            currentMonth = today.month;
            renderCalendar();
        });

        // التنقل بلوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.key === 'ArrowRight') {
                // في RTL، السهم الأيمن = الشهر السابق
                currentMonth--;
                if (currentMonth < 1) { currentMonth = 12; currentYear--; }
                renderCalendar();
            } else if (e.key === 'ArrowLeft') {
                currentMonth++;
                if (currentMonth > 12) { currentMonth = 1; currentYear++; }
                renderCalendar();
            }
        });
    }

    // ─── إعداد محوّل التواريخ ────────────────────────────────
    function setupConverter() {
        document.getElementById('convert-to-gregorian').addEventListener('click', () => {
            const y = parseInt(document.getElementById('hijri-year-input').value);
            const m = parseInt(document.getElementById('hijri-month-input').value);
            const d = parseInt(document.getElementById('hijri-day-input').value);

            if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 30) {
                document.getElementById('conversion-result').textContent = 'أدخل تاريخاً هجرياً صحيحاً';
                return;
            }

            const maxDay = H.daysInMonth(y, m);
            if (d > maxDay) {
                document.getElementById('conversion-result').textContent =
                    `شهر ${H.MONTH_NAMES[m-1]} في سنة ${H.toArabicNumerals(y)} هـ فيه ${H.toArabicNumerals(maxDay)} يوماً فقط`;
                return;
            }

            const greg = H.hijriToGregorian(y, m, d);
            const jdn = H.hijriToJDN(y, m, d);
            const dow = H.dayOfWeek(jdn);

            document.getElementById('conversion-result').innerHTML =
                `<span class="result-label">الميلادي:</span> ${H.DAY_NAMES[dow]}، ${H.toArabicNumerals(greg.day)} ${H.GREGORIAN_MONTH_NAMES[greg.month-1]} ${H.toArabicNumerals(greg.year)}م`;
        });

        document.getElementById('convert-to-hijri').addEventListener('click', () => {
            const y = parseInt(document.getElementById('greg-year-input').value);
            const m = parseInt(document.getElementById('greg-month-input').value);
            const d = parseInt(document.getElementById('greg-day-input').value);

            if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
                document.getElementById('conversion-result-2').textContent = 'أدخل تاريخاً ميلادياً صحيحاً';
                return;
            }

            const hijri = H.gregorianToHijri(y, m, d);
            const jdn = H.gregorianToJDN(y, m, d);
            const dow = H.dayOfWeek(jdn);

            document.getElementById('conversion-result-2').innerHTML =
                `<span class="result-label">الهجري:</span> ${H.DAY_NAMES[dow]}، ${H.toArabicNumerals(hijri.day)} ${H.MONTH_NAMES[hijri.month-1]} ${H.toArabicNumerals(hijri.year)}هـ`;
        });
    }

    // ─── عرض التقويم ────────────────────────────────────────
    function renderCalendar() {
        const data = H.getMonthData(currentYear, currentMonth);

        // عنوان الشهر
        document.getElementById('month-title').textContent =
            `${data.monthName} ${H.toArabicNumerals(data.year)} هـ`;

        // النطاق الميلادي
        document.getElementById('gregorian-range').textContent = data.gregorianRange;

        // مؤشر السنة الكبيسة
        const leapBadge = document.getElementById('leap-badge');
        if (data.isLeapYear) {
            leapBadge.style.display = 'inline-block';
        } else {
            leapBadge.style.display = 'none';
        }

        // شبكة التقويم
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        data.days.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            if (day.isOtherMonth) cell.classList.add('other-month');
            if (day.isToday) cell.classList.add('today');

            // اليوم الهجري
            const hijriNum = document.createElement('span');
            hijriNum.className = 'hijri-day';
            hijriNum.textContent = H.toArabicNumerals(day.hijriDay);
            cell.appendChild(hijriNum);

            // اليوم الميلادي
            const gregNum = document.createElement('span');
            gregNum.className = 'greg-day';
            gregNum.textContent = H.toArabicNumerals(day.gregorian.day);
            cell.appendChild(gregNum);

            // تلميح (tooltip)
            const gregDate = `${day.gregorian.day}/${day.gregorian.month}/${day.gregorian.year}`;
            cell.title = `${H.DAY_NAMES[day.dayOfWeek]} — ${gregDate}م`;

            // النقر على الخلية
            cell.addEventListener('click', (e) => selectDay(day, e));

            grid.appendChild(cell);
        });

        // تحديث شريط المعلومات
        updateInfoBar(null);
    }

    // ─── عرض معلومات اليوم ──────────────────────────────────
    function renderTodayInfo() {
        const today = H.todayHijri();
        const now = new Date();
        const jdn = H.todayJDN();
        const dow = H.dayOfWeek(jdn);

        document.getElementById('today-hijri').textContent =
            `${H.DAY_NAMES[dow]}، ${H.toArabicNumerals(today.day)} ${H.MONTH_NAMES[today.month-1]} ${H.toArabicNumerals(today.year)} هـ`;

        document.getElementById('today-gregorian').textContent =
            `${H.toArabicNumerals(now.getDate())} ${H.GREGORIAN_MONTH_NAMES[now.getMonth()]} ${H.toArabicNumerals(now.getFullYear())}م`;
    }

    // ─── اختيار يوم ─────────────────────────────────────────
    function selectDay(day, e) {
        updateInfoBar(day);

        // تحديث التمييز
        document.querySelectorAll('.calendar-cell.selected').forEach(el => el.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
    }

    // ─── تحديث شريط المعلومات ────────────────────────────────
    function updateInfoBar(day) {
        const infoBar = document.getElementById('selected-info');
        if (!day) {
            infoBar.textContent = 'انقر على يوم لعرض تفاصيله';
            return;
        }

        const greg = day.gregorian;
        const hijriFromJDN = H.jdnToHijri(day.jdn);
        infoBar.innerHTML =
            `${H.DAY_NAMES[day.dayOfWeek]}، ${H.toArabicNumerals(hijriFromJDN.day)} ${H.MONTH_NAMES[hijriFromJDN.month-1]} ${H.toArabicNumerals(hijriFromJDN.year)} هـ` +
            ` — ` +
            `${H.toArabicNumerals(greg.day)} ${H.GREGORIAN_MONTH_NAMES[greg.month-1]} ${H.toArabicNumerals(greg.year)}م`;
    }

    return { init };
})();

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', App.init);
