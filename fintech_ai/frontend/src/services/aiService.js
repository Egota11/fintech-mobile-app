/**
 * AI cevapları için API servisi
 */

// API istekleri için temel yapılandırma
const baseUrl = process.env.REACT_APP_API_URL || '';

/**
 * API isteklerinde kullanılacak ortak yapılandırma
 */
const getHeaders = () => {
  // Yerel depodan token'ı al
  const token = localStorage.getItem('token');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
};

/**
 * Kullanıcı mesajına yapay zeka yanıtı alır
 * 
 * @param {string} message - Kullanıcı mesajı
 * @returns {Promise<string>} - AI yanıtı
 */
export const getAIResponse = async (message) => {
  try {
    // Önbelleği engellemek için zaman damgası ekle
    const timestamp = new Date().getTime();
    
    // Backend ile kimlik doğrulaması varsa
    if (localStorage.getItem('token')) {
      console.log('Kimlik doğrulamalı API yanıtı isteniyor:', message);
      
      // Gerçek API endpointini çağır - önbellek engelleyici başlıklar eklendi
      const response = await fetch(`${baseUrl}/api/advice/ai-response?nocache=${timestamp}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          message,
          timestamp, // Zaman damgasını body'ye de ekle
          force_refresh: true // Her zaman yeni yanıt iste
        }),
        cache: 'no-store' // Fetch API'nin önbelleği kullanmamasını sağla
      });
      
      console.log('API yanıtı alınıyor:', response.status);
      
      // Başarılı değilse public endpoint'e yönlendir
      if (!response.ok) {
        console.error('Kimlik doğrulamalı API yanıtında sorun:', await response.text());
        // Token olmadan public endpoint'i kullan, simulasyon yapmak yerine
        return getPublicAIResponse(message);
      }
      
      // Yanıtı döndür
      const data = await response.json();
      return data.response;
    } else {
      // Kimlik doğrulaması olmadan public API endpoint'ini kullan
      console.log('Public API yanıtı isteniyor:', message);
      return getPublicAIResponse(message);
    }
  } catch (error) {
    console.error('AI yanıtı alınırken hata oluştu:', error);
    return getPublicAIResponse(message); // Hata durumunda public endpoint'i dene
  }
};

/**
 * Kimlik doğrulaması olmadan public API endpoint'ini kullanarak AI yanıtı alır
 * 
 * @param {string} message - Kullanıcı mesajı 
 * @returns {Promise<string>} - AI yanıtı
 */
const getPublicAIResponse = async (message) => {
  try {
    // Önbelleği engellemek için zaman damgası ekle
    const timestamp = new Date().getTime();
    
    // Public API endpoint'ini çağır
    const response = await fetch(`${baseUrl}/api/advice/public-ai-response?nocache=${timestamp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ 
        message,
        timestamp,
        force_refresh: true // Her zaman yeni yanıt iste
      }),
      cache: 'no-store'
    });
    
    // Başarılı değilse yerel yanıt kullan
    if (!response.ok) {
      console.error('Public API yanıtında sorun:', await response.text());
      return simulateLocalAIResponse(message, true);
    }
    
    // Yanıtı döndür
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Public AI yanıtı alınırken hata oluştu:', error);
    return simulateLocalAIResponse(message, true);
  }
};

/**
 * API bağlantısı yokken yerel demo yanıtlar oluşturur
 * Bu sadece test amaçlıdır, gerçek bir uygulamada kaldırılmalıdır
 * 
 * @param {string} message - Kullanıcı mesajı
 * @param {boolean} forceRefresh - Yanıtı zorla yenileme
 * @returns {Promise<string>} - Demo AI yanıtı
 */
const simulateLocalAIResponse = async (message, forceRefresh = false) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowercaseMessage = message.toLowerCase();
      // Her sorguda güncel zaman damgası ekle
      const time = new Date().toLocaleTimeString();
      
      // Doğru zaman damgasıyla yanıt versin
      if (lowercaseMessage.includes('merhaba') || lowercaseMessage.includes('selam')) {
        resolve(`[${time}] Merhaba! Size nasıl yardımcı olabilirim? Finansal durumunuz, harcamalarınız, gelirleriniz veya yatırımlarınız hakkında sorular sorabilirsiniz.`);
      } else if (lowercaseMessage.includes('teşekkür')) {
        resolve(`[${time}] Rica ederim! Başka bir sorunuz varsa yardımcı olmaktan memnuniyet duyarım.`);
      } else if (lowercaseMessage.includes('nasıl')) {
        resolve(`[${time}] Finansal durumunuzu analiz etmek, bütçe planlamanıza yardımcı olmak ve finansal hedeflerinize ulaşmanızı sağlamak için buradayım. Lütfen bana daha spesifik bir soru sorun.`);
      } else if (lowercaseMessage.includes('vergi') && lowercaseMessage.includes('indirim')) {
        resolve(`[${time}] Vergi indirimine tabi olan harcamalarınız genellikle eğitim, sağlık ve bağış kategorilerinde olabilir. Sağlık harcamalarınız için 1.520 TL, eğitim harcamalarınız için 2.350 TL ve bağışlar için 500 TL vergi indirimine tabi harcama yapmışsınız. Toplam vergi indirimi tutarınız 4.370 TL'dir.`);
      } else if (lowercaseMessage.includes('sağlık') && lowercaseMessage.includes('harcama')) {
        resolve(`[${time}] Bu yıl toplam 1.820 TL tutarında sağlık harcaması yapmışsınız. Bunun 1.520 TL'lik kısmı vergi indirimine tabi. Son sağlık harcamanız 29.03.2023 tarihinde 300 TL tutarında.`);
      } else if (lowercaseMessage.includes('bütçe')) {
        resolve(`[${time}] Bütçe durumunuz şu şekildedir: Market: 3.500/3.800 TL (%92), Faturalar: 2.200/2.500 TL (%88), Ulaşım: 1.800/2.000 TL (%90), Eğlence: 1.500/1.800 TL (%83), Sağlık: 1.520/2.000 TL (%76). Bu ay özellikle market harcamalarınıza dikkat etmenizi öneririm.`);
      } else if (lowercaseMessage.includes('harcama')) {
        resolve(`[${time}] Bu ay toplam 10.000 TL harcama yapmışsınız. En çok harcamayı 3.500 TL ile market kategorisinde yapmışsınız. İkinci sırada 2.200 TL ile faturalar geliyor. Detaylı analiz için "Harcamalar" sayfasını ziyaret edebilirsiniz.`);
      } else if (lowercaseMessage.includes('gelir')) {
        resolve(`[${time}] Bu ay toplam geliriniz 13.500 TL. Geçen aya göre %5 artış göstermiş. Mevcut tasarruf oranınız %26, hedef oran %30. Gelir kaynaklarınızı "Gelirler" sayfasından detaylı inceleyebilirsiniz.`);
      } else {
        resolve(`[${time}] API bağlantısı kurulamadı. Size nasıl yardımcı olabilirim? Harcamalarınız, gelirleriniz veya bütçeniz hakkında sorular sorabilirsiniz.`);
      }
    }, 500);
  });
};

const aiService = {
  getAIResponse
};

export default aiService; 