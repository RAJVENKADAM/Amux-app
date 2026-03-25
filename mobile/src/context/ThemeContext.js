import React, { createContext, useContext } from 'react';

const darkTheme = {
  mode: 'dark',
  primary: '#e5467b',         
  primaryLight: '#f472b6',    
  primaryDark: '#9b1452',     
  secondary: '#ec4899',       
  secondaryLight: '#fce7f3',  
  success: '#10b981',
  successBg: '#064e3b',       
  successText: '#000000',     
  warning: '#f59e0b',
  warningBg: '#451a03',       
  warningText: '#000000',     
  error: '#ef4444',
  errorBg: '#451a03',         
  errorText: '#000000',       
  info: '#e5467b',
  infoBg: '#2d1b24',          
  infoText: '#000000',        
  background: '#000000',      
  surface: '#1c1c1c',         
  surfaceAlt: '#2c2c2c',      
  text: '#ffffff',            
  textSecondary: '#a1a1a1',   
  textLight: '#6b7280',       
  border: '#3f3f46',          
  borderDark: '#27272a',      
  overlay: 'rgba(0, 0, 0, 0.5)',
  inputBackground: '#1c1c1c',
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const theme = darkTheme;
  const isDark = true;

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

