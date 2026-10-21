// Smooth scrolling for nav links + focus target section
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();

    const id = link.getAttribute('href');
    const target = document.querySelector(id);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
});

// Project filters: pick a category, pick it again to show everything
const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.project-card');

filters.forEach(btn => {
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    filters.forEach(b => b.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', String(on));
    cards.forEach(card => {
      card.hidden = on && card.dataset.category !== btn.dataset.filter;
    });
  });
});

// Highlight the nav link for the section currently in view
const navLinks = document.querySelectorAll('.nav-link');
const sections = ['about', 'projects', 'skills']
  .map(id => document.getElementById(id))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
    });
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(section => sectionObserver.observe(section));

// New York skyline: skyscrapers in two rows, windows that switch on and off,
// and now and then someone walking past a lit window.
const cityBack = document.getElementById('city-back');
const cityFront = document.getElementById('city-front');
const windowLayer = document.getElementById('windows');
const walkerLayer = document.getElementById('walkers');

if (cityBack && cityFront && windowLayer && walkerLayer) {
  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };

  // Seeded random, so the skyline is the same on every visit
  let seed = 1932;
  const rand = (a = 0, b = 1) => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return a + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (b - a);
  };
  const pick = list => list[Math.floor(rand(0, list.length))];

  const GROUND = 196, FLOOR = 6, COL = 4.6, WIN_W = 2.8, WIN_H = 3.4;

  // A building is a stack of tiers, each narrower than the one below (NY setbacks),
  // plus whatever sits on the roof
  function building(x, w, h, kind) {
    const tiers = [{ x0: x, x1: x + w, top: GROUND - h }];
    const extras = [];
    const add = (inset, rise) => {
      const below = tiers[tiers.length - 1];
      tiers.push({ x0: below.x0 + inset, x1: below.x1 - inset, top: below.top - rise });
    };
    const top = () => tiers[tiers.length - 1];
    const mid = () => (top().x0 + top().x1) / 2;

    if (kind === 'setback') {
      const steps = Math.floor(rand(1, 4));
      for (let i = 0; i < steps && top().x1 - top().x0 > 12; i++) add(w * rand(0.1, 0.16), rand(10, 22));
    } else if (kind === 'empire') {
      add(w * 0.12, 26); add(w * 0.14, 34); add(w * 0.16, 8); add(w * 0.12, 6);
      extras.push(['rect', { x: mid() - 1, y: top().top - 10, width: 2, height: 10 }]);
      extras.push(['rect', { x: mid() - 0.3, y: top().top - 24, width: 0.6, height: 14 }]);
    } else if (kind === 'chrysler') {
      add(w * 0.14, 30); add(w * 0.12, 14);
      // stepped arches narrowing to a needle
      let x0 = top().x0, x1 = top().x1, y = top().top;
      for (let i = 0; i < 5; i++) {
        const inset = (x1 - x0) * 0.16;
        extras.push(['path', { d: `M${x0} ${y}Q${(x0 + x1) / 2} ${y - 9} ${x1} ${y}Z` }]);
        x0 += inset; x1 -= inset; y -= 4.5;
      }
      extras.push(['path', { d: `M${mid() - 0.6} ${y + 2}L${mid()} ${y - 16}L${mid() + 0.6} ${y + 2}Z` }]);
    } else if (kind === 'slant') {
      const t = top();
      extras.push(['path', { d: `M${t.x0} ${t.top}L${t.x1} ${t.top}L${t.x1} ${t.top - (t.x1 - t.x0) * 0.6}Z` }]);
    } else if (kind === 'antenna') {
      add(w * 0.2, rand(6, 12));
      extras.push(['rect', { x: mid() - 0.35, y: top().top - 18, width: 0.7, height: 18 }]);
    } else if (kind === 'tower') {
      // a classic rooftop water tank on legs
      const tx = top().x0 + rand(3, Math.max(4, w - 10));
      extras.push(['path', { d: `M${tx} ${top().top}L${tx + 1} ${top().top - 3}L${tx + 5} ${top().top - 3}L${tx + 6} ${top().top}Z` }]);
      extras.push(['path', { d: `M${tx + 0.6} ${top().top - 3}V${top().top - 8}L${tx + 3} ${top().top - 10}L${tx + 5.4} ${top().top - 8}V${top().top - 3}Z` }]);
    }
    return { tiers, extras };
  }

  function draw(b, parent) {
    b.tiers.forEach(t => make('rect', { x: t.x0, y: t.top, width: t.x1 - t.x0, height: GROUND - t.top + 1 }, parent));
    b.extras.forEach(([tag, attrs]) => make(tag, attrs, parent));
  }

  // Window slots for one building: rows of floors in each tier, between its roof and the tier below
  function slots(b) {
    const rows = [];
    b.tiers.forEach((t, i) => {
      const floorTo = i === 0 ? GROUND - 4 : b.tiers[i - 1].top;
      const cols = Math.floor((t.x1 - t.x0 - 2) / COL);
      if (cols < 1) return;
      const left = t.x0 + (t.x1 - t.x0 - cols * COL) / 2 + (COL - WIN_W) / 2;
      for (let y = t.top + 3; y + WIN_H <= floorTo - 1; y += FLOOR) {
        rows.push({ y, x0: t.x0, x1: t.x1, lights: [], xs: Array.from({ length: cols }, (_, c) => left + c * COL) });
      }
    });
    return rows;
  }

  // Lay out a row of buildings across the 880-wide view
  function street(minW, maxW, height, kinds, gap) {
    const list = [];
    let x = -6;
    while (x < 886) {
      const w = rand(minW, maxW);
      const centre = 1 - Math.abs(x + w / 2 - 440) / 440;
      list.push({ x, w, h: height(centre), kind: pick(kinds) });
      x += w + gap();
    }
    return list;
  }

  const back = street(20, 34, c => rand(70, 105) + c * rand(10, 45),
    ['setback', 'setback', 'antenna', 'slant', 'plain'], () => rand(-4, 2));
  const front = street(24, 40, c => rand(28, 70) + c * rand(10, 50),
    ['plain', 'setback', 'tower', 'tower', 'setback', 'plain'], () => rand(0, 3));

  // Two landmarks in the front row: an Empire State and a Chrysler
  const nearest = (list, at) => list.reduce((a, b) => Math.abs(b.x + b.w / 2 - at) < Math.abs(a.x + a.w / 2 - at) ? b : a);
  Object.assign(nearest(front, 330), { kind: 'empire', h: 96, w: 40 });
  Object.assign(nearest(front, 570), { kind: 'chrysler', h: 86, w: 30 });

  const lights = [];   // every window that can light up: { el, on }
  const litRows = [];  // front-row floors where someone can walk past

  function light(row, parent, share, chance) {
    row.xs.forEach(x => {
      if (rand() > share) return;   // some offices simply have no lights
      const on = rand() < chance;
      const el = make('rect', { x: x.toFixed(2), y: row.y.toFixed(2), width: WIN_W, height: WIN_H, class: on ? 'lit' : '' }, parent);
      const w = { el, on };
      lights.push(w);
      row.lights.push(w);
    });
  }

  const backWindows = make('g', { class: 'windows windows--back' }, cityBack);
  back.forEach(spec => {
    const b = building(spec.x, spec.w, spec.h, spec.kind);
    draw(b, cityBack);
    cityBack.appendChild(backWindows);   // keep the back windows above the back buildings
    slots(b).forEach(row => light(row, backWindows, 0.45, 0.5));
  });

  front.forEach(spec => {
    const b = building(spec.x, spec.w, spec.h, spec.kind);
    draw(b, cityFront);
    slots(b).forEach(row => {
      light(row, windowLayer, 0.7, 0.55);
      litRows.push(row);
    });
  });

  // The city is always live: lights keep switching and people keep walking
  // Every quarter second a light or two somewhere switches on or off
  const frontLights = lights.filter(w => w.el.parentNode === windowLayer);
  setInterval(() => {
    const flips = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < flips; i++) {
      const pool = Math.random() < 0.8 ? frontLights : lights;
      const w = pool[Math.floor(Math.random() * pool.length)];
      w.on = !w.on;
      w.el.classList.toggle('lit', w.on);
    }
  }, 250);

  // Someone walks along an office floor: a strip of light comes on, a dark figure
  // walks the length of it, then the light goes off behind them
  const walkRows = litRows.filter(row => row.x1 - row.x0 >= 22 && row.y < GROUND - 12);
  const walking = new Set();

  const walk = () => {
    const free = walkRows.filter(row => !walking.has(row));
    const row = free[Math.floor(Math.random() * free.length)];
    if (!row) return;
    walking.add(row);

    const floor = make('g', { class: 'office' }, walkerLayer);
    const band = make('rect', {
      x: (row.x0 + 1).toFixed(2), y: (row.y - 1.2).toFixed(2),
      width: (row.x1 - row.x0 - 2).toFixed(2), height: WIN_H + 2.4, class: 'office-light'
    }, floor);
    const person = make('g', { class: 'walker' }, floor);
    make('circle', { cx: 0, cy: 0.1, r: 0.65 }, person);
    make('path', { d: 'M-0.75 0.85Q0 0.6 0.75 0.85L0.65 2.6H-0.65Z' }, person);
    const legA = make('line', { class: 'walker-leg' }, person);
    const legB = make('line', { class: 'walker-leg' }, person);

    requestAnimationFrame(() => band.classList.add('on'));

    const right = Math.random() < 0.5;
    const from = right ? row.x0 + 1.5 : row.x1 - 1.5, to = right ? row.x1 - 1.5 : row.x0 + 1.5;
    const dist = Math.abs(to - from);
    const speed = 4 + Math.random() * 2;   // view units per second
    const delay = 600;                     // let the lights come up first
    const start = performance.now() + delay;

    const step = now => {
      const t = Math.max(0, (now - start) / 1000 * speed / dist);
      if (t >= 1) {
        person.remove();
        band.classList.remove('on');
        setTimeout(() => { floor.remove(); walking.delete(row); }, 900);
        return;
      }
      const x = from + (to - from) * t;
      const swing = Math.sin(t * dist * 2.2) * 0.5;
      legA.setAttribute('x1', 0); legA.setAttribute('y1', 2.5); legA.setAttribute('x2', swing); legA.setAttribute('y2', 4.1);
      legB.setAttribute('x1', 0); legB.setAttribute('y1', 2.5); legB.setAttribute('x2', -swing); legB.setAttribute('y2', 4.1);
      person.setAttribute('transform', `translate(${x.toFixed(2)} ${(row.y - 0.5).toFixed(2)}) scale(${right ? 1.3 : -1.3} 1.3)`);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // A few people are usually on the move at once
  const keepWalking = () => {
    if (walking.size < 3) walk();
    setTimeout(keepWalking, 1200 + Math.random() * 2000);
  };
  keepWalking();
}
