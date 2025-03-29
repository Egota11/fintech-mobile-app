import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CircularProgress,
  Chip
} from '@mui/material';

// İkonlar
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';

const AdminPanel = ({ generalSettings: propGeneralSettings }) => {
  // Sekme durumu
  const [tabIndex, setTabIndex] = useState(0);
  
  // Bildirim durumu
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Ayarların değiştiğini bildirmek için state
  const [settingsUpdated, setSettingsUpdated] = useState(false);
  
  // Kategori yönetimi
  const [categories, setCategories] = useState([]);
  const [categoryDialog, setCategoryDialog] = useState({
    open: false,
    isEdit: false,
    name: '',
    color: '#2E7D32',
    icon: 'CategoryIcon',
    editIndex: -1
  });
  
  // Vergi indirimi ayarları
  const [taxSettings, setTaxSettings] = useState({
    allowedCategories: [],
    defaultTaxRate: 18,
    showTaxDeductionOnDashboard: true,
    automaticTaxCalculation: true
  });
  
  // Genel ayarlar
  const [generalSettings, setGeneralSettings] = useState({
    currencySymbol: '₺',
    language: 'tr',
    dateFormat: 'DD.MM.YYYY',
    theme: 'light',
    enableNotifications: true,
    showChatBot: true
  });
  
  // Sayfa yüklendiğinde localStorage'dan veri çekme
  useEffect(() => {
    // Kategorileri yükle
    const savedCategories = localStorage.getItem('expenseCategories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      // Örnek kategoriler
      const defaultCategories = [
        { name: 'Market', color: '#2E7D32', icon: 'CategoryIcon' },
        { name: 'Faturalar', color: '#1976D2', icon: 'CategoryIcon' },
        { name: 'Ulaşım', color: '#673AB7', icon: 'CategoryIcon' },
        { name: 'Eğlence', color: '#F57C00', icon: 'CategoryIcon' },
        { name: 'Sağlık', color: '#00796B', icon: 'CategoryIcon' },
        { name: 'Eğitim', color: '#9C27B0', icon: 'CategoryIcon' },
        { name: 'Kira', color: '#D32F2F', icon: 'CategoryIcon' },
        { name: 'Giyim', color: '#FFC107', icon: 'CategoryIcon' },
        { name: 'Diğer', color: '#607D8B', icon: 'CategoryIcon' }
      ];
      setCategories(defaultCategories);
      localStorage.setItem('expenseCategories', JSON.stringify(defaultCategories));
    }
    
    // Vergi ayarlarını yükle
    const savedTaxSettings = localStorage.getItem('taxSettings');
    if (savedTaxSettings) {
      setTaxSettings(JSON.parse(savedTaxSettings));
    } else {
      // Varsayılan vergi ayarları
      const defaultTaxSettings = {
        allowedCategories: ['Eğitim', 'Sağlık', 'Ulaşım', 'Faturalar'],
        defaultTaxRate: 18,
        showTaxDeductionOnDashboard: true,
        automaticTaxCalculation: true
      };
      setTaxSettings(defaultTaxSettings);
      localStorage.setItem('taxSettings', JSON.stringify(defaultTaxSettings));
    }
    
    // Genel ayarları yükle
    const savedGeneralSettings = localStorage.getItem('generalSettings');
    if (savedGeneralSettings) {
      setGeneralSettings(JSON.parse(savedGeneralSettings));
    } else {
      // Genel ayarları kaydet
      localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
    }
  }, []);
  
  // Sekme değişikliği
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
  // Bildirim kapatma
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
    
    if (settingsUpdated) {
      window.location.reload();
    }
  };
  
  // Kategori ekleme/düzenleme dialog işlemleri
  const openCategoryDialog = (isEdit = false, editIndex = -1) => {
    if (isEdit && editIndex >= 0) {
      setCategoryDialog({
        open: true,
        isEdit: true,
        name: categories[editIndex].name,
        color: categories[editIndex].color,
        icon: categories[editIndex].icon,
        editIndex
      });
    } else {
      setCategoryDialog({
        open: true,
        isEdit: false,
        name: '',
        color: '#2E7D32',
        icon: 'CategoryIcon',
        editIndex: -1
      });
    }
  };
  
  const closeCategoryDialog = () => {
    setCategoryDialog({ ...categoryDialog, open: false });
  };
  
  const handleCategoryChange = (field, value) => {
    setCategoryDialog({ ...categoryDialog, [field]: value });
  };
  
  const saveCategory = () => {
    if (!categoryDialog.name.trim()) {
      setSnackbar({
        open: true,
        message: 'Kategori adı boş olamaz',
        severity: 'error'
      });
      return;
    }
    
    let updatedCategories = [...categories];
    
    if (categoryDialog.isEdit) {
      // Kategori güncelleme
      updatedCategories[categoryDialog.editIndex] = {
        name: categoryDialog.name,
        color: categoryDialog.color,
        icon: categoryDialog.icon
      };
      
      setSnackbar({
        open: true,
        message: 'Kategori başarıyla güncellendi',
        severity: 'success'
      });
    } else {
      // Yeni kategori ekleme
      updatedCategories.push({
        name: categoryDialog.name,
        color: categoryDialog.color,
        icon: categoryDialog.icon
      });
      
      setSnackbar({
        open: true,
        message: 'Yeni kategori başarıyla eklendi',
        severity: 'success'
      });
    }
    
    setCategories(updatedCategories);
    localStorage.setItem('expenseCategories', JSON.stringify(updatedCategories));
    closeCategoryDialog();
  };
  
  const deleteCategory = (index) => {
    const updatedCategories = [...categories];
    updatedCategories.splice(index, 1);
    setCategories(updatedCategories);
    localStorage.setItem('expenseCategories', JSON.stringify(updatedCategories));
    
    setSnackbar({
      open: true,
      message: 'Kategori başarıyla silindi',
      severity: 'success'
    });
    
    // Vergi indirimi ayarlarını güncelle
    const deletedCategory = categories[index].name;
    if (taxSettings.allowedCategories.includes(deletedCategory)) {
      const updatedTaxSettings = { ...taxSettings };
      updatedTaxSettings.allowedCategories = updatedTaxSettings.allowedCategories.filter(
        cat => cat !== deletedCategory
      );
      setTaxSettings(updatedTaxSettings);
      localStorage.setItem('taxSettings', JSON.stringify(updatedTaxSettings));
    }
  };
  
  // Vergi ayarlarını kaydetme
  const saveTaxSettings = () => {
    localStorage.setItem('taxSettings', JSON.stringify(taxSettings));
    
    setSnackbar({
      open: true,
      message: 'Vergi ayarları başarıyla kaydedildi',
      severity: 'success'
    });
  };
  
  // Vergi kategorisi değiştirme
  const handleTaxCategoryChange = (category) => {
    const updatedTaxSettings = { ...taxSettings };
    
    if (updatedTaxSettings.allowedCategories.includes(category)) {
      // Kategoriden kaldır
      updatedTaxSettings.allowedCategories = updatedTaxSettings.allowedCategories.filter(
        cat => cat !== category
      );
    } else {
      // Kategori ekle
      updatedTaxSettings.allowedCategories.push(category);
    }
    
    setTaxSettings(updatedTaxSettings);
  };
  
  // Genel ayarları kaydetme
  const saveGeneralSettings = () => {
    localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
    
    setSnackbar({
      open: true,
      message: 'Genel ayarlar başarıyla kaydedildi',
      severity: 'success'
    });
    
    // Ayarların değiştiğini işaretle
    setSettingsUpdated(true);
    
    // Sayfayı yeniden yükle (3 saniye sonra)
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };
  
  // Genel ayar değiştirme
  const handleGeneralSettingChange = (setting, value) => {
    setGeneralSettings({
      ...generalSettings,
      [setting]: value
    });
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Yönetim Paneli
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Kategori Yönetimi" icon={<CategoryIcon />} />
          <Tab label="Vergi Ayarları" icon={<SettingsIcon />} />
          <Tab label="Genel Ayarlar" icon={<SettingsIcon />} />
        </Tabs>
      </Paper>
      
      {/* Kategori Yönetimi */}
      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Kategoriler</Typography>
              <Button
                variant="contained"
                startIcon={<AddCircleIcon />}
                onClick={() => openCategoryDialog()}
              >
                Yeni Kategori Ekle
              </Button>
            </Box>
            
            <Paper>
              <List>
                {categories.map((category, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: category.color,
                          mr: 2
                        }}
                      />
                      <ListItemText primary={category.name} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="edit" onClick={() => openCategoryDialog(true, index)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => deleteCategory(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < categories.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Vergi Ayarları */}
      <TabPanel value={tabIndex} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vergi İndirimi Kategorileri
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Vergi indirimine dahil edilecek kategorileri seçin.
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  {categories.map((category, index) => (
                    <FormControlLabel
                      key={index}
                      control={
                        <Switch
                          checked={taxSettings.allowedCategories.includes(category.name)}
                          onChange={() => handleTaxCategoryChange(category.name)}
                          color="primary"
                        />
                      }
                      label={category.name}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vergi Hesaplama Ayarları
                </Typography>
                
                <TextField
                  fullWidth
                  label="Varsayılan KDV Oranı (%)"
                  type="number"
                  margin="normal"
                  value={taxSettings.defaultTaxRate}
                  onChange={(e) => setTaxSettings({ ...taxSettings, defaultTaxRate: Number(e.target.value) })}
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={taxSettings.showTaxDeductionOnDashboard}
                      onChange={(e) => setTaxSettings({ ...taxSettings, showTaxDeductionOnDashboard: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Dashboard'da vergi indirimi grafiğini göster"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={taxSettings.automaticTaxCalculation}
                      onChange={(e) => setTaxSettings({ ...taxSettings, automaticTaxCalculation: e.target.checked })}
                      color="primary"
                    />
                  }
                  label="Otomatik vergi hesaplama"
                />
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={saveTaxSettings}
                  >
                    Değişiklikleri Kaydet
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Genel Ayarlar */}
      <TabPanel value={tabIndex} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Uygulama Ayarları
                </Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Para Birimi</InputLabel>
                  <Select
                    value={generalSettings.currencySymbol}
                    onChange={(e) => handleGeneralSettingChange('currencySymbol', e.target.value)}
                  >
                    <MenuItem value="₺">Türk Lirası (₺)</MenuItem>
                    <MenuItem value="$">Dolar ($)</MenuItem>
                    <MenuItem value="€">Euro (€)</MenuItem>
                    <MenuItem value="£">İngiliz Sterlini (£)</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Dil</InputLabel>
                  <Select
                    value={generalSettings.language}
                    onChange={(e) => handleGeneralSettingChange('language', e.target.value)}
                  >
                    <MenuItem value="tr">Türkçe</MenuItem>
                    <MenuItem value="en">İngilizce</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tarih Formatı</InputLabel>
                  <Select
                    value={generalSettings.dateFormat}
                    onChange={(e) => handleGeneralSettingChange('dateFormat', e.target.value)}
                  >
                    <MenuItem value="DD.MM.YYYY">DD.MM.YYYY</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Görünüm ve Bildirim Ayarları
                </Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tema</InputLabel>
                  <Select
                    value={generalSettings.theme}
                    onChange={(e) => handleGeneralSettingChange('theme', e.target.value)}
                  >
                    <MenuItem value="light">Açık Tema</MenuItem>
                    <MenuItem value="dark">Koyu Tema</MenuItem>
                    <MenuItem value="system">Sistem Teması</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={generalSettings.enableNotifications}
                      onChange={(e) => handleGeneralSettingChange('enableNotifications', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Bildirimleri Etkinleştir"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={generalSettings.showChatBot}
                      onChange={(e) => handleGeneralSettingChange('showChatBot', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="ChatBot'u Göster"
                />
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={saveGeneralSettings}
                  >
                    Değişiklikleri Kaydet
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      
      {/* Kategori Ekleme/Düzenleme Dialog */}
      <Dialog open={categoryDialog.open} onClose={closeCategoryDialog}>
        <DialogTitle>
          {categoryDialog.isEdit ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Kategori Adı"
            type="text"
            fullWidth
            value={categoryDialog.name}
            onChange={(e) => handleCategoryChange('name', e.target.value)}
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Kategori Rengi</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                '#2E7D32', // Yeşil
                '#1976D2', // Mavi
                '#673AB7', // Mor
                '#F57C00', // Turuncu
                '#D32F2F', // Kırmızı
                '#9C27B0', // Mor
                '#00796B', // Turkuaz
                '#FFC107', // Sarı
                '#607D8B'  // Gri mavi
              ].map((color) => (
                <Box
                  key={color}
                  onClick={() => handleCategoryChange('color', color)}
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: color,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: categoryDialog.color === color ? '2px solid black' : 'none'
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCategoryDialog}>İptal</Button>
          <Button onClick={saveCategory} variant="contained" color="primary">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bildirim Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Tab Panel Bileşeni
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default AdminPanel; 