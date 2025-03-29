import datetime
import pandas as pd
import numpy as np

class CashflowService:
    """
    Nakit akışı yönetimi ve izleme servisi.
    
    İşlevler:
    - Nakit akışı analizi
    - Nakit akışı tahmini
    - Nakit eksikliği risk tespiti
    - İyileştirme önerileri
    """
    
    def __init__(self):
        # Nakit akışı uyarı eşikleri
        self.alert_thresholds = {
            'low_balance': 5000,  # 5.000 TL altındaki nakit bakiyesi için uyarı
            'cash_flow_negative': 0,  # Negatif nakit akışı için uyarı
            'expense_spike': 1.5,  # Ortalama giderin 1.5 katı üzerindeki giderler için uyarı
            'income_drop': 0.7,  # Ortalama gelirin %70'in altına düşen gelirler için uyarı
            'runway_months': 3  # 3 aydan az nakit ömrü için uyarı
        }
    
    def analyze_cashflow(self, income_data, expense_data, balance=None):
        """
        Nakit akışı analizi yapar
        
        Args:
            income_data (dict): Aylık gelir verileri {'2023-01': 5000, ...}
            expense_data (dict): Aylık gider verileri {'2023-01': 3000, ...}
            balance (float): Mevcut nakit bakiyesi (değer verilmezse hesaplanır)
        
        Returns:
            dict: Nakit akışı analiz sonuçları
        """
        # Veriyi DataFrame'e dönüştür
        months = sorted(list(set(income_data.keys()) | set(expense_data.keys())))
        cashflow_df = pd.DataFrame(index=months, columns=['income', 'expense', 'net', 'cumulative'])
        
        # Gelir ve gider verilerini doldur
        for month in months:
            cashflow_df.loc[month, 'income'] = income_data.get(month, 0)
            cashflow_df.loc[month, 'expense'] = expense_data.get(month, 0)
        
        # Net ve kümülatif nakit akışını hesapla
        cashflow_df['net'] = cashflow_df['income'] - cashflow_df['expense']
        cashflow_df['cumulative'] = cashflow_df['net'].cumsum()
        
        # Eğer başlangıç bakiyesi belirtilmişse, kümülatif değerlere ekle
        if balance is not None:
            cashflow_df['cumulative'] += balance
        
        # Temel istatistikler
        total_income = cashflow_df['income'].sum()
        total_expense = cashflow_df['expense'].sum()
        net_cashflow = total_income - total_expense
        average_monthly_income = cashflow_df['income'].mean()
        average_monthly_expense = cashflow_df['expense'].mean()
        current_balance = cashflow_df['cumulative'].iloc[-1] if balance is None else balance + net_cashflow
        
        # Gelir ve gider trendi
        income_trend = self._calculate_trend(cashflow_df['income'])
        expense_trend = self._calculate_trend(cashflow_df['expense'])
        
        # Nakit ömrü hesaplama (mevcut gider hızıyla kaç ay dayanabilir)
        if average_monthly_expense > 0:
            runway_months = current_balance / average_monthly_expense
        else:
            runway_months = float('inf')  # Gider yoksa sonsuz nakit ömrü
        
        # Nakit akışı verimliliği (gelirin ne kadarı tasarruf ediliyor)
        if total_income > 0:
            cashflow_efficiency = net_cashflow / total_income
        else:
            cashflow_efficiency = 0
        
        # Nakit dalgalanması (standart sapma / ortalama)
        cashflow_volatility = cashflow_df['net'].std() / abs(cashflow_df['net'].mean()) if cashflow_df['net'].mean() != 0 else 0
        
        return {
            'total_income': total_income,
            'total_expense': total_expense,
            'net_cashflow': net_cashflow,
            'average_monthly_income': average_monthly_income,
            'average_monthly_expense': average_monthly_expense,
            'current_balance': current_balance,
            'income_trend': income_trend,
            'expense_trend': expense_trend,
            'runway_months': runway_months,
            'cashflow_efficiency': cashflow_efficiency,
            'cashflow_volatility': cashflow_volatility,
            'monthly_data': cashflow_df.to_dict('index')
        }
    
    def forecast_cashflow(self, income_data, expense_data, balance, months_ahead=3):
        """
        Gelecek aylar için nakit akışı tahmini yapar
        
        Args:
            income_data (dict): Aylık gelir verileri
            expense_data (dict): Aylık gider verileri
            balance (float): Mevcut nakit bakiyesi
            months_ahead (int): Kaç ay ilerisi için tahmin yapılacağı
        
        Returns:
            dict: Nakit akışı tahmin sonuçları
        """
        # Basit trend analizi ile gelecek ayları tahmin et
        months = sorted(list(set(income_data.keys()) | set(expense_data.keys())))
        income_values = [income_data.get(month, 0) for month in months]
        expense_values = [expense_data.get(month, 0) for month in months]
        
        # Gelir ve gider dizilerinin uzunluğu en az 2 olmalı
        if len(income_values) < 2 or len(expense_values) < 2:
            return {
                'error': 'Tahmin için yeterli veri yok. En az 2 aylık veri gerekli.'
            }
        
        # Trend hesaplama
        income_trend = self._calculate_trend(pd.Series(income_values))
        expense_trend = self._calculate_trend(pd.Series(expense_values))
        
        # Son değerler
        last_income = income_values[-1]
        last_expense = expense_values[-1]
        
        # Gelecek ayları tahmin et
        forecast_months = []
        forecast_income = []
        forecast_expense = []
        forecast_net = []
        forecast_balance = []
        
        current_balance = balance
        last_month = datetime.datetime.strptime(months[-1], '%Y-%m')
        
        for i in range(1, months_ahead + 1):
            # Gelecek ay
            next_month = last_month + datetime.timedelta(days=30 * i)
            forecast_month = next_month.strftime('%Y-%m')
            forecast_months.append(forecast_month)
            
            # Gelir tahmini (trend ile)
            next_income = max(0, last_income * (1 + income_trend))
            forecast_income.append(next_income)
            last_income = next_income
            
            # Gider tahmini (trend ile)
            next_expense = max(0, last_expense * (1 + expense_trend))
            forecast_expense.append(next_expense)
            last_expense = next_expense
            
            # Net nakit akışı
            next_net = next_income - next_expense
            forecast_net.append(next_net)
            
            # Bakiye güncelleme
            current_balance += next_net
            forecast_balance.append(current_balance)
        
        return {
            'forecast_months': forecast_months,
            'forecast_income': forecast_income,
            'forecast_expense': forecast_expense,
            'forecast_net': forecast_net,
            'forecast_balance': forecast_balance,
            'final_balance': forecast_balance[-1] if forecast_balance else balance
        }
    
    def detect_cashflow_risks(self, income_data, expense_data, balance):
        """
        Nakit akışı risklerini tespit eder
        
        Args:
            income_data (dict): Aylık gelir verileri
            expense_data (dict): Aylık gider verileri
            balance (float): Mevcut nakit bakiyesi
        
        Returns:
            list: Tespit edilen risk uyarıları
        """
        # Nakit akışı analizi yap
        analysis = self.analyze_cashflow(income_data, expense_data, balance)
        
        # Gelecek nakit akışı tahmini
        forecast = self.forecast_cashflow(income_data, expense_data, balance)
        
        # Riskler
        risks = []
        
        # Düşük bakiye riski
        if analysis['current_balance'] < self.alert_thresholds['low_balance']:
            risks.append({
                'type': 'low_balance',
                'severity': 'high',
                'message': f"Düşük nakit bakiyesi: {analysis['current_balance']:.2f} TL",
                'details': f"Mevcut nakit bakiyeniz {self.alert_thresholds['low_balance']} TL'nin altında."
            })
        
        # Negatif nakit akışı riski
        if analysis['net_cashflow'] < self.alert_thresholds['cash_flow_negative']:
            risks.append({
                'type': 'negative_cashflow',
                'severity': 'high',
                'message': f"Negatif nakit akışı: {analysis['net_cashflow']:.2f} TL",
                'details': "Son dönemde harcamalarınız gelirlerinizden fazla."
            })
        
        # Gider artış riski
        if len(expense_data) >= 3:
            recent_expenses = [expense_data[month] for month in sorted(expense_data.keys())[-3:]]
            avg_recent_expense = sum(recent_expenses) / 3
            
            if avg_recent_expense > analysis['average_monthly_expense'] * self.alert_thresholds['expense_spike']:
                risks.append({
                    'type': 'expense_spike',
                    'severity': 'medium',
                    'message': f"Gider artışı tespit edildi: {avg_recent_expense:.2f} TL",
                    'details': "Son 3 aydaki ortalama gideriniz, genel ortalamanızdan belirgin şekilde yüksek."
                })
        
        # Gelir düşüş riski
        if len(income_data) >= 3:
            recent_income = [income_data[month] for month in sorted(income_data.keys())[-3:]]
            avg_recent_income = sum(recent_income) / 3
            
            if avg_recent_income < analysis['average_monthly_income'] * self.alert_thresholds['income_drop']:
                risks.append({
                    'type': 'income_drop',
                    'severity': 'high',
                    'message': f"Gelir düşüşü tespit edildi: {avg_recent_income:.2f} TL",
                    'details': "Son 3 aydaki ortalama geliriniz, genel ortalamanızdan belirgin şekilde düşük."
                })
        
        # Nakit ömrü riski
        if analysis['runway_months'] < self.alert_thresholds['runway_months']:
            risks.append({
                'type': 'low_runway',
                'severity': 'critical',
                'message': f"Düşük nakit ömrü: {analysis['runway_months']:.1f} ay",
                'details': f"Mevcut gider hızınızla nakit bakiyeniz {analysis['runway_months']:.1f} ay içinde tükenebilir."
            })
        
        # Gelecekte nakit sorunu riski
        if forecast.get('final_balance', float('inf')) < 0:
            negative_month_index = next((i for i, bal in enumerate(forecast.get('forecast_balance', [])) if bal < 0), None)
            months_to_negative = negative_month_index + 1 if negative_month_index is not None else None
            
            if months_to_negative:
                risks.append({
                    'type': 'future_cashflow_problem',
                    'severity': 'high',
                    'message': f"Yaklaşan nakit sorunu: {months_to_negative} ay içinde",
                    'details': f"Mevcut trend devam ederse {months_to_negative} ay içinde nakit bakiyeniz negatife düşebilir."
                })
        
        return risks
    
    def suggest_cashflow_improvements(self, income_data, expense_data, balance, expense_categories=None):
        """
        Nakit akışını iyileştirme önerileri sunar
        
        Args:
            income_data (dict): Aylık gelir verileri
            expense_data (dict): Aylık gider verileri
            balance (float): Mevcut nakit bakiyesi
            expense_categories (dict): Gider kategorileri (opsiyonel)
            
        Returns:
            list: İyileştirme önerileri
        """
        # Nakit akışı analizi ve risk tespiti
        analysis = self.analyze_cashflow(income_data, expense_data, balance)
        risks = self.detect_cashflow_risks(income_data, expense_data, balance)
        
        # Öneriler
        suggestions = []
        
        # Ciddi riskler varsa acil önlemler
        critical_risks = [r for r in risks if r['severity'] in ['critical', 'high']]
        if critical_risks:
            # Acil nakit akışı iyileştirmesi gerekiyor
            suggestions.append({
                'type': 'emergency',
                'title': 'Acil Nakit Akışı İyileştirmesi',
                'description': 'Nakit akışınızda ciddi sorunlar tespit edildi. Acil önlemler almanız gerekiyor.',
                'actions': [
                    'Acil olmayan tüm harcamaları erteleyin',
                    'Alacaklarınızın tahsilatını hızlandırın',
                    'Faturalarınızın ödeme vadelerini uzatmak için görüşün',
                    'Kısa vadeli alternatif gelir kaynakları arayın'
                ]
            })
        
        # Gider azaltma önerileri
        if expense_categories and analysis['net_cashflow'] < 0:
            # En yüksek gider kategorilerini belirle
            top_categories = sorted(expense_categories.items(), key=lambda x: x[1], reverse=True)[:3]
            
            suggestions.append({
                'type': 'expense_reduction',
                'title': 'Gider Azaltma Önerileri',
                'description': 'Aşağıdaki en yüksek gider kategorilerinizde tasarruf yapabilirsiniz:',
                'categories': [{'name': cat, 'amount': amount} for cat, amount in top_categories],
                'actions': [
                    f"'{top_categories[0][0]}' kategorisindeki harcamalarınızı %10-15 azaltın",
                    'Sabit giderlerinizi gözden geçirin ve alternatif tedarikçiler bulun',
                    'Aboneliklerinizi ve düzenli ödemelerinizi kontrol edin'
                ]
            })
        
        # Gelir artırma önerileri
        if analysis['income_trend'] < 0 or analysis['average_monthly_income'] < analysis['average_monthly_expense'] * 1.2:
            suggestions.append({
                'type': 'income_increase',
                'title': 'Gelir Artırma Stratejileri',
                'description': 'Nakit akışınızı iyileştirmek için gelir artırma stratejileri uygulayabilirsiniz:',
                'actions': [
                    'Mevcut müşterilerinize ek hizmetler sunun',
                    'Fiyatlandırma stratejinizi gözden geçirin',
                    'Yeni potansiyel müşterilere ulaşın',
                    'Pasif gelir kaynakları oluşturun'
                ]
            })
        
        # Nakit akışı yönetimi önerileri
        suggestions.append({
            'type': 'cashflow_management',
            'title': 'Nakit Akışı Yönetimi İyileştirmeleri',
            'description': 'Nakit akışınızı daha iyi yönetmek için aşağıdaki stratejileri uygulayabilirsiniz:',
            'actions': [
                'Düzenli bir nakit akışı tahmini ve bütçe oluşturun',
                'Ödemeleri ve tahsilatları takvime bağlayın',
                'Acil durumlar için nakit rezervi ayırın (3-6 aylık giderleriniz kadar)',
                'Serbest nakit için kısa vadeli yatırım fırsatları değerlendirin'
            ]
        })
        
        # Nakit akışı düzensizse, dengeleme önerileri
        if analysis['cashflow_volatility'] > 0.3:  # %30'dan fazla dalgalanma
            suggestions.append({
                'type': 'cashflow_smoothing',
                'title': 'Nakit Akışı Dengeleme',
                'description': 'Nakit akışınızdaki dalgalanmaları azaltabilirsiniz:',
                'actions': [
                    'Müşteri sözleşmelerinizi daha düzenli ödemelere göre yapılandırın',
                    'Farklı sektörlerde müşteri çeşitlendirmesi yapın',
                    'Ön ödeme ve depozito uygulamaları ile nakit girişlerini düzenleyin',
                    'Büyük ödemeleri taksitlendirin'
                ]
            })
        
        return suggestions
    
    def _calculate_trend(self, data_series):
        """
        Zaman serisi verileri için basit trend hesaplama
        
        Args:
            data_series (Series): Zaman serisi veriler
            
        Returns:
            float: Trend katsayısı (pozitif: artış, negatif: azalış)
        """
        if len(data_series) < 2:
            return 0
        
        # Basit bir yöntem: son değer ile ilk değer arasındaki yüzde değişim
        first_value = data_series.iloc[0]
        last_value = data_series.iloc[-1]
        
        if first_value == 0:
            return 0  # Sıfıra bölme hatasını önle
        
        # Aylık ortalama değişim oranı
        n_periods = len(data_series) - 1
        if n_periods > 0 and first_value > 0:
            trend = (last_value / first_value) ** (1 / n_periods) - 1
        else:
            trend = 0
        
        return trend 