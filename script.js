(() => {
  const root = document.documentElement;

  /* ---- palettes for the shuffle button ---- */
  const palettes = [
    ["#ff5a1f", "#ffc400", "#00b386", "#2f6bff", "#00c2d1", "#c6f432"], // signal
    ["#2f6bff", "#c6f432", "#00c2d1", "#ff5a1f", "#ffc400", "#00b386"], // electric
    ["#e63946", "#f4a261", "#2a9d8f", "#264653", "#e9c46a", "#457b9d"], // earth
    ["#00b386", "#ffd60a", "#3a86ff", "#fb5607", "#06d6a0", "#8ac926"], // field
    ["#ff7a00", "#e0e0e0", "#4cc9f0", "#4361ee", "#90be6d", "#f9c74f"], // steel
  ];
  let pIndex = 0;
  try {
    const saved = parseInt(localStorage.getItem("iak-palette-v2"), 10);
    if (!Number.isNaN(saved) && palettes[saved]) pIndex = saved;
  } catch (_) {}

  const applyPalette = (i) => {
    palettes[i].forEach((c, n) => root.style.setProperty(`--c${n + 1}`, c));
  };
  applyPalette(pIndex);

  document.getElementById("shuffle").addEventListener("click", () => {
    pIndex = (pIndex + 1) % palettes.length;
    applyPalette(pIndex);
    try { localStorage.setItem("iak-palette-v2", String(pIndex)); } catch (_) {}
    toast(["palette swapped", "new palette", "colors: shuffled", "fresh look"][pIndex % 4]);
  });

  /* ---- split name into letters that wiggle + recolor on hover ---- */
  const nameEl = document.getElementById("name");
  const text = nameEl.textContent.trim();
  nameEl.textContent = "";
  [...text].forEach((ch, i) => {
    const s = document.createElement("span");
    s.className = "ch";
    s.textContent = ch;
    s.addEventListener("mouseenter", () => {
      s.style.color = `var(--c${(i % 6) + 1})`;
    });
    nameEl.appendChild(s);
  });

  /* ---- live clock (Chennai time) ---- */
  const clock = document.getElementById("clock");
  const tz = "Asia/Kolkata";
  const fmt = (() => {
    try {
      return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz });
    } catch (_) {
      return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
    }
  })();
  const tick = () => { clock.textContent = fmt.format(new Date()).toLowerCase(); };
  tick();
  setInterval(tick, 15000);

  /* ---- reveal on scroll ---- */
  const els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 6) * 60}ms`;
      io.observe(el);
    });
  } else {
    els.forEach((el) => el.classList.add("in"));
  }

  /* ---- timeline: click a stop to open it ---- */
  const stops = document.querySelectorAll(".timeline li");
  stops.forEach((li) => {
    const b = li.querySelector(".stop");
    b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", () => {
      const open = !li.classList.contains("open");
      li.classList.toggle("open", open);
      b.setAttribute("aria-expanded", String(open));
    });
  });
  const cur = document.querySelector(".timeline li.current");
  if (cur) { cur.classList.add("open"); cur.querySelector(".stop").setAttribute("aria-expanded", "true"); }

  /* ---- stats count up when they scroll into view ---- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nums = document.querySelectorAll("[data-count]");
  const show = (el, v) => { el.textContent = `${el.dataset.prefix || ""}${v}${el.dataset.suffix || ""}`; };
  const countUp = (el) => {
    const end = +el.dataset.count;
    if (reduce) return show(el, end);
    const start = performance.now(), dur = 1200;
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      show(el, Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); so.unobserve(e.target); } });
    }, { threshold: 0.5 });
    nums.forEach((n) => so.observe(n));
  } else {
    nums.forEach((n) => show(n, n.dataset.count));
  }

  /* ---- copy email ---- */
  const btn = document.getElementById("copyEmail");
  btn.addEventListener("click", async () => {
    const email = btn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      toast("copied! talk soon ✉️");
    } catch (_) {
      window.location.href = `mailto:${email}`;
    }
  });

  /* ---- toast ---- */
  const toastEl = document.getElementById("toast");
  let t;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(t);
    t = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  /* ---- show the CV button only if cv.pdf exists ---- */
  const cv = document.getElementById("cvBtn");
  if (cv) {
    fetch("cv.pdf", { method: "HEAD" })
      .then((r) => { if (r.ok) cv.hidden = false; })
      .catch(() => {});
  }

  document.getElementById("year").textContent = new Date().getFullYear();
})();
