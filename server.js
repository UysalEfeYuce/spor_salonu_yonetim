const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const cors = require("cors");
const express = require("express");
const mysql = require("mysql2/promise");
// bcrypt removed: using plain-text passwords to match existing DB

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

let schemaReadyPromise;

async function ensureMemberAIColumns() {
  const [hedefColumns] = await pool.query("SHOW COLUMNS FROM uyeler LIKE 'hedef'");
  if (!hedefColumns.length) {
    await pool.query("ALTER TABLE uyeler ADD COLUMN hedef VARCHAR(60) NOT NULL DEFAULT 'hacim_kazanma'");
  }

  const [stackColumns] = await pool.query("SHOW COLUMNS FROM uyeler LIKE 'supplement_onerisi'");
  if (!stackColumns.length) {
    await pool.query("ALTER TABLE uyeler ADD COLUMN supplement_onerisi TEXT NULL");
  }
}

function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await ensureMemberAIColumns();
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  return schemaReadyPromise;
}

async function getMemberPayload(memberId) {
  await ensureSchema();

  const [[member]] = await pool.query(
    `SELECT u.uyeid AS id, u.ad AS name, u.telno AS phone,
      u.hedef, u.supplement_onerisi, ut.baslangictarihi, ut.bitistarihi,
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
    hedef: member.hedef,
    supplement_onerisi: member.supplement_onerisi || "",
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
  await ensureSchema();

  const [[coach]] = await pool.query("SELECT per_id AS id, ad AS name FROM personel WHERE per_id = ?", [coachId]);
  if (!coach) return null;

  const [members] = await pool.query(
    `SELECT u.uyeid AS id, u.ad AS name, u.telno AS phone, u.hedef
    FROM uyeler u
    WHERE (
      SELECT ap2.personelid FROM antrenman_programi ap2
      WHERE ap2.uyeid = u.uyeid
      ORDER BY ap2.baslangic_tarihi DESC, ap2.antrenman_id DESC
      LIMIT 1
    ) = ?
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
      hedef: member.hedef,
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
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: process.env.MYSQL_DATABASE || "spor_salonu" });
  } catch (error) {
    res.status(503).json({ ok: false, message: "MySQL baglantisi yok.", database: process.env.MYSQL_DATABASE || "spor_salonu" });
  }
});

app.post("/api/login", async (req, res) => {
  const { role, username, password } = req.body;

  if (role === "coach") {
    if (!username || !password) return res.status(400).json({ message: "Hoca girişi için per_id ve şifre gerekli." });

    const id = Number(String(username).trim());
    if (Number.isNaN(id)) return res.status(400).json({ message: "Hoca girişi için numeric per_id giriniz." });

    const [[coach]] = await pool.query(
      "SELECT per_id AS id, ad AS name, sifre FROM personel WHERE per_id = ? LIMIT 1",
      [id],
    );

    if (!coach) return res.status(401).json({ message: "Hoca bulunamadı." });

    const stored = (coach.sifre ?? "").toString().trim();
    if (String(password).trim() !== stored) return res.status(401).json({ message: "Kimlik doğrulama başarısız." });

    return res.json(await getCoachPayload(coach.id));
  }

  const normalizedPhone = String(username || "").replace(/\D/g, "");
  const [[member]] = await pool.query(
    "SELECT uyeid AS id, sifre FROM uyeler WHERE REPLACE(REPLACE(telno, ' ', ''), '-', '') = ? OR telno = ? LIMIT 1",
    [normalizedPhone, username],
  );
  if (!member) return res.status(401).json({ message: "Üye bulunamadı." });
  if (String(password || "").trim() !== String(member.sifre || "").trim()) {
    return res.status(401).json({ message: "Üye şifresi hatalı." });
  }
  res.json(await getMemberPayload(member.id));
});

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Admin kullanıcı adı ve şifre gerekli." });
  }

  const [[admin]] = await pool.query(
    "SELECT admin_id AS id, kullanici_adi AS username, sifre FROM adminler WHERE kullanici_adi = ? LIMIT 1",
    [String(username).trim()],
  );

  if (!admin) return res.status(401).json({ message: "Admin bulunamadı." });

  if (String(password).trim() !== String(admin.sifre || "").trim()) {
    return res.status(401).json({ message: "Admin şifresi hatalı." });
  }

  res.json({ ok: true, admin: { id: admin.id, username: admin.username } });
});

app.get("/api/members/:id", async (req, res) => {
  const payload = await getMemberPayload(req.params.id);
  if (!payload) return res.status(404).json({ message: "Üye bulunamadı." });
  res.json(payload);
});

app.get("/api/coaches/:id", async (req, res) => {
  const payload = await getCoachPayload(req.params.id);
  if (!payload) return res.status(404).json({ message: "Hoca bulunamadı." });
  res.json(payload);
});

app.get("/api/admin/data", async (req, res) => {
  await ensureSchema();

  const [members] = await pool.query(
    `SELECT u.uyeid AS id, u.ad AS name, u.telno AS phone, u.hedef,
      (
        SELECT p.ad FROM antrenman_programi ap
        JOIN personel p ON p.per_id = ap.personelid
        WHERE ap.uyeid = u.uyeid
        ORDER BY ap.baslangic_tarihi DESC, ap.antrenman_id DESC
        LIMIT 1
      ) AS coach
    FROM uyeler u
    ORDER BY u.uyeid DESC`
  );
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
  await ensureSchema();

  const { name, phone, password, startDate, endDate, staffId, goal } = req.body;
  if (!password) return res.status(400).json({ message: "Üye şifresi gerekli." });
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.query("INSERT INTO uyeler (ad, telno, sifre, hedef) VALUES (?, ?, ?, ?)", [
      name,
      phone,
      String(password),
      goal || "hacim_kazanma",
    ]);
    await connection.query(
      "INSERT INTO uyelik_takibi (uyeid, baslangictarihi, bitistarihi) VALUES (?, ?, ?)",
      [result.insertId, startDate, endDate],
    );

    if (staffId) {
      await connection.query(
        "INSERT INTO antrenman_programi (uyeid, personelid, program_detayi, baslangic_tarihi) VALUES (?, ?, ?, ?)",
        [result.insertId, staffId, null, startDate],
      );
    }

    await connection.commit();
    res.status(201).json({ ok: true, id: result.insertId });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

app.post("/api/admin/staff", async (req, res) => {
  const { name, salary, password } = req.body;
  if (!name) return res.status(400).json({ message: "Personel adı gerekli." });

  const [[existing]] = await pool.query("SELECT per_id AS id, sifre FROM personel WHERE ad = ? LIMIT 1", [name]);

  if (existing) {
    if (password) {
      await pool.query("UPDATE personel SET maas = ?, sifre = ? WHERE per_id = ?", [salary || 0, String(password), existing.id]);
      return res.status(200).json({ ok: true, id: existing.id, updated: true });
    }

    await pool.query("UPDATE personel SET maas = ? WHERE per_id = ?", [salary || 0, existing.id]);
    return res.status(200).json({ ok: true, id: existing.id, updated: true });
  }

  const pwd = password ? String(password) : null;
  const [result] = await pool.query("INSERT INTO personel (ad, maas, sifre) VALUES (?, ?, ?)", [name, salary || 0, pwd]);
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

app.put("/api/admin/products/:id/stock", async (req, res) => {
  const { amount } = req.body;
  const stockAmount = Number(amount);

  if (!Number.isInteger(stockAmount) || stockAmount <= 0) {
    return res.status(400).json({ message: "Eklenecek stok adedi 1 veya daha büyük tam sayı olmalı." });
  }

  const [result] = await pool.query("UPDATE urunler SET stokmiktari = stokmiktari + ? WHERE urun_id = ?", [
    stockAmount,
    req.params.id,
  ]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Ürün bulunamadı." });
  }

  res.json({ ok: true });
});

app.post("/api/admin/assignments", async (req, res) => {
  const { memberId, staffId, startDate, programDetail } = req.body;
  if (!memberId || !staffId) return res.status(400).json({ message: "memberId ve staffId gerekli." });

  const [[last]] = await pool.query(
    `SELECT personelid, program_detayi FROM antrenman_programi WHERE uyeid = ? ORDER BY baslangic_tarihi DESC, antrenman_id DESC LIMIT 1`,
    [memberId],
  );

  if (last && Number(last.personelid) === Number(staffId)) {
    return res.status(200).json({ ok: true, message: "Aynı hoca zaten atanmış." });
  }

  const detailToUse = programDetail != null && programDetail !== "" ? programDetail : last ? last.program_detayi : null;

  await pool.query(
    "INSERT INTO antrenman_programi (uyeid, personelid, program_detayi, baslangic_tarihi) VALUES (?, ?, ?, ?)",
    [memberId, staffId, detailToUse, startDate || new Date()],
  );

  res.status(201).json({ ok: true });
});

app.delete("/api/admin/members/:id", async (req, res) => {
  const memberId = req.params.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM satislar WHERE uyeid = ?", [memberId]);
    await connection.query("DELETE FROM vucut_olculeri WHERE uyeid = ?", [memberId]);
    await connection.query("DELETE FROM antrenman_programi WHERE uyeid = ?", [memberId]);
    await connection.query("DELETE FROM uyelik_takibi WHERE uyeid = ?", [memberId]);
    await connection.query("DELETE FROM uyeler WHERE uyeid = ?", [memberId]);
    await connection.commit();
    res.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

app.put("/api/admin/members/:id/coach", async (req, res) => {
  const memberId = req.params.id;
  const { staffId } = req.body;
  if (!staffId) return res.status(400).json({ message: "staffId gerekli." });
  const [[last]] = await pool.query(
    `SELECT personelid, program_detayi FROM antrenman_programi WHERE uyeid = ? ORDER BY baslangic_tarihi DESC, antrenman_id DESC LIMIT 1`,
    [memberId],
  );

  if (last && Number(last.personelid) === Number(staffId)) {
    return res.status(200).json({ ok: true, message: "Aynı hoca zaten atanmış." });
  }

  const detailToUse = last ? last.program_detayi : null;

  await pool.query(
    "INSERT INTO antrenman_programi (uyeid, personelid, program_detayi, baslangic_tarihi) VALUES (?, ?, ?, NOW())",
    [memberId, staffId, detailToUse],
  );

  res.json({ ok: true });
});

app.delete("/api/admin/staff/:id", async (req, res) => {
  const staffId = req.params.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    // Delete programs assigned to this staff before deleting the staff record
    await connection.query("DELETE FROM antrenman_programi WHERE personelid = ?", [staffId]);
    await connection.query("DELETE FROM personel WHERE per_id = ?", [staffId]);
    await connection.commit();
    res.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
      return res.status(404).json({ message: "Ürün bulunamadı." });
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
      return res.status(404).json({ message: "Ürün bulunamadı." });
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

function generateFallbackStack(name, goal, weight, height, bodyFat) {
  let goalText = "Hacim Kazanma / Bulk";
  if (goal === "kilo_verme") goalText = "Kilo Verme / Yağ Yakımı";
  if (goal === "dayaniklilik") goalText = "Dayanıklılık / Performans";

  let statsInfo = "";
  if (weight && height) {
    statsInfo = `- **Vücut Bilgileri:** ${weight} kg, ${height} cm${bodyFat ? `, %${bodyFat} Yağ Oranı` : ""}\n`;
  }

  let recommendationContent = "";
  if (goal === "kilo_verme") {
    const targetProtein = weight ? Math.round(weight * 1.5) : 100;
    const fatBurnerOption = `- **Termojenik Yağ Yakıcı / Kafein:** Antrenmandan 30 dk önce 1 porsiyon (enerji artışı ve yağ yakımını hızlandırmak için).`;

    recommendationContent = `
### 1. Önerilen Supplementler ve Seçim Nedenleri

*   **Whey Protein Tozu (İzole):** Kalori açığı oluştururken kas kütlenizi korumak için gereklidir. Günlük protein ihtiyacınızı karşılamaya yardımcı olur.
    *   *Kişisel Doz Hedefi:* Sizin için günlük yaklaşık **${targetProtein}g** protein tüketimi hedeflenmelidir.
*   **BCAA (2:1:1):** Antrenman sırasında kas yıkımını (katabolizma) önlemek ve toparlanmayı hızlandırmak amacıyla kullanılır.
${fatBurnerOption}
*   **CLA (Konjuge Linoleik Asit):** Öğünlerle birlikte günde 3 defa 1'er kapsül. Bölgesel yağ depolanmasını azaltmaya yardımcı olur.
*   **Omega-3 Yağ Asitleri:** Faydalı yağ desteği ve metabolizma aktivasyonu için günde 2 kapsül.

### 2. Günlük Kullanım Zamanlaması ve Dozaj Tablosu

| Zaman dilimi | Supplement | Miktar / Doz | Amacı |
| :--- | :--- | :--- | :--- |
| **Sabah (Aç Karnına)** | CLA | 1 Kapsül | Yağ Yakımını Tetikleme |
| **Öğle Yemeği ile** | CLA | 1 Kapsül | Yağ Depolanmasını Engelleme |
| **Antrenmandan 30 Dk Önce** | Yağ Yakıcı / Kafein | 1 Servis | Enerji & Termojenez |
| **Antrenman Sırasında** | BCAA | 1 Ölçek (Suya Karışık) | Kas Koruması |
| **Antrenman Hemen Sonrası** | Whey Protein (İzole) | 1 Ölçek (300ml Su) | Hızlı Toparlanma & Kas Besleme |
| **Akşam Yemeği ile** | CLA | 1 Kapsül | Gece Yağ Asidi Oksidasyonu |

### 3. Kullanım Güvenliği Uyarıları

*   Supplement kullanımında aşırıya kaçmamalı ve vücudunuzu dinlemelisiniz.
*   **Hidrasyon:** L-Karnitin ve termojeniklerin etkili çalışması ve böbrek sağlığınız için günde en az **3.5 litre su** tüketmeye özen gösterin.
*   **Beslenme Dengesi:** Supplementler birer takviyedir; hedefinize ulaşmak için protein ağırlıklı kalori açığı diyetinizi sürdürmelisiniz.
`;
  } else if (goal === "dayaniklilik") {
    recommendationContent = `
### 1. Önerilen Supplementler ve Seçim Nedenleri

*   **Beta-Alanin:** Kaslardaki laktik asit birikimini geciktirerek yüksek yoğunluklu antrenmanlarda dayanıklılığınızı artırır. İlk kullanımlarda hafif karıncalanma hissi yapabilir, tamamen zararsızdır.
*   **Elektrolit Kompleksi:** Uzun süren antrenmanlarda terle kaybedilen sodyum, potasyum ve magnezyumu yerine koyarak krampları önler.
*   **Kreatin Monohidrat:** ATP (hücresel enerji) depolarını yeniler. Hız, güç ve kısa süreli dayanıklılık patlamaları için kritik rol oynar.
*   **Whey Protein:** Kas liflerinin antrenman sonrası mikro yırtıklarını onarmak ve toparlanma (recovery) süresini en aza indirmek için gereklidir.
*   **Magnezyum & Çinko (ZMA):** Gece yatmadan önce derin uyku fazını artırarak kas dinlenmesini maksimuma çıkarır.

### 2. Günlük Kullanım Zamanlaması ve Dozaj Tablosu

| Zaman dilimi | Supplement | Miktar / Doz | Amacı |
| :--- | :--- | :--- | :--- |
| **Sabah Kahvaltısı Sonrası** | Kreatin Monohidrat | 3-5 gram (Her gün) | Hücresel ATP Seviyelerini Yüksek Tutma |
| **Antrenmandan 30 Dk Önce** | Beta-Alanin | 3.2 gram | Laktik Acit Tamponlama |
| **Antrenman Sırasında** | Elektrolit Tozu | 1 Servis (Suya Karışık) | Mineral Dengesi & Kramp Önleme |
| **Antrenman Hemen Sonrası** | Whey Protein + Karbonhidrat | 1 Ölçek Protein + 30g Karb | Glikojen Depolarını Yenileme & Onarım |
| **Gece Yatmadan Önce** | Magnezyum (ZMA) | 1 Servis | Kaliteli Uyku & Kas Gevşemesi |

### 3. Kullanım Güvenliği Uyarıları

*   Yoğun dayanıklılık antrenmanlarında kalbinizi aşırı zorlamamaya dikkat edin.
*   **Sıvı Tüketimi:** Kreatin ve elektrolitlerin hücre içine su çekmesi sebebiyle günlük su tüketiminizi en az **4 litreye** çıkarın.
*   **Beslenme Esası:** Dayanıklılık sporcuları için karbonhidrat depoları (glikojen) birincil yakıttır. Yeterli kompleks karbonhidrat tükettiğinizden emin olun.
`;
  } else {
    const targetProtein = weight ? Math.round(weight * 2.0) : 140;
    recommendationContent = `
### 1. Önerilen Supplementler ve Seçim Nedenleri

*   **Kreatin Monohidrat:** Hücre içi su tutumunu artırarak kasların daha hacimli durmasını sağlar ve patlayıcı gücü yükseltir. Kas kütlesi inşasında en çok araştırılmış ve kanıtlanmış takviyedir.
*   **Whey Protein:** Antrenman sonrası kas sentezini tetiklemek için mükemmel bir hızlı sindirilen protein kaynağıdır.
    *   *Kişisel Doz Hedefi:* Hacim kazanımı sürecinde günde kilo başına 2g protein hedefiyle yaklaşık **${targetProtein}g** protein tüketmelisiniz.
*   **Karbonhidrat Tozu (Gainer) / Yulaf Unu:** Kalori fazlası oluşturmakta zorlanıyorsanız, günlük kalori ihtiyacınızı sıvı formda temiz karbonhidratlarla tamamlar.
*   **BCAA (2:1:1) veya EAA:** Protein sentezini (mTOR yolunu) maksimize etmek için antrenman öncesi veya esnasında tüketilmesi önerilir.
*   **Omega-3 & Multivitamin:** Hücre gelişimi, hormon üretimi (özellikle testosteron desteği) ve ağır antrenmanlar sonrası inflamasyonu azaltmak için sabahları 1'er adet.

### 2. Günlük Kullanım Zamanlaması ve Dozaj Tablosu

| Zaman dilimi | Supplement | Miktar / Doz | Amacı |
| :--- | :--- | :--- | :--- |
| **Sabah Kahvaltısı Sonrası** | Multivitamin & Omega-3 | 1'er Kapsül | Yağ Dengesi & Genel Hücresel Destek |
| **Öğün Aralarında** | Gainer (Karbonhidrat Tozu) | 1 Servis (Yarım Ölçek) | Ekstra Kalori Surplus Sağlama |
| **Antrenmandan 30 Dk Önce** | BCAA / Pre-Workout | 1 Servis | Enerji & Kas Pompalama (Pump) |
| **Antrenman Hemen Sonrası** | Whey Protein + Kreatin | 1 Ölçek Protein + 5g Kreatin | Hızlı İnsülin Tepkisi & Hücre Yenilenmesi |
| **Gece Yatmadan Önce** | Kazein (Yavaş Salınımlı) | 1 Ölçek (veya Süt/Yoğurt) | Gece Boyunca Kas Besleme |

### 3. Kullanım Güvenliği Uyarıları

*   Hacim kazanma sürecindeki yüksek ağırlık egzersizlerinde doğru form kullanmaya özen gösterin.
*   **Böbrek ve Karaciğer Sağlığı:** Protein ve kreatin süzülmesini kolaylaştırmak amacıyla günde en az **3.5 - 4 litre su** içmelisiniz.
*   **Beslenme Esası:** Supplementler sadece takviyedir. Kalori fazlası (kalori surplus) oluşturacak şekilde günde 4-5 öğün temiz beslenmeye devam etmelisiniz.
`;
  }

  return `## 🌟 ${name} İçin Yapay Zeka Supplement Önerisi
> **Hedef:** ${goalText}
${statsInfo}
---
${recommendationContent}
*(Not: Bu tavsiyeler yapay zeka destekli bir simülasyon/analiz sonucudur. Herhangi bir supplement kullanmadan önce hekiminize danışmanız tavsiye edilir.)*`;
}

app.put("/api/members/:id/goal", async (req, res) => {
  const memberId = req.params.id;
  const { hedef } = req.body;

  if (!hedef) {
    return res.status(400).json({ message: "Hedef alanı boş olamaz." });
  }

  const validGoals = ["kilo_verme", "hacim_kazanma", "dayaniklilik"];
  if (!validGoals.includes(hedef)) {
    return res.status(400).json({ message: "Geçersiz hedef değeri." });
  }

  try {
    await pool.query("UPDATE uyeler SET hedef = ? WHERE uyeid = ?", [hedef, memberId]);
    res.json({ ok: true });
  } catch (error) {
    console.error("Hedef güncellenirken hata oluştu:", error);
    res.status(500).json({ message: "Hedef güncellenemedi." });
  }
});

app.post("/api/members/:id/generate-stack", async (req, res) => {
  const memberId = req.params.id;

  try {
    const [[member]] = await pool.query(
      "SELECT ad, hedef FROM uyeler WHERE uyeid = ?",
      [memberId]
    );

    if (!member) {
      return res.status(404).json({ message: "Üye bulunamadı." });
    }

    const [[measurement]] = await pool.query(
      "SELECT kilo, boy, yag_orani FROM vucut_olculeri WHERE uyeid = ? ORDER BY olcum_tarihi DESC, olcum_id DESC LIMIT 1",
      [memberId]
    );

    const weight = measurement ? measurement.kilo : null;
    const height = measurement ? measurement.boy : null;
    const bodyFat = measurement ? measurement.yag_orani : null;

    const apiKey = process.env.GEMINI_API_KEY;
    let generatedMarkdown = "";

    if (apiKey) {
      try {
        const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        let goalInTurkish = "Hacim Kazanma / Bulk";
        if (member.hedef === "kilo_verme") goalInTurkish = "Kilo Verme / Yağ Yakımı";
        if (member.hedef === "dayaniklilik") goalInTurkish = "Dayanıklılık / Performans";

        const prompt = `Sen profesyonel bir spor hekimi, beslenme uzmanı ve supplement danışmanısın.
Üyemizin bilgileri şöyledir:
- Ad Soyad: ${member.ad}
- Spor Hedefi: ${goalInTurkish}
- Son Vücut Ölçüleri: Kilo ${weight || "Bilinmiyor"} kg, Boy ${height || "Bilinmiyor"} cm, Yağ Oranı %${bodyFat || "Bilinmiyor"}

Lütfen bu üye için tamamen kişiselleştirilmiş, bilimsel araştırmalara dayalı, hedefine uygun bir Supplement Önerisi ve Detaylı Kullanım Rehberi oluştur.
Rehber şu bölümleri içermelidir:
1. Önerilen Supplementler ve Seçim Nedenleri: Hangi supplementler, neden seçildi ve üyenin vücut ölçülerine göre ne işe yarayacak?
2. Günlük/Haftalık Kullanım Zamanlaması ve Dozaj Tablosu: (Kahvaltı sonrası, antrenman öncesi, antrenman sonrası vb. zamanlar ve miktarlar belirtilerek net bir tablo veya liste şeklinde planla).
3. Kullanım Güvenliği Uyarıları: Supplement kullanımında genel olarak nelere dikkat edilmeli?
4. Hidrasyon ve Beslenme Tavsiyeleri: Bu önerinin etkisini artıracak su tüketimi ve beslenme ipuçları.

Lütfen yanıtı markdown formatında ver. Yanıt motive edici, profesyonel, anlaşılır ve tamamen Türkçe olsun. En başta üye adına özel bir tebrik/giriş cümlesi kur.`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedMarkdown = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        } else {
          console.warn("Gemini API call failed, status code:", response.status);
        }
      } catch (err) {
        console.error("Gemini API call error, falling back to local recommendation generator:", err);
      }
    }

    if (!generatedMarkdown) {
      generatedMarkdown = generateFallbackStack(
        member.ad,
        member.hedef,
        weight,
        height,
        bodyFat
      );
    }

    await pool.query("UPDATE uyeler SET supplement_onerisi = ? WHERE uyeid = ?", [generatedMarkdown, memberId]);

    res.json(await getMemberPayload(memberId));
  } catch (error) {
    console.error("Supplement önerisi üretilirken hata:", error);
    res.status(500).json({ message: "Supplement önerisi oluşturulurken bir hata oluştu." });
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Sunucu veya veritabani hatasi." });
});

app.listen(port, () => {
  console.log(`Backend hazir: http://localhost:${port}`);
});
