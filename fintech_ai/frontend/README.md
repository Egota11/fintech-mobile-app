# FinTech AI Frontend

Finansal yönetim ve analiz platformu

## Kurulum

Projeyi başlatmak için aşağıdaki adımları izleyin:

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm start
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde çalışır.

## Mobil Cihazlarda Test Etme

FinTech AI uygulamasını mobil cihazlarda test etmek için aşağıdaki yöntemleri kullanabilirsiniz:

### 1. QR Kod ile Test (Aynı Ağda)

Eğer bilgisayarınız ve mobil cihazınız aynı WiFi ağındaysa:

1. Geliştirme sunucusunu başlatın: `npm start`
2. Tarayıcınızda `http://localhost:3000/dev-test.html` adresine gidin
3. Bu sayfadaki QR kodu mobil cihazınızla tarayın
4. Telefonunuzdan uygulamaya erişebilirsiniz

### 2. Mobil Önizleme (Tarayıcıda)

Web tarayıcınızın geliştirici araçlarını kullanarak:

**Chrome:**
- F12 veya Ctrl+Shift+I tuşlarına basarak geliştirici araçlarını açın
- Toggle Device Toolbar butonuna tıklayın (veya Ctrl+Shift+M)
- Açılan araç çubuğunda istediğiniz cihazı seçin

**Safari:**
- Menüden Develop > Enter Responsive Design Mode seçeneğini seçin
- İstediğiniz cihaz tipini seçin

### 3. Mobil Önizleme Sayfası

Uygulama içindeki mobil önizleme sayfasını kullanarak:

1. Uygulamaya giriş yapın
2. Üst menüde sağda yer alan mobil önizleme butonuna tıklayın
3. Açılan sayfada telefon ve tablet görünümlerini inceleyebilirsiniz

## Önemli Dosyalar

- `/public/mobile-preview.html`: Mobil önizleme sayfası
- `/public/dev-test.html`: Mobil geliştirme test sayfası
- `/public/qr-helper.js`: QR kod üretim aracı
- `/src/components/common/MainLayout.js`: Ana düzen bileşeni (mobil-duyarlı)
- `/src/theme.js`: Duyarlı tema ayarları
