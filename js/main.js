// Elektro Lüdorf – kleine Helfer ohne Abhängigkeiten.
// Die Seite funktioniert auch ohne JavaScript; hier kommen nur Komfort und Prüfungen dazu.
(() => {
  'use strict';

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- Header: Trennlinie erst nach dem Scrollen ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ---------- Mobiles Menü ---------- */
  const toggle = document.querySelector('.menu-toggle');
  const panel = document.getElementById('menu');
  if (toggle && panel) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      panel.classList.toggle('is-open', open);
      panel.inert = !open;
      document.documentElement.style.overflow = open ? 'hidden' : '';
    };
    panel.inert = true;
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- Aktionsleiste: beim Tippen in Felder ausblenden ---------- */
  const bar = document.querySelector('.action-bar');
  if (bar) {
    const isField = (el) => el && el.matches && el.matches('input:not([type="radio"]):not([type="checkbox"]):not([type="file"]), textarea, select');
    document.addEventListener('focusin', (e) => { if (isField(e.target)) bar.classList.add('is-hidden'); });
    document.addEventListener('focusout', (e) => { if (isField(e.target)) bar.classList.remove('is-hidden'); });
  }

  /* ---------- Verteilung erklärt: Legende und Markierungen koppeln ---------- */
  document.querySelectorAll('[data-explain]').forEach((root) => {
    const spots = [...root.querySelectorAll('.hotspot')];
    const items = [...root.querySelectorAll('.legend button')];
    const activate = (i) => {
      spots.forEach((s, j) => s.classList.toggle('is-active', j === i));
      items.forEach((b, j) => {
        b.classList.toggle('is-active', j === i);
        b.setAttribute('aria-pressed', String(j === i));
      });
    };
    spots.forEach((s, i) => s.addEventListener('click', () => activate(i)));
    items.forEach((b, i) => {
      b.addEventListener('click', () => activate(i));
      b.addEventListener('focus', () => activate(i));
      b.addEventListener('mouseenter', () => { if (fine.matches) activate(i); });
    });
    activate(0);
  });

  /* ---------- Leistungen: aktuellen Abschnitt in der Unternavigation zeigen ---------- */
  const subnav = document.querySelector('.subnav');
  if (subnav && 'IntersectionObserver' in window) {
    const list = subnav.querySelector('ul');
    const links = new Map([...subnav.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a]));
    let current = null;
    const mark = (id) => {
      if (id === current) return;
      current = id;
      links.forEach((a, key) => a.classList.toggle('is-current', key === id));
      const a = links.get(id);
      if (a && list.scrollWidth > list.clientWidth) {
        const left = a.offsetLeft - (list.clientWidth - a.offsetWidth) / 2;
        list.scrollTo({ left, behavior: 'smooth' });
      }
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) mark(entry.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('[data-section]').forEach((s) => observer.observe(s));
  }

  /* ---------- Anfrageformular ---------- */
  const form = document.querySelector('[data-form]');
  if (!form) return;

  const MAX_FILES = 5;
  const MAX_BYTES = 15 * 1024 * 1024;

  // Thema aus dem Link übernehmen (kontakt.html?thema=wallbox)
  const thema = new URLSearchParams(window.location.search).get('thema');
  if (thema) {
    const radio = [...form.querySelectorAll('input[name="anliegen"]')].find((r) => r.dataset.id === thema);
    if (radio) radio.checked = true;
  }

  // Zeitstempel gegen Bots, die das Formular sofort absenden
  if (form.elements.zeit) form.elements.zeit.value = String(Date.now());

  const fileInput = form.querySelector('#fotos');
  const fileList = form.querySelector('.file-list');
  const upload = form.querySelector('.upload');
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('button[type="submit"]');
  let tried = false;

  const formatSize = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`);
  const digits = (s) => (s.match(/\d/g) || []).length;

  const checks = {
    anliegen: () => !!form.querySelector('input[name="anliegen"]:checked'),
    nachricht: () => form.elements.nachricht.value.trim().length > 0,
    name: () => form.elements.name.value.trim().length > 0,
    telefon: () => digits(form.elements.telefon.value) >= 6,
    email: () => {
      const v = form.elements.email.value.trim();
      return v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    },
    fotos: () => {
      const files = fileInput ? [...fileInput.files] : [];
      const total = files.reduce((s, f) => s + f.size, 0);
      return files.length <= MAX_FILES && total <= MAX_BYTES;
    },
  };

  const show = (name, ok) => {
    if (name === 'anliegen') {
      const err = form.querySelector('#anliegen-fehler');
      err.classList.toggle('is-visible', !ok);
      form.querySelectorAll('input[name="anliegen"]').forEach((r) => r.setAttribute('aria-invalid', String(!ok)));
      return;
    }
    const el = name === 'fotos' ? fileInput : form.elements[name];
    if (!el) return;
    el.closest('.field').classList.toggle('has-error', !ok);
    el.setAttribute('aria-invalid', String(!ok));
  };

  const validate = (name) => {
    const ok = checks[name]();
    show(name, ok);
    return ok;
  };

  // Felder erst nach dem Verlassen bzw. nach dem ersten Absendeversuch prüfen
  ['nachricht', 'name', 'telefon', 'email'].forEach((name) => {
    const el = form.elements[name];
    el.addEventListener('blur', () => { if (el.value.trim() !== '' || tried) validate(name); });
    el.addEventListener('input', () => { if (el.closest('.field').classList.contains('has-error')) validate(name); });
  });
  form.querySelectorAll('input[name="anliegen"]').forEach((r) => r.addEventListener('change', () => { if (tried) validate('anliegen'); }));

  if (fileInput) {
    fileInput.addEventListener('change', () => {
      fileList.innerHTML = '';
      [...fileInput.files].forEach((f) => {
        const li = document.createElement('li');
        const name = document.createElement('span');
        const size = document.createElement('span');
        name.textContent = f.name;
        size.textContent = formatSize(f.size);
        li.append(name, size);
        fileList.append(li);
      });
      validate('fotos');
    });
    ['dragenter', 'dragover'].forEach((t) => upload.addEventListener(t, () => upload.classList.add('is-drag')));
    ['dragleave', 'drop'].forEach((t) => upload.addEventListener(t, () => upload.classList.remove('is-drag')));
  }

  const setLoading = (on) => {
    submit.classList.toggle('is-loading', on);
    submit.disabled = on;
    submit.querySelector('.btn-label').textContent = on ? 'Wird gesendet …' : 'Anfrage senden';
  };

  const fail = () => {
    status.className = 'form-status is-error';
    status.innerHTML = 'Die Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es in ein paar Minuten noch einmal – oder rufen Sie uns an: <a href="tel:+4921025534453">02102 5534453</a>.';
  };

  form.addEventListener('submit', async (e) => {
    tried = true;
    const order = ['anliegen', 'nachricht', 'fotos', 'name', 'telefon', 'email'];
    const failed = order.filter((name) => !validate(name));
    if (failed.length) {
      e.preventDefault();
      const first = failed[0];
      const target = first === 'anliegen'
        ? form.querySelector('input[name="anliegen"]')
        : first === 'fotos' ? fileInput : form.elements[first];
      target.closest(first === 'anliegen' ? 'fieldset' : '.field').scrollIntoView({ block: 'center', behavior: 'smooth' });
      target.focus({ preventScroll: true });
      return;
    }

    // Ohne fetch (sehr alte Browser) normal absenden; anfrage.php leitet dann auf danke.html weiter.
    if (!window.fetch || !window.FormData) return;
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    setLoading(true);

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.fehler || 'Senden fehlgeschlagen');

      const card = form.closest('.form-card');
      const tpl = document.getElementById('erfolg');
      card.replaceChildren(tpl.content.cloneNode(true));
      card.scrollIntoView({ block: 'start', behavior: 'smooth' });
      card.querySelector('h2').focus({ preventScroll: true });
    } catch (err) {
      setLoading(false);
      fail();
    }
  });
})();
