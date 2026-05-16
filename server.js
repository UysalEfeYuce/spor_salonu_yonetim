const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const cors = require("cors");
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = Number(process.env.PORT || 3000);

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "spor_salonu",
  waitForConnections: true,
  connectionLimit: 10,
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

function money(value) {
  return `${Number(value || 0).toLocaleString("tr-TR")} TL`;
}

function trDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function initials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

async function getMemberPayload(memberId) {
  const [[member]] = await pool.query(
    `SELECT u.uyeid AS id, u.ad AS name, u.telno AS phone, ut.baslangictarihi, ut.bitistarihi,
      ap.program_detayi AS programDetail, ap.baslangic_tarihi AS programDate, p.ad AS coach,
      COALESCE(SUM(s.adet * ur.fiyat), 0) AS totalSpending
    FROM uyeler u
    LEFT JOIN uyelik_takibi ut ON ut.uyeid = u.uyeid
    LEFT JOIN antrenman_programi ap ON ap.antrenman_id = (
      SELECT ap2.antrenman_id FROM antrenman_programi ap2
      WHERE ap2.uyeid = u.uyeid
      ORDER BY ap2.baslangic_tarihi DESC, ap2.antrenman_id DESC
      LIMIT 1
    )
    LEFT JOIN personel p ON p.per_id = ap.personelid
    LEFT JOIN satislar s ON s.uyeid = u.uyeid
    LEFT JOIN urunler ur ON ur.urun_id = s.urunid
    WHERE u.uyeid = ?
    GROUP BY u.uyeid, ut.id, ap.antrenman_id, p.per_id
    ORDER BY ut.bitistarihi DESC
    LIMIT 1`,
    [memberId],
  );

  if (!member) return null;

  const [measurements] = await pool.query(
    `SELECT olcum_tarihi AS date, kilo AS weight, boy AS height, yag_orani AS body_fat
    FROM vucut_olculeri
    WHERE uyeid = ?
    ORDER BY olcum_tarihi DESC, olcum_id DESC`,
    [memberId],
  );

  const [purchases] = await pool.query(
    `SELECT s.sat_id AS id, s.satistarihi AS date, ur.urunadi AS product, s.adet AS quantity, (s.adet * ur.fiyat) AS total
    FROM satislar s
    JOIN urunler ur ON ur.urun_id = s.urunid
    WHERE s.uyeid = ?
    ORDER BY s.satistarihi DESC, s.sat_id DESC`,
    [memberId],
  );

  return {
    id: member.id,
    name: member.name,
    initials: initials(member.name),
    member_id: member.id,
    full_name: member.name,
    phone: member.phone,
    registered: trDate(member.baslangictarihi),
    membership_package: "Standart",
    membership_end: trDate(member.bitistarihi),
    program_name: member.programDetail ? "Antrenman Programi" : "-",
    program_detail: member.programDetail || "",
    coach: member.coach || "-",
    total_spending: money(member.totalSpending),
    measurements: measurements.map((row) => ({
      date: trDate(row.date),
      weight: row.weight,
      height: row.height,
      body_fat: row.body_fat,
      note: "",
    })),
    purchases: purchases.map((row) => ({
      id: row.id,
      date: trDate(row.date),
      product: row.product,
      quantity: row.quantity,
      total: row.total,
    })),
  };
}

async function getCoachPayload(coachId) {
  const [[coach]] = await pool.query("SELECT per_id AS id, ad AS name FROM personel WHERE per_id = ?", [coachId]);
  if (!coach) return null;

  const [members] = await pool.query(
    `SELECT DISTINCT u.uyeid AS id, u.ad AS name, u.telno AS phone
    FROM uyeler u
    JOIN antrenman_programi ap ON ap.uyeid = u.uyeid
    WHERE ap.personelid = ?
    ORDER BY u.ad`,
    [coachId],
  );

  const assignedMembers = [];
  for (const member of members) {
    const [programs] = await pool.query(
      `SELECT antrenman_id AS id, program_detayi AS details, baslangic_tarihi AS date
      FROM antrenman_programi
      WHERE uyeid = ? AND personelid = ?
      ORDER BY baslangic_tarihi DESC, antrenman_id DESC`,
      [member.id, coachId],
    );

    const [progress] = await pool.query(
      `SELECT olcum_tarihi AS date, kilo AS weight, boy AS height, yag_orani AS body_fat
      FROM vucut_olculeri
      WHERE uyeid = ?
      ORDER BY olcum_tarihi DESC, olcum_id DESC`,
      [member.id],
    );

    assignedMembers.push({
      id: member.id,
      name: member.name,
      phone: member.phone,
      programs: programs.map((program) => ({
        id: program.id,
        title: "Antrenman Programi",
        details: program.details,
        days: "-",
        date: trDate(program.date),
      })),
      progress: progress.map((row) => ({
        date: trDate(row.date),
        weight: row.weight,
        height: row.height,
        body_fat: row.body_fat,
        note: "",
      })),
    });
  }

  return {
    coach: {
      id: coach.id,
      name: coach.name,
      initials: initials(coach.name),
    },
    assigned_members: assignedMembers,
  };
}

app.get("/api/health", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, database: process.env.MYSQL_DATABASE || "spor_salonu" });
});

app.post("/api/login", async (req, res) => {
  const { role, username } = req.body;

  if (role === "coach") {
    let [[coach]] = await pool.query("SELECT per_id AS id FROM personel WHERE per_id = ? OR ad = ? LIMIT 1", [username, username]);
    if (!coach) {
      [[coach]] = await pool.query("SELECT per_id AS id FROM personel ORDER BY per_id LIMIT 1");
    }
    if (!coach) return res.status(401).json({ message: "Hoca bulunamadi." });
    return res.json(await getCoachPayload(coach.id));
  }

  const normalizedPhone = String(username || "").replace(/\D/g, "");
  const [[member]] = await pool.query(
    "SELECT uyeid AS id FROM uyeler WHERE REPLACE(REPLACE(telno, ' ', ''), '-', '') = ? OR telno = ? LIMIT 1",
    [normalizedPhone, username],
  );
  if (!member) return res.status(401).json({ message: "Uye bulunamadi." });
  res.json(await getMemberPayload(member.id));
});

app.get("/api/members/:id", async (req, res) => {
  const payload = await getMemberPayload(req.params.id);
  if (!payload) return res.status(404).json({ message: "Uye bulunamadi." });
  res.json(payload);
});

app.get("/api/coaches/:id", async (req, res) => {
  const payload = await getCoachPayload(req.params.id);
  if (!payload) return res.status(404).json({ message: "Hoca bulunamadi." });
  res.json(payload);
});

app.get("/api/admin/data", async (req, res) => {
  const [members] = await pool.query("SELECT uyeid AS id, ad AS name, telno AS phone FROM uyeler ORDER BY uyeid DESC");
  const [staff] = await pool.query("SELECT per_id AS id, ad AS name, maas AS salary FROM personel ORDER BY per_id");
  const [products] = await pool.query(
    "SELECT urun_id AS id, urunadi AS name, kategori AS category, fiyat AS price, stokmiktari AS stock FROM urunler ORDER BY urun_id",
  );
  const [[summary]] = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM uyeler) AS memberCount,
      (SELECT COUNT(*) FROM uyelik_takibi WHERE bitistarihi >= NOW()) AS activeMembershipCount,
      (SELECT COUNT(*) FROM personel) AS staffCount,
      (SELECT COUNT(*) FROM urunler WHERE stokmiktari <= 5) AS lowStockCount`,
  );

  res.json({ summary, members, staff, products });
});

app.post("/api/admin/members", async (req, res) => {
  const { name, phone, startDate, endDate } = req.body;
  const [result] = await pool.query("INSERT INTO uyeler (ad, telno) VALUES (?, ?)", [name, phone]);
  await pool.query("INSERT INTO uyelik_takibi (uyeid, baslangictarihi, bitistarihi) VALUES (?, ?, ?)", [
    result.insertId,
    startDate,
    endDate,
  ]);
  res.status(201).json({ ok: true, id: result.insertId });
});

app.post("/api/admin/staff", async (req, res) => {
  const { name, salary } = req.body;
  if (!name) return res.status(400).json({ message: "Personel adi gerekli." });

  const [[existing]] = await pool.query("SELECT per_id AS id FROM personel WHERE ad = ? LIMIT 1", [name]);

  if (existing) {
    await pool.query("UPDATE personel SET maas = ? WHERE per_id = ?", [salary || 0, existing.id]);
    return res.status(200).json({ ok: true, id: existing.id, updated: true });
  }

  const [result] = await pool.query("INSERT INTO personel (ad, maas) VALUES (?, ?)", [name, salary || 0]);
  res.status(201).json({ ok: true, id: result.insertId, updated: false });
});

app.post("/api/admin/products", async (req, res) => {
  const { name, category, price, stock } = req.body;

  const [result] = await pool.query(
    "INSERT INTO urunler (urunadi, kategori, fiyat, stokmiktari) VALUES (?, ?, ?, ?)",
    [name, category, price || 0, stock || 0],
  );

  res.status(201).json({ ok: true, id: result.insertId });
});

app.post("/api/admin/assignments", async (req, res) => {
  const { memberId, staffId, startDate, programDetail } = req.body;
  await pool.query(
    "INSERT INTO antrenman_programi (uyeid, personelid, program_detayi, baslangic_tarihi) VALUES (?, ?, ?, ?)",
    [memberId, staffId, programDetail || "Hoca tarafindan yazilacak", startDate],
  );
  res.status(201).json({ ok: true });
});

app.post("/api/admin/sales", async (req, res) => {
  const { memberId, productId, quantity } = req.body;
  const amount = Math.max(1, Number(quantity) || 1);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [[product]] = await connection.query("SELECT urun_id AS id, stokmiktari FROM urunler WHERE urun_id = ? FOR UPDATE", [
      productId,
    ]);

    if (!product) {
      await connection.rollback();
      return res.status(404).json({ message: "Urun bulunamadi." });
    }

    if (product.stokmiktari < amount) {
      await connection.rollback();
      return res.status(400).json({ message: "Stok yetersiz." });
    }

    await connection.query("INSERT INTO satislar (uyeid, urunid, satistarihi, adet) VALUES (?, ?, NOW(), ?)", [
      memberId,
      productId,
      amount,
    ]);
    await connection.query("UPDATE urunler SET stokmiktari = stokmiktari - ? WHERE urun_id = ?", [amount, productId]);
    await connection.commit();
    res.status(201).json({ ok: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

app.post("/api/purchases", async (req, res) => {
  const { memberId, productId, quantity } = req.body;
  const amount = Math.max(1, Number(quantity) || 1);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [[product]] = await connection.query("SELECT urun_id AS id, stokmiktari FROM urunler WHERE urun_id = ? FOR UPDATE", [
      productId,
    ]);

    if (!product) {
      await connection.rollback();
      return res.status(404).json({ message: "Urun bulunamadi." });
    }

    if (product.stokmiktari < amount) {
      await connection.rollback();
      return res.status(400).json({ message: "Stok yetersiz." });
    }

    await connection.query("INSERT INTO satislar (uyeid, urunid, satistarihi, adet) VALUES (?, ?, NOW(), ?)", [
      memberId,
      productId,
      amount,
    ]);
    await connection.query("UPDATE urunler SET stokmiktari = stokmiktari - ? WHERE urun_id = ?", [amount, productId]);
    await connection.commit();
    res.status(201).json(await getMemberPayload(memberId));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

app.post("/api/programs", async (req, res) => {
  const { coachId, memberId, title, details, date } = req.body;
  const programText = `${title || "Antrenman Programi"}\n${details || "Program detayi girilmedi."}`;

  await pool.query(
    "INSERT INTO antrenman_programi (uyeid, personelid, program_detayi, baslangic_tarihi) VALUES (?, ?, ?, ?)",
    [memberId, coachId, programText, date || new Date()],
  );

  res.status(201).json(await getCoachPayload(coachId));
});

app.post("/api/progress", async (req, res) => {
  const { coachId, memberId, date, weight, height, bodyFat } = req.body;

  await pool.query(
    "INSERT INTO vucut_olculeri (uyeid, kilo, boy, yag_orani, olcum_tarihi) VALUES (?, ?, ?, ?, ?)",
    [memberId, weight || null, height || null, bodyFat || null, date || new Date()],
  );

  res.status(201).json(await getCoachPayload(coachId));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Sunucu veya veritabani hatasi." });
});

app.listen(port, () => {
  console.log(`Backend hazir: http://localhost:${port}`);
});
