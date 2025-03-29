import datetime
import numpy as np
from sklearn.linear_model import LinearRegression
import pandas as pd

class TaxEstimationService:
    """
    Kullanıcının gelir ve gider verileri üzerinden vergi tahmini ve planlaması
    yapan servis sınıfı. 
    
    İşlemler:
    - Yıllık gelir vergisi tahmini
    - KDV tahmini
    - Vergi indirimleri ve kesintileri hesaplama
    - Vergi tasarrufu önerileri
    """
    
    def __init__(self):
        # Gelir vergisi dilimleri (2023 yılı için) - Gerçek değerlerle güncellenmelidir
        self.income_tax_brackets = [
            {'min': 0, 'max': 32000, 'rate': 0.15},
            {'min': 32000, 'max': 70000, 'rate': 0.20},
            {'min': 70000, 'max': 250000, 'rate': 0.27},
            {'min': 250000, 'max': 880000, 'rate': 0.35},
            {'min': 880000, 'max': float('inf'), 'rate': 0.40},
        ]
        
        # KDV oranları
        self.vat_rates = {
            'standard': 0.18,  # Standart oran
            'reduced': 0.08,   # İndirilmiş oran (gıda, kitap vb.)
            'special': 0.01    # Özel oran (bazı tarım ürünleri, kitaplar vb.)
        }
        
        # Vergi indirimine tabi olan gider kategorileri ve oranları
        self.tax_deductible_categories = {
            'İş Giderleri': 1.0,      # %100 indirilebilir
            'Sağlık': 0.5,            # %50 indirilebilir
            'Eğitim': 0.5,            # %50 indirilebilir
            'Bağışlar': 0.1,          # %10 indirilebilir (gelirin belirli bir oranına kadar)
            'Sigorta': 0.8,           # %80 indirilebilir
            'Emeklilik Katkısı': 0.7  # %70 indirilebilir
        }
    
    def calculate_income_tax(self, annual_income, deductions=0):
        """
        Yıllık gelir vergisi hesabı yapar
        
        Args:
            annual_income (float): Yıllık brüt gelir
            deductions (float): Vergi indirimleri toplamı
        
        Returns:
            dict: Vergi hesabı sonuçları
        """
        # Vergiye tabi geliri hesapla
        taxable_income = max(0, annual_income - deductions)
        
        # Vergi dilimleri üzerinden hesaplama
        total_tax = 0
        remaining_income = taxable_income
        tax_brackets_applied = []
        
        for bracket in self.income_tax_brackets:
            if remaining_income <= 0:
                break
            
            bracket_min = bracket['min']
            bracket_max = bracket['max']
            bracket_rate = bracket['rate']
            
            if remaining_income > bracket_max - bracket_min:
                # Bu dilimin tamamı kullanılıyor
                bracket_tax = (bracket_max - bracket_min) * bracket_rate
                bracket_amount = bracket_max - bracket_min
                remaining_income -= bracket_amount
            else:
                # Bu dilimin bir kısmı kullanılıyor
                bracket_tax = remaining_income * bracket_rate
                bracket_amount = remaining_income
                remaining_income = 0
            
            total_tax += bracket_tax
            
            tax_brackets_applied.append({
                'bracket': f"{bracket_min} - {bracket_max}",
                'rate': bracket_rate,
                'amount': bracket_amount,
                'tax': bracket_tax
            })
        
        # Efektif vergi oranı
        effective_tax_rate = total_tax / annual_income if annual_income > 0 else 0
        
        return {
            'annual_income': annual_income,
            'deductions': deductions,
            'taxable_income': taxable_income,
            'total_tax': total_tax,
            'effective_tax_rate': effective_tax_rate,
            'tax_brackets_applied': tax_brackets_applied,
            'net_income': annual_income - total_tax
        }
    
    def calculate_vat(self, transactions):
        """
        İşlemler üzerinden KDV hesabı yapar
        
        Args:
            transactions (list): İşlem nesneleri listesi
        
        Returns:
            dict: KDV hesabı sonuçları
        """
        total_vat = 0
        total_amount = 0
        vat_by_rate = {
            'standard': 0,
            'reduced': 0,
            'special': 0
        }
        
        for transaction in transactions:
            # İşlem tutarı
            amount = transaction.get('amount', 0)
            
            # İşlem KDV oranı (varsayılan: standart)
            vat_rate_type = transaction.get('vat_rate_type', 'standard')
            vat_rate = self.vat_rates.get(vat_rate_type, self.vat_rates['standard'])
            
            # KDV tutarını hesapla
            vat_amount = amount * vat_rate
            
            total_vat += vat_amount
            total_amount += amount
            vat_by_rate[vat_rate_type] += vat_amount
        
        return {
            'total_vat': total_vat,
            'total_amount': total_amount,
            'vat_by_rate': vat_by_rate
        }
    
    def calculate_deductions(self, expenses):
        """
        Giderler üzerinden vergi indirimlerini hesaplar
        
        Args:
            expenses (list): Gider nesneleri listesi
        
        Returns:
            dict: Vergi indirimleri hesabı sonuçları
        """
        total_deductible = 0
        deductions_by_category = {}
        
        for expense in expenses:
            # Gider kategorisi ve tutarı
            category = expense.get('category', 'Diğer')
            amount = expense.get('amount', 0)
            
            # Kategori vergi indirimine tabi mi?
            if category in self.tax_deductible_categories:
                deduction_rate = self.tax_deductible_categories[category]
                deductible_amount = amount * deduction_rate
                
                total_deductible += deductible_amount
                
                # Kategoriye göre toplamları güncelle
                if category in deductions_by_category:
                    deductions_by_category[category] += deductible_amount
                else:
                    deductions_by_category[category] = deductible_amount
        
        return {
            'total_deductible': total_deductible,
            'deductions_by_category': deductions_by_category
        }
    
    def estimate_annual_tax(self, income_data, expenses_data, tax_year=None):
        """
        Yıllık vergi tahmini yapar
        
        Args:
            income_data (dict): Aylık gelir verileri
            expenses_data (dict): Aylık gider verileri
            tax_year (int): Vergi yılı (varsayılan: mevcut yıl)
        
        Returns:
            dict: Vergi tahmini sonuçları
        """
        # Vergi yılını belirle
        if tax_year is None:
            tax_year = datetime.datetime.now().year
        
        # Yıllık gelir ve giderleri hesapla
        annual_income = sum(income_data.values())
        
        # Gider kategorilerine göre vergi indirimlerini hesapla
        deductions_result = self.calculate_deductions(expenses_data)
        total_deductions = deductions_result['total_deductible']
        
        # Gelir vergisi hesabı
        income_tax_result = self.calculate_income_tax(annual_income, total_deductions)
        
        # Tahmini KDV hesabı
        vat_result = self.calculate_vat(expenses_data)
        
        return {
            'tax_year': tax_year,
            'annual_income': annual_income,
            'deductions': deductions_result,
            'income_tax': income_tax_result,
            'vat': vat_result,
            'total_tax_liability': income_tax_result['total_tax'] + vat_result['total_vat']
        }
    
    def forecast_tax_liability(self, historical_income, historical_expenses, months_ahead=12):
        """
        Geçmiş veriler üzerinden gelecek vergi yükümlülüğünü tahmin eder
        
        Args:
            historical_income (dict): Aylık gelir geçmişi
            historical_expenses (dict): Aylık gider geçmişi
            months_ahead (int): Kaç ay ilerisi için tahmin yapılacağı
        
        Returns:
            dict: Gelecek vergi tahmini
        """
        # Gelir tahmini için
        income_months = sorted(list(historical_income.keys()))
        income_values = [historical_income[month] for month in income_months]
        
        # Gider tahmini için
        expense_months = sorted(list(historical_expenses.keys()))
        expense_values = [historical_expenses[month] for month in expense_months]
        
        # Basit doğrusal regresyon ile tahmin
        X_income = np.array(range(len(income_months))).reshape(-1, 1)
        X_expense = np.array(range(len(expense_months))).reshape(-1, 1)
        
        # Gelir modeli
        income_model = LinearRegression()
        income_model.fit(X_income, income_values)
        
        # Gider modeli
        expense_model = LinearRegression()
        expense_model.fit(X_expense, expense_values)
        
        # Gelecek aylar için tahminler
        future_months = []
        future_income = []
        future_expenses = []
        future_taxes = []
        
        last_month = max(income_months[-1], expense_months[-1])
        last_date = datetime.datetime.strptime(last_month, '%Y-%m')
        
        for i in range(1, months_ahead + 1):
            future_date = last_date + datetime.timedelta(days=30*i)
            future_month = future_date.strftime('%Y-%m')
            future_months.append(future_month)
            
            # Gelir tahmini
            future_income_value = income_model.predict([[len(income_months) + i - 1]])[0]
            future_income.append(future_income_value)
            
            # Gider tahmini
            future_expense_value = expense_model.predict([[len(expense_months) + i - 1]])[0]
            future_expenses.append(future_expense_value)
            
            # Vergi tahmini (basitleştirilmiş)
            income_tax = future_income_value * 0.25  # Ortalama bir oran
            future_taxes.append(income_tax)
        
        return {
            'months': future_months,
            'income': future_income,
            'expenses': future_expenses,
            'taxes': future_taxes,
            'total_estimated_tax': sum(future_taxes)
        }
    
    def suggest_tax_savings(self, income_data, expenses_data):
        """
        Vergi tasarrufu önerileri sunar
        
        Args:
            income_data (dict): Aylık gelir verileri
            expenses_data (dict): Aylık gider verileri
        
        Returns:
            list: Vergi tasarrufu önerileri
        """
        suggestions = []
        
        # Mevcut vergi durumunu hesapla
        current_tax = self.estimate_annual_tax(income_data, expenses_data)
        current_liability = current_tax['total_tax_liability']
        
        # Gelir dengesi kontrolü
        if sum(income_data.values()) > 0:
            top_month = max(income_data.items(), key=lambda x: x[1])[0]
            lowest_month = min(income_data.items(), key=lambda x: x[1])[0]
            
            if income_data[top_month] > income_data[lowest_month] * 2:
                suggestions.append({
                    'type': 'income_balance',
                    'title': 'Gelir Dengeleme',
                    'description': 'Gelirinizi yıl içine dengeli dağıtarak daha düşük vergi dilimlerinde kalabilirsiniz.',
                    'saving_potential': 'Orta',
                    'implementation_difficulty': 'Orta'
                })
        
        # Gider kategorileri kontrolü
        deduction_potential = 0
        for expense in expenses_data:
            category = expense.get('category', 'Diğer')
            amount = expense.get('amount', 0)
            
            if category not in self.tax_deductible_categories:
                # Bu gider vergi indirimine tabi değil
                similar_deductible = self._find_similar_deductible_category(category)
                
                if similar_deductible:
                    suggestions.append({
                        'type': 'expense_recategorization',
                        'title': f'Gider Yeniden Kategorilendirme: {category}',
                        'description': f'"{category}" giderlerinizi "{similar_deductible}" olarak kategorilendirmeyi düşünün.',
                        'saving_potential': 'Düşük-Orta',
                        'implementation_difficulty': 'Kolay'
                    })
                    deduction_potential += amount * self.tax_deductible_categories[similar_deductible]
        
        # İndirim potansiyelini değerlendir
        if deduction_potential > 0:
            new_deductions = current_tax['deductions']['total_deductible'] + deduction_potential
            new_tax = self.calculate_income_tax(sum(income_data.values()), new_deductions)
            potential_saving = current_tax['income_tax']['total_tax'] - new_tax['total_tax']
            
            if potential_saving > 0:
                suggestions.append({
                    'type': 'deduction_increase',
                    'title': 'Vergi İndirimi Artırımı',
                    'description': 'Giderlerinizi daha iyi kategorilendirerek yaklaşık '
                                  f'{potential_saving:.2f} TL vergi tasarrufu sağlayabilirsiniz.',
                    'saving_potential': 'Yüksek' if potential_saving > 5000 else 'Orta',
                    'implementation_difficulty': 'Kolay'
                })
        
        # Şirket yapısı önerisi
        annual_income = sum(income_data.values())
        if annual_income > 250000:  # Yüksek gelirli freelancer için
            suggestions.append({
                'type': 'business_structure',
                'title': 'Şirket Kurulumu Düşünün',
                'description': 'Gelir düzeyiniz şirket kurarak vergi avantajlarından '
                              'yararlanmak için uygun. Bu, kişisel gelir vergisinden daha avantajlı olabilir.',
                'saving_potential': 'Yüksek',
                'implementation_difficulty': 'Zor'
            })
        
        # Emeklilik katkısı önerisi
        retirement_expenses = [e for e in expenses_data if e.get('category') == 'Emeklilik Katkısı']
        retirement_total = sum(e.get('amount', 0) for e in retirement_expenses)
        
        if retirement_total < annual_income * 0.1:  # Gelirin %10'undan az emeklilik katkısı
            suggestions.append({
                'type': 'retirement_contribution',
                'title': 'Emeklilik Katkısını Artırın',
                'description': 'Bireysel emeklilik katkılarınızı artırarak vergi avantajlarından yararlanabilirsiniz.',
                'saving_potential': 'Orta',
                'implementation_difficulty': 'Kolay'
            })
        
        return suggestions
    
    def _find_similar_deductible_category(self, category):
        """
        Vergi indirimine tabi olmayan bir kategori için benzer indirilebilir kategori önerir
        
        Args:
            category (str): Mevcut kategori
        
        Returns:
            str: Benzer indirilebilir kategori (veya None)
        """
        # Basit bir benzerlik algoritması - gerçek uygulamada daha gelişmiş olabilir
        category_lower = category.lower()
        
        if 'iş' in category_lower or 'ofis' in category_lower or 'ekipman' in category_lower:
            return 'İş Giderleri'
        elif 'sağlık' in category_lower or 'doktor' in category_lower or 'ilaç' in category_lower:
            return 'Sağlık'
        elif 'eğitim' in category_lower or 'kurs' in category_lower or 'seminer' in category_lower:
            return 'Eğitim'
        elif 'bağış' in category_lower or 'yardım' in category_lower:
            return 'Bağışlar'
        elif 'sigorta' in category_lower:
            return 'Sigorta'
        elif 'emeklilik' in category_lower or 'bireysel emeklilik' in category_lower:
            return 'Emeklilik Katkısı'
        
        return None 