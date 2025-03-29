import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from services.ai_response_service import AIResponseService

# .env dosyasından çevre değişkenlerini yükle
load_dotenv()

# Flask uygulamasını başlat
app = Flask(__name__)

# Konfigürasyon
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'gelistirme-modu-gizli-anahtar')

# CORS yapılandırması
CORS(app)

# AI Yanıt servisi başlat
ai_service = AIResponseService()

# Kök yolda API durumunu döndür
@app.route('/')
def index():
    return jsonify({
        "status": "online",
        "message": "FinTech AI API çalışıyor",
        "version": "0.1.0"
    })

# Basit AI yanıt endpointi
@app.route('/api/advice/public-ai-response', methods=['POST'])
def get_public_ai_response():
    """
    Kullanıcı sorusuna basit AI yanıtı üretir
    """
    # İstek gövdesinden kullanıcı mesajını al
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "Mesaj sağlanmadı"}), 400
    
    user_message = data['message']
    force_refresh = data.get('force_refresh', True)
    timestamp = data.get('timestamp', '')
    
    # Demo finansal veriler
    financial_data = {
        'user': {
            'name': 'Demo Kullanıcı',
            'company': 'Demo Şirket'
        },
        'current_month': 'Mart 2023',
        'monthly_income': 13500,
        'monthly_expenses': 10000,
        'savings': 3500,
        'savings_rate': 25.93,
        'current_balance': 25000,
        'expense_categories': {
            'Market': 3500,
            'Faturalar': 2200,
            'Ulaşım': 1800,
            'Eğlence': 1500,
            'Sağlık': 1000
        },
        'budgets': {
            'Market': {
                'limit': 3800,
                'used': 3500,
                'remaining': 300,
                'status': 'Dikkat'
            },
            'Faturalar': {
                'limit': 2500,
                'used': 2200,
                'remaining': 300,
                'status': 'İyi'
            },
            'Ulaşım': {
                'limit': 2000,
                'used': 1800,
                'remaining': 200, 
                'status': 'İyi'
            }
        },
        'goals': [
            {
                'name': 'Acil Durum Fonu',
                'target': 15000,
                'current': 10000,
                'progress': 66.67,
                'deadline': None
            },
            {
                'name': 'Tatil Fonu',
                'target': 6000,
                'current': 2500,
                'progress': 41.67,
                'deadline': '2023-07-01'
            }
        ]
    }
    
    # AI yanıtını al
    ai_response = ai_service.get_response(user_message, financial_data, force_refresh)
    
    return jsonify({
        'response': ai_response
    }), 200

# Hata işleyicileri
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "error": "Bulunamadı",
        "message": "İstenen kaynak bulunamadı."
    }), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({
        "error": "Sunucu Hatası",
        "message": "Bir sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin."
    }), 500

# Uygulamayı çalıştır
if __name__ == '__main__':
    # Geliştirme modunda debug açık
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', debug=False, port=port)
