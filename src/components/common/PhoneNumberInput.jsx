import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  validatePhoneNumberLength,
  AsYouType,
} from 'libphonenumber-js';

// ISO Country Code to Emoji Flag helper
const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return 'ðŸŒ';
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
};

// Safe Intl DisplayNames for localized English country names
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
const getCountryName = (countryCode) => {
  try {
    return regionNames.of(countryCode) || countryCode;
  } catch (e) {
    return countryCode;
  }
};

// Pre-build the comprehensive list of supported countries (200+)
const ALL_COUNTRIES = getCountries()
  .map((code) => {
    let callingCode = '';
    try {
      callingCode = '+' + getCountryCallingCode(code);
    } catch (e) {
      callingCode = '';
    }
    return {
      code,
      name: getCountryName(code),
      callingCode,
      flag: getCountryFlag(code),
    };
  })
  .filter((c) => c.callingCode !== '')
  .sort((a, b) => a.name.localeCompare(b.name));

/**
 * Metadata-driven check: can the national number accept more digits?
 */
export function canAcceptMoreDigits(digits, country) {
  if (!digits) return true;
  const clean = digits.replace(/\D/g, '');
  if (clean.length === 0) return true;
  if (clean.length >= 15) return false;

  // If libphonenumber length check reports TOO_LONG, definitely reject
  if (validatePhoneNumberLength(clean, country) === 'TOO_LONG') {
    return false;
  }

  // If the number is currently valid according to libphonenumber metadata
  const parsed = parsePhoneNumberFromString(clean, country);
  if (parsed && parsed.isValid()) {
    // Check if adding any digit 0-9 could form a valid or possible number
    let canExtend = false;
    for (let d = 0; d <= 9; d++) {
      const candidate = clean + d;
      if (isValidPhoneNumber(candidate, country)) {
        canExtend = true;
        break;
      }
      const pCand = parsePhoneNumberFromString(candidate, country);
      if (pCand && pCand.isPossible()) {
        for (let next = 0; next <= 9; next++) {
          if (isValidPhoneNumber(candidate + next, country)) {
            canExtend = true;
            break;
          }
        }
      }
      if (canExtend) break;
    }
    return canExtend;
  }

  return true;
}

/**
 * Sanitizes input national digits: blocks extra digits beyond valid country structure
 */
export function sanitizeNationalDigits(rawText, country) {
  const digitsOnly = String(rawText || '').replace(/\D/g, '');
  let result = '';
  for (let i = 0; i < digitsOnly.length; i++) {
    const char = digitsOnly[i];
    if (canAcceptMoreDigits(result, country)) {
      result += char;
    } else {
      break; // Extra digit blocked!
    }
  }
  return result;
}

const PhoneNumberInput = ({
  value = '',
  onChange,
  defaultCountry = 'IN',
  label = 'Phone Number',
  required = false,
  disabled = false,
  placeholder = '',
  id,
  name = 'phone',
  className = '',
  error: externalError = null,
  showLabel = true,
}) => {
  // State
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [nationalNumber, setNationalNumber] = useState('');
  const [touched, setTouched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const numberInputRef = useRef(null);

  // Parse initial or externally changed value
  useEffect(() => {
    if (!value) {
      setNationalNumber('');
      return;
    }

    const str = String(value).trim();
    // If value has international prefix '+'
    if (str.startsWith('+')) {
      const parsed = parsePhoneNumberFromString(str);
      if (parsed) {
        if (parsed.country && parsed.country !== selectedCountry) {
          setSelectedCountry(parsed.country);
        }
        setNationalNumber(parsed.nationalNumber || '');
        return;
      }
    }

    // Otherwise try parsing with selectedCountry
    const parsed = parsePhoneNumberFromString(str, selectedCountry);
    if (parsed) {
      setNationalNumber(parsed.nationalNumber || str.replace(/\D/g, ''));
    } else {
      setNationalNumber(str.replace(/\D/g, ''));
    }
  }, [value]);

  const currentCountryObj = useMemo(() => {
    return (
      ALL_COUNTRIES.find((c) => c.code === selectedCountry) ||
      ALL_COUNTRIES.find((c) => c.code === 'IN') ||
      ALL_COUNTRIES[0]
    );
  }, [selectedCountry]);

  // Filtered country list based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return ALL_COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.callingCode.replace('+', '').includes(q) ||
        c.callingCode.includes(q)
    );
  }, [searchQuery]);

  // Validation logic
  const validationError = useMemo(() => {
    if (!nationalNumber) {
      if (required && touched) {
        return 'Phone number is required.';
      }
      return null;
    }

    const lengthCheck = validatePhoneNumberLength(nationalNumber, selectedCountry);
    if (lengthCheck === 'TOO_SHORT') {
      return 'Please enter a complete valid phone number for the selected country.';
    }
    if (lengthCheck === 'TOO_LONG') {
      return 'Phone number has too many digits for the selected country.';
    }

    // Check validity using libphonenumber-js
    const isValid = isValidPhoneNumber(nationalNumber, selectedCountry);
    if (!isValid && touched) {
      return 'Please enter a valid phone number for the selected country.';
    }

    return null;
  }, [nationalNumber, selectedCountry, required, touched]);

  // Emit change to parent
  const notifyChange = (newNationalNumber, newCountry) => {
    const countryObj = ALL_COUNTRIES.find((c) => c.code === newCountry) || currentCountryObj;
    const cleanDigits = (newNationalNumber || '').replace(/\D/g, '');

    let fullE164 = '';
    let isValid = false;

    if (cleanDigits) {
      const parsed = parsePhoneNumberFromString(cleanDigits, newCountry);
      if (parsed && parsed.isValid()) {
        fullE164 = parsed.number; // Canonical E.164 with trunk prefix correctly handled
        isValid = true;
      } else {
        const stripped = cleanDigits.startsWith('0') && cleanDigits.length > 1 ? cleanDigits.replace(/^0+/, '') : cleanDigits;
        fullE164 = `${countryObj.callingCode}${stripped}`;
        isValid = isValidPhoneNumber(cleanDigits, newCountry);
      }
    } else {
      isValid = !required;
    }

    if (onChange) {
      onChange(fullE164, {
        country: newCountry,
        countryCode: countryObj.callingCode,
        nationalNumber: cleanDigits,
        e164: fullE164,
        isValid,
        error: validationError,
      });
    }
  };

  // Keyboard navigation and prevention of extra digits
  const handleKeyDown = (e) => {
    // Allow navigation, control keys, backspace, delete, tab, arrows
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }

    // Block non-digit keys
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    const selStart = numberInputRef.current?.selectionStart;
    const selEnd = numberInputRef.current?.selectionEnd;
    if (selStart !== null && selEnd !== null && selStart !== selEnd) {
      return; // Selection will be replaced
    }

    // MANDATORY REQUIREMENT: Block extra digits beyond valid country structure
    if (!canAcceptMoreDigits(nationalNumber, selectedCountry)) {
      e.preventDefault();
    }
  };

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    const sanitized = sanitizeNationalDigits(rawVal, selectedCountry);
    setNationalNumber(sanitized);
    notifyChange(sanitized, selectedCountry);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    if (!pastedText) return;

    // If user pasted an international format with '+', try to detect country
    if (pastedText.trim().startsWith('+')) {
      const parsed = parsePhoneNumberFromString(pastedText.trim());
      if (parsed && parsed.country) {
        setSelectedCountry(parsed.country);
        const sanitized = sanitizeNationalDigits(parsed.nationalNumber, parsed.country);
        setNationalNumber(sanitized);
        notifyChange(sanitized, parsed.country);
        return;
      }
    }

    // Handle replacement if text is selected
    const inputEl = numberInputRef.current;
    let targetText = pastedText;
    if (inputEl && inputEl.selectionStart !== null && inputEl.selectionEnd !== null) {
      const start = inputEl.selectionStart;
      const end = inputEl.selectionEnd;
      targetText = nationalNumber.slice(0, start) + pastedText + nationalNumber.slice(end);
    } else {
      targetText = nationalNumber + pastedText;
    }

    const sanitized = sanitizeNationalDigits(targetText, selectedCountry);
    setNationalNumber(sanitized);
    notifyChange(sanitized, selectedCountry);
  };

  // Country selection change
  const handleCountrySelect = (newCountry) => {
    setSelectedCountry(newCountry);
    setDropdownOpen(false);
    setSearchQuery('');
    setFocusedIndex(-1);

    // Re-sanitize existing national number under new country rules
    const reSanitized = sanitizeNationalDigits(nationalNumber, newCountry);
    setNationalNumber(reSanitized);
    notifyChange(reSanitized, newCountry);

    if (numberInputRef.current) {
      numberInputRef.current.focus();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation inside country search dropdown
  const handleDropdownKeyDown = (e) => {
    if (e.key === 'Escape') {
      setDropdownOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredCountries.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : filteredCountries.length - 1));
    } else if (e.key === 'Enter' && focusedIndex >= 0 && filteredCountries[focusedIndex]) {
      e.preventDefault();
      handleCountrySelect(filteredCountries[focusedIndex].code);
    }
  };

  const displayError = externalError || (touched ? validationError : null);

  return (
    <div className={`space-y-1 ${className}`} ref={dropdownRef}>
      {showLabel && label && (
        <label
          htmlFor={id || name}
          className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Country Selector Button */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setTimeout(() => {
                if (!dropdownOpen && searchInputRef.current) {
                  searchInputRef.current.focus();
                }
              }, 50);
            }}
            className={`flex items-center gap-1.5 px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-l-xl text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 h-[42px] shrink-0 ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label={`Select country code. Current: ${currentCountryObj.name} (${currentCountryObj.callingCode})`}
          >
            <span className="text-base leading-none" role="img" aria-label={currentCountryObj.name}>
              {currentCountryObj.flag}
            </span>
            <span className="font-mono text-xs text-on-surface">{currentCountryObj.callingCode}</span>
            <span className="material-symbols-outlined text-xs text-outline">arrow_drop_down</span>
          </button>

          {/* Searchable Country Dropdown Modal/Listbox */}
          {dropdownOpen && (
            <div
              onKeyDown={handleDropdownKeyDown}
              className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-h-72 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            >
              {/* Search input header */}
              <div className="p-2.5 border-b border-outline-variant bg-surface-container-low">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-xs text-on-surface-variant">
                    search
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFocusedIndex(0);
                    }}
                    placeholder="Search country or code..."
                    className="w-full text-xs pl-7 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Scrollable country list */}
              <div className="overflow-y-auto flex-1 divide-y divide-outline-variant/30 py-1" role="listbox">
                {filteredCountries.length === 0 ? (
                  <div className="p-4 text-center text-xs text-on-surface-variant">
                    No country found for "{searchQuery}"
                  </div>
                ) : (
                  filteredCountries.map((c, index) => {
                    const isSelected = c.code === selectedCountry;
                    const isFocused = index === focusedIndex;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCountrySelect(c.code)}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-bold'
                            : isFocused
                            ? 'bg-surface-container-high text-on-surface'
                            : 'hover:bg-surface-container-low text-on-surface'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <span className="flex items-center gap-2 truncate pr-2">
                          <span className="text-base leading-none">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="font-mono text-[11px] text-on-surface-variant shrink-0">
                          {c.callingCode}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* National Number Input Field */}
        <input
          ref={numberInputRef}
          id={id || name}
          name={name}
          type="tel"
          inputMode="tel"
          disabled={disabled}
          required={required}
          value={nationalNumber}
          onKeyDown={handleKeyDown}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onBlur={() => setTouched(true)}
          placeholder={placeholder || `e.g. ${currentCountryObj.code === 'IN' ? '9876543210' : 'Mobile number'}`}
          className={`w-full px-3.5 py-2.5 bg-surface border border-l-0 border-outline-variant rounded-r-xl text-sm font-mono text-on-surface focus:outline-none focus:border-primary transition-colors h-[42px] ${
            displayError ? 'border-rose-500 focus:border-rose-600 bg-rose-50/10' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-container-low' : ''}`}
          aria-invalid={!!displayError}
        />
      </div>

      {/* Validation Error Message */}
      {displayError && (
        <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1 animate-in fade-in duration-150">
          <span className="material-symbols-outlined text-xs">error</span>
          <span>{displayError}</span>
        </p>
      )}
    </div>
  );
};

export default PhoneNumberInput;