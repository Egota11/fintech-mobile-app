# FinTech AI - Freelancer ve KOBİ'ler için AI Destekli Finans Yönetim Aracı

FinTech AI, freelancer ve küçük işletmelerin finansal verilerini analiz etmelerine, gelir ve giderlerini takip etmelerine, nakit akışını yönetmelerine ve iş sağlığını değerlendirmelerine yardımcı olan, yapay zeka destekli bir finansal yönetim aracıdır.

## Özellikler

- **Dashboard**: Finansal sağlık göstergeleri, gelir/gider grafikleri ve finansal öngörüler
- **Gelir Takibi**: Gelir kaynaklarını ekle, izle ve tahminle
- **Gider Yönetimi**: Giderleri kategorize et, analiz et ve kontrol et
- **Nakit Akışı**: Nakit akışı tahminleri ve likidite yönetimi
- **Vergi Planlama**: Vergi yükümlülüklerini hesapla ve vergi tasarrufu fırsatlarını belirle
- **Finansal Raporlar**: Özel raporlar oluştur ve periyodik finansal durumu değerlendir
- **AI Analiz**: Finansal verilerden anlamlı içgörüler çıkar ve tavsiyeler al
- **Chatbot Asistan**: Finansal durumunuz hakkında sorular sorabileceğiniz ve cevaplar alabileceğiniz AI destekli chatbot

## Teknoloji Yığını

- **Frontend**: React, Material-UI
- **Backend**: Flask, SQLAlchemy
- **Veritabanı**: PostgreSQL
- **AI/ML**: TensorFlow, scikit-learn, OpenAI
- **API'ler**: Plaid, Stripe, QuickBooks/Xero

## Proje Kurulumu

### Gereklilikler

- Python 3.9 veya üstü
- Node.js 14 veya üstü
- PostgreSQL 13 veya üstü

### Backend Kurulumu

1. Proje dizinine gidin ve sanal ortam oluşturun:
   ```bash
   cd fintech_ai/backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   pip install -r requirements.txt
   ```

3. `.env` dosyasını düzenleyin:
   ```
   SECRET_KEY=uretim-icin-degistirin-guclu-gizli-anahtar
   JWT_SECRET_KEY=uretim-icin-degistirin-jwt-gizli-anahtari
   DATABASE_URL=postgresql://postgres:postgres@localhost/fintech_ai
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. Veritabanını oluşturun:
   ```bash
   flask db init
   flask db migrate
   flask db upgrade
   ```

5. Sunucuyu başlatın:
   ```bash
   flask run
   ```

### Frontend Kurulumu

1. Proje dizinine gidin:
   ```bash
   cd fintech_ai/frontend
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Frontend'i başlatın:
   ```bash
   npm start
   ```

## ChatBot AI Entegrasyonu

Projede bulunan chatbot, OpenAI API'si kullanılarak geliştirilmiştir. Chatbot'u kullanabilmek için:

1. Bir OpenAI API anahtarı edinmeniz gerekmektedir. https://platform.openai.com/api-keys adresinden bir anahtar alabilirsiniz.

2. `.env` dosyasındaki `OPENAI_API_KEY` değişkenini alınan API anahtarı ile güncelleyin.

3. Backend sunucusunu yeniden başlatın:
   ```bash
   cd fintech_ai/backend
   flask run
   ```

### ChatBot Kullanımı

- Chatbot, sağ alt köşedeki konuşma simgesine tıklanarak erişilebilir.
- Finansal verilerinizle ilgili sorular sorabilirsiniz:
  - "Bu ay ne kadar harcama yapmışım?"
  - "Aylık gelirim ne kadar?"
  - "Bütçe durumum nedir?"
  - "Vergi indirimlerim ne durumda?"
  - "Finansal sağlık durumum nedir?"
  - "Harcamalarımı nasıl azaltabilirim?"

## Geliştirme

Projeye katkıda bulunmak için:

1. Projeyi forklayın
2. Özellik dalı oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik ekle'`)
4. Dalı pushla (`git push origin yeni-ozellik`)
5. Pull request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için LICENSE dosyasına bakın. 