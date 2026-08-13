async function loadAdmin() {
  const reports = await fetch("/api/reports").then(r => r.json());
  document.getElementById("aTotal").textContent = reports.length;
  document.getElementById("aPending").textContent = reports.filter(r => r.status === "Pending").length;
  document.getElementById("aResolved").textContent = reports.filter(r => r.status === "Resolved").length;

  const list = document.getElementById("adminList");
  if (!reports.length) {
    list.innerHTML = `<div class="card" style="padding:25px">No reports yet. Submit one from the public site.</div>`;
    return;
  }

  list.innerHTML = reports.map(r => `
    <article class="card" style="padding:22px">
      <div style="display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap">
        <div>
          <span class="status">${escapeHtml(r.status)}</span>
          <h3>${escapeHtml(r.title)}</h3>
          <p><strong>ID:</strong> ${escapeHtml(r.id)} · <strong>Category:</strong> ${escapeHtml(r.category)}</p>
          <p><strong>Location:</strong> ${escapeHtml(r.location)}</p>
          <p>${escapeHtml(r.description)}</p>
          ${r.photo ? `<img src="${r.photo}" style="max-width:300px;border-radius:10px" alt="Report photo">` : ""}
        </div>
        <div style="min-width:180px">
          <label>Update status
            <select onchange="updateStatus('${r.id}', this.value)">
              ${["Pending","Verified","In Progress","Resolved"].map(s => `<option ${s===r.status?"selected":""}>${s}</option>`).join("")}
            </select>
          </label>
          <button class="btn ghost" style="margin-top:10px" onclick="deleteReport('${r.id}')">Delete</button>
        </div>
      </div>
    </article>`).join("");
}
async function updateStatus(id, status) {
  await fetch(`/api/reports/${encodeURIComponent(id)}/status`, {
    method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status})
  });
  loadAdmin();
}
async function deleteReport(id) {
  if (!confirm("Delete this report?")) return;
  await fetch(`/api/reports/${encodeURIComponent(id)}`, {method:"DELETE"});
  loadAdmin();
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
loadAdmin();