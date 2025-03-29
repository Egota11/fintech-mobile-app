from app import db
from sqlalchemy.sql import func

class User(db.Model):
    """Kullanıcı hesaplarını temsil eden model"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    company_name = db.Column(db.String(100), nullable=False)
    business_type = db.Column(db.String(50), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    
    # Plaid API entegrasyonu için
    plaid_access_token = db.Column(db.String(256), nullable=True)
    plaid_item_id = db.Column(db.String(256), nullable=True)
    
    # QuickBooks/Xero entegrasyonu için
    quickbooks_token = db.Column(db.String(512), nullable=True)
    xero_token = db.Column(db.String(512), nullable=True)
    
    # Zaman damgaları
    created_at = db.Column(db.DateTime, nullable=False, default=func.now())
    updated_at = db.Column(db.DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # İlişkiler
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')
    income_predictions = db.relationship('IncomePrediction', backref='user', lazy=True, cascade='all, delete-orphan')
    tax_estimates = db.relationship('TaxEstimate', backref='user', lazy=True, cascade='all, delete-orphan')
    cash_flow_alerts = db.relationship('CashFlowAlert', backref='user', lazy=True, cascade='all, delete-orphan')
    financial_advice = db.relationship('FinancialAdvice', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    @property
    def is_bank_connected(self):
        """Kullanıcının banka hesabının bağlı olup olmadığını kontrol eder"""
        return self.plaid_access_token is not None
    
    @property
    def is_accounting_connected(self):
        """Kullanıcının muhasebe yazılımı hesabının bağlı olup olmadığını kontrol eder"""
        return self.quickbooks_token is not None or self.xero_token is not None 