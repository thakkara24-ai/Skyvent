import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Settings, Palette, Check, RotateCcw, CheckCircle2 } from 'lucide-react';

export const ThemeSwitcher = ({ className = "" }) => {
  const { theme, currentThemeId, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Gear Icon Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center relative cursor-pointer border ${
          isOpen
            ? 'bg-[var(--coffee-brown)]/10 text-[var(--coffee-brown)] border-[var(--coffee-brown)]/30 ring-2 ring-[var(--coffee-brown)]/20'
            : 'text-[var(--warm-gray)] hover:text-[var(--ink-brown)] hover:bg-[var(--sand)]/50 border-transparent hover:border-[var(--sand)]'
        }`}
        title="Change Theme Color (8 Palettes)"
        aria-label="Theme Settings"
      >
        <Settings className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-90 text-[var(--coffee-brown)]' : 'hover:rotate-45'}`} />
        
        {/* Active Theme Tiny Dot Indicator */}
        <span
          className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white shadow-xs"
          style={{ backgroundColor: theme.preview.primary }}
        />
      </button>

      {/* Theme Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white border border-[var(--sand)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[var(--sand)]/30 to-[var(--sand-light)]/40 border-b border-[var(--sand)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--coffee-brown)]/15 text-[var(--coffee-brown)] flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--ink-brown)] flex items-center gap-1.5">
                  Theme Appearance
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--coffee-brown)]/10 text-[var(--coffee-brown)]">
                    8 Colors
                  </span>
                </h4>
                <p className="text-[11px] text-[var(--warm-gray)]">
                  Switch live campus design palette
                </p>
              </div>
            </div>

            {/* Reset Button */}
            {currentThemeId !== 'warm_academic' && (
              <button
                onClick={() => setTheme('warm_academic')}
                className="text-[11px] font-semibold text-[var(--warm-gray)] hover:text-[var(--coffee-brown)] flex items-center gap-1 p-1 hover:bg-white rounded-md transition-colors cursor-pointer"
                title="Reset to Warm Academic"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Theme Grid List */}
          <div className="p-3 max-h-[380px] overflow-y-auto space-y-1.5 divide-y divide-transparent">
            {themes.map((t) => {
              const isActive = t.id === currentThemeId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 flex items-center justify-between border cursor-pointer group ${
                    isActive
                      ? 'bg-[var(--sand)]/30 border-[var(--coffee-brown)]/40 shadow-xs ring-1 ring-[var(--coffee-brown)]/30'
                      : 'border-transparent hover:border-[var(--sand)] hover:bg-[var(--sand-light)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* 3-Color Preview Swatch Circle */}
                    <div className="relative w-8 h-8 rounded-xl shrink-0 overflow-hidden shadow-xs border border-black/10 flex items-center justify-center p-0.5" style={{ backgroundColor: t.preview.bg }}>
                      <div className="w-full h-full rounded-lg flex overflow-hidden">
                        <div className="w-1/2 h-full" style={{ backgroundColor: t.preview.primary }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: t.preview.accent }} />
                      </div>
                    </div>

                    {/* Theme Info */}
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isActive ? 'text-[var(--coffee-brown)]' : 'text-[var(--ink-brown)] group-hover:text-[var(--coffee-brown)]'}`}>
                          {t.name}
                        </span>
                        {t.id === 'warm_academic' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--sand)] text-[var(--ink-brown)]">
                            Default
                          </span>
                        )}
                        {t.id === 'midnight_slate' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 text-white">
                            Dark
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--warm-gray)] block truncate">
                        {t.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Active Indicator Checkmark */}
                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-[var(--coffee-brown)] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 bg-[var(--cream)] border-t border-[var(--sand)] text-[10px] text-[var(--warm-gray)] flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Saved automatically
            </span>
            <span className="font-semibold text-[var(--ink-brown)]">
              Active: {theme.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
