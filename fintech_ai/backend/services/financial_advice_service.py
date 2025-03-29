import datetime
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

class FinancialAdviceService:
    """
    Kullanıcının finansal verilerine dayalı kişiselleştirilmiş tavsiyeler
    üreten servis sınıfı.
    
    İşlevler:
    - Finansal durum değerlendirmesi
    - Kişiselleştirilmiş finansal tavsiyeler
    - Finansal hedef önerileri
    - Yatırım stratejileri
    """
    
    def __init__(self):
        # Kullanıcı finansal profil segmentleri
        self.financial_profiles = {
            'growth_seeker': {
                'description': 'Büyüme odaklı genç işletme',
                'income_growth_target': 0.2,  # %20 yıllık gelir artışı hedefi
                'savings_target': 0.1,  # Gelirin %10'u tasarruf hedefi
                'risk_tolerance': 'high'
            },
            'stability_seeker': {
                'description': 'İstikrar odaklı yerleşik işletme',
                'income_growth_target': 0.1,  # %10 yıllık gelir artışı hedefi
                'savings_target': 0.15,  # Gelirin %15'i tasarruf hedefi
                'risk_tolerance': 'medium'
            },
            'security_seeker': {
                'description': 'Güvenlik odaklı olgun işletme',
                'income_growth_target': 0.05,  # %5 yıllık gelir artışı hedefi
                'savings_target': 0.2,  # Gelirin %20'si tasarruf hedefi
                'risk_tolerance': 'low'
            }
        }
        
        # Finansal sağlık skor eşikleri
        self.financial_health_thresholds = {
            'excellent': 80,
            'good': 60,
            'fair': 40,
            'poor': 20
        }
        
        # Yatırım stratejileri
        self.investment_strategies = {
            'high_risk': {
                'description': 'Yüksek getiri potansiyelli, yüksek riskli stratejiler',
                'allocation': {
                    'stocks': 0.70,
                    'bonds': 0.15,
                    'cash': 0.05,
                    'alternative': 0.10
                },
                'suitable_for': ['growth_seeker']
            },
            'medium_risk': {
                'description': 'Dengeli, orta riskli stratejiler',
                'allocation': {
                    'stocks': 0.50,
                    'bonds': 0.30,
                    'cash': 0.10,
                    'alternative': 0.10
                },
                'suitable_for': ['growth_seeker', 'stability_seeker']
            },
            'low_risk': {
                'description': 'Koruma odaklı, düşük riskli stratejiler',
                'allocation': {
                    'stocks': 0.30,
                    'bonds': 0.40,
                    'cash': 0.25,
                    'alternative': 0.05
                },
                'suitable_for': ['stability_seeker', 'security_seeker']
            },
            'very_low_risk': {
                'description': 'Güvenlik odaklı, çok düşük riskli stratejiler',
                'allocation': {
                    'stocks': 0.10,
                    'bonds': 0.50,
                    'cash': 0.35,
                    'alternative': 0.05
                },
                'suitable_for': ['security_seeker']
            }
        }
    
    def analyze_financial_health(self, income_data, expense_data, balance, debts=None):
        """
        Kullanıcının finansal sağlığını analiz eder
        
        Args:
            income_data (dict): Aylık gelir verileri
            expense_data (dict): Aylık gider verileri
            balance (float): Mevcut nakit bakiyesi
            debts (dict): Borç bilgileri (opsiyonel)
            
        Returns:
            dict: Finansal sağlık analiz sonuçları
        """
        # Temel finansal oranları hesapla
        total_annual_income = sum(income_data.values())
        total_annual_expense = sum(expense_data.values())
        
        # Nakit akışı oranı (gelir/gider)
        if total_annual_expense > 0:
            cashflow_ratio = total_annual_income / total_annual_expense
        else:
            cashflow_ratio = float('inf')  # Gider sıfırsa, oran sonsuz
        
        # Tasarruf oranı (tasarruf/gelir)
        if total_annual_income > 0:
            savings = total_annual_income - total_annual_expense
            savings_ratio = max(0, savings) / total_annual_income
        else:
            savings_ratio = 0
        
        # Acil durum fonu yeterliliği (bakiye / aylık gider)
        monthly_expense = total_annual_expense / 12 if total_annual_expense > 0 else 0
        if monthly_expense > 0:
            emergency_fund_months = balance / monthly_expense
        else:
            emergency_fund_months = float('inf')
        
        # Borç oranı (toplam borç / yıllık gelir)
        total_debt = sum(debts.values()) if debts else 0
        if total_annual_income > 0:
            debt_to_income_ratio = total_debt / total_annual_income
        else:
            debt_to_income_ratio = float('inf')
        
        # Gelir büyüme trendi
        if len(income_data) >= 3:
            income_values = [income_data[month] for month in sorted(income_data.keys())]
            income_growth = (income_values[-1] / income_values[0] - 1) if income_values[0] > 0 else 0
        else:
            income_growth = 0
        
        # Finansal sağlık skoru hesaplama (0-100)
        # Faktörler ve ağırlıkları:
        # - Nakit akışı oranı (25%): 1.0 değerinde ideal, >2.0 çok iyi, <0.8 zayıf
        # - Tasarruf oranı (25%): >0.2 çok iyi, <0.05 zayıf
        # - Acil durum fonu (20%): >6 ay çok iyi, <2 ay zayıf
        # - Borç oranı (20%): <0.3 çok iyi, >0.5 zayıf
        # - Gelir büyüme trendi (10%): >0.1 çok iyi, <0 zayıf
        
        cashflow_score = min(25, 25 * min(cashflow_ratio / 1.5, 1.0))
        savings_score = min(25, 25 * min(savings_ratio / 0.2, 1.0))
        emergency_fund_score = min(20, 20 * min(emergency_fund_months / 6, 1.0))
        debt_score = min(20, 20 * (1 - min(debt_to_income_ratio / 0.5, 1.0)))
        growth_score = min(10, 10 * (0.5 + min(income_growth / 0.2, 0.5)))
        
        financial_health_score = cashflow_score + savings_score + emergency_fund_score + debt_score + growth_score
        
        # Skor kategorisi
        if financial_health_score >= self.financial_health_thresholds['excellent']:
            health_category = 'excellent'
        elif financial_health_score >= self.financial_health_thresholds['good']:
            health_category = 'good'
        elif financial_health_score >= self.financial_health_thresholds['fair']:
            health_category = 'fair'
        else:
            health_category = 'poor'
        
        # Kullanıcının finansal profil segmenti tahmin et
        financial_profile = self._determine_financial_profile(income_growth, savings_ratio, debt_to_income_ratio)
        
        return {
            'financial_health_score': financial_health_score,
            'health_category': health_category,
            'financial_profile': financial_profile,
            'metrics': {
                'cashflow_ratio': cashflow_ratio,
                'savings_ratio': savings_ratio,
                'emergency_fund_months': emergency_fund_months,
                'debt_to_income_ratio': debt_to_income_ratio,
                'income_growth': income_growth
            },
            'component_scores': {
                'cashflow_score': cashflow_score,
                'savings_score': savings_score,
                'emergency_fund_score': emergency_fund_score,
                'debt_score': debt_score,
                'growth_score': growth_score
            }
        }
    
    def generate_financial_advice(self, financial_health, transaction_data=None, expense_categories=None, goals=None):
        """
        Kullanıcıya özel finansal tavsiyeler üretir
        
        Args:
            financial_health (dict): Finansal sağlık analiz sonuçları
            transaction_data (list): İşlem verileri (opsiyonel)
            expense_categories (dict): Gider kategorileri (opsiyonel)
            goals (list): Kullanıcının finansal hedefleri (opsiyonel)
            
        Returns:
            dict: Kişiselleştirilmiş finansal tavsiyeler
        """
        advice = {
            'summary': '',
            'priorities': [],
            'detailed_advice': {}
        }
        
        # Finansal sağlık durumuna göre genel tavsiye
        health_category = financial_health['health_category']
        financial_profile = financial_health['financial_profile']
        metrics = financial_health['metrics']
        
        if health_category == 'excellent':
            advice['summary'] = 'Finansal durumunuz mükemmel! Şimdi büyüme ve yatırıma odaklanma zamanı.'
        elif health_category == 'good':
            advice['summary'] = 'Finansal durumunuz iyi. Birkaç iyileştirme ile mükemmel seviyeye çıkabilirsiniz.'
        elif health_category == 'fair':
            advice['summary'] = 'Finansal durumunuz orta seviyede. Bazı alanlarda iyileştirmeler yapmanız gerekiyor.'
        else:  # poor
            advice['summary'] = 'Finansal durumunuzda acil iyileştirmeler gerekiyor. Önceliklerinizi belirleyin.'
        
        # Öncelikli alanları belirle
        priorities = []
        
        if metrics['emergency_fund_months'] < 3:
            priorities.append({
                'area': 'emergency_fund',
                'title': 'Acil Durum Fonu Oluşturma',
                'description': f"Mevcut acil durum fonunuz {metrics['emergency_fund_months']:.1f} aylık giderinizi karşılıyor. Bu miktarı en az 3-6 aya çıkarın."
            })
        
        if metrics['debt_to_income_ratio'] > 0.4:
            priorities.append({
                'area': 'debt_reduction',
                'title': 'Borç Azaltma',
                'description': f"Borç/gelir oranınız {metrics['debt_to_income_ratio']:.2f}, bu yüksek bir oran. Bu oranı 0.3'ün altına indirmek için borç azaltma stratejisi uygulayın."
            })
        
        if metrics['savings_ratio'] < 0.1:
            priorities.append({
                'area': 'savings_increase',
                'title': 'Tasarruf Artırma',
                'description': f"Tasarruf oranınız %{metrics['savings_ratio']*100:.1f}. Bu oranı gelirin en az %10-15'ine çıkarmayı hedefleyin."
            })
        
        if metrics['cashflow_ratio'] < 1.2:
            priorities.append({
                'area': 'cashflow_improvement',
                'title': 'Nakit Akışı İyileştirme',
                'description': f"Nakit akışı oranınız {metrics['cashflow_ratio']:.2f}. Gelir artışı veya gider azaltma ile bu oranı 1.5'in üzerine çıkarmayı hedefleyin."
            })
        
        # Finansal profile göre büyüme tavsiyesi
        if financial_profile == 'growth_seeker' and metrics['income_growth'] < 0.15:
            priorities.append({
                'area': 'business_growth',
                'title': 'İş Büyüme Stratejisi',
                'description': f"Büyüme odaklı profiliniz için gelir artış hızınız (%{metrics['income_growth']*100:.1f}) yeterli değil. Yeni iş kolları veya müşteri segmentleri değerlendirin."
            })
        
        # Öncelikleri en önemliden daha az önemliye sırala
        priorities.sort(key=lambda x: {
            'emergency_fund': 1, 
            'debt_reduction': 2, 
            'cashflow_improvement': 3,
            'savings_increase': 4, 
            'business_growth': 5
        }.get(x['area'], 10))
        
        advice['priorities'] = priorities[:3]  # En önemli 3 önceliği al
        
        # Detaylı tavsiyeler
        detailed_advice = {}
        
        # Nakit akışı tavsiyesi
        if metrics['cashflow_ratio'] < 1.5:
            if expense_categories:
                # En yüksek gider kategorileri
                top_expenses = sorted(expense_categories.items(), key=lambda x: x[1], reverse=True)[:3]
                
                detailed_advice['cashflow'] = {
                    'title': 'Nakit Akışı İyileştirme',
                    'description': 'Nakit akışınızı iyileştirmek için aşağıdaki adımları değerlendirin:',
                    'recommendations': [
                        f"'{top_expenses[0][0]}' kategorisindeki harcamalarınızı gözden geçirin, potansiyel tasarruf %5-10 arası olabilir.",
                        'Fiyatlandırma stratejinizi gözden geçirin ve gelir artışı için fırsatları değerlendirin.',
                        'Nakit akışını tahmin etmek ve planlamak için aylık nakit akışı bütçesi oluşturun.'
                    ]
                }
        
        # Borç yönetimi tavsiyesi
        if 'debt_reduction' in [p['area'] for p in priorities]:
            detailed_advice['debt'] = {
                'title': 'Borç Yönetimi Stratejisi',
                'description': 'Borç yükünüzü azaltmak için aşağıdaki stratejileri değerlendirin:',
                'recommendations': [
                    'En yüksek faizli borçlarınızı önceliklendirerek hızlı ödeme planı yapın.',
                    'Mümkünse düşük faizli borç yapılandırması için finansal kurumlarla görüşün.',
                    'Ekstra gelir fırsatlarını değerlendirerek borç ödemelerine yönlendirin.',
                    'Yeni borç almaktan kaçının ve kredi kartı bakiyelerinizi sıfırlayın.'
                ]
            }
        
        # Acil durum fonu tavsiyesi
        if 'emergency_fund' in [p['area'] for p in priorities]:
            monthly_expense = metrics.get('monthly_expense', metrics.get('emergency_fund_months', 0))
            target_fund = monthly_expense * 6  # 6 aylık gider hedefi
            
            detailed_advice['emergency_fund'] = {
                'title': 'Acil Durum Fonu Oluşturma',
                'description': f"Güçlü bir finansal güvenlik ağı için {target_fund:.2f} TL tutarında (6 aylık gideriniz) acil durum fonu oluşturmanızı öneririz:",
                'recommendations': [
                    'Gelirinizin %5-10\'unu düzenli olarak acil durum fonuna aktarın.',
                    'Acil durum fonunuzu yüksek likiditeye sahip ve düşük riskli hesaplarda tutun.',
                    'Fonu sadece gerçek acil durumlar için kullanın, günlük harcamalar için kullanmaktan kaçının.',
                    'Hedefe ulaştıktan sonra, acil durum fonunuzu yılda en az bir kez güncelleyin.'
                ]
            }
        
        # Tasarruf ve yatırım tavsiyesi
        risk_tolerance = self.financial_profiles[financial_profile]['risk_tolerance']
        suitable_strategies = [
            strategy for strategy, details in self.investment_strategies.items() 
            if financial_profile in details['suitable_for']
        ]
        
        if suitable_strategies:
            recommended_strategy = suitable_strategies[0]
            strategy_details = self.investment_strategies[recommended_strategy]
            
            detailed_advice['investment'] = {
                'title': 'Tasarruf ve Yatırım Stratejisi',
                'description': f"Finansal profilinize ({self.financial_profiles[financial_profile]['description']}) uygun yatırım stratejisi: {strategy_details['description']}",
                'recommendations': [
                    f"Varlık dağılımı: {', '.join([f'{asset} %{int(alloc*100)}' for asset, alloc in strategy_details['allocation'].items()])}",
                    'Düzenli tasarruf alışkanlığı geliştirin, gelirinizin en az %10\'unu otomatik olarak yatırımlara yönlendirin.',
                    'Emeklilik planlaması için bireysel emeklilik sistemini değerlendirin.',
                    'Portföyünüzü çeşitlendirin ve düzenli olarak gözden geçirin.'
                ]
            }
        
        # İş büyüme stratejileri
        if financial_profile == 'growth_seeker':
            detailed_advice['business_growth'] = {
                'title': 'İş Büyüme Stratejileri',
                'description': 'İşinizi büyütmek ve gelir artışı sağlamak için aşağıdaki stratejileri değerlendirin:',
                'recommendations': [
                    'Yeni müşteri segmentleri veya pazarlar için pazar araştırması yapın.',
                    'Mevcut müşterilerinize ek ürün veya hizmetler sunarak çapraz satış fırsatları yaratın.',
                    'Dijital pazarlama kanallarını etkin kullanarak erişiminizi genişletin.',
                    'Stratejik iş birlikleri ile yeni pazarlara ulaşın.',
                    'Operasyonel verimliliği artırarak kâr marjlarınızı yükseltin.'
                ]
            }
        
        advice['detailed_advice'] = detailed_advice
        
        return advice
    
    def recommend_financial_goals(self, financial_health, current_goals=None):
        """
        Kullanıcının finansal durumuna göre hedefler önerir
        
        Args:
            financial_health (dict): Finansal sağlık analiz sonuçları
            current_goals (list): Kullanıcının mevcut hedefleri (opsiyonel)
            
        Returns:
            list: Önerilen finansal hedefler
        """
        recommended_goals = []
        profile = financial_health['financial_profile']
        metrics = financial_health['metrics']
        
        # Acil durum fonu hedefi
        if metrics['emergency_fund_months'] < 6:
            target_months = 6
            current_months = metrics['emergency_fund_months']
            monthly_expense = metrics.get('average_monthly_expense', 0)
            
            if monthly_expense > 0:
                goal_amount = (target_months - current_months) * monthly_expense
                
                if goal_amount > 0:
                    recommended_goals.append({
                        'type': 'emergency_fund',
                        'title': f"{target_months} Aylık Acil Durum Fonu Oluşturma",
                        'target_amount': goal_amount,
                        'current_amount': current_months * monthly_expense,
                        'priority': 'high',
                        'timeframe': 'short',  # 0-12 ay
                        'description': f"Mevcut {current_months:.1f} aylık acil durum fonunuzu {target_months} aya çıkarın."
                    })
        
        # Borç azaltma hedefi
        if metrics['debt_to_income_ratio'] > 0.3:
            current_ratio = metrics['debt_to_income_ratio']
            target_ratio = 0.3
            annual_income = metrics.get('annual_income', 0)
            
            if annual_income > 0:
                current_debt = current_ratio * annual_income
                target_debt = target_ratio * annual_income
                goal_amount = current_debt - target_debt
                
                if goal_amount > 0:
                    recommended_goals.append({
                        'type': 'debt_reduction',
                        'title': 'Borç Azaltma',
                        'target_amount': goal_amount,
                        'current_amount': current_debt,
                        'priority': 'high',
                        'timeframe': 'medium',  # 1-3 yıl
                        'description': f"Borç/gelir oranınızı %{current_ratio*100:.1f}'den %{target_ratio*100:.1f}'e düşürün."
                    })
        
        # Tasarruf hedefi
        target_savings_ratio = self.financial_profiles[profile]['savings_target']
        current_savings_ratio = metrics['savings_ratio']
        
        if current_savings_ratio < target_savings_ratio:
            annual_income = metrics.get('annual_income', 0)
            
            if annual_income > 0:
                monthly_target = (target_savings_ratio - current_savings_ratio) * annual_income / 12
                
                recommended_goals.append({
                    'type': 'savings_increase',
                    'title': 'Aylık Tasarruf Artırma',
                    'target_amount': monthly_target,
                    'current_amount': current_savings_ratio * annual_income / 12,
                    'priority': 'medium',
                    'timeframe': 'ongoing',
                    'description': f"Aylık tasarruf oranınızı %{current_savings_ratio*100:.1f}'den %{target_savings_ratio*100:.1f}'e çıkarın."
                })
        
        # Gelir artışı hedefi
        target_income_growth = self.financial_profiles[profile]['income_growth_target']
        current_income_growth = metrics['income_growth']
        
        if current_income_growth < target_income_growth:
            annual_income = metrics.get('annual_income', 0)
            
            if annual_income > 0:
                target_income = annual_income * (1 + target_income_growth)
                income_increase = target_income - annual_income
                
                recommended_goals.append({
                    'type': 'income_growth',
                    'title': 'Yıllık Gelir Artışı',
                    'target_amount': income_increase,
                    'current_amount': annual_income,
                    'priority': 'medium',
                    'timeframe': 'medium',  # 1-3 yıl
                    'description': f"Yıllık gelir büyümenizi %{current_income_growth*100:.1f}'den %{target_income_growth*100:.1f}'e çıkarın."
                })
        
        # Yatırım hedefi
        if metrics['savings_ratio'] > 0.1 and metrics['emergency_fund_months'] >= 3:
            annual_income = metrics.get('annual_income', 0)
            
            if annual_income > 0:
                investment_target = annual_income * 0.15  # Gelirin %15'i kadar yatırım
                
                recommended_goals.append({
                    'type': 'investment',
                    'title': 'Yıllık Yatırım Portföyü Oluşturma',
                    'target_amount': investment_target,
                    'current_amount': 0,  # Varsayılan olarak sıfırdan başlatıyoruz
                    'priority': 'medium',
                    'timeframe': 'long',  # 3+ yıl
                    'description': f"Gelirinizin %15'ini düzenli olarak uzun vadeli yatırım portföyüne ayırın."
                })
        
        # Emeklilik hedefi (uzun vadeli)
        if profile in ['stability_seeker', 'security_seeker']:
            annual_income = metrics.get('annual_income', 0)
            
            if annual_income > 0:
                retirement_target = annual_income * 15  # 15 yıllık gelir birikimi
                
                recommended_goals.append({
                    'type': 'retirement',
                    'title': 'Emeklilik Fonu Oluşturma',
                    'target_amount': retirement_target,
                    'current_amount': 0,  # Varsayılan olarak sıfırdan başlatıyoruz
                    'priority': 'low',
                    'timeframe': 'long',  # 3+ yıl
                    'description': f"Uzun vadeli finansal bağımsızlık için emeklilik fonu oluşturun."
                })
        
        # Eğer mevcut hedefler belirtilmişse, önerilen hedeflerle birleştir
        if current_goals:
            # Mevcut hedeflerin tiplerini belirle
            current_goal_types = [goal['type'] for goal in current_goals]
            
            # Sadece mevcut olmayan tipte hedefleri ekle
            recommended_goals = [
                goal for goal in recommended_goals 
                if goal['type'] not in current_goal_types
            ]
            
            # Tüm hedefleri birleştir
            combined_goals = current_goals + recommended_goals
            
            # Öncelik sırasına göre sırala
            priority_order = {'high': 0, 'medium': 1, 'low': 2}
            combined_goals.sort(key=lambda x: priority_order.get(x['priority'], 3))
            
            return combined_goals
        
        return recommended_goals
    
    def _determine_financial_profile(self, income_growth, savings_ratio, debt_ratio):
        """
        Finansal metrikler üzerinden kullanıcının finansal profilini belirler
        
        Args:
            income_growth (float): Gelir büyüme oranı
            savings_ratio (float): Tasarruf oranı
            debt_ratio (float): Borç/gelir oranı
            
        Returns:
            str: Finansal profil adı
        """
        # Basit bir kural tabanlı yaklaşım
        if income_growth > 0.15 and debt_ratio < 0.4:
            return 'growth_seeker'
        elif savings_ratio > 0.15 and debt_ratio < 0.3:
            return 'security_seeker'
        else:
            return 'stability_seeker'
        
        # Not: Gerçek bir uygulamada, burada daha sofistike bir makine öğrenmesi
        # modeli (örn. K-means kümeleme) kullanılabilir 