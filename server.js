const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(__dirname, "public", "uploads");
const DATA_FILE = path.join(DATA_DIR, "reports.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  }
});

function readReports() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeReports(reports) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2));
}

function makeId() {
  return "STR-" + Date.now().toString(36).toUpperCase() + "-" +
         Math.random().toString(36).slice(2, 7).toUpperCase();
}

app.get("/api/reports", (req, res) => {
  const reports = readReports().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(reports);
});

app.get("/api/reports/:id", (req, res) => {
  const report = readReports().find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json(report);
});

app.post("/api/reports", upload.single("photo"), (req, res) => {
  try {
    const { name, email, title, category, description, location, latitude, longitude } = req.body;

    if (!title || !category || !description || !location) {
      return res.status(400).json({ error: "Please fill all required fields." });
    }

    const report = {
      id: makeId(),
      name: name || "Anonymous",
      email: email || "",
      title,
      category,
      description,
      location,
      latitude: latitude || null,
      longitude: longitude || null,
      photo: req.file ? `/uploads/${req.file.filename}` : null,
      status: "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const reports = readReports();
    reports.push(report);
    writeReports(reports);

    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save the report." });
  }
});

app.patch("/api/reports/:id/status", (req, res) => {
  const allowed = ["Pending", "Verified", "In Progress", "Resolved"];
  const { status } = req.body;

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const reports = readReports();
  const report = reports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });

  report.status = status;
  report.updatedAt = new Date().toISOString();
  writeReports(reports);

  res.json(report);
});

app.delete("/api/reports/:id", (req, res) => {
  const reports = readReports();
  const index = reports.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Report not found" });

  const [removed] = reports.splice(index, 1);
  if (removed.photo) {
    const file = path.join(__dirname, "public", removed.photo.replace(/^\//, ""));
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  writeReports(reports);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Smart Traffic Reporter running at http://localhost:${PORT}`);
});