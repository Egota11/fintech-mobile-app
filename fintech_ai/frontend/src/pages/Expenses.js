import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  TableSortLabel,
  InputAdornment,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import trLocale from 'date-fns/locale/tr';
import { format, parse } from 'date-fns';

// İkonlar
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import RefreshIcon from '@mui/icons-material/Refresh';

// Sahte veri - Gerçek uygulamada API'den gelecek
const mockExpenses = [
  { id: 1, date: '2023-05-01', amount: 120.50, category: 'Market', description: 'Haftalık alışveriş', is_tax_deductible: false },
  { id: 2, date: '2023-05-02', amount: 45.75, category: 'Ulaşım', description: 'Benzin', is_tax_deductible: true },
  { id: 3, date: '2023-05-03', amount: 89.99, category: 'Eğlence', description: 'Sinema bileti', is_tax_deductible: false },
  { id: 4, date: '2023-05-05', amount: 250.00, category: 'Faturalar', description: 'Elektrik faturası', is_tax_deductible: true },
  { id: 5, date: '2023-05-10', amount: 1200.00, category: 'Kira', description: 'Mayıs kirası', is_tax_deductible: false },
  { id: 6, date: '2023-05-12', amount: 75.50, category: 'Market', description: 'Haftalık alışveriş', is_tax_deductible: false },
  { id: 7, date: '2023-05-15', amount: 120.00, category: 'Sağlık', description: 'İlaç', is_tax_deductible: true },
  { id: 8, date: '2023-05-18', amount: 45.00, category: 'Ulaşım', description: 'Taksi', is_tax_deductible: false },
  { id: 9, date: '2023-05-20', amount: 89.90, category: 'Giyim', description: 'Tişört', is_tax_deductible: false },
  { id: 10, date: '2023-05-25', amount: 180.00, category: 'Faturalar', description: 'İnternet faturası', is_tax_deductible: true },
];

// Sabit kategori listesi yerine AdminPanel'den kategorileri al
const getCategories = () => {
  const savedCategories = localStorage.getItem('expenseCategories');
  if (savedCategories) {
    const parsedCategories = JSON.parse(savedCategories);
    return parsedCategories.map(cat => cat.name);
  }
  return ['Market', 'Ulaşım', 'Eğlence', 'Faturalar', 'Kira', 'Sağlık', 'Giyim', 'Eğitim', 'Diğer'];
};

const Expenses = ({ generalSettings }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [categories, setCategories] = useState(getCategories());
  
  // Para birimi bilgisini al
  const currencySymbol = generalSettings?.currencySymbol || '₺';
  
  // Tarih formatını al ve date-fns formatına çevir
  const dateFormat = generalSettings?.dateFormat || 'DD.MM.YYYY';
  const dateFnsFormat = dateFormat
    .replace('DD', 'dd')
    .replace('MM', 'MM')
    .replace('YYYY', 'yyyy');
  
  // Bir tarihi formatlı şekilde göstermek için kullanılacak fonksiyon
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return format(date, dateFnsFormat);
    } catch (error) {
      return dateStr;
    }
  };
  
  // Filtreleme durumu
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    category: '',
    minAmount: '',
    maxAmount: '',
    description: '',
    isTaxDeductible: ''
  });
  
  // Sıralama durumu
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });
  
  // Form durumu
  const [formData, setFormData] = useState({
    id: null,
    date: new Date(),
    amount: '',
    category: '',
    description: '',
    is_tax_deductible: false
  });
  
  useEffect(() => {
    // Kategorileri güncelle
    setCategories(getCategories());
    
    // Gerçek uygulamada API çağrısı olacak
    // API'den veri çekme işlemi
    const fetchExpenses = async () => {
      try {
        // Gerçek API çağrısı:
        // const response = await fetch('/api/expenses');
        // const data = await response.json();
        
        // localStorage'dan daha önce kaydedilmiş harcamaları kontrol et
        const savedExpenses = localStorage.getItem('expenses');
        
        if (savedExpenses) {
          // Kaydedilmiş veriler varsa kullan
          setExpenses(JSON.parse(savedExpenses));
          setLoading(false);
        } else {
          // Yoksa sahte veri kullan ve localStorage'a kaydet
          setTimeout(() => {
            setExpenses(mockExpenses);
            localStorage.setItem('expenses', JSON.stringify(mockExpenses));
            setLoading(false);
          }, 1000);
        }
      } catch (error) {
        console.error('Harcamalar yüklenirken hata oluştu:', error);
        setLoading(false);
      }
    };
    
    fetchExpenses();
  }, []);
  
  // Vergi indirimi ayarlarını kontrol et
  useEffect(() => {
    // Vergi indirimi ayarlarından vergi indirimine tabi kategorileri al
    const taxSettings = localStorage.getItem('taxSettings');
    if (taxSettings) {
      const parsedSettings = JSON.parse(taxSettings);
      // Gider eklerken vergi indirimi kontrolünde kullanılabilir
      // Şu an için bir şey yapmıyoruz
    }
  }, []);
  
  // Sıralama işlevi
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Verileri filtrele ve sırala
  const getProcessedExpenses = () => {
    // Filtrele
    let filteredExpenses = [...expenses];
    
    if (filters.startDate) {
      filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) >= filters.startDate);
    }
    
    if (filters.endDate) {
      filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) <= filters.endDate);
    }
    
    if (filters.category) {
      filteredExpenses = filteredExpenses.filter(exp => exp.category === filters.category);
    }
    
    if (filters.minAmount) {
      filteredExpenses = filteredExpenses.filter(exp => exp.amount >= parseFloat(filters.minAmount));
    }
    
    if (filters.maxAmount) {
      filteredExpenses = filteredExpenses.filter(exp => exp.amount <= parseFloat(filters.maxAmount));
    }
    
    if (filters.description) {
      filteredExpenses = filteredExpenses.filter(exp => 
        exp.description.toLowerCase().includes(filters.description.toLowerCase())
      );
    }
    
    if (filters.isTaxDeductible !== '') {
      const isTaxDeductible = filters.isTaxDeductible === 'true';
      filteredExpenses = filteredExpenses.filter(exp => exp.is_tax_deductible === isTaxDeductible);
    }
    
    // Sırala
    filteredExpenses.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return filteredExpenses;
  };
  
  // Sayfalandırılmış veriler
  const getPaginatedExpenses = () => {
    const processedExpenses = getProcessedExpenses();
    const startIndex = (page - 1) * pageSize;
    return processedExpenses.slice(startIndex, startIndex + pageSize);
  };
  
  // Sayfa değişimi
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Filtre sıfırlama
  const resetFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      category: '',
      minAmount: '',
      maxAmount: '',
      description: '',
      isTaxDeductible: ''
    });
  };
  
  // Form işlemleri
  const handleFormChange = (field, value) => {
    const updatedFormData = { ...formData, [field]: value };
    
    // Kategori değişince, o kategori vergi indirimine tabi mi kontrol et
    if (field === 'category') {
      const taxSettings = localStorage.getItem('taxSettings');
      if (taxSettings) {
        const parsedSettings = JSON.parse(taxSettings);
        if (parsedSettings.automaticTaxCalculation) {
          updatedFormData.is_tax_deductible = parsedSettings.allowedCategories.includes(value);
        }
      }
    }
    
    setFormData(updatedFormData);
  };
  
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date
    });
  };
  
  const handleTaxDeductibleChange = (event) => {
    setFormData({
      ...formData,
      is_tax_deductible: event.target.value === 'true'
    });
  };
  
  // Yeni harcama ekleme
  const handleAddExpense = () => {
    setFormData({
      id: null,
      date: new Date(),
      amount: '',
      category: '',
      description: '',
      is_tax_deductible: false
    });
    setDialogOpen(true);
  };
  
  // Harcama düzenleme
  const handleEditExpense = (expense) => {
    setFormData({
      id: expense.id,
      date: new Date(expense.date),
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      is_tax_deductible: expense.is_tax_deductible
    });
    setDialogOpen(true);
  };
  
  // Harcama silme
  const handleDeleteExpense = (id) => {
    // Gerçek uygulamada API isteği yapılacak:
    // await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    
    // UI'dan sil
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    setExpenses(updatedExpenses);
    
    // LocalStorage'a kaydet
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    
    // Bildirim göster
    setSnackbarMessage('Harcama başarıyla silindi');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  };
  
  const openDialog = (isEdit = false, editExpense = null) => {
    if (isEdit && editExpense) {
      setFormData({
        id: editExpense.id,
        date: new Date(editExpense.date),
        amount: editExpense.amount,
        category: editExpense.category,
        description: editExpense.description,
        is_tax_deductible: editExpense.is_tax_deductible
      });
    } else {
      // Yeni gider ekleme formu
      const newId = Math.max(...expenses.map(e => e.id), 0) + 1;
      setFormData({
        id: newId,
        date: new Date(),
        amount: '',
        category: '',
        description: '',
        is_tax_deductible: false
      });
    }
    setDialogOpen(true);
  };
  
  // Form gönderimi
  const handleSubmit = () => {
    if (!formData.amount || !formData.category || !formData.description) {
      setSnackbarMessage('Lütfen tüm zorunlu alanları doldurun');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    let updatedExpenses;
    
    // Yeni harcama veya güncelleme
    if (formData.id) {
      // Güncelleme - Gerçek uygulamada API isteği yapılacak:
      // await fetch(`/api/expenses/${formData.id}`, { 
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      // UI'da güncelle
      updatedExpenses = expenses.map(expense => 
        expense.id === formData.id 
          ? { 
              ...expense, 
              date: formData.date.toISOString().split('T')[0],
              amount: parseFloat(formData.amount),
              category: formData.category,
              description: formData.description,
              is_tax_deductible: formData.is_tax_deductible
            } 
          : expense
      );
      
      setExpenses(updatedExpenses);
      setSnackbarMessage('Harcama başarıyla güncellendi');
    } else {
      // Yeni ekleme - Gerçek uygulamada API isteği yapılacak:
      // const response = await fetch('/api/expenses', { 
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      // const newExpense = await response.json();
      
      // UI'a ekle
      const newExpense = {
        id: Date.now(), // Benzersiz bir ID oluştur
        date: formData.date.toISOString().split('T')[0],
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        is_tax_deductible: formData.is_tax_deductible
      };
      
      updatedExpenses = [...expenses, newExpense];
      setExpenses(updatedExpenses);
      setSnackbarMessage('Yeni harcama başarıyla eklendi');
    }
    
    // LocalStorage'a kaydet
    localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
    
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    setDialogOpen(false);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const processedExpenses = getProcessedExpenses();
  const paginatedExpenses = getPaginatedExpenses();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Harcamalar
      </Typography>
      
      {/* Üst araç çubuğu */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Açıklama ara..."
                value={filters.description}
                onChange={(e) => setFilters({ ...filters, description: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={8}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<FilterListIcon />}
                  onClick={() => setFilterOpen(!filterOpen)}
                >
                  Filtreler
                </Button>
                
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />}
                  onClick={resetFilters}
                >
                  Sıfırla
                </Button>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={handleAddExpense}
                >
                  Yeni Harcama
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {/* Filtre paneli */}
          {filterOpen && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                    <DatePicker
                      label="Başlangıç Tarihi"
                      value={filters.startDate}
                      onChange={(date) => setFilters({ ...filters, startDate: date })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                    <DatePicker
                      label="Bitiş Tarihi"
                      value={filters.endDate}
                      onChange={(date) => setFilters({ ...filters, endDate: date })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Kategori</InputLabel>
                    <Select
                      value={filters.category}
                      label="Kategori"
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                      <MenuItem value="">Tümü</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Min Tutar"
                    type="number"
                    value={filters.minAmount}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{currencySymbol}</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Max Tutar"
                    type="number"
                    value={filters.maxAmount}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{currencySymbol}</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Vergi İndirimi</InputLabel>
                    <Select
                      value={filters.isTaxDeductible}
                      label="Vergi İndirimi"
                      onChange={(e) => setFilters({ ...filters, isTaxDeductible: e.target.value })}
                    >
                      <MenuItem value="">Tümü</MenuItem>
                      <MenuItem value="true">Evet</MenuItem>
                      <MenuItem value="false">Hayır</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Veri tablosu */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'date'}
                  direction={sortConfig.key === 'date' ? sortConfig.direction : 'asc'}
                  onClick={() => requestSort('date')}
                >
                  Tarih
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'description'}
                  direction={sortConfig.key === 'description' ? sortConfig.direction : 'asc'}
                  onClick={() => requestSort('description')}
                >
                  Açıklama
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'category'}
                  direction={sortConfig.key === 'category' ? sortConfig.direction : 'asc'}
                  onClick={() => requestSort('category')}
                >
                  Kategori
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'amount'}
                  direction={sortConfig.key === 'amount' ? sortConfig.direction : 'asc'}
                  onClick={() => requestSort('amount')}
                >
                  Tutar
                </TableSortLabel>
              </TableCell>
              <TableCell>Vergi İndirimi</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedExpenses.length > 0 ? (
              paginatedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>
                    <Chip 
                      icon={<CategoryIcon />} 
                      label={expense.category} 
                      size="small" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    {expense.amount.toLocaleString('tr-TR')} {currencySymbol}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={expense.is_tax_deductible ? 'Evet' : 'Hayır'}
                      color={expense.is_tax_deductible ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Düzenle">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEditExpense(expense)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Sil">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Sonuç bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Sayfalama */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Toplam {processedExpenses.length} harcama
        </Typography>
        
        <Pagination 
          count={Math.ceil(processedExpenses.length / pageSize)} 
          page={page} 
          onChange={handlePageChange} 
        />
      </Box>
      
      {/* Harcama Formu Diyalog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {formData.id ? 'Harcama Düzenle' : 'Yeni Harcama Ekle'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                <DatePicker
                  label="Tarih"
                  value={formData.date}
                  onChange={(newDate) => handleFormChange('date', newDate)}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" required />}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tutar"
                type="number"
                value={formData.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                required
                InputProps={{
                  endAdornment: <InputAdornment position="end">{currencySymbol}</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Kategori</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Vergi İndirimi</InputLabel>
                <Select
                  value={formData.is_tax_deductible.toString()}
                  label="Vergi İndirimi"
                  onChange={handleTaxDeductibleChange}
                >
                  <MenuItem value="true">Evet</MenuItem>
                  <MenuItem value="false">Hayır</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>İptal</Button>
          <Button onClick={handleSubmit} variant="contained">
            {formData.id ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bildirim */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Expenses; 