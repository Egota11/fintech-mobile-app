import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
import pickle
import datetime
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
import matplotlib.pyplot as plt
import io
import base64

class IncomePredictionService:
    """
    Kullanıcının geçmiş gelir verileri üzerinde tahmin modelleri oluşturan
    ve gelecek gelir tahminleri yapan servis.
    
    Farklı modeller kullanarak (LSTM, ARIMA, SARIMA) zamana bağlı serilerde
    tahmin yapar.
    """
    
    def __init__(self, model_dir='models'):
        """
        Args:
            model_dir (str): Model dosyalarının saklanacağı dizin
        """
        self.model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), model_dir)
        self.models_loaded = False
        self.scaler = None
        self.lstm_model = None
        self.arima_model = None
        self.sarima_model = None
        
        # Modelleri yükle
        self._load_models()
    
    def _load_models(self):
        """Kayıtlı modelleri yükler"""
        try:
            # LSTM modeli ve veri ölçekleyici
            self.lstm_model = load_model(os.path.join(self.model_dir, 'income_lstm_model.h5'))
            
            with open(os.path.join(self.model_dir, 'income_scaler.pkl'), 'rb') as f:
                self.scaler = pickle.load(f)
            
            # ARIMA ve SARIMA parametreleri
            with open(os.path.join(self.model_dir, 'arima_params.pkl'), 'rb') as f:
                self.arima_params = pickle.load(f)
            
            with open(os.path.join(self.model_dir, 'sarima_params.pkl'), 'rb') as f:
                self.sarima_params = pickle.load(f)
            
            self.models_loaded = True
        except (FileNotFoundError, OSError):
            self.models_loaded = False
            print("Gelir tahmin modelleri bulunamadı. Tahmin yapmadan önce modelleri eğitin.")
    
    def _create_lstm_model(self, input_shape):
        """LSTM ağı mimarisini oluşturur"""
        model = Sequential([
            LSTM(50, return_sequences=True, input_shape=input_shape),
            Dropout(0.2),
            LSTM(50, return_sequences=False),
            Dropout(0.2),
            Dense(25),
            Dense(1)
        ])
        
        model.compile(optimizer='adam', loss='mse')
        return model
    
    def _prepare_lstm_data(self, data, time_steps=12):
        """
        LSTM modeli için veriyi hazırlar
        
        Args:
            data (array): Gelir verileri (ölçeklenmiş)
            time_steps (int): Kaç dönem geriye bakılacağı
            
        Returns:
            tuple: X (girdi) ve y (çıktı) verileri
        """
        X, y = [], []
        for i in range(len(data) - time_steps):
            X.append(data[i:(i + time_steps), 0])
            y.append(data[i + time_steps, 0])
        
        return np.array(X), np.array(y)
    
    def _reshape_lstm_input(self, data, time_steps):
        """LSTM girdisini modele uygun şekilde yeniden şekillendirir"""
        return np.reshape(data, (data.shape[0], time_steps, 1))
    
    def train_models(self, income_data):
        """
        Gelir tahmin modellerini eğitir
        
        Args:
            income_data (dict): Aylık gelir verilerini içeren sözlük
                               {'2023-01': 5000, '2023-02': 5500, ...}
        
        Returns:
            dict: Eğitim sonuçları ve model performans metrikleri
        """
        # Veriyi düzenle
        df = pd.DataFrame(list(income_data.items()), columns=['date', 'income'])
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Eksik ayları doldur
        date_range = pd.date_range(start=df['date'].min(), end=df['date'].max(), freq='MS')
        full_df = pd.DataFrame({'date': date_range})
        df = pd.merge(full_df, df, on='date', how='left')
        df['income'] = df['income'].interpolate()
        
        # LSTM için veriyi ölçekle
        income_values = df['income'].values.reshape(-1, 1)
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = self.scaler.fit_transform(income_values)
        
        # Eğitim ve test verilerini ayır
        train_size = int(len(scaled_data) * 0.8)
        train_data = scaled_data[:train_size]
        test_data = scaled_data[train_size:]
        
        # LSTM için veriyi hazırla
        time_steps = min(12, len(train_data) - 1)  # En az 1 tahmin için veri olmalı
        X_train, y_train = self._prepare_lstm_data(train_data, time_steps)
        X_test, y_test = self._prepare_lstm_data(test_data, time_steps)
        
        X_train = self._reshape_lstm_input(X_train, time_steps)
        X_test = self._reshape_lstm_input(X_test, time_steps)
        
        # LSTM modelini oluştur ve eğit
        self.lstm_model = self._create_lstm_model((X_train.shape[1], 1))
        history = self.lstm_model.fit(
            X_train, y_train,
            epochs=100,
            batch_size=32,
            validation_data=(X_test, y_test),
            verbose=0
        )
        
        # ARIMA için veriyi hazırla
        arima_df = df.set_index('date')['income']
        
        # ARIMA parametrelerini belirle
        try:
            from pmdarima import auto_arima
            auto_model = auto_arima(
                arima_df,
                start_p=1, start_q=1,
                max_p=3, max_q=3,
                m=12,
                seasonal=False,
                d=None,
                trace=False,
                error_action='ignore',
                suppress_warnings=True,
                stepwise=True
            )
            self.arima_params = auto_model.get_params()
        except:
            # Auto ARIMA kullanılamıyorsa basit bir model kullan
            self.arima_params = {'order': (1, 1, 1)}
        
        # SARIMA parametrelerini belirle
        try:
            from pmdarima import auto_arima
            auto_model_seasonal = auto_arima(
                arima_df,
                start_p=1, start_q=1,
                max_p=2, max_q=2,
                m=12,
                seasonal=True,
                d=None,
                trace=False,
                error_action='ignore',
                suppress_warnings=True,
                stepwise=True
            )
            self.sarima_params = auto_model_seasonal.get_params()
        except:
            # Auto SARIMA kullanılamıyorsa basit bir mevsimsel model kullan
            self.sarima_params = {'order': (1, 1, 1), 'seasonal_order': (1, 1, 1, 12)}
        
        # Modelleri kaydet
        os.makedirs(self.model_dir, exist_ok=True)
        
        self.lstm_model.save(os.path.join(self.model_dir, 'income_lstm_model.h5'))
        
        with open(os.path.join(self.model_dir, 'income_scaler.pkl'), 'wb') as f:
            pickle.dump(self.scaler, f)
        
        with open(os.path.join(self.model_dir, 'arima_params.pkl'), 'wb') as f:
            pickle.dump(self.arima_params, f)
        
        with open(os.path.join(self.model_dir, 'sarima_params.pkl'), 'wb') as f:
            pickle.dump(self.sarima_params, f)
        
        self.models_loaded = True
        
        # Model performansını değerlendir
        lstm_predictions = self.lstm_model.predict(X_test)
        lstm_predictions = self.scaler.inverse_transform(lstm_predictions)
        lstm_mse = np.mean((lstm_predictions - self.scaler.inverse_transform(y_test.reshape(-1, 1)))**2)
        
        return {
            "status": "success",
            "message": "Gelir tahmin modelleri başarıyla eğitildi",
            "metrics": {
                "lstm_mse": float(lstm_mse),
                "lstm_rmse": float(np.sqrt(lstm_mse)),
                "arima_order": self.arima_params.get('order', (0, 0, 0)),
                "sarima_order": self.sarima_params.get('order', (0, 0, 0)),
                "sarima_seasonal_order": self.sarima_params.get('seasonal_order', (0, 0, 0, 0))
            }
        }
    
    def predict_future_income(self, income_data, months=6):
        """
        Gelecek aylardaki geliri tahmin eder
        
        Args:
            income_data (dict): Aylık gelir verilerini içeren sözlük
                              {'2023-01': 5000, '2023-02': 5500, ...}
            months (int): Kaç ay ilerisi için tahmin yapılacağı
        
        Returns:
            dict: Tahmin sonuçları ve performans metrikleri
        """
        if not self.models_loaded:
            return {
                "status": "error",
                "message": "Modeller yüklenmedi. Önce modelleri eğitin.",
                "predictions": {}
            }
        
        # Veriyi düzenle
        df = pd.DataFrame(list(income_data.items()), columns=['date', 'income'])
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # LSTM tahmini için
        time_steps = min(12, len(df) - 1)
        income_values = df['income'].values.reshape(-1, 1)
        scaled_data = self.scaler.transform(income_values)
        
        # LSTM için son veriyi hazırla
        X_last = scaled_data[-time_steps:].reshape(1, time_steps, 1)
        
        # LSTM tahminleri
        lstm_predictions = []
        curr_sequence = X_last[0]
        
        for i in range(months):
            # Mevcut dizi ile bir sonraki değeri tahmin et
            lstm_pred = self.lstm_model.predict(curr_sequence.reshape(1, time_steps, 1))[0][0]
            lstm_predictions.append(lstm_pred)
            
            # Tahmin edilen değeri diziye ekle ve dizinin başındaki değeri kaldır
            curr_sequence = np.append(curr_sequence[1:], [[lstm_pred]], axis=0)
        
        # LSTM tahminlerini gerçek değerlere dönüştür
        lstm_predictions = self.scaler.inverse_transform(np.array(lstm_predictions).reshape(-1, 1))
        
        # ARIMA ve SARIMA için veriyi hazırla
        arima_df = df.set_index('date')['income']
        
        # ARIMA modeli ile tahmin
        arima_model = ARIMA(
            arima_df,
            order=self.arima_params.get('order', (1, 1, 1))
        )
        arima_results = arima_model.fit()
        arima_predictions = arima_results.forecast(steps=months)
        
        # SARIMA modeli ile tahmin
        sarima_model = SARIMAX(
            arima_df,
            order=self.sarima_params.get('order', (1, 1, 1)),
            seasonal_order=self.sarima_params.get('seasonal_order', (1, 1, 1, 12))
        )
        sarima_results = sarima_model.fit(disp=False)
        sarima_predictions = sarima_results.forecast(steps=months)
        
        # Ensemble tahminleri (tüm modellerin ortalaması)
        ensemble_predictions = (lstm_predictions.flatten() + 
                              np.array(arima_predictions) + 
                              np.array(sarima_predictions)) / 3
        
        # Tahmin sonuçlarını hazırla
        last_date = df['date'].max()
        future_dates = [last_date + pd.DateOffset(months=i+1) for i in range(months)]
        future_dates_str = [d.strftime('%Y-%m') for d in future_dates]
        
        predictions = {
            'dates': future_dates_str,
            'lstm': [float(val) for val in lstm_predictions.flatten()],
            'arima': [float(val) for val in arima_predictions],
            'sarima': [float(val) for val in sarima_predictions],
            'ensemble': [float(val) for val in ensemble_predictions]
        }
        
        # Tahmin grafiği oluştur
        self._create_prediction_chart(df, future_dates, predictions)
        
        return {
            "status": "success",
            "message": f"Gelecek {months} ay için gelir tahmini yapıldı",
            "predictions": predictions
        }
    
    def _create_prediction_chart(self, historical_df, future_dates, predictions):
        """
        Tahmin grafikleri oluşturur ve Base64 formatında döndürür
        
        Args:
            historical_df (DataFrame): Geçmiş gelir verileri
            future_dates (list): Tahmin edilecek ayların tarihleri
            predictions (dict): Tahmin sonuçları
            
        Returns:
            str: Base64 kodlu görüntü verisi
        """
        plt.figure(figsize=(12, 6))
        
        # Geçmiş verileri çiz
        plt.plot(historical_df['date'], historical_df['income'], 
                label='Geçmiş Gelir', color='blue', marker='o')
        
        # Tahmin edilen verileri çiz
        plt.plot(future_dates, predictions['lstm'], 
                label='LSTM Tahmini', color='red', linestyle='--')
        plt.plot(future_dates, predictions['arima'], 
                label='ARIMA Tahmini', color='green', linestyle='--')
        plt.plot(future_dates, predictions['sarima'], 
                label='SARIMA Tahmini', color='purple', linestyle='--')
        plt.plot(future_dates, predictions['ensemble'], 
                label='Ensemble Tahmini', color='black', linestyle='-', linewidth=2)
        
        # Grafik başlığı ve etiketleri
        plt.title('Gelir Tahmini')
        plt.xlabel('Tarih')
        plt.ylabel('Gelir (TL)')
        plt.legend()
        plt.grid(True)
        
        # Grafik dosyasını hafızada oluştur
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        
        # Base64 formatına dönüştür
        chart_data = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close()
        
        return chart_data 