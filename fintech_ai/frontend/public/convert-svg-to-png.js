// Bu dosya, SVG'yi PNG'ye dönüştürmek için tarayıcıda çalıştırılabilecek bir JavaScript kodu içerir
// SVG'den PNG oluşturmak için tarayıcı gerektiğinden, bu kodu HTML içinde kullanabiliriz

function convertSvgToPng(svgId, pngFilename, width, height) {
  const svg = document.getElementById(svgId);
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);
  
  // SVG'yi base64'e çevir
  const svgBase64 = btoa(svgStr);
  const imgSrc = 'data:image/svg+xml;base64,' + svgBase64;
  
  // Yeni bir Image nesnesi oluştur
  const img = new Image();
  img.width = width;
  img.height = height;
  
  img.onload = function() {
    // Canvas oluştur
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Görseli canvas'a çiz
    ctx.drawImage(img, 0, 0, width, height);
    
    // PNG indirme bağlantısı oluştur
    const a = document.createElement('a');
    a.download = pngFilename;
    a.href = canvas.toDataURL('image/png');
    a.textContent = pngFilename + ' indir';
    a.style.display = 'block';
    a.style.margin = '10px 0';
    
    document.body.appendChild(a);
    console.log('PNG oluşturuldu: ' + pngFilename);
  };
  
  img.src = imgSrc;
}

// Bu fonksiyonu converterDemo.html dosyasında kullanacağız 