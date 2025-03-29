import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Tema oluşturucu fonksiyon
const createAppTheme = (mode = 'light') => {
  // Temel tema
  let theme = createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
      },
    },
    palette: {
      mode: mode,
      primary: {
        main: '#2E7D32', // Yeşil
      },
      secondary: {
        main: '#673AB7', // Mor
      },
      error: {
        main: '#D32F2F', // Kırmızı
      },
      warning: {
        main: '#F57C00', // Turuncu
      },
      info: {
        main: '#1976D2', // Mavi
      },
      success: {
        main: '#388E3C', // Koyu yeşil
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#212121',
        secondary: mode === 'dark' ? '#b0b0b0' : '#757575',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      // Responsive tipografi ayarları
      h1: {
        fontWeight: 500,
        fontSize: '2.2rem',
        '@media (max-width:600px)': {
          fontSize: '1.8rem',
        },
      },
      h2: {
        fontWeight: 500,
        fontSize: '1.8rem',
        '@media (max-width:600px)': {
          fontSize: '1.6rem',
        },
      },
      h3: {
        fontWeight: 500,
        fontSize: '1.5rem',
        '@media (max-width:600px)': {
          fontSize: '1.35rem',
        },
      },
      h4: {
        fontWeight: 500,
        fontSize: '1.3rem',
        '@media (max-width:600px)': {
          fontSize: '1.2rem',
        },
      },
      h5: {
        fontWeight: 500,
        fontSize: '1.1rem',
        '@media (max-width:600px)': {
          fontSize: '1.05rem',
        },
      },
      h6: {
        fontWeight: 500,
        fontSize: '1rem',
        '@media (max-width:600px)': {
          fontSize: '0.95rem',
        },
      },
      body1: {
        fontSize: '1rem',
        '@media (max-width:600px)': {
          fontSize: '0.95rem',
        },
      },
      body2: {
        fontSize: '0.875rem',
        '@media (max-width:600px)': {
          fontSize: '0.85rem',
        },
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            '@media (max-width:600px)': {
              padding: '6px 12px',
              fontSize: '0.875rem',
            },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'dark' 
              ? '0px 3px 6px rgba(0, 0, 0, 0.25)' 
              : '0px 3px 6px rgba(0, 0, 0, 0.05)',
            '@media (max-width:600px)': {
              borderRadius: 8,
            },
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: 16,
            '&:last-child': {
              paddingBottom: 16,
            },
            '@media (max-width:600px)': {
              padding: 12,
              '&:last-child': {
                paddingBottom: 12,
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#2E7D32',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#333333' : '#f8f8f8',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#121212' : '#ffffff',
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: mode === 'dark' ? '#b0b0b0' : '#757575',
            '&.Mui-selected': {
              color: theme => theme.palette.primary.main,
            },
            minWidth: 0, // Küçük ekranlarda daha iyi görünüm için
            padding: '6px 0',
            '@media (max-width:360px)': {
              padding: '6px 0',
            },
          },
          label: {
            fontSize: '0.7rem',
            '@media (max-width:360px)': {
              fontSize: '0.65rem',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '@media (max-width:600px)': {
              padding: 8,
            },
          },
          sizeSmall: {
            '@media (max-width:600px)': {
              padding: 4,
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            '@media (max-width:600px)': {
              paddingTop: 6,
              paddingBottom: 6,
            },
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            '@media (max-width:600px)': {
              paddingLeft: 12,
              paddingRight: 12,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 48,
            '@media (max-width:600px)': {
              minHeight: 40,
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 48,
            '@media (max-width:600px)': {
              minHeight: 40,
              minWidth: 72,
              fontSize: '0.75rem',
            },
          },
        },
      },
    },
  });

  // Responsive yazı tiplerini otomatik ayarla
  theme = responsiveFontSizes(theme);
  
  return theme;
};

// Varsayılan tema
const theme = createAppTheme('light');

export { createAppTheme };
export default theme; 