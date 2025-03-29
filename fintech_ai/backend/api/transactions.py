from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import datetime
from models.transaction import Transaction
from models.user import User
from app import db
from services.plaid_service import PlaidService

# İşlemler Blueprint'i
transactions_bp = Blueprint('transactions', __name__)

# Plaid servisi örneği oluştur
plaid_service = PlaidService()

@transactions_bp.route('/link-token', methods=['POST'])
@jwt_required()
def create_link_token():
    """Plaid bağlantısı için link token oluşturur"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    # Plaid link token oluştur
    try:
        link_token = plaid_service.create_link_token(str(user.id), user.full_name)
        return jsonify({"link_token": link_token}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@transactions_bp.route('/exchange-token', methods=['POST'])
@jwt_required()
def exchange_public_token():
    """Plaid public token'ı access token ile değiştirir"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    data = request.get_json()
    public_token = data.get('public_token')
    
    if not public_token:
        return jsonify({"error": "Public token gereklidir"}), 400
    
    try:
        # Public token'ı access token ile değiştir
        access_token, item_id = plaid_service.exchange_public_token(public_token)
        
        # Kullanıcı bilgilerini güncelle
        user.plaid_access_token = access_token
        user.plaid_item_id = item_id
        db.session.commit()
        
        return jsonify({"message": "Banka hesabı başarıyla bağlandı"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@transactions_bp.route('/sync', methods=['POST'])
@jwt_required()
def sync_transactions():
    """Plaid API kullanarak kullanıcının banka işlemlerini senkronize eder"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    if not user.plaid_access_token:
        return jsonify({"error": "Banka hesabı bağlantısı bulunamadı"}), 400
    
    try:
        # Son 30 günlük işlemleri çek
        end_date = datetime.datetime.now().date()
        start_date = end_date - datetime.timedelta(days=30)
        
        transactions = plaid_service.get_transactions(user.plaid_access_token, start_date, end_date)
        
        # Veritabanına kaydet
        for transaction in transactions:
            # İşlem zaten var mı kontrol et
            existing = Transaction.query.filter_by(
                user_id=user.id,
                transaction_id=transaction['transaction_id']
            ).first()
            
            if existing:
                # İşlem varsa güncelle
                existing.amount = transaction['amount']
                existing.date = datetime.datetime.strptime(transaction['date'], '%Y-%m-%d').date()
                existing.name = transaction['name']
                existing.category = json.dumps(transaction['category'])
                existing.category_id = transaction['category_id']
                existing.pending = transaction['pending']
            else:
                # Yeni işlem oluştur
                new_transaction = Transaction(
                    user_id=user.id,
                    transaction_id=transaction['transaction_id'],
                    account_id=transaction['account_id'],
                    amount=transaction['amount'],
                    date=datetime.datetime.strptime(transaction['date'], '%Y-%m-%d').date(),
                    name=transaction['name'],
                    merchant_name=transaction.get('merchant_name', ''),
                    category=json.dumps(transaction['category']),
                    category_id=transaction['category_id'],
                    pending=transaction['pending'],
                    payment_channel=transaction['payment_channel']
                )
                db.session.add(new_transaction)
        
        db.session.commit()
        
        return jsonify({
            "message": f"{len(transactions)} işlem başarıyla senkronize edildi",
            "sync_date": datetime.datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    """Kullanıcının işlemlerini döndürür (filtreleme ve sayfalama destekli)"""
    current_user_id = get_jwt_identity()
    
    # Filtre parametreleri
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category')
    min_amount = request.args.get('min_amount')
    max_amount = request.args.get('max_amount')
    sort_by = request.args.get('sort_by', 'date')
    sort_order = request.args.get('sort_order', 'desc')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    # Sorgu oluştur
    query = Transaction.query.filter_by(user_id=current_user_id)
    
    # Filtreleri uygula
    if start_date:
        query = query.filter(Transaction.date >= datetime.datetime.strptime(start_date, '%Y-%m-%d').date())
    
    if end_date:
        query = query.filter(Transaction.date <= datetime.datetime.strptime(end_date, '%Y-%m-%d').date())
    
    if category:
        query = query.filter(Transaction.category_id == category)
    
    if min_amount:
        query = query.filter(Transaction.amount >= float(min_amount))
    
    if max_amount:
        query = query.filter(Transaction.amount <= float(max_amount))
    
    # Sıralama
    if sort_order.lower() == 'asc':
        query = query.order_by(getattr(Transaction, sort_by).asc())
    else:
        query = query.order_by(getattr(Transaction, sort_by).desc())
    
    # Sayfalama
    pagination = query.paginate(page=page, per_page=per_page)
    
    # Sonuçları JSON olarak dönüştür
    transactions = []
    for transaction in pagination.items:
        transactions.append({
            "id": transaction.id,
            "transaction_id": transaction.transaction_id,
            "account_id": transaction.account_id,
            "amount": transaction.amount,
            "date": transaction.date.isoformat(),
            "name": transaction.name,
            "merchant_name": transaction.merchant_name,
            "category": json.loads(transaction.category),
            "category_id": transaction.category_id,
            "pending": transaction.pending,
            "payment_channel": transaction.payment_channel
        })
    
    return jsonify({
        "transactions": transactions,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200

@transactions_bp.route('/<int:transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    """Belirli bir işlemin detaylarını döndürür"""
    current_user_id = get_jwt_identity()
    
    transaction = Transaction.query.filter_by(
        id=transaction_id,
        user_id=current_user_id
    ).first()
    
    if not transaction:
        return jsonify({"error": "İşlem bulunamadı"}), 404
    
    return jsonify({
        "transaction": {
            "id": transaction.id,
            "transaction_id": transaction.transaction_id,
            "account_id": transaction.account_id,
            "amount": transaction.amount,
            "date": transaction.date.isoformat(),
            "name": transaction.name,
            "merchant_name": transaction.merchant_name,
            "category": json.loads(transaction.category),
            "category_id": transaction.category_id,
            "pending": transaction.pending,
            "payment_channel": transaction.payment_channel
        }
    }), 200

@transactions_bp.route('/<int:transaction_id>/update-category', methods=['PUT'])
@jwt_required()
def update_transaction_category(transaction_id):
    """Bir işlemin kategorisini manuel olarak günceller"""
    current_user_id = get_jwt_identity()
    
    transaction = Transaction.query.filter_by(
        id=transaction_id,
        user_id=current_user_id
    ).first()
    
    if not transaction:
        return jsonify({"error": "İşlem bulunamadı"}), 404
    
    data = request.get_json()
    
    if not data or 'category_id' not in data:
        return jsonify({"error": "category_id alanı gereklidir"}), 400
    
    # Kategoriyi güncelle
    transaction.category_id = data['category_id']
    if 'category' in data:
        transaction.category = json.dumps(data['category'])
    
    db.session.commit()
    
    return jsonify({
        "message": "İşlem kategorisi başarıyla güncellendi",
        "transaction": {
            "id": transaction.id,
            "category_id": transaction.category_id,
            "category": json.loads(transaction.category)
        }
    }), 200 