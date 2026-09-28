(function () {
    'use strict';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

    /* Header: vidro sobre o hero, sólido depois dele */
    var header = $('#header');
    var hero = $('.hero');
    var nav = $('#nav');
    var burger = $('#burger');
    function updateHeader() {
        var past = window.scrollY > hero.offsetHeight - 90;
        header.classList.toggle('is-solid', past || nav.classList.contains('is-open'));
    }

    /* Menu mobile */
    function closeNav() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); updateHeader(); }
    burger.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
        updateHeader();
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });

    /* Link ativo */
    var links = $$('a[href^="#"]', nav);
    if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) spy.observe(s); });
    }

    /* Revelar ao rolar, com leve escalonamento entre irmãos */
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('is-in'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                var i = $$('.reveal', el.parentNode).indexOf(el);
                el.style.transitionDelay = Math.min(Math.max(i, 0), 7) * 70 + 'ms';
                el.classList.add('is-in');
                io.unobserve(el);
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: .06 });
        items.forEach(function (el) { io.observe(el); });
    }

    /* Contadores */
    function runCount(el) {
        var end = +el.getAttribute('data-count');
        if (reduce) { el.textContent = end; return; }
        var t0 = null, dur = 1600;
        el.textContent = '0';
        requestAnimationFrame(function step(t) {
            if (!t0) t0 = t;
            var p = Math.min((t - t0) / dur, 1);
            el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4)));
            if (p < 1) requestAnimationFrame(step);
        });
    }
    if ('IntersectionObserver' in window) {
        var co = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); } });
        }, { threshold: .6 });
        $$('[data-count]').forEach(function (el) { co.observe(el); });
    }

    /* Rolagem: header, parallax da foto do hero e linha de progresso das etapas */
    var parallax = $('[data-parallax]');
    var steps = $('#steps');
    var ticking = false;
    function onScroll() {
        updateHeader();
        if (!reduce && parallax && window.scrollY < hero.offsetHeight) {
            parallax.style.transform = 'translate3d(0,' + (window.scrollY * .06).toFixed(1) + 'px,0)';
        }
        if (steps) {
            var r = steps.getBoundingClientRect();
            var p = (window.innerHeight * .85 - r.top) / (r.height + window.innerHeight * .3);
            steps.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
        }
        ticking = false;
    }
    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* Luz que segue o cursor nos cards de área */
    $$('.area').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
            var r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
    });

    /* Modais */
    var openModalEl = null, lastFocus = null;
    function openModal(m) {
        if (openModalEl && openModalEl !== m) closeModal(openModalEl, true);
        if (!openModalEl) lastFocus = document.activeElement;
        m.hidden = false;
        openModalEl = m;
        document.body.style.overflow = 'hidden';
        var f = $('a, button:not([data-close])', $('.modal__panel', m));
        if (f) f.focus({ preventScroll: true });
    }
    function closeModal(m, keepFocus) {
        m.hidden = true;
        openModalEl = null;
        document.body.style.overflow = '';
        if (!keepFocus && lastFocus) lastFocus.focus({ preventScroll: true });
    }
    $$('.modal').forEach(function (m) {
        $$('[data-close]', m).forEach(function (b) { b.addEventListener('click', function () { closeModal(m); }); });
    });

    var picker = $('#picker');
    $$('[data-open-contato]').forEach(function (b) { b.addEventListener('click', function () { closeNav(); openModal(picker); }); });

    /* Áreas de atuação: painel com o conteúdo completo */
    var areaModal = $('#area-modal');
    var areaData = $$('div', $('#areas-data').content);
    var current = 0;
    function showArea(i) {
        current = (i + areaData.length) % areaData.length;
        var d = areaData[current];
        $('#area-n').textContent = 'Área ' + String(current + 1).padStart(2, '0') + ' de 0' + areaData.length;
        $('#area-title').textContent = d.getAttribute('data-t');
        $('#area-body').innerHTML = d.innerHTML;
        $('#area-tags').innerHTML = d.getAttribute('data-tags').split('|').map(function (t) { return '<li>' + t + '</li>'; }).join('');
    }
    $$('.area').forEach(function (btn) {
        btn.addEventListener('click', function () { showArea(+btn.getAttribute('data-area')); openModal(areaModal); });
    });
    $('#area-prev').addEventListener('click', function () { showArea(current - 1); });
    $('#area-next').addEventListener('click', function () { showArea(current + 1); });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { if (openModalEl) closeModal(openModalEl); closeNav(); }
        if (openModalEl === areaModal && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) showArea(current + (e.key === 'ArrowRight' ? 1 : -1));
    });

    /* Abas de unidades */
    var tabList = $('.tabs');
    var ink = $('.tabs__ink', tabList);
    var tabs = $$('[role="tab"]', tabList);
    var currentTab = tabs[0];
    function moveInk() {
        ink.style.width = currentTab.offsetWidth + 'px';
        ink.style.transform = 'translateX(' + currentTab.offsetLeft + 'px)';
    }
    function selectTab(tab, focus) {
        if (tab === currentTab && !focus) return;
        currentTab = tab;
        tabs.forEach(function (t) {
            var on = t === tab;
            var panel = document.getElementById(t.getAttribute('aria-controls'));
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
            panel.classList.toggle('is-active', on);
            panel.inert = !on;
        });
        moveInk();
        if (focus) tab.focus({ preventScroll: true });
    }
    tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { selectTab(t); });
        t.addEventListener('keydown', function (e) {
            var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (n) { e.preventDefault(); selectTab(tabs[(i + n + tabs.length) % tabs.length], true); }
        });
    });
    moveInk();
    window.addEventListener('resize', moveInk);
    if (document.fonts) document.fonts.ready.then(moveInk);

    var ano = $('#ano');
    if (ano) ano.textContent = new Date().getFullYear();
})();
