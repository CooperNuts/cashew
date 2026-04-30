// ==============================
// CONFIG (CASHEW1)
// ==============================
const SUPABASE_URL = "https://njropgdoiswwuxihrkdl.supabase.co/";

const SUPABASE_KEY = "eeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcm9wZ2RvaXN3d3V4aWhya2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTQ1MzcsImV4cCI6MjA5MzEzMDUzN30.ajprWtMWDio4Zx-ndaf0MSXe545N80YifjEfUA7QjAE";

const TABLE = "cashew1";

// ==============================
// HITOS
// ==============================
const hitos = [
  { fecha: '2023-10-02', texto: 'Op. C23' },
  { fecha: '2024-09-30', texto: 'Op. C24' },
  { fecha: '2025-09-29', texto: 'Op. C25' }
];

// ==============================
// STATE
// ==============================
let globalData = [];
let activeColumns = ["usdlb_std"];
let chart = null;

// ==============================
// INIT
// ==============================
document.addEventListener("DOMContentLoaded", async () => {

  if (typeof Chart === "undefined") {
    console.error("Chart.js no cargado");
    return;
  }

  showLoadingState();

  await fetchData();

  if (!globalData.length) {
    console.error("No data loaded");
    return;
  }

  setupTickers();
  setupChart();
  updateUI();
});

// ==============================
// FETCH
// ==============================
async function fetchData() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=fecha.desc&limit=5000`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Supabase error:", data);
      return;
    }

    globalData = data
      .filter(d => d.fecha)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// ==============================
// UI LOADING
// ==============================
function showLoadingState() {
  document.getElementById("productTitle").textContent = "Loading...";
  document.getElementById("productPrice").textContent = "-";
  document.getElementById("productChange").textContent = "";
}

// ==============================
// TICKERS
// ==============================
function setupTickers() {
  const tickers = document.querySelectorAll(".ticker");

  tickers.forEach(t => {

    const labelEl = t.querySelector(".label");

    if (labelEl && t.dataset.name) {
      labelEl.textContent = t.dataset.name;
    }

    t.addEventListener("click", () => {

      const col = t.dataset.column;

      if (activeColumns.includes(col)) {
        activeColumns = activeColumns.filter(c => c !== col);
        t.classList.remove("active");
      } else {
        activeColumns.push(col);
        t.classList.add("active");
      }

      if (activeColumns.length === 0) {
        activeColumns = [col];
        t.classList.add("active");
      }

      updateUI();
    });
  });
}

// ==============================
// CHART
// ==============================
function setupChart() {
  const ctx = document.getElementById("currencyChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          position: "right",
          ticks: {
            callback: v => Number(v).toFixed(2)
          }
        }
      }
    }
  });
}

// ==============================
// UPDATE CHART
// ==============================
function updateChart() {
  if (!chart || !globalData.length) return;

  const sorted = [...globalData].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  chart.data.labels = sorted.map(d => d.fecha);
  chart.data.datasets = [];

  activeColumns.forEach((col, i) => {

    const values = sorted.map(d => {
      const v = Number(d[col]);
      return isNaN(v) ? null : v;
    });

    chart.data.datasets.push({
      label: col,
      data: values,
      borderWidth: 1.5,
      tension: 0.2,
      pointRadius: 0,
      borderColor: i === 0 ? "#12151c" : "#8B0000"
    });

  });

  chart.update();
}

// ==============================
// UI UPDATE
// ==============================
function updateUI() {
  if (!globalData.length) return;

  updateChart();

  const latest = globalData[globalData.length - 1];
  const prev = globalData[globalData.length - 2];

  const col = activeColumns[0];

  const value = Number(latest[col]);
  const prevValue = prev ? Number(prev[col]) : value;

  document.getElementById("productTitle").textContent = col;
  document.getElementById("productPrice").textContent = value.toFixed(2);

  const change = ((value - prevValue) / prevValue) * 100;
  const isPositive = change >= 0;

  document.getElementById("productChange").textContent =
    `${isPositive ? "▲" : "▼"} ${Math.abs(change).toFixed(2)}%`;

  document.getElementById("productChange").className =
    `change ${isPositive ? "down" : "up"}`;
}