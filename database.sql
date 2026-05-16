CREATE DATABASE IF NOT EXISTS spor_salonu CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci;
USE spor_salonu;

CREATE TABLE IF NOT EXISTS uyeler (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  telno VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS personel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  maas DECIMAL(10, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS urunler (
  id INT AUTO_INCREMENT PRIMARY KEY,
  urunadi VARCHAR(100) NOT NULL,
  kategori VARCHAR(60) NOT NULL,
  fiyat DECIMAL(10, 2) NOT NULL,
  stokmiktari INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS satislar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uyeid INT NOT NULL,
  urunid INT NOT NULL,
  satistarihi DATETIME NOT NULL,
  adet INT NOT NULL
);

CREATE TABLE IF NOT EXISTS uyelik_takibi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uyeid INT NOT NULL,
  baslangictarihi DATETIME NOT NULL,
  bitistarihi DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS antrenman_programi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uyeid INT NOT NULL,
  personelid INT NOT NULL,
  program_detayi TEXT NOT NULL,
  baslangic_tarihi DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS vucut_olculeri (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uyeid INT NOT NULL,
  kilo DECIMAL(5, 2),
  boy INT,
  yag_orani DECIMAL(5, 2),
  olcum_tarihi DATETIME NOT NULL
);

INSERT IGNORE INTO uyeler (id, ad, telno)
VALUES
  (1, 'Gurkan Isik', '05551112233'),
  (2, 'Uysal Efe Yuce', '05442223344'),
  (3, 'Ayse Kaya', '05329998877');

INSERT IGNORE INTO personel (id, ad, maas)
VALUES
  (1, 'Burak Koc', 30000),
  (2, 'Selin Arslan', 28000);

INSERT IGNORE INTO urunler (id, urunadi, kategori, fiyat, stokmiktari)
VALUES
  (1, 'Whey Protein', 'Protein', 1500, 10),
  (2, 'Kreatin', 'Supplement', 650, 20),
  (3, 'Shaker', 'Aksesuar', 180, 50);

INSERT INTO uyelik_takibi (uyeid, baslangictarihi, bitistarihi)
SELECT 2, '2026-02-10 00:00:00', '2026-05-10 00:00:00'
WHERE NOT EXISTS (SELECT 1 FROM uyelik_takibi WHERE uyeid = 2);

INSERT INTO antrenman_programi (uyeid, personelid, program_detayi, baslangic_tarihi)
SELECT 2, 1, '4 Gun Hipertrofi: Pazartesi gogus ve omuz, carsamba sirt ve biceps, cuma bacak.', '2026-05-05'
WHERE NOT EXISTS (SELECT 1 FROM antrenman_programi WHERE uyeid = 2);
