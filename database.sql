CREATE DATABASE IF NOT EXISTS spor_salonu CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci;
USE spor_salonu;

-- Tabloların çakışmaması için eğer varsa önceden kalanları temizliyoruz
DROP TABLE IF EXISTS vucut_olculeri;
DROP TABLE IF EXISTS antrenman_programi;
DROP TABLE IF EXISTS uyelik_takibi;
DROP TABLE IF EXISTS satislar;
DROP TABLE IF EXISTS urunler;
DROP TABLE IF EXISTS adminler;
DROP TABLE IF EXISTS personel;
DROP TABLE IF EXISTS uyeler;

-- 1. UYELER TABLOSU (Sütun adı 'uyeid' olarak senkronize edildi)
CREATE TABLE IF NOT EXISTS uyeler (
  uyeid INT AUTO_INCREMENT PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  telno VARCHAR(30) NOT NULL UNIQUE, -- Giriş alanı olduğu için UNIQUE yaptık
  sifre VARCHAR(255) NOT NULL,       -- Hash'lenmiş şifre için (En az 255 karakter)
  saglik_durumu VARCHAR(60) NOT NULL DEFAULT 'yok',
  saglik_notu TEXT NULL
);

-- 2. PERSONEL TABLOSU (Sütun adı 'per_id' olarak senkronize edildi)
CREATE TABLE IF NOT EXISTS personel (
  per_id INT AUTO_INCREMENT PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  maas DECIMAL(10, 2) NOT NULL,
  sifre VARCHAR(255) NOT NULL        -- Hash'lenmiş şifre için (En az 255 karakter)
);

-- 3. URUNLER TABLOSU (Sütun adı 'urun_id' olarak senkronize edildi)
CREATE TABLE IF NOT EXISTS adminler (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  kullanici_adi VARCHAR(50) NOT NULL UNIQUE,
  sifre VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS urunler (
  urun_id INT AUTO_INCREMENT PRIMARY KEY,
  urunadi VARCHAR(100) NOT NULL,
  kategori VARCHAR(60) NOT NULL,
  fiyat DECIMAL(10, 2) NOT NULL,
  stokmiktari INT NOT NULL DEFAULT 0
);

-- 4. SATISLAR TABLOSU
CREATE TABLE IF NOT EXISTS satislar (
  sat_id INT AUTO_INCREMENT PRIMARY KEY,
  uyeid INT NOT NULL,
  urunid INT NOT NULL,
  satistarihi DATETIME NOT NULL,
  adet INT NOT NULL,
  FOREIGN KEY (uyeid) REFERENCES uyeler(uyeid),
  FOREIGN KEY (urunid) REFERENCES urunler(urun_id)
);

-- 5. UYELIK TAKIBI TABLOSU
CREATE TABLE IF NOT EXISTS uyelik_takibi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uyeid INT NOT NULL,
  baslangictarihi DATETIME NOT NULL,
  bitistarihi DATETIME NOT NULL,
  FOREIGN KEY (uyeid) REFERENCES uyeler(uyeid)
);

-- 6. ANTRENMAN PROGRAMI TABLOSU (INSERT sorgusundaki eksik sütunlar buraya eklendi)
CREATE TABLE IF NOT EXISTS antrenman_programi (
  antrenman_id INT AUTO_INCREMENT PRIMARY KEY,
  uyeid INT NOT NULL,
  personelid INT NOT NULL,
  program_detayi TEXT NOT NULL,
  baslangic_tarihi DATE NOT NULL,
  FOREIGN KEY (uyeid) REFERENCES uyeler(uyeid),
  FOREIGN KEY (personelid) REFERENCES personel(per_id)
);

-- 7. VUCUT OLCULERI TABLOSU
CREATE TABLE IF NOT EXISTS vucut_olculeri (
  olcum_id INT AUTO_INCREMENT PRIMARY KEY,
  uyeid INT NOT NULL,
  kilo DECIMAL(5, 2),
  boy INT,
  yag_orani DECIMAL(5, 2),
  olcum_tarihi DATETIME NOT NULL,
  FOREIGN KEY (uyeid) REFERENCES uyeler(uyeid)
);

-- ==========================================
-- VERİ EKLEME (SEED DATA) BÖLÜMÜ
-- ==========================================

-- Tablo şemasına uygun sütun isimleriyle veri ekleme:
INSERT IGNORE INTO uyeler (uyeid, ad, telno, sifre, saglik_durumu, saglik_notu)
VALUES
  (1, 'Gurkan Isik', '05551112233', '1234', 'yok', NULL),
  (2, 'Uysal Efe Yuce', '05442223344', '1234', 'diz', 'Sag dizde eski sakatlik var. Agir bacak hareketlerinde dikkat edilmeli.'),
  (3, 'Ayse Kaya', '05329998877', '1234', 'bel', 'Bel rahatsizligi nedeniyle deadlift kontrollu uygulanmali.');

INSERT IGNORE INTO personel (per_id, ad, maas)
VALUES
  (1, 'Burak Koc', 30000),
  (2, 'Selin Arslan', 28000);

INSERT IGNORE INTO adminler (admin_id, kullanici_adi, sifre)
VALUES
  (1, 'admin', '1234');

INSERT IGNORE INTO urunler (urun_id, urunadi, kategori, fiyat, stokmiktari)
VALUES
  (1, 'Whey Protein', 'Protein', 1500, 10),
  (2, 'Kreatin', 'Supplement', 650, 20),
  (3, 'Shaker', 'Aksesuar', 180, 50);

INSERT INTO uyelik_takibi (uyeid, baslangictarihi, bitistarihi)
SELECT 2, '2026-02-10 00:00:00', '2026-05-10 00:00:00'
WHERE NOT EXISTS (SELECT 1 FROM uyelik_takibi WHERE uyeid = 2);

-- Tablo şeması genişletildiği için bu sorgu artık hatasız çalışacaktır:
INSERT INTO antrenman_programi (uyeid, personelid, program_detayi, baslangic_tarihi)
SELECT 2, 1, '4 Gun Hipertrofi: Pazartesi gogus ve omuz, carsamba sirt ve biceps, cuma bacak.', '2026-05-05'
WHERE NOT EXISTS (SELECT 1 FROM antrenman_programi WHERE uyeid = 2);
