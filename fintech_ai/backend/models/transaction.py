from app import db
from sqlalchemy.sql import func

class Transaction(db.Model):
    """Kullanıcı banka işlemlerini temsil eden model"""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Plaid'den alınan işlem bilgileri
    transaction_id = db.Column(db.String(100), nullable=False)
    account_id = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    merchant_name = db.Column(db.String(255), nullable=True)
    category = db.Column(db.Text, nullable=True)  # JSON string: ["Food and Drink", "Restaurants"]
    category_id = db.Column(db.String(100), nullable=True)
    pending = db.Column(db.Boolean, default=False)
    payment_channel = db.Column(db.String(50), nullable=True)
    
    # İşlemin AI ile belirlenen özellikleri
    is_income = db.Column(db.Boolean, default=False)
    is_tax_deductible = db.Column(db.Boolean, default=False)
    custom_category = db.Column(db.String(100), nullable=True)  # Kullanıcı tarafından özelleştirilmiş kategori
    prediction_confidence = db.Column(db.Float, nullable=True)  # AI kategori tahmini güven skoru (0-1)
    
    # Zaman damgaları
    created_at = db.Column(db.DateTime, nullable=False, default=func.now())
    updated_at = db.Column(db.DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f'<Transaction {self.id}: {self.amount} on {self.date}>'
    
    @property
    def is_expense(self):
        """İşlemin bir gider olup olmadığını belirler"""
        return self.amount > 0
    
    @property
    def transaction_month(self):
        """İşlemin gerçekleştiği ayı döndürür (raporlama için)"""
        return f"{self.date.year}-{self.date.month:02d}" 