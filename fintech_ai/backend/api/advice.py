from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.expense import Expense
from models.income import Income
from models.budget import Budget
from models.financial_goal import FinancialGoal
from services.financial_advice_service import FinancialAdviceService
from services.ai_response_service import AIResponseService
import datetime

advice_bp = Blueprint('advice', __name__)
financial_advice_service = FinancialAdviceService()
ai_response_service = AIResponseService()

@advice_bp.route('/financial-health', methods=['GET'])
@jwt_required()
def get_financial_health():
    """
    Kullanıcının finansal sağlık durumunu ve kişiselleştirilmiş tavsiyeleri döndürür
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    # Son 12 ayın gelir ve gider verilerini al
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=365)
    
    expenses = Expense.query.filter_by(user_id=user_id).filter(
        Expense.date >= start_date.date(),
        Expense.date <= end_date.date()
    ).all()
    
    incomes = Income.query.filter_by(user_id=user_id).filter(
        Income.date >= start_date.date(),
        Income.date <= end_date.date()
    ).all()
    
    # Verileri aylık olarak gruplandır
    expense_data = {}
    income_data = {}
    
    for expense in expenses:
        month_key = expense.date.strftime('%Y-%m')
        if month_key in expense_data:
            expense_data[month_key] += expense.amount
        else:
            expense_data[month_key] = expense.amount
    
    for income in incomes:
        month_key = income.date.strftime('%Y-%m')
        if month_key in income_data:
            income_data[month_key] += income.amount
        else:
            income_data[month_key] = income.amount
    
    # Mevcut bakiye ve borç verilerini hesapla
    balance = user.current_balance
    
    debts = {}  # TODO: Borç verilerini getir
    
    # Finansal sağlık analizi
    financial_health = financial_advice_service.analyze_financial_health(
        income_data, expense_data, balance, debts
    )
    
    # Kategori bazlı gider analizini hazırla
    expense_categories = {}
    for expense in expenses:
        if expense.category in expense_categories:
            expense_categories[expense.category] += expense.amount
        else:
            expense_categories[expense.category] = expense.amount
    
    # Finansal hedefleri al
    goals = FinancialGoal.query.filter_by(user_id=user_id).all()
    user_goals = [
        {
            'id': goal.id,
            'name': goal.name,
            'target_amount': goal.target_amount,
            'current_amount': goal.current_amount,
            'deadline': goal.deadline.strftime('%Y-%m-%d') if goal.deadline else None,
            'priority': goal.priority
        }
        for goal in goals
    ]
    
    # Finansal tavsiyeler
    advice = financial_advice_service.generate_financial_advice(
        financial_health,
        expense_categories=expense_categories,
        goals=user_goals
    )
    
    # Bütçeleri getir
    budgets = Budget.query.filter_by(user_id=user_id).all()
    budget_data = [
        {
            'category': budget.category,
            'amount': budget.amount,
            'period': budget.period
        }
        for budget in budgets
    ]
    
    # Sonuçları birleştir
    result = {
        'financial_health': financial_health,
        'advice': advice,
        'expense_categories': expense_categories,
        'budgets': budget_data,
        'goals': user_goals
    }
    
    return jsonify(result), 200

@advice_bp.route('/ai-response', methods=['POST'])
@jwt_required()
def get_ai_response():
    """
    Kullanıcı sorusuna OpenAI API üzerinden yanıt üretir
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"error": "Kullanıcı bulunamadı"}), 404
    
    # İstek gövdesinden kullanıcı mesajını al
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "Mesaj sağlanmadı"}), 400
    
    user_message = data['message']
    
    # Kullanıcının finansal verilerini hazırla
    financial_data = {}
    
    # Son 30 günlük giderleri al
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=30)
    
    expenses = Expense.query.filter_by(user_id=user_id).filter(
        Expense.date >= start_date.date(),
        Expense.date <= end_date.date()
    ).all()
    
    # Kategori bazlı giderleri grupla
    expense_categories = {}
    total_expenses = 0
    for expense in expenses:
        total_expenses += expense.amount
        if expense.category in expense_categories:
            expense_categories[expense.category] += expense.amount
        else:
            expense_categories[expense.category] = expense.amount
    
    # Gelir verilerini al
    incomes = Income.query.filter_by(user_id=user_id).filter(
        Income.date >= start_date.date(),
        Income.date <= end_date.date()
    ).all()
    
    total_income = sum(income.amount for income in incomes)
    
    # Bütçe verilerini al
    budgets = Budget.query.filter_by(user_id=user_id).all()
    budget_data = {}
    for budget in budgets:
        # Bütçenin ne kadarının kullanıldığını hesapla
        used_amount = expense_categories.get(budget.category, 0)
        remaining = budget.amount - used_amount
        budget_data[budget.category] = {
            'limit': budget.amount,
            'used': used_amount,
            'remaining': remaining,
            'status': 'İyi' if remaining > (budget.amount * 0.2) else 'Dikkat'
        }
    
    # Finansal hedefleri al
    goals = FinancialGoal.query.filter_by(user_id=user_id).all()
    goals_data = []
    for goal in goals:
        progress = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0
        goals_data.append({
            'name': goal.name,
            'target': goal.target_amount,
            'current': goal.current_amount,
            'progress': progress,
            'deadline': goal.deadline.strftime('%Y-%m-%d') if goal.deadline else None
        })
    
    # Mevcut bakiye
    current_balance = user.current_balance
    
    # Tüm finansal verileri bir araya getir
    financial_data = {
        'user': {
            'name': user.full_name,
            'company': user.company_name
        },
        'current_month': end_date.strftime('%B %Y'),  # Örn: "Mart 2023"
        'monthly_income': total_income,
        'monthly_expenses': total_expenses,
        'savings': max(0, total_income - total_expenses),
        'savings_rate': (max(0, total_income - total_expenses) / total_income * 100) if total_income > 0 else 0,
        'current_balance': current_balance,
        'expense_categories': expense_categories,
        'budgets': budget_data,
        'goals': goals_data
    }
    
    # AI yanıtını al
    ai_response = ai_response_service.get_response(user_message, financial_data)
    
    return jsonify({
        'response': ai_response
    }), 200

# Kimlik doğrulama gerektirmeyen basit AI yanıt endpointi
@advice_bp.route('/public-ai-response', methods=['POST'])
def get_public_ai_response():
    """
    Kullanıcı sorusuna giriş yapmadan basit AI yanıtı üretir
    """
    # İstek gövdesinden kullanıcı mesajını al
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "Mesaj sağlanmadı"}), 400
    
    user_message = data['message']
    force_refresh = data.get('force_refresh', True)
    
    # Demo finansal veriler
    financial_data = {
        'user': {
            'name': 'Demo Kullanıcı',
            'company': 'Demo Şirket'
        },
        'current_month': datetime.datetime.now().strftime('%B %Y'),
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
    ai_response = ai_response_service.get_response(user_message, financial_data, force_refresh)
    
    return jsonify({
        'response': ai_response
    }), 200 