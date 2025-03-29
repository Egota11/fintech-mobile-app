/**
 * QR Kod Yardımcısı
 * 
 * Bu script, test amaçlı QR kod oluşturma fonksiyonlarını içerir.
 * Mobil cihazlarda test edilmesini kolaylaştırmak için kullanılır.
 */

function getIPAddress() {
  return new Promise((resolve, reject) => {
    // IP adresini almak için bir fetch isteği yapıyoruz
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        resolve(data.ip);
      })
      .catch(error => {
        console.error('IP adresi alınamadı:', error);
        resolve(window.location.hostname); // Hata durumunda hostname'i kullan
      });
  });
}

function createDevQRCode(targetElement, port = '3000') {
  if (!targetElement) {
    console.error('QR kodu için bir hedef element belirtilmedi');
    return;
  }
  
  getIPAddress().then(ip => {
    const url = `http://${ip}:${port}`;
    
    // URL'yi göster
    const urlDisplay = document.createElement('div');
    urlDisplay.innerHTML = `<p style="margin: 10px 0;"><strong>Test URL:</strong> ${url}</p>`;
    targetElement.appendChild(urlDisplay);
    
    // QR kodu oluştur
    const qrContainer = document.createElement('div');
    new QRCode(qrContainer, {
      text: url,
      width: 200,
      height: 200,
      colorDark: "#2E7D32",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    
    targetElement.appendChild(qrContainer);
    
    // Kullanım talimatları
    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <div style="margin-top: 15px; text-align: left;">
        <p><strong>Kullanım:</strong></p>
        <ol style="padding-left: 20px; margin: 10px 0;">
          <li>Bu QR kodu telefonunuzun kamerası ile tarayın</li>
          <li>Telefonunuzda FinTech AI uygulamasına erişin</li>
          <li>Telefonunuzun ve bilgisayarınızın aynı ağda olduğundan emin olun</li>
        </ol>
      </div>
    `;
    targetElement.appendChild(instructions);
  });
}

// LocalIP fonksiyonu - Yerel IP adresini tespit etmek için
async function getLocalIPAddress() {
  try {
    // WebRTC aracılığıyla IP adreslerini almak için
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel('');
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    return new Promise((resolve) => {
      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) return;
        
        const regexResult = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate);
        if (regexResult && regexResult[1]) {
          const ip = regexResult[1];
          pc.onicecandidate = null;
          pc.close();
          resolve(ip);
        }
      };
      
      // Timeout
      setTimeout(() => {
        pc.close();
        resolve(window.location.hostname);
      }, 1000);
    });
  } catch (error) {
    console.error('Yerel IP adresi alınamadı:', error);
    return window.location.hostname;
  }
}

// Public API
window.QRHelper = {
  createDevQRCode,
  getIPAddress,
  getLocalIPAddress
};
