# FinTech AI Uygulaması Dağıtım Kılavuzu

Bu kılavuz, FinTech AI uygulamasını ücretsiz olarak Render.com üzerinde barındırmak için adımları içerir.

## Ön Gereksinimler

- [GitHub](https://github.com) hesabı
- [Render.com](https://render.com) hesabı (ücretsiz)

## Dağıtım Adımları

### 1. Projeyi GitHub'a Yükleyin

```bash
# GitHub'da yeni bir repo oluşturun ve kodu oraya yükleyin
git init
git add .
git commit -m "İlk commit"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/fintech-ai.git
git push -u origin main
```

### 2. Render.com Üzerinde Dağıtım

1. [Render.com](https://render.com)'da oturum açın
2. "New +" butonuna tıklayın
3. "Blueprint" seçeneğini seçin
4. GitHub reponuzu bağlayın
5. "Connect" butonuna tıklayın
6. Render otomatik olarak `render.yaml` dosyasını tespit edecek ve servisleri oluşturacaktır
7. Dağıtım tamamlandığında, uygulamanıza verilen URL'ler ile erişebilirsiniz

### 3. Manuel Dağıtım (Blueprint Kullanmadan)

Alternatif olarak, servisleri manuel olarak da oluşturabilirsiniz:

#### Backend Servisi Kurulumu:

1. Render.com'da "New +" > "Web Service" seçin
2. GitHub reponuzu bağlayın
3. Aşağıdaki bilgileri girin:
   - Name: fintech-ai-backend
   - Environment: Python
   - Region: Frankfurt (veya size yakın bir bölge)
   - Branch: main
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && gunicorn wsgi:app`
4. "Advanced" bölümünde şu çevre değişkenlerini ekleyin:
   - SECRET_KEY: (rastgele bir değer)
   - PORT: 10000
5. "Create Web Service" butonuna tıklayın

#### Frontend Servisi Kurulumu:

1. Render.com'da "New +" > "Static Site" seçin
2. GitHub reponuzu bağlayın
3. Aşağıdaki bilgileri girin:
   - Name: fintech-ai-frontend
   - Environment: Static Site
   - Region: Frankfurt (veya size yakın bir bölge) 
   - Branch: main
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/build`
4. "Advanced" bölümünde şu çevre değişkenlerini ekleyin:
   - REACT_APP_API_URL: (Backend'iniz için Render URL'si, örneğin https://fintech-ai-backend.onrender.com)
5. "Create Static Site" butonuna tıklayın

## Dağıtım Sonrası

Dağıtım tamamlandıktan sonra:

1. Frontend URL'nize giderek uygulamanın çalıştığını doğrulayın
2. Backend API'sini test etmek için `<backend-url>/` adresine giderek JSON yanıtını kontrol edin

## Önemli Notlar

- Render'ın ücretsiz planı aşağıdaki kısıtlamalara sahiptir:
  - Web servisleri 15 dakika kullanılmadığında uyku moduna geçer
  - İlk istekte uyanma süresi 30-40 saniye arası olabilir
  - Ayda 750 saat ücretsiz kullanım (bir servis için yeterli)
  - Yavaş başlangıç ve düşük performans

- Daha iyi performans için ücretli planlara yükseltme yapılabilir

## Sorun Giderme

- Eğer backend API'si yanıt vermiyorsa:
  1. Render kontrol panelinden logları kontrol edin
  2. `PORT` değişkeninin doğru ayarlandığından emin olun
  3. `wsgi.py` dosyasının doğru olduğundan emin olun

- Eğer frontend API'yi bulamıyorsa:
  1. `REACT_APP_API_URL` çevre değişkeninin doğru ayarlandığından emin olun
  2. CORS ayarlarını kontrol edin 