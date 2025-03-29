from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import datetime
from app import db
from models.transaction import Transaction
from services.expense_categorization_service import ExpenseCategorizationService

# Gider işlemleri Blueprint'i
expenses_bp = Blueprint('expenses', __name__)

# Gider kategorilendirme servisi örneği oluştur
expense_service = ExpenseCategorizationService()

@expenses_bp.route('/', methods=['GET'])
@jwt_required()
def get_expenses():
    """Kullanıcının giderlerini döndürür (filtreleme ve sayfalama destekli)"""
    current_user_id = get_jwt_identity()
    
    # Filtre parametreleri
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category = request.args.get('category')
    min_amount = request.args.get('min_amount')
    max_amount = request.args.get('max_amount')
    is_tax_deductible = request.args.get('is_tax_deductible')
    sort_by = request.args.get('sort_by', 'date')
    sort_order = request.args.get('sort_order', 'desc')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    # Sorgu oluştur (sadece giderler için amount > 0)
    query = Transaction.query.filter_by(user_id=current_user_id).filter(Transaction.amount > 0)
    
    # Filtreleri uygula
    if start_date:
        query = query.filter(Transaction.date >= datetime.datetime.strptime(start_date, '%Y-%m-%d').date())
    
    if end_date:
        query = query.filter(Transaction.date <= datetime.datetime.strptime(end_date, '%Y-%m-%d').date())
    
    if category:
        if ',' in category:
            categories = category.split(',')
            query = query.filter(Transaction.category_id.in_(categories))
        else:
            query = query.filter(Transaction.category_id == category)
    
    if min_amount:
        query = query.filter(Transaction.amount >= float(min_amount))
    
    if max_amount:
        query = query.filter(Transaction.amount <= float(max_amount))
    
    if is_tax_deductible is not None:
        is_deductible = is_tax_deductible.lower() == 'true'
        query = query.filter(Transaction.is_tax_deductible == is_deductible)
    
    # Sıralama
    if sort_order.lower() == 'asc':
        query = query.order_by(getattr(Transaction, sort_by).asc())
    else:
        query = query.order_by(getattr(Transaction, sort_by).desc())
    
    # Sayfalama
    pagination = query.paginate(page=page, per_page=per_page)
    
    # Sonuçları JSON olarak dönüştür
    expenses = []
    for transaction in pagination.items:
        expenses.append({
            "id": transaction.id,
            "transaction_id": transaction.transaction_id,
            "amount": transaction.amount,
            "date": transaction.date.isoformat(),
            "name": transaction.name,
            "merchant_name": transaction.merchant_name,
            "category": json.loads(transaction.category) if transaction.category else [],
            "category_id": transaction.category_id,
            "custom_category": transaction.custom_category,
            "is_tax_deductible": transaction.is_tax_deductible,
            "prediction_confidence": transaction.prediction_confidence
        })
    
    return jsonify({
        "expenses": expenses,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200

@expenses_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_expense_summary():
    """Gider özeti ve analizi döndürür"""
    current_user_id = get_jwt_identity()
    
    # Zaman aralığı parametreleri
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    group_by = request.args.get('group_by', 'category')  # category, month, week
    
    # Sorgu oluştur (sadece giderler için amount > 0)
    query = Transaction.query.filter_by(user_id=current_user_id).filter(Transaction.amount > 0)
    
    # Tarih filtrelerini uygula
    if start_date:
        query = query.filter(Transaction.date >= datetime.datetime.strptime(start_date, '%Y-%m-%d').date())
    
    if end_date:
        query = query.filter(Transaction.date <= datetime.datetime.strptime(end_date, '%Y-%m-%d').date())
    
    # Tüm giderleri al
    expenses = query.all()
    
    # Özet istatistikler
    total_amount = sum(expense.amount for expense in expenses)
    avg_amount = total_amount / len(expenses) if expenses else 0
    
    # Gruplama stratejisi
    summary = {}
    
    if group_by == 'category':
        # Kategoriye göre grupla
        for expense in expenses:
            category = expense.category_id or 'Diğer'
            if category in summary:
                summary[category]['amount'] += expense.amount
                summary[category]['count'] += 1
            else:
                summary[category] = {
                    'amount': expense.amount,
                    'count': 1,
                    'category': json.loads(expense.category) if expense.category else ['Diğer']
                }
        
        # Yüzde hesapla
        for category in summary:
            summary[category]['percentage'] = (summary[category]['amount'] / total_amount) * 100 if total_amount > 0 else 0
    
    elif group_by == 'month':
        # Aya göre grupla
        for expense in expenses:
            month_key = expense.date.strftime('%Y-%m')
            if month_key in summary:
                summary[month_key]['amount'] += expense.amount
                summary[month_key]['count'] += 1
            else:
                summary[month_key] = {
                    'amount': expense.amount,
                    'count': 1,
                    'month': month_key
                }
    
    elif group_by == 'week':
        # Haftaya göre grupla
        for expense in expenses:
            week_key = expense.date.strftime('%Y-%U')  # %U: Haftanın yıl içindeki numarası (00-53)
            if week_key in summary:
                summary[week_key]['amount'] += expense.amount
                summary[week_key]['count'] += 1
            else:
                summary[week_key] = {
                    'amount': expense.amount,
                    'count': 1,
                    'week': week_key
                }
    
    # Sonuçları hazırla
    results = {
        'total_amount': total_amount,
        'avg_amount': avg_amount,
        'total_count': len(expenses),
        'summary': list(summary.values()),
        'group_by': group_by,
        'start_date': start_date,
        'end_date': end_date
    }
    
    return jsonify(results), 200

@expenses_bp.route('/categorize', methods=['POST'])
@jwt_required()
def categorize_expenses():
    """AI modelini kullanarak giderleri otomatik kategorize eder"""
    current_user_id = get_jwt_identity()
    
    data = request.get_json()
    transaction_ids = data.get('transaction_ids', [])
    
    if not transaction_ids:
        return jsonify({"error": "İşlem ID'leri gereklidir"}), 400
    
    # Belirtilen işlemleri al
    transactions = Transaction.query.filter(
        Transaction.id.in_(transaction_ids),
        Transaction.user_id == current_user_id,
        Transaction.amount > 0  # Sadece giderler
    ).all()
    
    if not transactions:
        return jsonify({"error": "Belirtilen kriterlere uygun işlem bulunamadı"}), 404
    
    # Kategorize edilecek işlemleri hazırla
    categorized_transactions = []
    
    for transaction in transactions:
        # İşlemi kategorize et
        transaction_data = {
            'name': transaction.name,
            'merchant_name': transaction.merchant_name,
            'amount': transaction.amount
        }
        
        # AI modeli ile kategori tahmin et
        category_result = expense_service.categorize_transaction(transaction_data)
        
        # İşlem verilerini güncelle
        transaction.category_id = category_result['category']
        transaction.is_tax_deductible = category_result['is_tax_deductible']
        transaction.prediction_confidence = category_result['confidence']
        
        db.session.add(transaction)
        
        # Sonucu hazırla
        categorized_transactions.append({
            'id': transaction.id,
            'category': category_result['category'],
            'confidence': category_result['confidence'],
            'is_tax_deductible': category_result['is_tax_deductible'],
            'all_predictions': category_result['all_predictions']
        })
    
    # Değişiklikleri kaydet
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f"{len(categorized_transactions)} işlem kategorize edildi",
        'transactions': categorized_transactions
    }), 200

@expenses_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_expense_categories():
    """Sistemdeki tüm gider kategorilerini döndürür"""
    # Expense servisi üzerinden kategorileri al
    categories = expense_service.categories
    
    # Kategorilerin vergi indirimi durumunu ekle
    categories_with_tax_info = []
    for category in categories:
        is_tax_deductible = category in expense_service.tax_deductible_categories
        categories_with_tax_info.append({
            'name': category,
            'is_tax_deductible': is_tax_deductible
        })
    
    return jsonify({
        'categories': categories_with_tax_info
    }), 200

@expenses_bp.route('/<int:transaction_id>/update-category', methods=['PUT'])
@jwt_required()
def update_expense_category(transaction_id):
    """Bir giderin kategorisini manuel olarak günceller"""
    current_user_id = get_jwt_identity()
    
    # İşlemi al
    transaction = Transaction.query.filter_by(
        id=transaction_id,
        user_id=current_user_id,
        amount__gt=0  # Sadece giderler
    ).first()
    
    if not transaction:
        return jsonify({"error": "Gider bulunamadı"}), 404
    
    data = request.get_json()
    
    if not data or 'category' not in data:
        return jsonify({"error": "Kategori alanı gereklidir"}), 400
    
    new_category = data['category']
    
    # Kategori sistemde var mı kontrol et
    if new_category not in expense_service.categories:
        return jsonify({"error": "Geçersiz kategori"}), 400
    
    # İşlemi güncelle
    transaction.category_id = new_category
    transaction.custom_category = new_category  # Kullanıcı tarafından belirlendiğini işaretle
    transaction.is_tax_deductible = new_category in expense_service.tax_deductible_categories
    
    # Değişiklikleri kaydet
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': "Gider kategorisi başarıyla güncellendi",
        'transaction': {
            'id': transaction.id,
            'category': new_category,
            'is_tax_deductible': transaction.is_tax_deductible
        }
    }), 200

@expenses_bp.route('/tax-deductible', methods=['GET'])
@jwt_required()
def get_tax_deductible_expenses():
    """Vergi indirimine tabi giderleri döndürür"""
    current_user_id = get_jwt_identity()
    
    # Zaman aralığı parametreleri
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    # Sorgu oluştur (vergi indirimine tabi giderler)
    query = Transaction.query.filter_by(
        user_id=current_user_id,
        is_tax_deductible=True
    ).filter(Transaction.amount > 0)
    
    # Tarih filtrelerini uygula
    if start_date:
        query = query.filter(Transaction.date >= datetime.datetime.strptime(start_date, '%Y-%m-%d').date())
    
    if end_date:
        query = query.filter(Transaction.date <= datetime.datetime.strptime(end_date, '%Y-%m-%d').date())
    
    # Son tarihe göre sırala
    query = query.order_by(Transaction.date.desc())
    
    # Sayfalama
    pagination = query.paginate(page=page, per_page=per_page)
    
    # Sonuçları JSON olarak dönüştür
    expenses = []
    for transaction in pagination.items:
        expenses.append({
            "id": transaction.id,
            "transaction_id": transaction.transaction_id,
            "amount": transaction.amount,
            "date": transaction.date.isoformat(),
            "name": transaction.name,
            "merchant_name": transaction.merchant_name,
            "category": json.loads(transaction.category) if transaction.category else [],
            "category_id": transaction.category_id,
            "custom_category": transaction.custom_category
        })
    
    # Toplam vergi indirimine tabi tutar
    total_deductible_amount = sum(transaction.amount for transaction in pagination.items)
    
    return jsonify({
        "expenses": expenses,
        "total_count": pagination.total,
        "total_deductible_amount": total_deductible_amount,
        "pages": pagination.pages,
        "current_page": page
    }), 200 