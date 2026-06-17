/* ==========================================================
   LOBSTER VPN — interactions
   Optimized for fast first paint and minimal jank.
   ========================================================== */
(function () {
  'use strict';

  const docEl = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Mobile menu ----
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ---- Scroll reveal ----
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -80px 0px' }
    );
    document.querySelectorAll(
      '.section__head, .pain, .feature, .step, .plan, .review, .faq__item, .compare, .guarantee, .trust-block, .killer__card'
    ).forEach(el => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // ---- Header shadow on scroll ----
  const header = document.getElementById('header');
  if (header) {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
        raf = 0;
      });
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- Live counter ----
  const liveCounter = document.querySelector('[data-live-counter]');
  if (liveCounter) {
    let n = 47832;
    const fmt = () => liveCounter.textContent = n.toLocaleString('ru-RU');
    fmt();
    setInterval(() => { n += Math.floor(Math.random() * 4); fmt(); }, 2200);
  }

  // ---- Countdown ----
  const countdowns = document.querySelectorAll('[data-countdown]');
  if (countdowns.length) {
    const target = new Date();
    target.setHours(23, 59, 59, 999);
    const tick = () => {
      const ms = Math.max(0, target - new Date());
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      const txt =
        String(h).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' +
        String(s).padStart(2, '0');
      countdowns.forEach(el => (el.textContent = txt));
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---- Background canvas: animated particle network (paused when off-screen) ----
  const canvas = document.getElementById('bg-canvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d', { alpha: true });
    let w = 0, h = 0;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let particles = [];
    let pulses = [];
    let raf = 0;
    let running = true;
    let pulseTimer;

    const isSmall = () => window.innerWidth < 720;
    const isTouch = () => window.matchMedia('(hover: none)').matches;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const seed = () => {
      const count = isSmall() ? 26 : (isTouch() ? 40 : 56);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.4 + 0.7,
        });
      }
    };

    const spawnPulse = () => {
      pulses.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.9 + h * 0.05,
        r: 0,
        max: 70 + Math.random() * 90,
        a: 0.45,
      });
    };

    const draw = () => {
      if (!running) { raf = 0; return; }
      ctx.clearRect(0, 0, w, h);
      const ld = isSmall() ? 100 : 140;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 138, 101, 0.38)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < ld * ld) {
            const op = (1 - Math.sqrt(d2) / ld) * 0.12;
            ctx.strokeStyle = `rgba(255, 138, 101, ${op})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      for (let i = pulses.length - 1; i >= 0; i--) {
        const pl = pulses[i];
        pl.r += 0.7;
        pl.a -= 0.005;
        if (pl.a <= 0 || pl.r > pl.max) { pulses.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(pl.x, pl.y, pl.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 87, 51, ${pl.a})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (running) return;
      running = true;
      pulseTimer = setInterval(() => { if (pulses.length < 4) spawnPulse(); }, 1400);
      draw();
    };
    const stop = () => {
      running = false;
      if (pulseTimer) clearInterval(pulseTimer);
      pulseTimer = null;
      if (raf) cancelAnimationFrame(raf);
    };

    let resizeRaf = 0;
    window.addEventListener('resize', () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => { resize(); resizeRaf = 0; });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else { running = false; start(); }
    });

    if ('IntersectionObserver' in window) {
      const visObs = new IntersectionObserver(
        entries => entries.forEach(e => {
          if (e.isIntersecting) { running = false; start(); } else stop();
        }),
        { threshold: 0 }
      );
      visObs.observe(canvas.parentElement);
    }

    resize();
    pulseTimer = setInterval(() => { if (pulses.length < 4) spawnPulse(); }, 1400);
    draw();
  }

  // ---- Hero parallax (mouse-follow on glows + phone tilt via CSS vars) ----
  const heroEl = document.querySelector('.hero');
  const heroBg = document.querySelector('.hero__bg');
  const phone = document.querySelector('.phone');
  if (heroEl && heroBg && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const glows = heroBg.querySelectorAll('.hero__glow');
    let mx = 0, my = 0, tx = 0, ty = 0, parallaxRaf = 0;
    const lerp = (a, b, t) => a + (b - a) * t;
    const loop = () => {
      tx = lerp(tx, mx, 0.06);
      ty = lerp(ty, my, 0.06);
      glows.forEach((g, i) => {
        const k = (i + 1) * 30;
        g.style.transform = `translate3d(${tx * k}px, ${ty * k}px, 0)`;
      });
      if (phone) {
        // Set CSS vars; the float keyframes apply them, so tilt and float compose
        phone.style.setProperty('--tilt-y', (tx * 8).toFixed(2) + 'deg');
        phone.style.setProperty('--tilt-x', (-ty * 5).toFixed(2) + 'deg');
      }
      if (Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001) {
        parallaxRaf = requestAnimationFrame(loop);
      } else {
        parallaxRaf = 0;
      }
    };
    heroEl.addEventListener('mousemove', e => {
      const r = heroEl.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      if (!parallaxRaf) loop();
    }, { passive: true });
    heroEl.addEventListener('mouseleave', () => {
      mx = 0; my = 0;
      if (!parallaxRaf) loop();
    }, { passive: true });
  }

  // ---- Smooth anchor scroll ----
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id && id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          const y = target.getBoundingClientRect().top + window.scrollY - 70;
          window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }
    });
  });

  // ==========================================================
  // LOGIN MODAL — open/close only; methods are direct links.
  // ==========================================================
  const modal = document.getElementById('login-modal');
  if (modal) {
    const open = () => {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    document.querySelectorAll('[data-open-login]').forEach(b => b.addEventListener('click', open));
    modal.querySelectorAll('[data-close-login]').forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }
})();
