(function () {
    'use strict';
    var doc = document.documentElement;
    doc.classList.add('js');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Header com sombra ao rolar */
    var header = document.querySelector('.header');
    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Menu mobile */
    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');
    function closeNav() { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
    burger.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a, button')) closeNav(); });

    /* Link ativo no menu */
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
    }

    /* Revelar ao rolar */
    var items = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
        items.forEach(function (el) { el.classList.add('is-in'); });
    } else {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                var sibs = Array.prototype.indexOf.call(el.parentNode.children, el);
                el.style.transitionDelay = Math.min(sibs, 6) * 70 + 'ms';
                el.classList.add('is-in');
                io.unobserve(el);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
        items.forEach(function (el) { io.observe(el); });
    }

    /* Contadores */
    var counters = document.querySelectorAll('[data-count]');
    function runCount(el) {
        var end = +el.getAttribute('data-count');
        if (reduce) { el.textContent = end; return; }
        var t0 = null, dur = 1400;
        function step(t) {
            if (!t0) t0 = t;
            var p = Math.min((t - t0) / dur, 1);
            el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = '0';
        requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
        var co = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); } });
        }, { threshold: .6 });
        counters.forEach(function (el) { co.observe(el); });
    }

    /* Acordeão: um aberto por vez */
    var acc = document.querySelectorAll('.acc__item');
    acc.forEach(function (d) {
        d.addEventListener('toggle', function () {
            if (!d.open) return;
            acc.forEach(function (o) { if (o !== d) o.open = false; });
        });
    });

    /* Abas de unidades */
    var tabList = document.querySelector('.tabs');
    var ink = tabList.querySelector('.tabs__ink');
    var tabs = Array.prototype.slice.call(tabList.querySelectorAll('[role="tab"]'));
    var current = tabs[0];
    function moveInk() {
        ink.style.width = current.offsetWidth + 'px';
        ink.style.transform = 'translateX(' + current.offsetLeft + 'px)';
    }
    function selectTab(tab, focus) {
        if (tab === current && !focus) return;
        current = tab;
        tabs.forEach(function (t) {
            var on = t === tab;
            var panel = document.getElementById(t.getAttribute('aria-controls'));
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
            panel.classList.toggle('is-active', on);
            panel.inert = !on;
        });
        moveInk();
        // no celular, traz a aba escolhida para dentro da faixa rolável
        var left = tab.offsetLeft - (tabList.clientWidth - tab.offsetWidth) / 2;
        tabList.scrollTo({ left: left, behavior: reduce ? 'auto' : 'smooth' });
        if (focus) tab.focus({ preventScroll: true });
    }
    moveInk();
    window.addEventListener('resize', moveInk);
    if (document.fonts) document.fonts.ready.then(moveInk);
    tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { selectTab(t); });
        t.addEventListener('keydown', function (e) {
            var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (n) { e.preventDefault(); selectTab(tabs[(i + n + tabs.length) % tabs.length], true); }
        });
    });
    document.querySelectorAll('[data-unit]').forEach(function (a) {
        a.addEventListener('click', function () {
            var t = document.getElementById('t-' + a.getAttribute('data-unit'));
            if (t) selectTab(t);
        });
    });

    /* Seletor de WhatsApp */
    var picker = document.getElementById('picker');
    var lastFocus = null;
    function openPicker() {
        lastFocus = document.activeElement;
        picker.hidden = false;
        document.body.style.overflow = 'hidden';
        picker.querySelector('a').focus();
    }
    function closePicker() {
        picker.hidden = true;
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }
    document.querySelectorAll('[data-open-contato]').forEach(function (b) { b.addEventListener('click', openPicker); });
    picker.querySelectorAll('[data-close-contato]').forEach(function (b) { b.addEventListener('click', closePicker); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { if (!picker.hidden) closePicker(); closeNav(); }
    });

    var ano = document.getElementById('ano');
    if (ano) ano.textContent = new Date().getFullYear();
})();
