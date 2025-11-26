// ====== CONFIG ======
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4jaSDSAyxPrg6t6zSq-40nxkoEOOevw3nhjOjZv2aeqfIW8sMKbJ9EMYnlx6GCNWSQqo5DkD3s32T/pub?output=csv";

const SLIDE_DURATION_MS = 15000; // 15 seconds
const RATES_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

// ====== FETCH & RENDER RATES ======
async function loadRates() {
  try {
    const urlWithCacheBust = `${SHEET_URL}&cacheBust=${Date.now()}`;
    const response = await fetch(urlWithCacheBust);
    const csvText = await response.text();

    const rows = csvText
      .trim()
      .split("\n")
      .map((row) => row.split(","));

    const headers = rows.shift().map((h) => h.trim().toLowerCase());
    const headerIndex = (name) => headers.indexOf(name);

    const currencyIdx = headerIndex("currency");
    const codeIdx = headerIndex("code");
    const buyIdx = headerIndex("buy");
    const sellIdx = headerIndex("sell");

    const rateObjects = rows.map((cols) => ({
      currency: cols[currencyIdx] || "",
      code: cols[codeIdx] || "",
      buy: cols[buyIdx] || "",
      sell: cols[sellIdx] || ""
    }));

    renderRates(rateObjects);
  } catch (err) {
    console.error("Error loading rates:", err);
    document.getElementById("rates-grid").innerHTML =
      "<p>Unable to load rates. Please check your internet connection.</p>";
  }
}

function renderRates(rates) {
  const grid = document.getElementById("rates-grid");

  const cardsHtml = rates
    .filter((r) => r.currency && (r.buy || r.sell))
    .map((r) => {
      const buy = r.buy ? r.buy : "-";
      const sell = r.sell ? r.sell : "-";

      return `
        <div class="rate-card">
          <div class="rate-header">
            <div class="currency">${r.currency}</div>
            <div class="code">${r.code}</div>
          </div>
          <div class="rate-values">
            <div class="rate-block">
              <div class="rate-label">Buy</div>
              <div class="rate-number">${buy}</div>
            </div>
            <div class="rate-block">
              <div class="rate-label">Sell</div>
              <div class="rate-number">${sell}</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  grid.innerHTML = cardsHtml || "<p>No rates available.</p>";

  const dateEl = document.getElementById("rates-date");
  const now = new Date();
  dateEl.textContent = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// ====== SLIDESHOW ======
function initSlideshow() {
  const slides = Array.from(document.querySelectorAll(".slide"));
  let currentIndex = 0;

  function showSlide(index) {
    slides[currentIndex].classList.remove("active");
    currentIndex = index;
    slides[currentIndex].classList.add("active");
  }

  setInterval(() => {
    const nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
  }, SLIDE_DURATION_MS);
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  loadRates();
  initSlideshow();
  setInterval(loadRates, RATES_REFRESH_MS);
});

