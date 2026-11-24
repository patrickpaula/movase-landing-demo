(function () {
  document.documentElement.classList.add('js-ready');

  // Reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Light parallax on the hero photo (desktop only, no reduced-motion)
  var photo = document.querySelector('.hero-photo img');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (photo && !calm && window.innerWidth > 900) {
    window.addEventListener('scroll', function () {
      var y = Math.min(window.scrollY, 600);
      photo.style.transform = 'translateY(' + (y * 0.04) + 'px)';
    }, { passive: true });
  }

  // Header: gains background, wave and shadow on scroll
  var top = document.querySelector('.top');
  if (top) {
    var tick = false;
    var upd = function () { top.classList.toggle('is-scrolled', window.scrollY > 24); tick = false; };
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  // Popup animado (antes/depois e depoimentos)
  var dlg = document.getElementById('lb');
  if (dlg && dlg.showModal) {
    var limg = document.getElementById('lb-img');
    var calmMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var items = [], idx = 0, lastBtn = null;
    var cnt = document.getElementById('lb-count'), live = document.getElementById('lb-live');
    var EASE = 'transform .55s cubic-bezier(.22,.7,.2,1), opacity .4s ease';

    function fromRect(btn) {
      var t = btn.getBoundingClientRect(), f = limg.getBoundingClientRect();
      if (!f.width || !f.height) return null;
      var dx = (t.left + t.width / 2) - (f.left + f.width / 2);
      var dy = (t.top + t.height / 2) - (f.top + f.height / 2);
      var sc = Math.min(t.width / f.width, t.height / f.height);
      return 'translate(' + dx + 'px,' + dy + 'px) scale(' + Math.max(sc, 0.2) + ')';
    }
    function show(i, animateFromThumb) {
      idx = (i + items.length) % items.length;
      var btn = items[idx], im = btn.querySelector('img');
      limg.alt = im.alt;
      if (cnt) cnt.textContent = (idx + 1) + ' / ' + items.length;
      if (live) live.textContent = 'Image ' + (idx + 1) + ' of ' + items.length;
      limg.onload = function () {
        limg.onload = null;
        if (calmMotion) { limg.style.opacity = 1; limg.style.transform = 'none'; return; }
        limg.style.transition = 'none';
        limg.style.opacity = 0;
        limg.style.transform = animateFromThumb ? (fromRect(btn) || 'scale(.92)') : 'translateX(24px) scale(.97)';
        void limg.offsetWidth;
        limg.style.transition = EASE;
        limg.style.opacity = 1; limg.style.transform = 'none';
      };
      limg.src = im.currentSrc || im.src;
      lastBtn = btn;
    }
    function open(btn) {
      var g = btn.getAttribute('data-group');
      items = [].slice.call(document.querySelectorAll('.zoom[data-group="' + g + '"]'));
      dlg.setAttribute('data-single', items.length < 2 ? '1' : '0');
      document.body.classList.add('lb-lock');
      dlg.showModal();
      try { history.pushState({ lb: 1 }, ''); } catch (e) {}
      requestAnimationFrame(function () { dlg.classList.add('is-open'); });
      show(items.indexOf(btn), true);
    }
    function close(fromPop) {
      if (!dlg.open || dlg.classList.contains('closing')) return;
      if (lastBtn) {                                   // sincroniza a faixa com a imagem vista
        var card = lastBtn.closest('.depo'), rl = card && card.parentNode;
        if (rl && rl.scrollWidth > rl.clientWidth + 4) {
          var st = rl.style.scrollBehavior; rl.style.scrollBehavior = 'auto';
          rl.scrollLeft = card.offsetLeft + card.offsetWidth / 2 - rl.clientWidth / 2;
          rl.style.scrollBehavior = st;
        }
      }
      dlg.classList.remove('is-open'); dlg.classList.add('closing');
      if (fromPop !== true && history.state && history.state.lb) history.back();
      var done = function () {
        dlg.classList.remove('closing'); dlg.close();
        document.body.classList.remove('lb-lock');
        if (lastBtn) lastBtn.focus({ preventScroll: true });
      };
      if (calmMotion) { done(); return; }
      var back = lastBtn && fromRect(lastBtn);
      var r = lastBtn && lastBtn.getBoundingClientRect();
      var visible = r && r.bottom > 0 && r.top < window.innerHeight;
      limg.style.transition = EASE;
      limg.style.opacity = 0;
      limg.style.transform = visible && back ? back : 'scale(.92)';
      setTimeout(done, 420);
    }
    document.querySelectorAll('.zoom').forEach(function (b) {
      b.addEventListener('click', function () { open(b); });
    });
    dlg.querySelector('.lb-close').addEventListener('click', function () { close(); });
    dlg.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1, false); });
    dlg.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1, false); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb-fig')) close(); });
    window.addEventListener('popstate', function () { if (dlg.open) close(true); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' && items.length > 1) show(idx - 1, false);
      if (e.key === 'ArrowRight' && items.length > 1) show(idx + 1, false);
    });
    var sx = null, sy = null;
    dlg.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { sx = null; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    dlg.addEventListener('touchend', function (e) {
      if (sx === null || items.length < 2) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(idx + (dx < 0 ? 1 : -1), false);
    });
  } else {
    // sem suporte a <dialog>: abre a imagem em nova aba
    document.querySelectorAll('.zoom').forEach(function (b) {
      b.addEventListener('click', function () { var im = b.querySelector('img'); window.open(im.currentSrc || im.src, '_blank', 'noopener'); });
    });
  }

  // Carousel guide (arrows, dots, counter, drag hint)
  (function () {
    var rails = document.querySelectorAll('[data-carousel]');
    if (!rails.length) return;
    var wide = window.matchMedia('(min-width: 1000px)');
    var chev = function (d) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
    };
    [].forEach.call(rails, function (rail) {
      var cards = [].slice.call(rail.children), n = cards.length;
      if (n < 2) return;
      var noun = rail.getAttribute('data-noun') || 'item';
      var hint = rail.getAttribute('data-hint') || 'Swipe sideways';
      var label = rail.getAttribute('aria-label') || '';
      var wrap = document.createElement('div');
      wrap.className = 'carousel';
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-roledescription', 'carousel');
      if (label) wrap.setAttribute('aria-label', label);
      rail.parentNode.insertBefore(wrap, rail);

      var top = document.createElement('div');
      top.className = 'car-top'; top.setAttribute('aria-hidden', 'true');
      top.innerHTML = '<span class="car-hint"><span></span><svg class="car-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span><span class="car-count"></span>';
      top.querySelector('.car-hint span').textContent = hint;
      var count = top.querySelector('.car-count');

      var bar = document.createElement('div');
      bar.className = 'car-bar';
      var prev = document.createElement('button');
      prev.type = 'button'; prev.className = 'car-btn car-prev'; prev.setAttribute('aria-label', 'View previous ' + noun); prev.innerHTML = chev('M15 5l-7 7 7 7');
      var next = document.createElement('button');
      next.type = 'button'; next.className = 'car-btn car-next'; next.setAttribute('aria-label', 'View next ' + noun); next.innerHTML = chev('M9 5l7 7-7 7');
      var dotsBox = document.createElement('div');
      dotsBox.className = 'car-dots';
      var dots = cards.map(function (c, i) {
        var d = document.createElement('button');
        d.type = 'button'; d.className = 'car-dot'; d.setAttribute('aria-label', 'Go to ' + noun + ' ' + (i + 1) + ' of ' + n);
        d.addEventListener('click', function () { go(i); });
        dotsBox.appendChild(d);
        var z = c.querySelector('.zoom');
        if (z) z.setAttribute('aria-label', 'Enlarge ' + noun + ' ' + (i + 1) + ' of ' + n);
        return d;
      });
      bar.appendChild(prev); bar.appendChild(dotsBox); bar.appendChild(next);
      wrap.appendChild(top); wrap.appendChild(rail); wrap.appendChild(bar);
      rail.setAttribute('aria-label', 'List of ' + noun + 's');
      rail.classList.add('is-built');

      var cur = 0;
      function current() {
        var sl = rail.scrollLeft;
        if (sl <= 2) return 0;
        if (sl + rail.clientWidth >= rail.scrollWidth - 2) return n - 1;
        var mid = sl + rail.clientWidth / 2, best = 0, dist = 1e9;
        for (var i = 0; i < n; i++) {
          var dd = Math.abs(cards[i].offsetLeft + cards[i].offsetWidth / 2 - mid);
          if (dd < dist) { dist = dd; best = i; }
        }
        return best;
      }
      function paint() {
        cur = current();
        count.textContent = (cur + 1) + ' / ' + n;
        dots.forEach(function (d, i) { if (i === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
        prev.setAttribute('aria-disabled', cur === 0 ? 'true' : 'false');
        next.setAttribute('aria-disabled', cur === n - 1 ? 'true' : 'false');
        if (rail.scrollLeft > 24) wrap.classList.add('is-touched');
      }
      function go(i) {
        i = Math.max(0, Math.min(n - 1, i));
        var c = cards[i];
        rail.scrollTo({ left: c.offsetLeft + c.offsetWidth / 2 - rail.clientWidth / 2, behavior: calm ? 'auto' : 'smooth' });
      }
      prev.addEventListener('click', function () { go(cur - 1); });
      next.addEventListener('click', function () { go(cur + 1); });

      var ticking = false;
      rail.addEventListener('scroll', function () {
        if (ticking) return; ticking = true;
        requestAnimationFrame(function () { paint(); ticking = false; });
      }, { passive: true });
      rail.addEventListener('touchstart', function () { wrap.classList.add('is-touched'); wrap.classList.remove('is-nudge'); }, { passive: true, once: true });
      rail.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
      });
      window.addEventListener('resize', paint);
      paint();

      // single nudge on entering the screen (mobile/tablet only, no reduced-motion)
      if (!calm && 'IntersectionObserver' in window) {
        var seen = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting) return;
            seen.disconnect();
            if (wide.matches || wrap.classList.contains('is-touched') || rail.scrollLeft > 2) return;
            setTimeout(function () {
              if (wrap.classList.contains('is-touched')) return;
              wrap.classList.add('is-nudge');
              cards[0].addEventListener('animationend', function () { wrap.classList.remove('is-nudge'); }, { once: true });
            }, 500);
          });
        }, { threshold: 0.6 });
        seen.observe(rail);
      }
    });
  })();

  // Barra fixa de CTA no celular: aparece depois do hero e some quando um botao de CTA ou o formulario esta na tela
  (function () {
    var s = document.getElementById('sticky'), h = document.querySelector('.hero .btn');
    if (!s || !h || !('IntersectionObserver' in window)) return;
    var heroOut = false, seen = {};
    function up() {
      var any = false;
      for (var k in seen) { if (seen[k]) { any = true; break; } }
      var on = heroOut && !any;
      s.classList.toggle('is-on', on);
      document.documentElement.classList.toggle('sticky-on', on);
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
      s.querySelector('a').tabIndex = on ? 0 : -1;
    }
    new IntersectionObserver(function (e) { heroOut = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; up(); }).observe(h);
    var targets = [].slice.call(document.querySelectorAll('.cta-row .btn, #quero'));
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen[targets.indexOf(e.target)] = e.isIntersecting; });
      up();
    }, { threshold: 0.2 });
    targets.forEach(function (el) { io2.observe(el); });
  })();

  // Contadores (valor final ja vem no HTML; sem JS ou com movimento reduzido nada muda)
  (function () {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length || calm || !('IntersectionObserver' in window)) return;
    var run = function (el) {
      var to = +el.getAttribute('data-count'), t0 = performance.now(), d = 1100;
      var f = function (t) {
        var p = Math.min((t - t0) / d, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(f); else el.textContent = to;
      };
      requestAnimationFrame(f);
    };
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    [].forEach.call(els, function (el) { el.textContent = '0'; cio.observe(el); });
  })();

  // Linha do tempo: o traco (onda do M) se desenha ao entrar na tela
  (function () {
    var st = document.querySelector('.steps-wrap');
    if (!st) return;
    if (!('IntersectionObserver' in window)) { st.classList.add('is-drawn'); return; }
    var o = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { st.classList.add('is-drawn'); o.disconnect(); }
    }, { threshold: 0.4 });
    o.observe(st);
  })();

  // Form (demo)
  var form = document.getElementById('quero');
  if (!form || form.tagName !== 'FORM') return;
  var err = document.getElementById('err'), busy = false;
  var btn = form.querySelector('button[type=submit]'), lab = btn.querySelector('.btn-label');
  var fNome = form.nome, fZap = form.whatsapp;
  var LABEL = lab.textContent;
  var GENERIC = 'We couldn\'t send that right now. Wait a few seconds and try again.';
  var ZAP_MSG = 'Use a mobile number with area code, for example (555) 123-4567.';

  function digits(v) { return v.replace(/\D/g, ''); }
  function normZap(v) { return digits(v).slice(0, 15); }
  // same rule as the server: international numbers, 10 to 15 digits
  function zapOk(d) { return d.length >= 10 && d.length <= 15; }
  // only formats plain 10-digit numbers as (555) 123-4567; international input (+44..., etc.) is left as typed
  function fmtZap(v) {
    if (/^\s*\+/.test(v)) return v;
    var d = normZap(v);
    if (d.length === 10) return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
    return v;
  }
  fZap.addEventListener('blur', function () { fZap.value = fmtZap(fZap.value); });
  // teclado do iOS: mantem o botao de enviar visivel
  fZap.addEventListener('focus', function () {
    setTimeout(function () { btn.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' }); }, 300);
  });

  function setField(input, msg) {
    var m = document.getElementById(input.id + '-err');
    if (msg) { input.setAttribute('aria-invalid', 'true'); m.textContent = msg; m.hidden = false; }
    else { input.removeAttribute('aria-invalid'); m.hidden = true; }
  }
  fNome.addEventListener('input', function () { if (fNome.value.trim().length >= 2) setField(fNome, ''); });
  fZap.addEventListener('input', function () { if (zapOk(normZap(fZap.value))) setField(fZap, ''); });

  function setBusy(on) {
    busy = on; btn.setAttribute('aria-busy', on ? 'true' : 'false');
    lab.textContent = on ? 'Sending...' : LABEL;
  }
  function showErr(msg) { err.textContent = msg; err.hidden = false; }

  function showSuccess(nome) {
    var wa = form.getAttribute('data-wa');
    var ok = document.createElement('div');
    ok.className = 'form-ok'; ok.id = 'quero'; ok.setAttribute('role', 'status'); ok.tabIndex = -1;
    var t = document.createElement('p'); t.className = 'form-ok-t';
    t.textContent = 'We got your contact, ' + nome.split(/\s+/)[0] + '.';
    var u = document.createElement('p'); u.className = 'form-ok-s';
    u.textContent = 'Thank you for taking the first step.';
    ok.appendChild(t); ok.appendChild(u);
    if (wa) {
      var a = document.createElement('a');
      a.className = 'btn btn-primary form-ok-wa'; a.href = wa; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Talk to Juliana now';
      ok.appendChild(a);
    }
    form.replaceWith(ok);
    ok.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
    ok.focus({ preventScroll: true });
    try { if (window.fbq) window.fbq('track', 'Lead'); } catch (e) {}
    try { if (window.gtag) window.gtag('event', 'generate_lead'); } catch (e) {}
  }

  form.addEventListener('submit', function (ev) {
    if (busy) { ev.preventDefault(); return; }
    err.hidden = true;
    var nome = fNome.value.trim(), zap = normZap(fZap.value);
    var bad = null;
    if (nome.length < 2) { setField(fNome, 'Enter your name.'); bad = bad || fNome; } else setField(fNome, '');
    if (!zapOk(zap)) { setField(fZap, ZAP_MSG); bad = bad || fZap; } else setField(fZap, '');
    if (bad) { ev.preventDefault(); bad.focus(); return; }
    // Portfolio demo: nothing is sent or stored.
    ev.preventDefault();
    showErr('This is a portfolio demo. No data is sent or stored.');
  });
})();
