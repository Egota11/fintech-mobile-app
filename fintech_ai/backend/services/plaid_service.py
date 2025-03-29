import os
import datetime
import plaid
from plaid.api import plaid_api
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions

class PlaidService:
    """Plaid API ile etkileşim için servis sınıfı"""
    
    def __init__(self):
        # Plaid API yapılandırması
        self.client_id = os.environ.get('PLAID_CLIENT_ID')
        self.secret = os.environ.get('PLAID_SECRET')
        self.environment = os.environ.get('PLAID_ENVIRONMENT', 'sandbox')
        
        # Plaid API istemcisi oluşturma
        configuration = plaid.Configuration(
            host=plaid.Environment.Sandbox if self.environment == 'sandbox' else plaid.Environment.Development,
            api_key={
                'clientId': self.client_id,
                'secret': self.secret,
            }
        )
        api_client = plaid.ApiClient(configuration)
        self.client = plaid_api.PlaidApi(api_client)
    
    def create_link_token(self, user_id, username):
        """
        Plaid Link arayüzü için token oluşturur
        
        Args:
            user_id (str): Kullanıcı ID'si
            username (str): Kullanıcı adı
            
        Returns:
            str: Plaid Link token
        """
        # Kullanıcı nesnesi oluştur
        user = LinkTokenCreateRequestUser(
            client_user_id=user_id
        )
        
        # Link token isteği oluştur
        request = LinkTokenCreateRequest(
            user=user,
            client_name="FinTech AI",
            products=[Products("transactions")],
            country_codes=[CountryCode("TR"), CountryCode("US")],
            language="tr",
            webhook="https://fintechai.example.com/api/plaid/webhook"
        )
        
        # Link token oluştur
        response = self.client.link_token_create(request)
        return response['link_token']
    
    def exchange_public_token(self, public_token):
        """
        Plaid public token'ı access token ile değiştirir
        
        Args:
            public_token (str): Plaid Link'ten alınan public token
            
        Returns:
            tuple: (access_token, item_id)
        """
        # Public token değişimi isteği oluştur
        request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )
        
        # Public token'ı değiştir
        response = self.client.item_public_token_exchange(request)
        return response['access_token'], response['item_id']
    
    def get_transactions(self, access_token, start_date, end_date):
        """
        Kullanıcının banka işlemlerini alır
        
        Args:
            access_token (str): Plaid access token
            start_date (date): Başlangıç tarihi
            end_date (date): Bitiş tarihi
            
        Returns:
            list: İşlem listesi
        """
        # Tarihleri string formatına dönüştür
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
        
        # İşlemleri getir
        request = TransactionsGetRequest(
            access_token=access_token,
            start_date=start_date_str,
            end_date=end_date_str,
            options=TransactionsGetRequestOptions(
                include_personal_finance_category=True
            )
        )
        
        response = self.client.transactions_get(request)
        transactions = response['transactions']
        
        # Eğer daha fazla işlem varsa, hepsini al
        while len(transactions) < response['total_transactions']:
            request = TransactionsGetRequest(
                access_token=access_token,
                start_date=start_date_str,
                end_date=end_date_str,
                options=TransactionsGetRequestOptions(
                    offset=len(transactions),
                    include_personal_finance_category=True
                )
            )
            response = self.client.transactions_get(request)
            transactions.extend(response['transactions'])
        
        # İşlemleri döndür
        return transactions 