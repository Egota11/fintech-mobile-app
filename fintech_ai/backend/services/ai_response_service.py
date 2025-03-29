import os
import json
import openai
from openai import OpenAI
import traceback
from datetime import datetime
from dotenv import load_dotenv

# .env dosyasından API anahtarını yükle
load_dotenv()

class AIResponseService:
    """
    OpenAI API kullanarak chatbot için yanıtlar üreten servis sınıfı.
    """
    
    def __init__(self):
        # OpenAI API anahtarını çevre değişkenlerinden al
        self.api_key = os.environ.get('OPENAI_API_KEY')
        # API anahtarını ayarla
        try:
            self.client = OpenAI(api_key=self.api_key)
            print(f"OpenAI API istemcisi başarıyla oluşturuldu. API anahtarı mevcut: {bool(self.api_key)}")
        except Exception as e:
            print(f"OpenAI istemcisi oluşturulurken hata: {str(e)}")
            self.client = None
        
        # Sistem mesajını tanımla
        self.system_message = """
        Sen Fintech AI asistanısın. Kullanıcıların finansal sorularına yardımcı olmak için bulunan, bilgili ve 
        profesyonel bir finansal danışmansın. Türkçe yanıt verirsin. Kullanıcıların finansal verilerini analiz eder, 
        mali kararlarında onlara yardımcı olursun ve finansal durumlarını iyileştirmek için kişiselleştirilmiş 
        öneriler sunarsın. Kısa ve öz yanıtlar vermeye çalış ancak gerektiğinde detaylı bilgi de sağla.
        
        Şu konularda bilgi verebilirsin:
        - Bütçe planlama ve yönetimi
        - Harcama analizi ve kategorizasyonu
        - Tasarruf stratejileri ve hedefleri
        - Borç yönetimi ve azaltma
        - Vergi planlaması ve optimizasyonu
        - Yatırım stratejileri ve portföy çeşitlendirme
        - Finansal sağlık değerlendirmesi
        - Nakit akışı yönetimi
        - Emeklilik planlaması
        - İşletme finansmanı (KOBİ'ler için)
        
        Eğer kesin bir cevap veremiyorsan ya da daha fazla bilgiye ihtiyacın varsa, bunu belirt ve 
        kullanıcıdan ek bilgi iste.
        """
        
        # Tüm yanıtları önbellekten temizle
        self.is_cache_enabled = False
        # Önbellekleme için sözlük
        self.response_cache = {}
        
    def get_response(self, message, financial_data=None, force_refresh=True):
        """
        Kullanıcı mesajına yanıt üretir
        
        Args:
            message (str): Kullanıcı mesajı
            financial_data (dict): Kullanıcının finansal verileri (opsiyonel)
            force_refresh (bool): Önbelleği zorla yenileme
            
        Returns:
            str: AI yanıtı
        """
        
        # Daima güncel bilgi kullanılsın
        force_refresh = True
        
        # Önbellek anahtarı oluştur
        cache_key = f"{message}_{json.dumps(financial_data) if financial_data else 'no_data'}"
        
        # Eğer önbellekleme etkinse ve mesaj önbellekte varsa ve yenileme zorunlu değilse
        if not force_refresh and self.is_cache_enabled and cache_key in self.response_cache:
            print(f"Önbellekten yanıt kullanılıyor: {message}")
            return self.response_cache[cache_key]
        
        # Her seferinde güncel zamanı al
        current_time = datetime.now().strftime("%H:%M:%S")
        print(f"Yanıt üretiliyor: {message} | Zaman: {current_time}")
        
        try:
            # API anahtarı kontrol et
            if not self.api_key:
                return f"[{current_time}] OpenAI API anahtarı bulunamadı. Lütfen sistem yöneticinizle iletişime geçin."
            
            if not self.client:
                return f"[{current_time}] OpenAI istemcisi oluşturulamadı. Lütfen sistem yöneticinizle iletişime geçin."
            
            # Finansal verilerde tarihleri güncelle
            if financial_data:
                # Mevcut ay ve zamanı güncelle 
                financial_data['current_month'] = datetime.now().strftime('%B %Y')
                financial_data['last_updated'] = current_time
                
                # Finans verilerinde başka tarih verileri varsa onları da güncelle
                if 'expense_categories' in financial_data:
                    # Demo harcamaları güncelleyelim: son veri 1-5 dakika öncesine ait olsun
                    minutes_ago = datetime.now().minute % 5 + 1
                    financial_data['last_expense_time'] = f"{minutes_ago} dakika önce"
                    
                    # Market harcamasını biraz değiştirelim (demo verinin güncel görünmesi için)
                    if 'Market' in financial_data['expense_categories']:
                        # Güncel hisse senedi fiyatı gibi değişken bir değer 
                        import random
                        variation = random.randint(-150, 150) # -150 TL ile +150 TL arası değişim
                        financial_data['expense_categories']['Market'] = max(3350, 3500 + variation)
                        
                        # Bütçe durumunu da güncelle
                        if 'budgets' in financial_data and 'Market' in financial_data['budgets']:
                            market_expense = financial_data['expense_categories']['Market']
                            market_budget = financial_data['budgets']['Market']
                            market_budget['used'] = market_expense
                            market_budget['remaining'] = market_budget['limit'] - market_expense
                            market_budget['status'] = 'Dikkat' if market_budget['remaining'] < 300 else 'İyi'
            
            # Mesajları hazırla
            messages = [
                {"role": "system", "content": self.system_message + f"\n\nYanıtını oluştururken şu anki zamanı kullan: {current_time}"}
            ]
            
            # Finansal veri varsa ekle
            if financial_data:
                financial_context = f"""
                Kullanıcının finansal verileri aşağıdadır:
                {json.dumps(financial_data, ensure_ascii=False, indent=2)}
                
                Bu verileri kullanarak yanıtını kişiselleştir. Her yanıtında finansal verilerin güncel olduğunu belirt.
                """
                messages.append({"role": "system", "content": financial_context})
            
            # Kullanıcı mesajını ekle
            messages.append({"role": "user", "content": message})
            
            print(f"OpenAI API'ye istek gönderiliyor. Mesaj: {message}")
            
            # OpenAI API'sini çağır - yeni sürümle uyumlu
            try:
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo-0125",  # Daha güvenilir ve stabil bir model versiyonu
                    messages=messages,
                    max_tokens=500,
                    temperature=0.7
                )
                
                # OpenAI yanıtını al
                ai_response = response.choices[0].message.content
                
                # Eğer yanıtta zaman damgası yoksa ekle
                if not ai_response.strip().startswith("["):
                    ai_response = f"[{current_time}] {ai_response}"
                
                # Önbelleğe kaydet (eğer aktifse)
                if self.is_cache_enabled:
                    self.response_cache[cache_key] = ai_response
                
                print(f"API yanıtı başarıyla alındı: {ai_response[:50]}...")
                
                # Yanıtı döndür
                return ai_response
                
            except Exception as e:
                error_msg = f"OpenAI API özel hatası: {str(e)}"
                print(error_msg)
                print(f"Hata ayrıntıları: {traceback.format_exc()}")
                return f"[{current_time}] Üzgünüm, yanıt üretirken teknik bir sorun oluştu. Lütfen daha sonra tekrar deneyin."
            
        except Exception as e:
            # Hata durumunda bilgilendirici bir mesaj döndür
            print(f"OpenAI API genel hatası: {str(e)}")
            print(f"Hata ayrıntıları: {traceback.format_exc()}")
            return f"[{current_time}] Üzgünüm, şu anda yanıt üretirken bir sorun yaşıyorum: {str(e)}. Lütfen daha sonra tekrar deneyin." 