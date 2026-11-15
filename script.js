/* =========================================================
   MAKARIOS EDIBLES — SCRIPT
   Plain JavaScript, no frameworks. Each feature lives in
   its own function and is started at the bottom of the file.
   ========================================================= */
"use strict";

// Tell the CSS that JavaScript is running (enables reveal animations)
document.documentElement.classList.add("js");

/* ---------- SETTINGS (edit these) ---------- */

// WhatsApp number in international format, no "+" and no leading zero.
// IMPORTANT: verify this number with the business before going live.
const WHATSAPP_NUMBER = "2348030650700";

// Used automatically if any image fails to load
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=70";

// Pre-written WhatsApp messages
const WHATSAPP_MESSAGES = {
  general:
    "Hello Makarios Edibles! I visited your website and would like to enquire about your products and pricing.",
  contact:
    "Hello Makarios Edibles! I visited your website and would like to get in touch.",
  cake:
    "Hello Makarios Edibles! I visited your website and I'm interested in a cake. Could you please tell me about the available cake options, whether customisation is possible, and the prices?",
  catering:
    "Hello Makarios Edibles! I visited your website and would like to ask about food trays/catering. Could you please share the available packages and pricing?",
  product: (name) =>
    `Hello Makarios Edibles! I visited your website and I'm interested in: ${name}. Could you please share the available options and pricing?`,
};

/* ---------- WHATSAPP ---------- */

/** Builds a wa.me link with a safely encoded message. */
function buildWhatsAppUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Opens WhatsApp in a new tab with the given message. */
function openWhatsApp(message) {
  window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
}

/** Picks the right message based on a button's data attributes. */
function getWhatsAppMessage(el) {
  const type = el.dataset.wa || "general";
  if (type === "product" && el.dataset.product) {
    return WHATSAPP_MESSAGES.product(el.dataset.product);
  }
  return WHATSAPP_MESSAGES[type] || WHATSAPP_MESSAGES.general;
}

/**
 * Finds every element with a data-wa attribute and:
 *  1. Updates its href (so long-press / right-click "copy link" also works)
 *  2. Opens WhatsApp with the correct message when clicked
 */
function initWhatsAppButtons() {
  document.querySelectorAll("[data-wa]").forEach((el) => {
    const message = getWhatsAppMessage(el);
    el.setAttribute("href", buildWhatsAppUrl(message));
    el.addEventListener("click", (event) => {
      event.preventDefault();
      openWhatsApp(message);
    });
  });
}

/* ---------- NAVBAR BACKGROUND + BACK-TO-TOP ---------- */
function initScrollEffects() {
  const navbar = document.getElementById("navbar");
  const backToTop = document.getElementById("backToTop");
  let ticking = false;

  function update() {
    const y = window.scrollY;
    navbar.classList.toggle("navbar--solid", y > 60);
    backToTop.classList.toggle("is-visible", y > window.innerHeight * 0.8);
    ticking = false;
  }

  // requestAnimationFrame keeps scrolling smooth on slower phones
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  backToTop.addEventListener("click", () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.querySelector(".logo").focus({ preventScroll: true });
  });

  update();
}

/* ---------- MOBILE MENU ---------- */
function initMobileMenu() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");
  const desktopQuery = window.matchMedia("(min-width: 992px)");

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("no-scroll", open);
  }

  toggle.addEventListener("click", () => {
    setMenu(!menu.classList.contains("is-open"));
  });

  // Close after choosing any link inside the menu
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  // Close with the Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  // Reset if the screen is resized to desktop
  desktopQuery.addEventListener("change", (e) => {
    if (e.matches) setMenu(false);
  });
}

/* ---------- ACTIVE NAV LINK ---------- */
function initActiveNavLinks() {
  const links = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[data-nav]");
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const target = entry.target.dataset.nav;
      links.forEach((link) => {
        const active = link.dataset.link === target;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  sections.forEach((section) => observer.observe(section));
}

/* ---------- SCROLL REVEAL ---------- */
function initRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target); // animate only once
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  // Small stagger for items that share a grid
  items.forEach((el) => {
    const siblings = el.parentElement.querySelectorAll(":scope > .reveal");
    const index = Array.prototype.indexOf.call(siblings, el);
    if (siblings.length > 1) el.style.transitionDelay = `${Math.min(index, 5) * 0.08}s`;
    observer.observe(el);
  });
}

/* ---------- GALLERY LIGHTBOX ---------- */
function initLightbox() {
  const items = Array.from(document.querySelectorAll(".gallery-item"));
  const lightbox = document.getElementById("lightbox");
  const image = document.getElementById("lbImage");
  const caption = document.getElementById("lbCaption");
  const btnClose = document.getElementById("lbClose");
  const btnPrev = document.getElementById("lbPrev");
  const btnNext = document.getElementById("lbNext");
  let current = 0;
  let lastFocused = null;
  let touchStartX = 0;

  if (!items.length) return;

  function show(index) {
    current = (index + items.length) % items.length; // loops around
    const thumb = items[current].querySelector("img");
    image.src = items[current].dataset.full || thumb.src;
    image.alt = thumb.alt;
    caption.textContent = `${thumb.alt} (${current + 1} / ${items.length})`;
  }

  function open(index) {
    lastFocused = document.activeElement;
    show(index);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    btnClose.focus();
  }

  function close() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (lastFocused) lastFocused.focus();
  }

  items.forEach((item, i) => {
    item.setAttribute("aria-label", `View larger image: ${item.querySelector("img").alt}`);
    item.addEventListener("click", () => open(i));
  });

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", () => show(current - 1));
  btnNext.addEventListener("click", () => show(current + 1));

  // Click the dark background to close
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox__figure")) close();
  });

  // Keyboard: Escape closes, arrows navigate, Tab stays inside the lightbox
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
    if (e.key === "Tab") {
      const focusable = [btnClose, btnPrev, btnNext];
      const idx = focusable.indexOf(document.activeElement);
      e.preventDefault();
      const next = e.shiftKey ? idx - 1 : idx + 1;
      focusable[(next + focusable.length) % focusable.length].focus();
    }
  });

  // Swipe left/right on phones
  lightbox.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) show(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });
}

/* ---------- IMAGE FALLBACK (prevents broken images) ---------- */
function initImageFallbacks() {
  function swap(img) {
    if (img.dataset.fallbackApplied) return; // avoid endless loops
    img.dataset.fallbackApplied = "true";
    img.src = FALLBACK_IMAGE;
    const galleryItem = img.closest(".gallery-item");
    if (galleryItem) galleryItem.dataset.full = FALLBACK_IMAGE;
  }

  document.querySelectorAll("img").forEach((img) => {
    if (img.id === "lbImage") return;
    img.addEventListener("error", () => swap(img));
    // Image may have already failed before this script ran
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("loading") !== "lazy") swap(img);
  });

  // Lightbox image fallback
  const lbImage = document.getElementById("lbImage");
  lbImage.addEventListener("error", () => {
    if (lbImage.src !== FALLBACK_IMAGE) lbImage.src = FALLBACK_IMAGE;
  });
}

/* ---------- FOOTER YEAR ---------- */
function setCurrentYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

/* ---------- START EVERYTHING ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initImageFallbacks();
  initWhatsAppButtons();
  initScrollEffects();
  initMobileMenu();
  initActiveNavLinks();
  initRevealAnimations();
  initLightbox();
  setCurrentYear();
});