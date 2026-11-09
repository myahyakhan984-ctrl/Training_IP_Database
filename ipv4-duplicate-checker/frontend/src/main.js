import "./style.css";

const API_BASE_URL = (window.APP_CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");
const $ = (id) => document.getElementById(id);

let currentPage = 1;
let totalPages = 1;
let currentSearch = "";

function showResult(message, type = "info") {
  const box = $("uploadResult");
  box.className = `result-box ${type}`;
  box.textContent = message;
}

function parseIPs(text) {
  // Accept line breaks, commas, semicolons, tabs, or spaces as separators.
  return text.split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean);
}

async function apiRequest(path, options = {}) {
  if (!API_BASE_URL || API_BASE_URL.includes("REPLACE-WITH-YOUR-WORKER-URL")) {
    throw new Error("Worker URL is not configured. Edit frontend/config.js first.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`API returned an unreadable response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (HTTP ${response.status}).`);
  }
  return data;
}

async function loadStats() {
  try {
    const data = await apiRequest("/api/stats");
    $("totalIps").textContent = Number(data.total_ips || 0).toLocaleString();
  } catch (error) {
    $("totalIps").textContent = "—";
    console.error(error);
  }
}

function renderRecords(records) {
  const body = $("recordsBody");
  body.replaceChildren();

  if (!records.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;
    cell.className = "empty-cell";
    cell.textContent = "No IP records found.";
    row.append(cell);
    body.append(row);
    return;
  }

  for (const record of records) {
    const row = document.createElement("tr");
    const ipCell = document.createElement("td");
    const dateCell = document.createElement("td");
    ipCell.className = "ip-cell";
    ipCell.textContent = record.ip_address;
    dateCell.textContent = record.created_at || "—";
    row.append(ipCell, dateCell);
    body.append(row);
  }
}

async function loadRecords() {
  $("recordsBody").innerHTML = '<tr><td colspan="2" class="empty-cell">Loading records...</td></tr>';
  try {
    const params = new URLSearchParams({
      page: String(currentPage),
      per_page: "20"
    });
    if (currentSearch) params.set("search", currentSearch);

    const data = await apiRequest(`/api/ips?${params.toString()}`);
    renderRecords(data.records || []);
    currentPage = data.pagination.page;
    totalPages = Math.max(1, data.pagination.total_pages || 1);
    $("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;
    $("prevBtn").disabled = currentPage <= 1;
    $("nextBtn").disabled = currentPage >= totalPages;
  } catch (error) {
    $("recordsBody").innerHTML = `<tr><td colspan="2" class="empty-cell">${escapeHTML(error.message)}</td></tr>`;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

async function uploadIPs() {
  const ips = parseIPs($("ipInput").value);
  if (!ips.length) {
    showResult("Please paste at least one IPv4 address.", "error");
    return;
  }
  if (ips.length > 500) {
    showResult("Maximum 500 IP addresses are allowed per upload.", "error");
    return;
  }

  $("uploadBtn").disabled = true;
  $("uploadButtonText").textContent = "Uploading...";
  try {
    const data = await apiRequest("/api/upload-ips", {
      method: "POST",
      body: JSON.stringify({ ips })
    });

    const s = data.summary || {};
    const lines = [
      `Upload completed: ${s.uploaded || 0} new IP(s) saved.`,
      `${s.duplicates || 0} duplicate(s) rejected.`,
      `${s.invalid || 0} invalid IPv4 address(es) rejected.`
    ];

    if ((s.duplicates || 0) > 0) {
      lines.push(`Duplicate IPs: ${(data.duplicate_ips || []).join(", ")}`);
    }
    if ((s.invalid || 0) > 0) {
      lines.push(`Invalid entries: ${(data.invalid_ips || []).join(", ")}`);
    }

    showResult(lines.join("\n"), (s.uploaded || 0) > 0 ? "success" : "info");
    $("ipInput").value = "";
    currentPage = 1;
    await Promise.all([loadStats(), loadRecords()]);
  } catch (error) {
    showResult(error.message, "error");
  } finally {
    $("uploadBtn").disabled = false;
    $("uploadButtonText").textContent = "Upload IPs";
  }
}

$("uploadBtn").addEventListener("click", uploadIPs);
$("clearBtn").addEventListener("click", () => {
  $("ipInput").value = "";
  $("uploadResult").className = "result-box hidden";
});
$("refreshBtn").addEventListener("click", async () => {
  await Promise.all([loadStats(), loadRecords()]);
});
$("searchBtn").addEventListener("click", () => {
  currentSearch = $("searchInput").value.trim();
  currentPage = 1;
  loadRecords();
});
$("searchInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") $("searchBtn").click();
});
$("prevBtn").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    loadRecords();
  }
});
$("nextBtn").addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage += 1;
    loadRecords();
  }
});

loadStats();
loadRecords();
