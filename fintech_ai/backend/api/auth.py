from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
from models.user import User
from app import db

# Kimlik doğrulama Blueprint'i
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Yeni kullanıcı kaydı oluşturur"""
    data = request.get_json()
    
    # Gerekli alanları kontrol et
    required_fields = ['email', 'password', 'full_name', 'company_name']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"'{field}' alanı gereklidir"}), 400
    
    # Email adresi kullanılıyor mu kontrol et
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Bu email adresi zaten kullanımda"}), 400
    
    # Yeni kullanıcı oluştur
    new_user = User(
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        full_name=data['full_name'],
        company_name=data['company_name'],
        business_type=data.get('business_type', 'other'),
        phone=data.get('phone', ''),
        created_at=datetime.datetime.now()
    )
    
    # Veritabanına ekle
    db.session.add(new_user)
    db.session.commit()
    
    # Kullanıcı bilgilerini döndür (şifre hariç)
    return jsonify({
        "message": "Kullanıcı başarıyla oluşturuldu",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "company_name": new_user.company_name
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Kullanıcı girişi yapar ve JWT token döndürür"""
    data = request.get_json()
    
    # Email ve şifre gerekli
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Email ve şifre gereklidir"}), 400
    
    # Kullanıcıyı bul
    user = User.query.filter_by(email=data['email']).first()
    
    # Kullanıcı yoksa veya şifre yanlışsa
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({"error": "Geçersiz email veya şifre"}), 401
    
    # JWT token oluştur, 24 saat geçerli
    access_token = create_access_token(
        identity=user.id,
        expires_delta=datetime.timedelta(hours=24)
    )
    
    return jsonify({
        "message": "Giriş başarılı",
        "access_token": access_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "company_name": user.company_name
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_user_profile():
    """JWT token ile mevcut kullanıcı profilini döndürür"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    return jsonify({
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "company_name": user.company_name,
            "business_type": user.business_type,
            "phone": user.phone,
            "created_at": user.created_at.isoformat()
        }
    }), 200

@auth_bp.route('/update', methods=['PUT'])
@jwt_required()
def update_profile():
    """Kullanıcı profilini günceller"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    data = request.get_json()
    
    # Güncellenebilir alanlar
    updatable_fields = ['full_name', 'company_name', 'business_type', 'phone']
    
    for field in updatable_fields:
        if field in data:
            setattr(user, field, data[field])
    
    # Şifre değişikliği varsa
    if 'password' in data and data['password']:
        user.password_hash = generate_password_hash(data['password'])
    
    # Veritabanına kaydet
    db.session.commit()
    
    return jsonify({
        "message": "Profil başarıyla güncellendi",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "company_name": user.company_name,
            "business_type": user.business_type,
            "phone": user.phone
        }
    }), 200 