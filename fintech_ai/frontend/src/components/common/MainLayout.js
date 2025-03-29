import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  IconButton, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Container,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Button,
  Tooltip,
  Badge
} from '@mui/material';

// İkonlar
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SavingsIcon from '@mui/icons-material/Savings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import MobileIcon from '@mui/icons-material/PhoneIphone';

const drawerWidth = 240;

// Ana menü öğeleri
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/', mobileIcon: <HomeIcon /> },
  { text: 'Harcamalar', icon: <ReceiptIcon />, path: '/expenses', mobileIcon: <ReceiptIcon /> },
  { text: 'Gelirler', icon: <CreditCardIcon />, path: '/income', mobileIcon: <CreditCardIcon /> },
  { text: 'Vergi Planlaması', icon: <SavingsIcon />, path: '/tax-planning', mobileIcon: <SavingsIcon /> },
  { text: 'Nakit Akışı', icon: <TrendingUpIcon />, path: '/cash-flow', mobileIcon: <TrendingUpIcon /> },
  { text: 'Finansal Tavsiyeler', icon: <LightbulbIcon />, path: '/financial-advice', mobileIcon: <LightbulbIcon /> },
  { text: 'Yönetim Paneli', icon: <SettingsIcon />, path: '/admin-panel', mobileIcon: <SettingsIcon /> },
];

// Mobil navigasyon için kullanılacak öğeler (maksimum 5)
const mobileNavItems = menuItems.slice(0, 5);

const MainLayout = ({ generalSettings, showMobilePreview, onOpenMobilePreview }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Drawer açık/kapalı durumu
  const [open, setOpen] = useState(!isMobile);
  
  // Kullanıcı menüsü durumu
  const [anchorEl, setAnchorEl] = useState(null);
  const openUserMenu = Boolean(anchorEl);

  // Aktif alt navigasyon öğesi
  const [activeNavItem, setActiveNavItem] = useState(0);
  
  // Sayfa değiştiğinde alt navigasyonu güncelle
  useEffect(() => {
    const index = mobileNavItems.findIndex(item => item.path === location.pathname);
    if (index !== -1) {
      setActiveNavItem(index);
    }
  }, [location.pathname]);
  
  // Kullanıcı menüsünü açma/kapama
  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Drawer açma/kapama
  const toggleDrawer = () => {
    setOpen(!open);
  };
  
  // Çıkış işlemi
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  const isDarkMode = generalSettings && generalSettings.theme === 'dark';
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Üst çubuk */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          width: { md: open ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { md: open ? `${drawerWidth}px` : 0 },
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.primary.main,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2, display: 'flex' }}
          >
            {open && !isMobile ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            FinTech AI
          </Typography>
          
          {/* Mobil Önizleme Butonu */}
          {showMobilePreview && (
            <Tooltip title="Mobil önizlemeyi görüntüle">
              <IconButton 
                color="primary" 
                onClick={onOpenMobilePreview}
                sx={{ mr: 1 }}
              >
                <Badge badgeContent="Yeni" color="secondary">
                  <MobileIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          )}
          
          <IconButton
            onClick={handleUserMenuClick}
            size="small"
            aria-controls={openUserMenu ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={openUserMenu ? 'true' : undefined}
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              <AccountCircleIcon />
            </Avatar>
          </IconButton>
          
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={openUserMenu}
            onClose={handleUserMenuClose}
            MenuListProps={{
              'aria-labelledby': 'user-button',
            }}
          >
            <MenuItem onClick={handleUserMenuClose}>Profil</MenuItem>
            <MenuItem onClick={() => navigate('/admin-panel')}>Ayarlar</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Çıkış Yap
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Yan menü - Mobil için kaydırılabilir drawer */}
      {isMobile ? (
        <SwipeableDrawer
          open={open}
          onClose={toggleDrawer}
          onOpen={() => setOpen(true)}
          sx={{
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
          <Box sx={{ overflow: 'auto', mt: 2 }}>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton 
                    selected={location.pathname === item.path}
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setOpen(false);
                    }}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(46, 125, 50, 0.1)',
                        borderRight: '3px solid',
                        borderColor: 'primary.main',
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'rgba(46, 125, 50, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: location.pathname === item.path ? 'primary.main' : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </SwipeableDrawer>
      ) : (
        <Drawer
          variant="persistent"
          open={open}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto', mt: 2 }}>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton 
                    selected={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(46, 125, 50, 0.1)',
                        borderRight: '3px solid',
                        borderColor: 'primary.main',
                      },
                      '&.Mui-selected:hover': {
                        backgroundColor: 'rgba(46, 125, 50, 0.15)',
                      }
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: location.pathname === item.path ? 'primary.main' : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      )}
      
      {/* Ana içerik */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 1, sm: 2, md: 3 }, 
          width: { md: open ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { md: open ? `${drawerWidth}px` : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          backgroundColor: theme.palette.background.default,
          pb: isMobile ? 7 : 3 // Alt navigasyon için ekstra padding
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} /> {/* Üst çubuğun yerine doldurma */}
        <Container maxWidth="xl" sx={{ mt: { xs: 1, sm: 2 } }}>
          <Outlet /> {/* Sayfaların render edileceği yer */}
        </Container>
      </Box>

      {/* Mobil alt navigasyon */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            boxShadow: '0 -2px 4px rgba(0,0,0,0.1)'
          }} 
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={activeNavItem}
            onChange={(event, newValue) => {
              setActiveNavItem(newValue);
              navigate(mobileNavItems[newValue].path);
            }}
          >
            {mobileNavItems.map((item, index) => (
              <BottomNavigationAction 
                key={item.text} 
                label={isSmallMobile ? '' : item.text} 
                icon={item.mobileIcon} 
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

export default MainLayout; 