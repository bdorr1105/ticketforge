import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';
import api from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');
  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('primaryColor') || '#1976d2');
  const [logo, setLogo] = useState(localStorage.getItem('logo') || '/logo.png');
  const [favicon, setFavicon] = useState(localStorage.getItem('favicon') || '/favicon.png');
  const [companyName, setCompanyName] = useState(localStorage.getItem('companyName') || 'TicketForge');

  useEffect(() => {
    loadThemeSettings();
  }, []);

  useEffect(() => {
    // Update document title when company name changes
    document.title = `${companyName} - Help Desk`;
  }, [companyName]);

  useEffect(() => {
    // Update favicon dynamically when it changes
    const updateFavicon = () => {
      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll("link[rel*='icon']");
      existingFavicons.forEach(link => link.remove());

      // Create new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = favicon;
      document.head.appendChild(link);

      // Also update apple-touch-icon for mobile
      const appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      appleTouchIcon.href = logo; // Use logo for apple touch icon
      document.head.appendChild(appleTouchIcon);
    };

    updateFavicon();
  }, [favicon, logo]);

  const loadThemeSettings = async () => {
    try {
      const response = await api.get('/theme/settings');
      const { theme_mode, primary_color, logo_url, favicon_url, company_name } = response.data;

      if (theme_mode) {
        setMode(theme_mode);
        localStorage.setItem('themeMode', theme_mode);
      }
      if (primary_color) {
        setPrimaryColor(primary_color);
        localStorage.setItem('primaryColor', primary_color);
      }
      // Use custom logo if available, otherwise use default logo
      const finalLogo = logo_url || '/logo.png';
      setLogo(finalLogo);
      localStorage.setItem('logo', finalLogo);

      // Use custom favicon if available, otherwise use default favicon
      const finalFavicon = favicon_url || '/favicon.png';
      setFavicon(finalFavicon);
      localStorage.setItem('favicon', finalFavicon);

      if (company_name) {
        setCompanyName(company_name);
        localStorage.setItem('companyName', company_name);
      }
    } catch (error) {
      // Use defaults if settings not available
      console.error('Failed to load theme settings:', error);
      // Set default logo and favicon on error
      setLogo('/logo.png');
      localStorage.setItem('logo', '/logo.png');
      setFavicon('/favicon.png');
      localStorage.setItem('favicon', '/favicon.png');
    }
  };

  const toggleColorMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const updatePrimaryColor = (color) => {
    setPrimaryColor(color);
    localStorage.setItem('primaryColor', color);
  };

  const updateLogo = (logoUrl) => {
    setLogo(logoUrl);
    localStorage.setItem('logo', logoUrl);
  };

  const updateFavicon = (faviconUrl) => {
    setFavicon(faviconUrl);
    localStorage.setItem('favicon', faviconUrl);
  };

  const updateCompanyName = (name) => {
    setCompanyName(name);
    localStorage.setItem('companyName', name);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: primaryColor,
          },
          secondary: {
            main: mode === 'dark' ? '#f48fb1' : '#dc004e',
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: primaryColor,
              },
            },
          },
        },
      }),
    [mode, primaryColor]
  );

  const value = {
    mode,
    primaryColor,
    logo,
    favicon,
    companyName,
    toggleColorMode,
    updatePrimaryColor,
    updateLogo,
    updateFavicon,
    updateCompanyName,
    refreshTheme: loadThemeSettings,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
