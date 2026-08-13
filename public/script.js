const form = document.getElementById("reportForm");
const msg = document.getElementById("formMessage");

async function loadStats() {
  const reports = await fetch("/api/reports").then(r => r.json());
  document.getElementById("totalReports").textContent = reports.length;
  document.getElementById("pendingReports").textContent = reports.filter(r => r.status === "Pending").length;
  document.getElementById("resolvedReports").textContent = reports.filter(r => r.status === "Resolved").length;
}
loadStats();

document.getElementById("useLocation").addEventListener("click", () => {
  const coords = document.getElementById("coords");
  if (!navigator.geolocation) {
    coords.textContent = "Geolocation is not supported.";
    return;
  }
  coords.textContent = "Detecting...";
  navigator.geolocation.getCurrentPosition(
    p => {
      document.getElementById("latitude").value = p.coords.latitude;
      document.getElementById("longitude").value = p.coords.longitude;
      coords.textContent = `${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`;
    },
    () => coords.textContent = "Permission denied or location unavailable."
  );
});

form.addEventListener("submit", async e => {
  e.preventDefault();
  msg.className = "full message";
  msg.textContent = "Submitting...";
  const data = new FormData(form);

  try {
    const res = await fetch("/api/reports", { method: "POST", body: data });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Submission failed.");

    msg.className = "full message success";
    msg.innerHTML = `Report submitted! Your tracking ID is <strong>${result.id}</strong>. Save this ID.`;
    form.reset();
    document.getElementById("coords").textContent = "Location not detected";
    loadStats();
  } catch (err) {
    msg.className = "full message error";
    msg.textContent = err.message;
  }
});

document.getElementById("trackBtn").addEventListener("click", async () => {
  const id = document.getElementById("trackId").value.trim();
  const box = document.getElementById("trackResult");
  if (!id) { box.innerHTML = "<p class='error'>Enter a tracking ID.</p>"; return; }

  const res = await fetch(`/api/reports/${encodeURIComponent(id)}`);
  if (!res.ok) { box.innerHTML = "<p class='error'>Report not found.</p>"; return; }
  const r = await res.json();

  box.innerHTML = `
    <div class="result">
      <span class="status">${escapeHtml(r.status)}</span>
      <h3>${escapeHtml(r.title)}</h3>
      <p>${escapeHtml(r.description)}</p>
      <p><strong>Category:</strong> ${escapeHtml(r.category)}</p>
      <p><strong>Location:</strong> ${escapeHtml(r.location)}</p>
      <p><strong>Report ID:</strong> ${escapeHtml(r.id)}</p>
      ${r.photo ? `<img src="${r.photo}" alt="Report photo" style="max-width:100%;border-radius:10px">` : ""}
    </div>`;
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}