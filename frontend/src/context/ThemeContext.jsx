import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEME_OPTIONS = [
  {
    id: 'warm_academic',
    name: 'Warm Academic',
    subtitle: 'Classic Parchment & Coffee',
    category: 'Collegiate Classic',
    preview: {
      primary: '#6B4A38',
      accent: '#8B6353',
      bg: '#FAF8F5',
      text: '#2A1E18',
    },
    colors: {
      '--ink-brown': '#2A1E18',
      '--coffee-brown': '#6B4A38',
      '--coffee-hover': '#563B2C',
      '--sand': '#E8DCCE',
      '--sand-light': '#F4EFEA',
      '--cream': '#FAF8F5',
      '--white': '#FFFFFF',
      '--warm-gray': '#7A6A5E',
      '--warm-gray-light': '#ECE7E2',
      '--clay-brown': '#8B6353',
      '--card-bg': '#FFFFFF',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
    }
  },
  {
    id: 'royal_navy',
    name: 'Royal Navy',
    subtitle: 'Oxford Blue & Slate',
    category: 'Collegiate Blue',
    preview: {
      primary: '#1E40AF',
      accent: '#3B82F6',
      bg: '#F8FAFC',
      text: '#0F172A',
    },
    colors: {
      '--ink-brown': '#0F172A',
      '--coffee-brown': '#1E40AF',
      '--coffee-hover': '#1E3A8A',
      '--sand': '#CBD5E1',
      '--sand-light': '#F1F5F9',
      '--cream': '#F8FAFC',
      '--white': '#FFFFFF',
      '--warm-gray': '#64748B',
      '--warm-gray-light': '#E2E8F0',
      '--clay-brown': '#2563EB',
      '--card-bg': '#FFFFFF',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
    }
  },
  {
    id: 'emerald_forest',
    name: 'Emerald Campus',
    subtitle: 'Campus Green & Sage',
    category: 'Botanical Green',
    preview: {
      primary: '#065F46',
      accent: '#0D9488',
      bg: '#F6FBF9',
      text: '#062C22',
    },
    colors: {
      '--ink-brown': '#062C22',
      '--coffee-brown': '#065F46',
      '--coffee-hover': '#044E39',
      '--sand': '#A7F3D0',
      '--sand-light': '#ECFDF5',
      '--cream': '#F6FBF9',
      '--white': '#FFFFFF',
      '--warm-gray': '#476B60',
      '--warm-gray-light': '#D1FAE5',
      '--clay-brown': '#0D9488',
      '--card-bg': '#FFFFFF',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
    }
  },
  {
    id: 'varsity_crimson',
    name: 'Varsity Crimson',
    subtitle: 'Ivy Maroon & Rose',
    category: 'Ivy League Red',
    preview: {
      primary: '#881337',
      accent: '#BE123C',
      bg: '#FFF8F9',
      text: '#2D0C15',
    },
    colors: {
      '--ink-brown': '#2D0C15',
      '--coffee-brown': '#881337',
      '--coffee-hover': '#700F2E',
      '--sand': '#FECDD3',
      '--sand-light': '#FFF1F2',
      '--cream': '#FFF8F9',
      '--white': '#FFFFFF',
      '--warm-gray': '#7A535F',
      '--warm-gray-light': '#FFE4E6',
      '--clay-brown': '#BE123C',
      '--card-bg': '#FFFFFF',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
    }
  },
  {
    id: 'sunset_amber',
    name: 'Sunset Amber',
    subtitle: 'Terracotta & Ochre Gold',
    category: 'Warm Gold',
    preview: {
      primary: '#B45309',
      accent: '#D97706',
      bg: '#FFFDF7',
      text: '#2B1D0E',
    },
    colors: {
      '--ink-brown': '#2B1D0E',
      '--coffee-brown': '#B45309',
      '--coffee-hover': '#92400E',
      '--sand': '#FDE68A',
      '--sand-light': '#FEF3C7',
      '--cream': '#FFFDF7',
      '--white': '#FFFFFF',
      '--warm-gray': '#786047',
      '--warm-gray-light': '#FEF9C3',
      '--clay-brown': '#D97706',
      '--card-bg': '#FFFFFF',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
    }
  },
  {
    id: 'imperial_amethyst',
    name: 'Imperial Amethyst',
    subtitle: 'Royal Violet & Lilac',
    category: 'Regal Purple',
    preview: {
      primary: '#6D28D9',
      accent: '#7C3AED',
      bg: '#FAF9FE',
      text: '#1E1035',
    },
    colors: {
      '--ink-brown': '#1E1035',
      '--coffee-brown': '#6D28D9',
      '--coffee-hover': '#5B21B6',
      '--sand': '#DDD6FE',
      '--sand-light': '#F5F3FF',
      '--cream': '#FAF9FE',
      '--white': '#FFFFFF',
      '--warm-gray': '#6D6487',
      '--warm-gray-light': '#EDE9FE',
      '--clay-brown': '#7C3AED',
      '--card-bg': '#FFFFFF',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
    }
  },
  {
    id: 'ocean_teal',
    name: 'Ocean Teal',
    subtitle: 'Pacific Cyan & Marine',
    category: 'Fresh Cyan',
    preview: {
      primary: '#0E7490',
      accent: '#0284C7',
      bg: '#F6FBFE',
      text: '#0E272D',
    },
    colors: {
      '--ink-brown': '#0E272D',
      '--coffee-brown': '#0E7490',
      '--coffee-hover': '#155E75',
      '--sand': '#BAE6FD',
      '--sand-light': '#F0F9FF',
      '--cream': '#F6FBFE',
      '--white': '#FFFFFF',
      '--warm-gray': '#506E78',
      '--warm-gray-light': '#E0F2FE',
      '--clay-brown': '#0284C7',
      '--card-bg': '#FFFFFF',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
    }
  },
  {
    id: 'midnight_slate',
    name: 'Midnight Slate',
    subtitle: 'Dark Mode & Cyberpunk Indigo',
    category: 'Modern Dark',
    preview: {
      primary: '#6366F1',
      accent: '#818CF8',
      bg: '#0F172A',
      text: '#F8FAFC',
    },
    colors: {
      '--ink-brown': '#F8FAFC',
      '--coffee-brown': '#6366F1',
      '--coffee-hover': '#4F46E5',
      '--sand': '#334155',
      '--sand-light': '#1E293B',
      '--cream': '#0F172A',
      '--white': '#1E293B',
      '--warm-gray': '#94A3B8',
      '--warm-gray-light': '#334155',
      '--clay-brown': '#818CF8',
      '--card-bg': '#1E293B',
      '--header-bg': 'rgba(15, 23, 42, 0.95)',
    }
  }
];

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    return localStorage.getItem('skyvent_theme') || 'warm_academic';
  });

  const activeTheme = THEME_OPTIONS.find((t) => t.id === currentThemeId) || THEME_OPTIONS[0];

  const applyTheme = (themeObj) => {
    if (!themeObj || !themeObj.colors) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', themeObj.id);
    
    // Apply all CSS variables directly to root style
    Object.entries(themeObj.colors).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
  };

  const setTheme = (themeId) => {
    const selected = THEME_OPTIONS.find((t) => t.id === themeId);
    if (selected) {
      setCurrentThemeId(selected.id);
      localStorage.setItem('skyvent_theme', selected.id);
      applyTheme(selected);
    }
  };

  useEffect(() => {
    applyTheme(activeTheme);
  }, [currentThemeId]);

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        currentThemeId,
        setTheme,
        themes: THEME_OPTIONS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
