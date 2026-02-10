/**
 * تطبيق التقويم الهجري — الواجهة
 * المستوى 2 (فلكي) كافتراضي + تصحيح يدوي + تعدد اللغات
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
        setupLangSelector();
        setupCorrectionControls();
        setupGoToDate();
        applyLabels();
        renderCalendar();
        renderTodayInfo();
        updateModeUI();
    }

    // ─── تحديث جميع النصوص (اللغة) ─────────────────────────
    function applyLabels() {
        const lang = H.getLang();
        const html = document.documentElement;
        html.setAttribute('lang', lang === 'ar' ? 'ar' : 'en');
        html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

        document.getElementById('app-title').textContent = H.t('title');

        // شريط الأدوات
        document.getElementById('lbl-mode').textContent = H.t('modeLabel');
        document.getElementById('opt-astro').textContent = H.t('modeAstro');
        document.getElementById('opt-tab').textContent = H.t('modeTab');
        document.getElementById('lbl-weekstart').textContent = H.t('weekStartLabel');
        document.getElementById('opt-sat').textContent = H.t('saturday');
        document.getElementById('opt-sun').textContent = H.t('sunday');
        document.getElementById('opt-mon').textContent = H.t('monday');
        document.getElementById('lbl-numeral').textContent = H.t('numeralLabel');
        document.getElementById('opt-hindi').textContent = H.t('numeralHindi');
        document.getElementById('opt-arabic').textContent = H.t('numeralArabic');
        document.getElementById('lbl-lang').textContent = H.t('langLabel');
        document.getElementById('opt-lang-ar').textContent = H.t('langAr');
        document.getElementById('opt-lang-en').textContent = H.t('langEn');
        document.getElementById('lbl-corr').textContent = H.t('corrLabel');
        document.getElementById('corr-reset').textContent = H.t('corrReset');
        document.getElementById('corr-minus').title = H.t('minusDay');
        document.getElementById('corr-plus').title = H.t('plusDay');
        document.getElementById('corr-reset').title = H.t('resetMonth');
        document.getElementById('lbl-corrections').textContent = H.t('corrections');
        document.getElementById('corr-clear-all').textContent = H.t('corrClearAll');

        // الانتقال إلى تاريخ
        document.getElementById('goto-title').textContent = H.t('goToDate');
        document.getElementById('goto-hijri-label').textContent = H.t('hijri');
        document.getElementById('goto-greg-label').textContent = H.t('gregorian');
        document.getElementById('goto-lbl-day').textContent = H.t('day');
        document.getElementById('goto-lbl-month').textContent = H.t('month');
        document.getElementById('goto-lbl-year').textContent = H.t('year');
        document.getElementById('goto-btn').textContent = H.t('go');

        // التنقل
        document.getElementById('today-btn').textContent = H.t('todayBtn');
        document.getElementById('leap-badge').textContent = H.t('leapYear');
        document.getElementById('next-month').title = H.t('nextMonth');
        document.getElementById('prev-month').title = H.t('prevMonth');

        // عن المنهج
        document.getElementById('about-title').textContent = H.t('aboutTitle');
        document.getElementById('about-p1').innerHTML = H.t('aboutP1');
        document.getElementById('about-p2').innerHTML = H.t('aboutP2');
        document.getElementById('about-p3').innerHTML = H.t('aboutP3');

        // التذييل
        document.getElementById('footer-credit').textContent = H.t('footer');
        document.getElementById('footer-version').textContent = H.t('version');
        document.getElementById('footer-tool').textContent = H.t('credit');
    }

    function refreshUI() {
        applyLabels();
        renderCalendar();
        renderTodayInfo();
        updateModeUI();
        updateCorrectionDisplay();
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
        badge.textContent = H.getMode() === 'astronomical' ? H.t('badgeAstro') : H.t('badgeTab');
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
            refreshUI();
        });
    }

    // ─── اختيار اللغة ───────────────────────────────────────
    function setupLangSelector() {
        const select = document.getElementById('lang-select');
        select.value = H.getLang();
        select.addEventListener('change', () => {
            H.setLang(select.value);
            H._saveLang();
            refreshUI();
        });
    }

    // ─── الانتقال إلى تاريخ ─────────────────────────────────
    function setupGoToDate() {
        document.getElementById('goto-btn').addEventListener('click', () => {
            const d = parseInt(document.getElementById('goto-day').value);
            const m = parseInt(document.getElementById('goto-month').value);
            const y = parseInt(document.getElementById('goto-year').value);

            if (!d || !m || !y || m < 1 || m > 12 || d < 1) return;

            const type = document.querySelector('input[name="goto-type"]:checked').value;

            if (type === 'hijri') {
                if (d > 30 || y < 1) return;
                currentYear = y;
                currentMonth = m;
            } else {
                if (d > 31 || y < 622) return;
                const hijri = H.gregorianToHijri(y, m, d);
                currentYear = hijri.year;
                currentMonth = hijri.month;
            }

            renderCalendar();
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

        const all = H.getAllCorrections();
        const listEl = document.getElementById('corrections-list');
        const keys = Object.keys(all).sort();
        if (keys.length === 0) {
            listEl.innerHTML = `<span class="corr-empty">${H.t('noCorrections')}</span>`;
        } else {
            listEl.innerHTML = keys.map(key => {
                const [y, m] = key.split('-').map(Number);
                const sign = all[key] > 0 ? '+' : '';
                return `<span class="corr-tag">${H.monthName(m-1)} ${H.toArabicNumerals(y)}: ${sign}${H.toArabicNumerals(all[key])}</span>`;
            }).join(' ');
        }
    }

    // ─── عرض التقويم ────────────────────────────────────────
    function renderCalendar() {
        const data = H.getMonthData(currentYear, currentMonth);

        document.getElementById('month-title').textContent =
            `${data.monthName} ${H.toArabicNumerals(data.year)} ${H.t('hSuffix')}`;

        document.getElementById('gregorian-range').textContent = data.gregorianRange;

        const leapBadge = document.getElementById('leap-badge');
        leapBadge.style.display = data.isLeapYear ? 'inline-block' : 'none';

        // رؤوس الأيام الديناميكية
        const headersEl = document.getElementById('day-headers');
        headersEl.innerHTML = '';
        const weekHeader = document.createElement('div');
        weekHeader.className = 'day-header week-header';
        weekHeader.textContent = H.t('weekCol');
        headersEl.appendChild(weekHeader);
        data.orderedDayNames.forEach((name, i) => {
            const dh = document.createElement('div');
            dh.className = 'day-header';
            if (i === 6) dh.classList.add('day-header-last');
            dh.textContent = name;
            headersEl.appendChild(dh);
        });

        // شبكة التقويم
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';

        data.days.forEach((day, idx) => {
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
            cell.title = `${H.dayName(day.dayOfWeek)} — ${gregDate}`;

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
            `${H.dayName(dow)}، ${H.toArabicNumerals(today.day)} ${H.monthName(today.month-1)} ${H.toArabicNumerals(today.year)} ${H.t('hSuffix')}`;

        document.getElementById('today-gregorian').textContent =
            `${H.toArabicNumerals(now.getDate())} ${H.gregMonthName(now.getMonth())} ${H.toArabicNumerals(now.getFullYear())}${H.t('gSuffix')}`;
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
            infoBar.textContent = H.t('clickDay');
            return;
        }

        const greg = day.gregorian;
        const hijriFromJDN = H.jdnToHijri(day.jdn);
        infoBar.innerHTML =
            `${H.dayName(day.dayOfWeek)}، ${H.toArabicNumerals(hijriFromJDN.day)} ${H.monthName(hijriFromJDN.month-1)} ${H.toArabicNumerals(hijriFromJDN.year)} ${H.t('hSuffix')}` +
            ` — ` +
            `${H.toArabicNumerals(greg.day)} ${H.gregMonthName(greg.month-1)} ${H.toArabicNumerals(greg.year)}${H.t('gSuffix')}`;
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
