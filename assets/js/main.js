(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Mobile nav toggle ---- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  /* ---- Scroll reveal ---- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger");
  if (revealEls.length && "IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---- Count-up numbers ---- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    var animateCount = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion) {
        el.textContent = target + suffix;
        return;
      }
      var start = null;
      var duration = 1400;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(target * eased);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---- Field canvas (hero signature: falling fertilizer granules) ---- */
  var FIELD_PALETTE = [
    "rgba(255, 255, 255, 0.85)",
    "rgba(247, 234, 214, 0.8)",
    "rgba(230, 242, 227, 0.75)",
    "rgba(200, 134, 47, 0.55)"
  ];

  function initField(host, isStatic) {
    var canvas = document.createElement("canvas");
    canvas.className = "field-canvas";
    canvas.setAttribute("aria-hidden", "true");
    var field = host.querySelector(".hero__field");
    if (field && field.nextSibling) {
      host.insertBefore(canvas, field.nextSibling);
    } else {
      host.appendChild(canvas);
    }

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, seeds = [];
    var mouse = { x: -9999, y: -9999, active: false };
    var rafId = null;

    function spawn(fromTop) {
      var r = 1.4 + Math.random() * 2.4;
      return {
        x: Math.random() * w,
        y: fromTop ? -r - Math.random() * 40 : Math.random() * h,
        r: r,
        drift: (Math.random() - 0.5) * 0.16,
        speed: 0.35 + Math.random() * 0.65,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        color: FIELD_PALETTE[(Math.random() * FIELD_PALETTE.length) | 0]
      };
    }

    function seed() {
      var count = Math.max(20, Math.round((w * h) / 15000));
      seeds = [];
      for (var i = 0; i < count; i++) seeds.push(spawn(false));
    }

    function drawSeed(s) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < seeds.length; i++) drawSeed(seeds[i]);
    }

    function resize() {
      var prevW = w, prevH = h;
      w = host.clientWidth;
      h = host.clientHeight;
      if (!w || !h) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (isStatic) {
        seed();
        draw();
      } else if (!seeds.length || !prevW || !prevH) {
        seed();
      }
    }

    resize();

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () { resize(); });
      ro.observe(host);
    } else if (!isStatic) {
      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 200);
      });
    }

    if (isStatic) return;

    host.addEventListener("mousemove", function (e) {
      var r = host.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
    });
    host.addEventListener("mouseleave", function () { mouse.active = false; });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!rafId) {
        rafId = requestAnimationFrame(step);
      }
    });

    function step() {
      for (var i = 0; i < seeds.length; i++) {
        var s = seeds[i];
        s.wobble += s.wobbleSpeed;
        s.y += s.speed;
        s.x += s.drift + Math.sin(s.wobble) * 0.18;
        if (mouse.active) {
          var dx = s.x - mouse.x, dy = s.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80 && dist > 0.01) {
            var push = (80 - dist) / 80 * 0.5;
            s.x += (dx / dist) * push;
            s.y += (dy / dist) * push;
          }
        }
        if (s.y - s.r > h + 10) {
          seeds[i] = spawn(true);
        }
      }
      draw();
      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
  }

  var fieldHosts = document.querySelectorAll("[data-field]");
  if (fieldHosts.length && "requestAnimationFrame" in window) {
    fieldHosts.forEach(function (host) { initField(host, reduceMotion); });
  }

  /* ---- YouTube facade (click-to-play institutional video) ---- */
  var ytFacades = document.querySelectorAll("[data-yt-facade]");
  ytFacades.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var embedUrl = btn.getAttribute("data-yt-embed");
      var iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.position = "absolute";
      iframe.style.inset = "0";
      btn.parentElement.appendChild(iframe);
      btn.remove();
    });
  });

  /* ---- Product catalog (search + segment filter) ---- */
  var catalogGrid = document.querySelector("[data-catalog]");
  if (catalogGrid) {
    var searchInput = document.querySelector("[data-catalog-search]");
    var chips = document.querySelectorAll("[data-catalog-chip]");
    var countEl = document.querySelector("[data-catalog-count]");
    var emptyEl = document.querySelector("[data-catalog-empty]");
    var items = Array.prototype.slice.call(catalogGrid.querySelectorAll(".catalog-item"));
    var activeSegment = "all";

    function normalize(str) {
      return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
    }

    function applyFilter() {
      var term = normalize(searchInput ? searchInput.value.trim() : "");
      var visible = 0;
      items.forEach(function (item) {
        var name = normalize(item.getAttribute("data-name") || "");
        var segment = item.getAttribute("data-segment") || "";
        var matchesTerm = !term || name.indexOf(term) !== -1;
        var matchesSegment = activeSegment === "all" || segment === activeSegment;
        var show = matchesTerm && matchesSegment;
        item.style.display = show ? "" : "none";
        if (show) visible++;
      });
      if (countEl) countEl.textContent = visible;
      if (emptyEl) emptyEl.classList.toggle("is-visible", visible === 0);
    }

    if (searchInput) {
      searchInput.addEventListener("input", applyFilter);
    }
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        activeSegment = chip.getAttribute("data-catalog-chip");
        applyFilter();
      });
    });
    applyFilter();
  }
})();
