import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';

// Grafikler için
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

// Sahte veri (gerçek uygulamada API'den alınacak)
const expensesByCategory = [
  { name: 'Market', value: 3500 },
  { name: 'Faturalar', value: 2200 },
  { name: 'Ulaşım', value: 1800 },
  { name: 'Eğlence', value: 1500 },
  { name: 'Diğer', value: 1000 },
];

const monthlyExpenses = [
  { name: 'Oca', Gider: 7500, Gelir: 12000 },
  { name: 'Şub', Gider: 8200, Gelir: 12000 },
  { name: 'Mar', Gider: 7800, Gelir: 12500 },
  { name: 'Nis', Gider: 9500, Gelir: 13000 },
  { name: 'May', Gider: 8800, Gelir: 13000 },
  { name: 'Haz', Gider: 7900, Gelir: 13500 },
];

// Gelen harcama verilerinden vergi indirimine tabi olanları kategorilerine göre gruplar
const calculateTaxSavings = (expenses) => {
  const taxDeductibleExpenses = expenses.filter(exp => exp.is_tax_deductible);
  
  // Kategorilere göre grupla
  const categoryGroups = {};
  taxDeductibleExpenses.forEach(expense => {
    if (categoryGroups[expense.category]) {
      categoryGroups[expense.category] += expense.amount;
    } else {
      categoryGroups[expense.category] = expense.amount;
    }
  });
  
  // Görselleştirme için formatlı veri yapısına dönüştür
  return Object.keys(categoryGroups).map(category => ({
    name: category,
    value: categoryGroups[category]
  }));
};

// Sahte veri (Gerçek uygulamada hesaplanacak)
const mockExpensesForTaxCalculation = [
  { id: 2, amount: 45.75, category: 'Ulaşım', is_tax_deductible: true },
  { id: 4, amount: 250.00, category: 'Faturalar', is_tax_deductible: true },
  { id: 7, amount: 120.00, category: 'Sağlık', is_tax_deductible: true },
  { id: 10, amount: 180.00, category: 'Faturalar', is_tax_deductible: true },
  { id: 11, amount: 1200.00, category: 'Eğitim', is_tax_deductible: true },
  { id: 12, amount: 800.00, category: 'Bağış', is_tax_deductible: true },
  { id: 13, amount: 3000.00, category: 'Emeklilik', is_tax_deductible: true },
];

const Dashboard = ({ generalSettings }) => {
  const theme = useTheme();
  const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    savings: 0,
    taxDeductible: 0
  });
  const [allExpenses, setAllExpenses] = useState([]);
  const [taxSavings, setTaxSavings] = useState([]);
  
  // Para birimi sembolünü al
  const currencySymbol = generalSettings?.currencySymbol || '₺';

  // Renkler
  const COLORS = [
    '#2E7D32', // Koyu yeşil (Market)
    '#1976D2', // Mavi (Faturalar)
    '#673AB7', // Mor (Ulaşım)
    '#F57C00', // Turuncu (Eğlence)
    '#D32F2F', // Kırmızı (Diğer)
    '#9C27B0', // Mor (Eğitim)
    '#00796B', // Turkuaz (Sağlık)
    '#FFC107', // Sarı (Bağış)
    '#607D8B', // Gri mavi (Emeklilik)
  ];

  useEffect(() => {
    // Gerçek uygulamada API'den verileri çekme
    const fetchData = async () => {
      try {
        // Burada API çağrısı olacak
        // const response = await fetch('/api/dashboard');
        // const data = await response.json();
        // const expensesResponse = await fetch('/api/expenses');
        // const expensesData = await expensesResponse.json();
        
        // Şimdilik sahte veri kullanıyoruz
        setTimeout(() => {
          setSummary({
            totalExpenses: 10000,
            totalIncome: 13500,
            savings: 3500,
            taxDeductible: 7400
          });
          
          // localStorage'dan harcamaları oku
          const savedExpenses = localStorage.getItem('expenses');
          let expenses = [];
          
          if (savedExpenses) {
            expenses = JSON.parse(savedExpenses);
          } else {
            // Eğer localStorage'da harcama yoksa mockExpensesForTaxCalculation'ı kullan
            expenses = mockExpensesForTaxCalculation;
            // localStorage'a kaydet
            localStorage.setItem('expenses', JSON.stringify(mockExpensesForTaxCalculation));
          }
          
          // Harcamaları state'e kaydet
          setAllExpenses(expenses);
          
          // Vergi indirimi ayarlarını kontrol et
          const taxSettings = localStorage.getItem('taxSettings');
          let allowedCategories = [];
          let showTaxDeduction = true;
          
          if (taxSettings) {
            const parsedSettings = JSON.parse(taxSettings);
            allowedCategories = parsedSettings.allowedCategories || [];
            showTaxDeduction = parsedSettings.showTaxDeductionOnDashboard !== false;
          }
          
          // Vergi indirimlerini hesapla
          // Sadece izin verilen kategorilerdeki harcamaları filtrele
          const filteredExpenses = expenses.filter(expense => 
            allowedCategories.includes(expense.category)
          );
          
          const calculatedTaxSavings = calculateTaxSavings(
            allowedCategories.length > 0 ? filteredExpenses : expenses
          );
          
          setTaxSavings(calculatedTaxSavings);
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Dashboard verileri alınamadı:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Mobil cihazlarda graph yüksekliğini ayarla
  const chartHeight = isXsScreen ? 200 : isMobile ? 250 : 300;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Finansal Dashboard
      </Typography>
      
      {/* Özet kartları */}
      <Grid container spacing={isXsScreen ? 2 : 3} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: '12px', sm: '16px' } }}>
              <Typography color="textSecondary" gutterBottom variant={isXsScreen ? "body2" : "body1"}>
                Aylık Gelir
              </Typography>
              <Typography variant={isXsScreen ? "h6" : "h5"} component="div" sx={{ color: 'success.main' }}>
                {summary.totalIncome.toLocaleString('tr-TR')} {currencySymbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: '12px', sm: '16px' } }}>
              <Typography color="textSecondary" gutterBottom variant={isXsScreen ? "body2" : "body1"}>
                Aylık Gider
              </Typography>
              <Typography variant={isXsScreen ? "h6" : "h5"} component="div" sx={{ color: 'error.main' }}>
                {summary.totalExpenses.toLocaleString('tr-TR')} {currencySymbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: '12px', sm: '16px' } }}>
              <Typography color="textSecondary" gutterBottom variant={isXsScreen ? "body2" : "body1"}>
                Tasarruf
              </Typography>
              <Typography variant={isXsScreen ? "h6" : "h5"} component="div" sx={{ color: 'primary.main' }}>
                {summary.savings.toLocaleString('tr-TR')} {currencySymbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: '12px', sm: '16px' } }}>
              <Typography color="textSecondary" gutterBottom variant={isXsScreen ? "body2" : "body1"}>
                Vergi İndirimleri
              </Typography>
              <Typography variant={isXsScreen ? "h6" : "h5"} component="div" sx={{ color: 'secondary.main' }}>
                {summary.taxDeductible.toLocaleString('tr-TR')} {currencySymbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Grafikler */}
      <Grid container spacing={isXsScreen ? 2 : 3}>
        {/* Gelir-Gider Grafiği - Mobil cihazlarda tam genişlik */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: '12px', sm: '16px' } }}>
              <Typography variant={isXsScreen ? "body1" : "h6"} gutterBottom>
                Gelir-Gider Dengesi
              </Typography>
              <Box sx={{ height: chartHeight, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyExpenses}
                    margin={{ top: 5, right: isXsScreen ? 10 : 30, left: isXsScreen ? -25 : 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={isXsScreen ? 10 : 12} />
                    <YAxis fontSize={isXsScreen ? 10 : 12} tickFormatter={(value) => `${(value/1000)}B`} />
                    <Tooltip
                      formatter={(value) => [`${value.toLocaleString('tr-TR')} ${currencySymbol}`, ``]}
                      labelFormatter={(label) => `${label} Ayı`}
                    />
                    <Legend fontSize={isXsScreen ? 10 : 12} wrapperStyle={{ fontSize: isXsScreen ? 10 : 12 }} />
                    <Bar dataKey="Gelir" fill="#4CAF50" />
                    <Bar dataKey="Gider" fill="#F44336" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Harcama Dağılımı Grafiği - Mobil cihazlarda tam genişlik */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: '12px', sm: '16px' } }}>
              <Typography variant={isXsScreen ? "body1" : "h6"} gutterBottom>
                Harcama Dağılımı
              </Typography>
              <Box sx={{ height: chartHeight, mt: 1, display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={!isXsScreen}
                      label={isXsScreen ? undefined : ({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={isXsScreen ? 70 : 110}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value.toLocaleString('tr-TR')} ${currencySymbol}`, ``]}
                    />
                    <Legend 
                      layout={isXsScreen ? "horizontal" : "vertical"} 
                      verticalAlign={isXsScreen ? "bottom" : "middle"} 
                      align={isXsScreen ? "center" : "right"}
                      wrapperStyle={{ fontSize: isXsScreen ? 10 : 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Vergi İndirimleri Grafiği - Mobil cihazlarda ikinci satırda */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ p: { xs: '12px', sm: '16px' } }}>
              <Typography variant={isXsScreen ? "body1" : "h6"} gutterBottom>
                Vergi İndirim Dağılımı
              </Typography>
              <Box sx={{ height: chartHeight, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={taxSavings}
                    layout="vertical"
                    margin={{ top: 5, right: isXsScreen ? 10 : 30, left: isXsScreen ? 60 : 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={isXsScreen ? 10 : 12} tickFormatter={(value) => `${value.toLocaleString('tr-TR')}`} />
                    <YAxis dataKey="name" type="category" fontSize={isXsScreen ? 10 : 12} width={isXsScreen ? 60 : 80} />
                    <Tooltip 
                      formatter={(value) => [`${value.toLocaleString('tr-TR')} ${currencySymbol}`, ``]}
                    />
                    <Bar dataKey="value" fill="#673AB7">
                      {taxSavings.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 