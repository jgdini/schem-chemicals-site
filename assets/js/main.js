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
