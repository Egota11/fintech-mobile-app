import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences

class ExpenseCategorizationService:
    """
    Harcama işlemlerini otomatik olarak kategorilendirmek için AI servisi.
    
    Hem geleneksel makine öğrenmesi (RandomForest) hem de derin öğrenme (LSTM)
    modellerini kullanır.
    """
    
    def __init__(self, model_dir='models'):
        # Model dizinini belirle
        self.model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), model_dir)
        
        # Kategoriler
        self.categories = [
            'Barınma', 'Yiyecek ve İçecek', 'Ulaşım', 'Sağlık', 'Eğitim', 'Alışveriş',
            'Eğlence', 'Seyahat', 'İş Giderleri', 'Vergiler', 'Sigorta', 'Abonelikler',
            'Bağışlar', 'Diğer'
        ]
        
        # Vergi indirimine tabi kategoriler
        self.tax_deductible_categories = [
            'İş Giderleri', 'Sağlık', 'Eğitim', 'Vergiler', 'Sigorta'
        ]
        
        # Modelleri yükle
        self._load_models()
    
    def _load_models(self):
        """Makine öğrenmesi modellerini yükler"""
        try:
            # Geleneksel ML model (Random Forest) ve TF-IDF vektörleyici
            with open(os.path.join(self.model_dir, 'tfidf_vectorizer.pkl'), 'rb') as f:
                self.vectorizer = pickle.load(f)
            
            with open(os.path.join(self.model_dir, 'random_forest_model.pkl'), 'rb') as f:
                self.rf_model = pickle.load(f)
            
            # Derin öğrenme modeli (LSTM)
            with open(os.path.join(self.model_dir, 'tokenizer.pkl'), 'rb') as f:
                self.tokenizer = pickle.load(f)
            
            self.lstm_model = load_model(os.path.join(self.model_dir, 'lstm_model.h5'))
            
            self.models_loaded = True
        except (FileNotFoundError, OSError):
            # Modeller henüz eğitilmemiş veya kaydedilmemiş
            self.models_loaded = False
            print("Modeller bulunamadı. Kategorizasyon servisini kullanmadan önce modelleri eğitin.")
    
    def categorize_transaction(self, transaction_data):
        """
        Bir işlemi analiz eder ve kategorisini tahmin eder
        
        Args:
            transaction_data (dict): İşlem bilgilerini içeren sözlük
                                    (name, amount, merchant_name, etc.)
        
        Returns:
            dict: Kategori tahminini içeren sözlük
                {
                    'category': 'Tahmin edilen kategori',
                    'confidence': 0.95,  # Güven skoru (0-1)
                    'is_tax_deductible': True/False,
                    'all_predictions': [('Kategori1', 0.8), ('Kategori2', 0.1)]
                }
        """
        if not self.models_loaded:
            return {
                'category': 'Diğer',
                'confidence': 0.0,
                'is_tax_deductible': False,
                'all_predictions': []
            }
        
        # Tahmin için metin oluştur
        text = f"{transaction_data.get('name', '')} {transaction_data.get('merchant_name', '')}"
        
        # Random Forest modeli ile tahmin
        text_vectorized = self.vectorizer.transform([text])
        rf_prediction = self.rf_model.predict_proba(text_vectorized)[0]
        rf_category_idx = np.argmax(rf_prediction)
        rf_confidence = rf_prediction[rf_category_idx]
        
        # LSTM modeli ile tahmin
        sequences = self.tokenizer.texts_to_sequences([text])
        padded_sequences = pad_sequences(sequences, maxlen=50)
        lstm_prediction = self.lstm_model.predict(padded_sequences)[0]
        lstm_category_idx = np.argmax(lstm_prediction)
        lstm_confidence = lstm_prediction[lstm_category_idx]
        
        # İki modelin sonuçlarını birleştir (ensemble)
        ensemble_predictions = (rf_prediction + lstm_prediction) / 2
        category_idx = np.argmax(ensemble_predictions)
        confidence = ensemble_predictions[category_idx]
        
        # Tüm tahminleri sırala
        all_predictions = [(self.categories[i], float(ensemble_predictions[i])) 
                          for i in range(len(self.categories))]
        all_predictions.sort(key=lambda x: x[1], reverse=True)
        
        # Sonuçları döndür
        category = self.categories[category_idx]
        is_tax_deductible = category in self.tax_deductible_categories
        
        return {
            'category': category,
            'confidence': float(confidence),
            'is_tax_deductible': is_tax_deductible,
            'all_predictions': all_predictions[:3]  # En iyi 3 tahmini döndür
        }
    
    def train_models(self, transactions_data, labels):
        """
        Kategorizasyon modellerini eğitir ve kaydeder
        
        Args:
            transactions_data (list): İşlem metinleri listesi
            labels (list): Kategori etiketleri listesi
        
        Returns:
            dict: Eğitim sonuçları
        """
        # TF-IDF vektörleyici oluştur ve metinleri dönüştür
        self.vectorizer = TfidfVectorizer(max_features=5000)
        X = self.vectorizer.fit_transform(transactions_data)
        
        # Random Forest modelini eğit
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.rf_model.fit(X, labels)
        
        # LSTM için tokenizer oluştur
        self.tokenizer = Tokenizer(num_words=10000)
        self.tokenizer.fit_on_texts(transactions_data)
        sequences = self.tokenizer.texts_to_sequences(transactions_data)
        padded_sequences = pad_sequences(sequences, maxlen=50)
        
        # Kategorileri one-hot encode formatına dönüştür
        category_indices = {category: idx for idx, category in enumerate(self.categories)}
        y_encoded = np.zeros((len(labels), len(self.categories)))
        for i, label in enumerate(labels):
            y_encoded[i, category_indices[label]] = 1
        
        # LSTM modelini oluştur ve eğit
        self.lstm_model = tf.keras.Sequential([
            tf.keras.layers.Embedding(10000, 128, input_length=50),
            tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(64, return_sequences=True)),
            tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(32)),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.5),
            tf.keras.layers.Dense(len(self.categories), activation='softmax')
        ])
        
        self.lstm_model.compile(
            loss='categorical_crossentropy',
            optimizer='adam',
            metrics=['accuracy']
        )
        
        self.lstm_model.fit(
            padded_sequences, 
            y_encoded,
            epochs=10,
            batch_size=32,
            validation_split=0.2
        )
        
        # Modelleri kaydet
        os.makedirs(self.model_dir, exist_ok=True)
        
        with open(os.path.join(self.model_dir, 'tfidf_vectorizer.pkl'), 'wb') as f:
            pickle.dump(self.vectorizer, f)
        
        with open(os.path.join(self.model_dir, 'random_forest_model.pkl'), 'wb') as f:
            pickle.dump(self.rf_model, f)
        
        with open(os.path.join(self.model_dir, 'tokenizer.pkl'), 'wb') as f:
            pickle.dump(self.tokenizer, f)
        
        self.lstm_model.save(os.path.join(self.model_dir, 'lstm_model.h5'))
        
        self.models_loaded = True
        
        return {
            "status": "success",
            "message": "Modeller başarıyla eğitildi ve kaydedildi."
        } 