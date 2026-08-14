'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
  id: string;
  label: string;
  sublabel?: string;
  searchValue?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  initialLimit?: number;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecciona una opción...',
  searchPlaceholder = 'Buscar por nombre o folio...',
  disabled = false,
  initialLimit = 4,
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const matchLabel = opt.label.toLowerCase().includes(term);
    const matchSublabel = opt.sublabel?.toLowerCase().includes(term);
    const matchSearchValue = opt.searchValue?.toLowerCase().includes(term);
    return matchLabel || matchSublabel || matchSearchValue;
  });

  // Limit items when not searching
  const displayedOptions = searchTerm.trim()
    ? filteredOptions
    : filteredOptions.slice(0, initialLimit);

  const hasMore = !searchTerm.trim() && options.length > initialLimit;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 rounded-xl bg-slate-900 border text-left text-xs flex items-center justify-between transition-all ${
          isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-700 hover:border-slate-600'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-950 border-slate-800' : 'cursor-pointer'}`}
      >
        <span className="truncate pr-2">
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span className="font-bold text-white truncate">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-[11px] text-slate-400 font-mono truncate">({selectedOption.sublabel})</span>
              )}
            </span>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl shadow-slate-950 overflow-hidden space-y-1">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-800 flex items-center gap-2 bg-slate-950/60">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-0.5 rounded text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/40 p-1">
            {displayedOptions.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-3 py-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                      : 'hover:bg-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold text-white truncate">{opt.label}</p>
                    {opt.sublabel && <p className="text-[10px] text-slate-400 font-mono truncate">{opt.sublabel}</p>}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}

            {displayedOptions.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-xs">
                No se encontraron resultados para "{searchTerm}"
              </div>
            )}
          </div>

          {/* Footer note when more items exist */}
          {hasMore && (
            <div className="px-3 py-1.5 bg-slate-950 text-[10px] text-slate-400 text-center border-t border-slate-800">
              Mostrando primeros {initialLimit} resultados. Escribe para buscar más...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
