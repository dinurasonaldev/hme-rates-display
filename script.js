// ===== CONFIG =====

// PASTE YOUR PUBLISHED CSV URL HERE (only once)
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4jaSDSAyxPrg6t6zSq-40nxkoEOOevw3nhjOjZv2aeqfIW8sMKbJ9EMYnlx6GCNWSQqo5DkD3s32T/pub?gid=0&single=true&output=csv";

// Slide timing: 10 seconds
const SLIDE_DURATION_MS = 30000;

// Refresh rates every 1 minute
const RATES_REFRESH_MS = 60 * 1000;

// ===== INTERNAL STATE =====
let lastRatesData = null;
let currentSlideIndex = 0;

// Simple mapping: currency code -> flag emoji
const FLAG_MAP = {
  EUR: "🇪🇺",
  USD: "🇺🇸",
  GBP: "🇬🇧",
  AED: "🇦🇪",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  CHF: "🇨🇭",
  SEK: "🇸🇪",
  NOK: "🇳🇴",
  DKK: "🇩🇰",
  JPY: "🇯🇵",
  LKR: "🇱🇰",
  INR: "🇮🇳",
  THB: "🇹🇭",
  TRY: "🇹🇷",
  MAD: "🇲🇦",
  SGD: "🇸🇬",
  MXN: "🇲🇽",
  NZD: "🇳🇿",
  ZAR: "🇿🇦"
};

function getFlagForCode(code) {
  if (!code) return "";
  const upper = code.trim().toUpperCase();
  return FLAG_MAP[upper] || "";
}

// ===== DATA LOAD =====

async function loadRates() {
  const errorEl = document.getElementById("error-message");
  try {
    const urlWithCacheBust = `${SHEET_URL}&cacheBust=${Date.now()}`;
    const res = await fetch(urlWithCacheBust);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const csvText = await res.text();
    const rows = csvText
      .trim()
      .split("\n")
      .map((row) => row.split(","));

    const headers = rows.shift().map((h) => h.trim().toLowerCase());
    const idx = (name) => headers.indexOf(name);

    const orderIdx = idx("order");
    const codeIdx = idx("code");
    const currencyIdx = idx("currency");
    const buyIdx = idx("buy");
    const sellIdx = idx("sell");

    const data = rows
      .map((cols) => ({
        order: parseInt(cols[orderIdx] || "9999", 10),
        code: (cols[codeIdx] || "").trim(),
        currency: (cols[currencyIdx] || "").trim(),
        buy: (cols[buyIdx] || "").trim(),
        sell: (cols[sellIdx] || "").trim()
      }))
      .filter((r) => r.code || r.currency);

    data.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.code.localeCompare(b.code);
    });

    lastRatesData = data;
    renderRates(data);
    setLastUpdated();
    errorEl.textContent = "";
  } catch (err) {
    console.error("Error loading rates:", err);
    if (lastRatesData) {
      // We have old data: keep showing it + show warning
      errorEl.textContent = "Unable to load latest rates – showing last data.";
    } else {
      // No data at all
      document.getElementById("rates-body").innerHTML =
        '<div class="rates-row rates-row--body"><div class="cell">No rates available.</div></div>';
      errorEl.textContent = "Unable to load rates. Please check the connection.";
    }
  }
}

function renderRates(rates) {
  const body = document.getElementById("rates-body");
  const rowsHtml = rates
    .map((r) => {
      const flag = getFlagForCode(r.code);
      const buy = r.buy || "-";
      const sell = r.sell || "-";

      return `
        <div class="rates-row rates-row--body">
          <div class="cell cell-flag">${flag}</div>
          <div class="cell cell-code">${r.code || ""}</div>
          <div class="cell cell-currency">${r.currency || ""}</div>
          <div class="cell cell-buy">
            <span class="rate-pill buy">${buy}</span>
          </div>
          <div class="cell cell-sell">
            <span class="rate-pill sell">${sell}</span>
          </div>
        </div>
      `;
    })
    .join("");

  body.innerHTML = rowsHtml || `
    <div class="rates-row rates-row--body">
      <div class="cell">No rates available.</div>
    </div>
  `;
}

function setLastUpdated() {
  const el = document.getElementById("last-updated");
  if (!el) return;
  const now = new Date();
  el.textContent =
    "Last updated: " +
    now.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
}

// ===== SLIDESHOW =====

function initSlideshow() {
  const slides = Array.from(document.querySelectorAll(".slide"));
  if (!slides.length) return;

  function showSlide(index) {
    slides.forEach((s, i) => {
      s.classList.toggle("active", i === index);
    });
    currentSlideIndex = index;
  }

  showSlide(0); // start with rates slide

  setInterval(() => {
    const next = (currentSlideIndex + 1) % slides.length;
    showSlide(next);
  }, SLIDE_DURATION_MS);
}

// ===== INIT =====

document.addEventListener("DOMContentLoaded", () => {
  loadRates();
  setInterval(loadRates, RATES_REFRESH_MS);
  initSlideshow();
});

