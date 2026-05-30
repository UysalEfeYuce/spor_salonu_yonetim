# Spor Salonu Yönetim Sistemi

Bu proje, bir spor salonunun temel yönetim işlemlerini web üzerinden takip etmek için hazırlanmış bir veritabanı projesidir. Sistem üç kullanıcı rolü üzerine kuruludur:

- Admin
- Hoca
- Üye

Admin üye kaydı, hoca/personel kaydı, hoca atama, ürün/stok yönetimi ve satış işlemlerini yapar. Hoca kendisine atanmış üyeler için program ve gelişim ölçümü ekler. Üye kendi üyelik, program, ölçüm ve alışveriş bilgilerini görüntüler.

## Kullanılan Teknolojiler

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Veritabanı: MySQL
- MySQL bağlantısı: mysql2/promise
- Ortam değişkenleri: dotenv

Projede React, Angular gibi bir frontend framework kullanılmamıştır. Amaç, veritabanı ve backend bağlantısını daha anlaşılır göstermek olduğu için sade JavaScript tercih edilmiştir.

## Proje Nasıl Çalışır?

Proje üç katmandan oluşur:

```text
Tarayıcı
  |-- index.html + app.js    -> Üye ve hoca paneli
  |-- admin.html + admin.js  -> Admin paneli
             |
             v
Express Backend
  |-- server.js
             |
             v
MySQL Veritabanı
  |-- spor_salonu
```

Tarayıcıdaki formlar JavaScript ile backend API'lerine istek gönderir. Backend bu istekleri alır, MySQL sorgularını çalıştırır ve sonucu JSON olarak frontend'e döndürür.

## Klasör ve Dosya Yapısı

```text
veritabaniproje/
|-- index.html        # Ana ekran, üye paneli ve hoca paneli
|-- admin.html        # Admin yönetim paneli
|-- styles.css        # Ortak tasarım dosyası
|-- app.js            # Üye ve hoca paneli işlemleri
|-- admin.js          # Admin paneli işlemleri
|-- server.js         # Express backend ve API endpointleri
|-- database.sql      # MySQL tablo oluşturma ve örnek veri scripti
|-- setup-db.js       # database.sql dosyasını MySQL'e kurar
|-- package.json      # Node.js paketleri ve komutları
|-- .env              # Veritabanı bağlantı ayarları
|-- baslat.bat        # Projeyi başlatmak için yardımcı dosya
```

## Kurulum

1. MySQL'in çalıştığından emin ol.

2. `.env` dosyasındaki bilgileri kontrol et:

```env
PORT=3000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=spor_salonu
```

3. Paketleri yükle:

```bash
npm install
```

4. Veritabanını kur:

```bash
npm run setup-db
```

5. Backend'i başlat:

```bash
npm start
```

6. Siteyi aç:

```text
http://localhost:3000/index.html
```

## Giriş Bilgileri

Admin:

```text
Kullanıcı adı: admin
Şifre: 1234
```

Örnek üye:

```text
Telefon: 05442223344
Şifre: 1234
```

Örnek hoca:

```text
Hoca ID: 1
Şifre: personel tablosundaki sifre değeri
```

Not: Hoca eklerken admin panelindeki personel formundan şifre verilebilir.

## Ana Ekran Akışı

`index.html` açıldığında kullanıcı rol seçimi yapar:

- Üye
- Hoca
- Admin

Üye ve hoca aynı giriş penceresinden giriş yapar. Admin de aynı rol seçim penceresinden giriş yapar; başarılı girişten sonra `admin.html` paneline yönlendirilir.

Üye ve hoca panelinde çıkış butonu üst menüdedir. Çıkış yapınca kullanıcı doğrudan ana sayfaya döner.

## Veritabanı Tabloları

### adminler

Admin giriş bilgilerini tutar.

Alanlar:

- `admin_id`
- `kullanici_adi`
- `sifre`

### uyeler

Spor salonu üyelerini tutar.

Alanlar:

- `uyeid`
- `ad`
- `telno`
- `sifre`

Üye girişinde telefon numarası ve şifre kontrol edilir.

### personel

Hocaları/personeli tutar.

Alanlar:

- `per_id`
- `ad`
- `maas`
- `sifre`

Hoca girişinde `per_id` ve `sifre` kullanılır.

### urunler

Satılan ürünleri ve stok bilgisini tutar.

Alanlar:

- `urun_id`
- `urunadi`
- `kategori`
- `fiyat`
- `stokmiktari`

Stok durumu ekranda şöyle gösterilir:

- Stok `0` ise: `Bitti`
- Stok `1-5` arası ise: `Azaldı`
- Stok `6+` ise: `Yeterli`

### satislar

Üyelere yapılan ürün satışlarını tutar.

Alanlar:

- `sat_id`
- `uyeid`
- `urunid`
- `satistarihi`
- `adet`

Satış yapılınca ürün stoğu satılan adet kadar azalır.

### uyelik_takibi

Üyelik başlangıç ve bitiş tarihlerini tutar.

Alanlar:

- `id`
- `uyeid`
- `baslangictarihi`
- `bitistarihi`

Üye panelindeki kalan gün bilgisi bu tablodan gelir.

### antrenman_programi

Üyeye atanan hocayı ve program detayını tutar.

Alanlar:

- `antrenman_id`
- `uyeid`
- `personelid`
- `program_detayi`
- `baslangic_tarihi`

Hoca panelinden program yazıldığında bu tabloya kayıt eklenir.

### vucut_olculeri

Üyenin gelişim ölçümlerini tutar.

Alanlar:

- `olcum_id`
- `uyeid`
- `kilo`
- `boy`
- `yag_orani`
- `olcum_tarihi`

Hoca panelinden ölçüm eklenebilir. Üye panelinde bu ölçümler görüntülenir.

## Tablo İlişkileri

```text
uyelik_takibi.uyeid          -> uyeler.uyeid
antrenman_programi.uyeid     -> uyeler.uyeid
antrenman_programi.personelid -> personel.per_id
vucut_olculeri.uyeid         -> uyeler.uyeid
satislar.uyeid               -> uyeler.uyeid
satislar.urunid              -> urunler.urun_id
```

Bu ilişkiler sayesinde satışın hangi üyeye ve ürüne ait olduğu, programın hangi üye ve hocaya ait olduğu takip edilir.

## Backend Dosyası: server.js

`server.js` projenin backend merkezidir.

Yaptığı işler:

- Express uygulamasını başlatır.
- MySQL bağlantı havuzu oluşturur.
- Statik dosyaları servis eder.
- API endpointlerini tanımlar.
- Veritabanı sorgularını çalıştırır.
- Hata durumunda JSON cevap döndürür.

Bağlantı kısmı:

```js
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "spor_salonu",
  waitForConnections: true,
  connectionLimit: 10,
});
```

Burada `.env` dosyasındaki MySQL bilgileri okunur.

## API Endpointleri

### Genel

```text
GET /api/health
```

Backend ve veritabanı bağlantısını kontrol eder.

### Giriş

```text
POST /api/login
```

Üye ve hoca girişini yapar.

Üye için:

- Telefon
- Şifre

Hoca için:

- Hoca ID (`per_id`)
- Şifre

```text
POST /api/admin/login
```

Admin kullanıcı adı ve şifre kontrolü yapar.

### Üye ve Hoca Bilgileri

```text
GET /api/members/:id
```

Bir üyenin üyelik, program, ölçüm ve alışveriş bilgilerini döndürür.

```text
GET /api/coaches/:id
```

Bir hocanın kendisine atanmış üyelerini, programlarını ve ölçümlerini döndürür.

### Admin Paneli

```text
GET /api/admin/data
```

Admin panelindeki özet, üyeler, personel ve ürün listesini getirir.

```text
POST /api/admin/members
```

Yeni üye ekler.

Eklenen bilgiler:

- Ad soyad
- Telefon
- Şifre
- Üyelik başlangıç tarihi
- Üyelik bitiş tarihi
- Hoca ID

Bu endpoint hem `uyeler` tablosuna hem de `uyelik_takibi` tablosuna kayıt ekler. Hoca seçildiyse `antrenman_programi` tablosunda da bağlantı oluşturur.

```text
POST /api/admin/staff
```

Yeni hoca/personel ekler veya aynı isimde personel varsa maaş/şifre bilgisini günceller.

```text
POST /api/admin/products
```

Yeni ürün ekler.

```text
PUT /api/admin/products/:id/stock
```

Ürün stoğunu yeniler. Burada girilen sayı mevcut stoğun üzerine eklenir.

Örnek:

```text
Mevcut stok: 4
Girilen adet: 6
Yeni stok: 10
```

SQL mantığı:

```sql
UPDATE urunler
SET stokmiktari = stokmiktari + ?
WHERE urun_id = ?;
```

```text
POST /api/admin/assignments
```

Üyeye hoca atar.

```text
DELETE /api/admin/members/:id
```

Üyeyi siler. Önce üyeye bağlı satış, ölçüm, program ve üyelik kayıtları silinir.

```text
DELETE /api/admin/staff/:id
```

Hocayı/personeli siler. Önce o hocaya bağlı program kayıtları silinir.

```text
POST /api/admin/sales
```

Admin panelinden satış ekler. Satış eklenince stok azalır.

### Üye Paneli

```text
POST /api/purchases
```

Üye panelinden ürün alma işlemi yapar. Stok yeterliyse satış kaydı oluşturur ve stoktan düşer.

### Hoca Paneli

```text
POST /api/programs
```

Hoca, üyeye antrenman programı yazar.

```text
POST /api/progress
```

Hoca, üyenin gelişim ölçümünü ekler.

## Frontend Dosyaları

### index.html

Ana sayfadır. Üye ve hoca paneli bu dosyada yer alır. Rol seçme modalı da buradadır.

Önemli bölümler:

- Ana karşılama ekranı
- Üye paneli
- Hoca paneli
- Rol seçimi/giriş penceresi
- Ürün alma penceresi
- Program yazma penceresi
- Ölçüm ekleme penceresi

### app.js

`index.html` içindeki üye ve hoca işlemlerini yönetir.

Önemli görevleri:

- Giriş penceresini açar.
- Seçilen role göre form alanlarını değiştirir.
- Üye girişini `/api/login` ile yapar.
- Hoca girişini `/api/login` ile yapar.
- Admin girişini `/api/admin/login` ile yapıp `admin.html` sayfasına yönlendirir.
- Üye panelini API'den gelen veriyle doldurur.
- Hoca panelindeki atanmış üyeleri listeler.
- Program yazma ve ölçüm ekleme isteklerini backend'e gönderir.
- Çıkış yapınca ana sayfaya döner.

### admin.html

Admin yönetim panelidir.

İçerdiği bölümler:

- Genel özet
- Üye kaydı
- Üye listesi
- Personel/hoca kaydı
- Hoca atama
- Satış ekleme
- Stok listesi
- Ürün ekleme
- Stok yenileme

### admin.js

Admin panelindeki formları ve tabloları yönetir.

Önemli görevleri:

- Admin panel verilerini `/api/admin/data` ile çeker.
- Üyeleri tabloya basar.
- Personel listesini basar.
- Ürünleri ve stok durumlarını basar.
- Üye ekleme formunu backend'e gönderir.
- Personel ekleme formunu backend'e gönderir.
- Ürün ekleme formunu backend'e gönderir.
- Stok yenileme butonunda girilen adedi mevcut stoğun üzerine ekler.
- Satış ekleme formunda ürün stoktan düşer.

## Önemli İş Akışları

### 1. Admin Üye Ekler

1. Admin giriş yapar.
2. Üye Kaydı formunu doldurur.
3. `admin.js` form verisini `/api/admin/members` endpointine gönderir.
4. `server.js` veriyi alır.
5. `uyeler` tablosuna üye kaydı eklenir.
6. `uyelik_takibi` tablosuna üyelik tarihi eklenir.
7. Hoca seçildiyse `antrenman_programi` tablosuna ilk bağlantı eklenir.
8. Admin tablosu yenilenir.

### 2. Hoca Program Yazar

1. Hoca, Hoca ID ve şifre ile giriş yapar.
2. Backend hocaya atanmış üyeleri getirir.
3. Hoca bir üye için program yazar.
4. `POST /api/programs` endpointi çalışır.
5. `antrenman_programi` tablosuna yeni program kaydı eklenir.
6. Üye panelinde bu program görünür.

### 3. Üye Ürün Alır

1. Üye telefon ve şifreyle giriş yapar.
2. Üye panelinde ürün alma işlemi yapar.
3. Backend ürün stok miktarını kontrol eder.
4. Stok yeterliyse `satislar` tablosuna kayıt eklenir.
5. `urunler.stokmiktari` satılan adet kadar azaltılır.
6. Üye panelindeki alışveriş listesi güncellenir.

### 4. Admin Stok Yeniler

1. Admin stok listesinden `Stok Yenile` butonuna basar.
2. Eklenecek stok adedini girer.
3. `PUT /api/admin/products/:id/stock` endpointi çalışır.
4. Girilen adet mevcut stokla toplanır.
5. Ürün listesi yenilenir.

## Hocaya Anlatırken Bilmen Gereken Kısa Cevaplar

### Projenin amacı ne?

Spor salonunda üye, hoca, üyelik, antrenman programı, vücut ölçümü, ürün stoğu ve satış işlemlerini tek bir web sistemi üzerinden yönetmek.

### Neden MySQL kullandın?

Veriler ilişkisel olduğu için MySQL uygundur. Örneğin satışlar üyeye ve ürüne bağlıdır; antrenman programı üyeye ve hocaya bağlıdır. Bu yüzden yabancı anahtarlarla ilişkiler kurulmuştur.

### Backend neden var?

Frontend doğrudan veritabanına bağlanamaz. Backend, frontend'den gelen istekleri alır, MySQL sorgularını çalıştırır ve sonucu frontend'e döndürür.

### Admin paneli ne yapıyor?

Admin paneli sistemin yönetim kısmıdır. Üye ekler, hoca ekler, üyeye hoca atar, ürün ekler, satış yapar, stok durumunu görür ve stok yeniler.

### Hoca paneli ne yapıyor?

Hoca kendisine atanmış üyeleri görür. Bu üyeler için antrenman programı yazabilir ve vücut ölçümü ekleyebilir.

### Üye paneli ne yapıyor?

Üye kendi üyelik durumunu, kalan gününü, programını, ölçümlerini ve alışverişlerini görür.

### Stok nasıl çalışıyor?

Satış yapılınca stok azalır. Admin `Stok Yenile` butonuyla mevcut stoğa yeni adet ekleyebilir. Stok 0 olunca durum `Bitti`, 1-5 arasında `Azaldı`, 6 ve üzerindeyse `Yeterli` görünür.

### Silme işlemlerinde neden önce bağlı kayıtlar siliniyor?

Çünkü tablolar arasında foreign key ilişkileri var. Örneğin bir üyeyi silmeden önce ona bağlı satış, ölçüm, program ve üyelik kayıtları silinmelidir. Aksi halde MySQL foreign key hatası verir.

### Projenin en önemli SQL ilişkisi hangisi?

`antrenman_programi` tablosu hem üyeye hem hocaya bağlıdır:

```text
antrenman_programi.uyeid -> uyeler.uyeid
antrenman_programi.personelid -> personel.per_id
```

Bu ilişki sayesinde hangi üyenin hangi hocaya bağlı olduğu takip edilir.

## Sık Karşılaşılan Hatalar

### Backend çalışmıyor

Terminalde şunu çalıştır:

```bash
npm start
```

### Veritabanı bağlantı hatası

`.env` dosyasındaki MySQL bilgilerini kontrol et:

```env
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=spor_salonu
```

### Tablo bulunamadı hatası

Veritabanını tekrar kur:

```bash
npm run setup-db
```

### Yapılan kod değişikliği görünmüyor

Tarayıcıda `Ctrl + F5` yap. Backend değiştiyse `npm start` çalışan terminali kapatıp tekrar başlat.

## Proje Özeti

Bu proje, veritabanı yönetim sistemleri dersi için hazırlanmış bir spor salonu yönetim uygulamasıdır. Projede ilişkisel veritabanı tasarımı, foreign key bağlantıları, CRUD işlemleri, frontend-backend haberleşmesi ve rol bazlı panel mantığı gösterilmiştir. Admin sistemi yönetir, hoca program ve ölçüm ekler, üye ise kendi bilgilerini görüntüler.
