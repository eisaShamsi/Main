/**
 * تطبيق التقويم الهجري — الواجهة
 * المستوى 2 (فلكي) كافتراضي + تصحيح يدوي + وضع حسابي
 */

const App = (() => {
    const H = HijriCalendar;

    let currentYear, currentMonth;

    // ─── تهيئة ──────────────────────────────────────────────
    function init() {
        const today = H.todayHijri();
        currentYear = today.year;
        currentMonth = today.month;

        setupNavigation();
        setupModeSelector();
        setupWeekStartSelector();
        setupNumeralSelector();
        setupConverter();
        setupCorrectionControls();
        renderCalendar();
        renderTodayInfo();
        updateModeUI();
    }

    // ─── التنقل ─────────────────────────────────────────────
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
            renderTodayInfo();
        });

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            if (e.key === 'ArrowRight') {
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

    // ─── اختيار النمط ───────────────────────────────────────
    function setupModeSelector() {
        const select = document.getElementById('mode-select');
        select.value = H.getMode();
        select.addEventListener('change', () => {
            H.setMode(select.value);
            H._saveMode();
            renderCalendar();
            renderTodayInfo();
            updateModeUI();
        });
    }

    function updateModeUI() {
        const select = document.getElementById('mode-select');
        select.value = H.getMode();

        const badge = document.getElementById('mode-badge');
        badge.textContent = H.getMode() === 'astronomical' ? 'فلكي' : 'حسابي';
        badge.className = 'mode-badge ' + (H.getMode() === 'astronomical' ? 'mode-astro' : 'mode-tab');

        updateCorrectionDisplay();
    }

    // ─── اختيار بداية الأسبوع ────────────────────────────────
    function setupWeekStartSelector() {
        const select = document.getElementById('weekstart-select');
        select.value = H.getWeekStart();
        select.addEventListener('change', () => {
            H.setWeekStart(parseInt(select.value));
            H._saveWeekStart();
            renderCalendar();
        });
    }

    // ─── اختيار نمط الأرقام ──────────────────────────────────
    function setupNumeralSelector() {
        const select = document.getElementById('numeral-select');
        select.value = H.getNumeralStyle();
        select.addEventListener('change', () => {
            H.setNumeralStyle(select.value);
            H._saveNumeralStyle();
            renderCalendar();
            renderTodayInfo();
            updateCorrectionDisplay();
        });
    }

    // ─── أدوات التصحيح ──────────────────────────────────────
    function setupCorrectionControls() {
        document.getElementById('corr-plus').addEventListener('click', () => {
            const current = H.getCorrection(currentYear, currentMonth);
            H.setCorrection(currentYear, currentMonth, current + 1);
            renderCalendar();
            renderTodayInfo();
        });

        document.getElementById('corr-minus').addEventListener('click', () => {
            const current = H.getCorrection(currentYear, currentMonth);
            H.setCorrection(currentYear, currentMonth, current - 1);
            renderCalendar();
            renderTodayInfo();
        });

        document.getElementById('corr-reset').addEventListener('click', () => {
            H.setCorrection(currentYear, currentMonth, 0);
            renderCalendar();
            renderTodayInfo();
        });

        document.getElementById('corr-clear-all').addEventListener('click', () => {
            H.clearCorrections();
            renderCalendar();
            renderTodayInfo();
        });
    }

    function updateCorrectionDisplay() {
        const corr = H.getCorrection(currentYear, currentMonth);
        const corrEl = document.getElementById('corr-value');
        if (corr === 0) {
            corrEl.textContent = H.toArabicNumerals(0);
            corrEl.className = 'corr-value';
        } else {
            const sign = corr > 0 ? '+' : '';
            corrEl.textContent = H.toArabicNumerals(sign + corr);
            corrEl.className = 'corr-value corr-active';
        }

        // عرض قائمة التصحيحات الحالية
        const all = H.getAllCorrections();
        const listEl = document.getElementById('corrections-list');
        const keys = Object.keys(all).sort();
        if (keys.length === 0) {
            listEl.innerHTML = '<span class="corr-empty">لا توجد تصحيحات</span>';
        } else {
            listEl.innerHTML = keys.map(key => {
                const [y, m] = key.split('-').map(Number);
                const sign = all[key] > 0 ? '+' : '';
                return `<span class="corr-tag">${H.MONTH_NAMES[m-1]} ${H.toArabicNumerals(y)}: ${sign}${H.toArabicNumerals(all[key])}</span>`;
            }).join(' ');
        }
    }

    // ─── محوّل التواريخ ─────────────────────────────────────
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

        document.getElementById('month-title').textContent =
            `${data.monthName} ${H.toArabicNumerals(data.year)} هـ`;

        document.getElementById('gregorian-range').textContent = data.gregorianRange;

        const leapBadge = document.getElementById('leap-badge');
        leapBadge.style.display = data.isLeapYear ? 'inline-block' : 'none';

        // رؤوس الأيام الديناميكية
        const headersEl = document.getElementById('day-headers');
        headersEl.innerHTML = '';
        const weekHeader = document.createElement('div');
        weekHeader.className = 'day-header week-header';
        weekHeader.textContent = 'أسبوع';
        headersEl.appendChild(weekHeader);
        data.orderedDayNames.forEach((name, i) => {
            const dh = document.createElement('div');
            dh.className = 'day-header';
            // آخر يوم في الأسبوع (الجمعة عادة) يبرز
            if (i === 6) dh.classList.add('day-header-last');
            dh.textContent = name;
            headersEl.appendChild(dh);
        });

        // شبكة التقويم
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        data.days.forEach((day, idx) => {
            // إضافة خلية رقم الأسبوع في بداية كل صف
            if (idx % 7 === 0) {
                const weekCell = document.createElement('div');
                weekCell.className = 'week-number';
                weekCell.textContent = H.toArabicNumerals(day.weekNumber);
                grid.appendChild(weekCell);
            }

            const cell = document.createElement('div');
            cell.className = 'calendar-cell';
            if (day.isOtherMonth) cell.classList.add('other-month');
            if (day.isToday) cell.classList.add('today');

            const hijriNum = document.createElement('span');
            hijriNum.className = 'hijri-day';
            hijriNum.textContent = H.toArabicNumerals(day.hijriDay);
            cell.appendChild(hijriNum);

            const gregNum = document.createElement('span');
            gregNum.className = 'greg-day';
            gregNum.textContent = H.toArabicNumerals(day.gregorian.day);
            cell.appendChild(gregNum);

            const gregDate = `${day.gregorian.day}/${day.gregorian.month}/${day.gregorian.year}`;
            cell.title = `${H.DAY_NAMES[day.dayOfWeek]} — ${gregDate}م`;

            // تحديد يوم الجمعة (آخر عمود)
            if ((idx % 7) === 6) cell.classList.add('friday-col');

            cell.addEventListener('click', (e) => selectDay(day, e));
            grid.appendChild(cell);
        });

        updateInfoBar(null);
        updateCorrectionDisplay();
    }

    // ─── معلومات اليوم ──────────────────────────────────────
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
        document.querySelectorAll('.calendar-cell.selected').forEach(el => el.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
    }

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

document.addEventListener('DOMContentLoaded', App.init);
