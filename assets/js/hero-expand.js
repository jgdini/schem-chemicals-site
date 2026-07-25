(function () {
  "use strict";

  var section = document.querySelector("[data-hero-expand]");
  if (!section) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var media = section.querySelector("[data-hero-media]");
  var bg = section.querySelector(".hero-expand__bg");
  var words = section.querySelectorAll(".hero-expand__word");
  var content = document.querySelector("[data-hero-expand-content]");

  window.scrollTo(0, 0);

  if (reduceMotion) {
    media.style.width = "min(1400px, 94vw)";
    if (bg) bg.style.opacity = "0";
    if (content) content.classList.add("is-visible");
    return;
  }

  var progress = 0;
  var expanded = false;
  var touchStartY = 0;

  function isMobile() { return window.innerWidth < 768; }

  function apply() {
    var minW = 320;
    var maxW = isMobile() ? window.innerWidth * 0.94 : 1400;
    var w = minW + progress * (maxW - minW);
    media.style.width = w + "px";

    var shift = progress * (isMobile() ? 40 : 70);
    if (words[0]) words[0].style.transform = "translateX(-" + shift + "px)";
    if (words[1]) words[1].style.transform = "translateX(" + shift + "px)";

    if (bg) bg.style.opacity = String(1 - progress);
    if (content) content.classList.toggle("is-visible", progress >= 0.98);
  }

  function setProgress(delta) {
    progress = Math.min(Math.max(progress + delta, 0), 1);
    apply();
    if (progress >= 1) {
      expanded = true;
      section.classList.add("is-expanded");
    } else if (progress < 0.75) {
      expanded = false;
      section.classList.remove("is-expanded");
    }
  }

  function onWheel(e) {
    if (expanded && e.deltaY < 0 && window.scrollY <= 5) {
      expanded = false;
      section.classList.remove("is-expanded");
      e.preventDefault();
      return;
    }
    if (!expanded) {
      e.preventDefault();
      setProgress(e.deltaY * 0.0026);
    }
  }

  function onTouchStart(e) {
    touchStartY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (!touchStartY) return;
    var y = e.touches[0].clientY;
    var deltaY = touchStartY - y;

    if (expanded && deltaY < -20 && window.scrollY <= 5) {
      expanded = false;
      section.classList.remove("is-expanded");
      e.preventDefault();
      return;
    }
    if (!expanded) {
      e.preventDefault();
      setProgress(deltaY * (deltaY < 0 ? 0.022 : 0.014));
      touchStartY = y;
    }
  }

  function onTouchEnd() {
    touchStartY = 0;
  }

  function onScroll() {
    if (!expanded) window.scrollTo(0, 0);
  }

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: false });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd);
  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", apply);

  apply();
})();
