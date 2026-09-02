import React, { useState, useEffect, useRef, useMemo } from 'react';
import examples from 'libphonenumber-js/examples.mobile.json';
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  getExampleNumber,
} from 'libphonenumber-js/max';

// ISO Country Code to Emoji Flag helper
const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌐';
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

// Pre-build the comprehensive list of supported countries (200+) sorted by name
export const ALL_COUNTRIES = getCountries()
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

// List of calling codes sorted by longest length for prefix matching
const COUNTRIES_BY_CALLING_CODE_LENGTH = [...ALL_COUNTRIES].sort(
  (a, b) => b.callingCode.length - a.callingCode.length
);

/**
 * Returns the exact national digit limits and mobile formatting for any country
 */
export const getCountryDigitLimits = (countryCode) => {
  try {
    const ex = getExampleNumber(countryCode, examples);
    const mobileLen = ex && ex.nationalNumber ? ex.nationalNumber.length : 10;
    const maxLen = countryCode === 'GB' ? 11 : countryCode === 'DE' ? 12 : mobileLen;
    return {
      expected: mobileLen,
      max: maxLen,
      min: mobileLen,
      example: ex ? ex.nationalNumber : '9876543210',
      format: ex ? ex.formatNational() : '',
    };
  } catch (e) {
    return { expected: 10, max: 10, min: 10, example: '9876543210', format: '' };
  }
};

/**
 * Checks if input national number can accept more digits based on country rules
 */
export function canAcceptMoreDigits(digits, country) {
  if (!digits) return true;
  const clean = String(digits).replace(/\D/g, '');
  if (clean.length === 0) return true;
  const limits = getCountryDigitLimits(country);
  return clean.length < limits.max;
}

/**
 * Sanitizes input national digits: blocks extra digits beyond valid country structure
 */
export function sanitizeNationalDigits(rawText, country) {
  const digitsOnly = String(rawText || '').replace(/\D/g, '');
  const limits = getCountryDigitLimits(country);
  return digitsOnly.slice(0, limits.max);
}

/**
 * Cleanly extracts country code and pure national digits from any incoming string.
 * Guarantees that the country code (+91, +1, etc.) NEVER leaks into national digits!
 */
export function extractCountryAndNational(val, currentCountry = 'IN') {
  if (!val) return { country: currentCountry, nationalNumber: '' };
  const str = String(val).trim();

  // Case 1: Value starts with '+' (e.g. "+919876543210" or "+919")
  if (str.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(str);
    if (parsed && parsed.country && parsed.nationalNumber) {
      const limits = getCountryDigitLimits(parsed.country);
      return {
        country: parsed.country,
        nationalNumber: parsed.nationalNumber.slice(0, limits.max),
      };
    }
    // Match against calling codes
    for (const c of COUNTRIES_BY_CALLING_CODE_LENGTH) {
      if (str.startsWith(c.callingCode)) {
        const limits = getCountryDigitLimits(c.code);
        const national = str.slice(c.callingCode.length).replace(/\D/g, '').slice(0, limits.max);
        return { country: c.code, nationalNumber: national };
      }
    }
    const limits = getCountryDigitLimits(currentCountry);
    return {
      country: currentCountry,
      nationalNumber: str.replace(/\D/g, '').slice(0, limits.max),
    };
  }

  // Case 2: Value does not have '+' (e.g. "9876543210" or "919876543210")
  const clean = str.replace(/\D/g, '');
  const limits = getCountryDigitLimits(currentCountry);
  let callingDigits = '';
  try {
    callingDigits = getCountryCallingCode(currentCountry);
  } catch (e) {}

  // If someone passed e.g. "919876543210" where calling code was prepended without '+'
  if (callingDigits && clean.startsWith(callingDigits) && clean.length > limits.expected) {
    return {
      country: currentCountry,
      nationalNumber: clean.slice(callingDigits.length).slice(0, limits.max),
    };
  }

  // Strip leading zero for countries where mobile does not use it (like India)
  let finalNational = clean;
  if (currentCountry === 'IN' && finalNational.startsWith('0') && finalNational.length > 1) {
    finalNational = finalNational.replace(/^0+/, '');
  }

  return {
    country: currentCountry,
    nationalNumber: finalNational.slice(0, limits.max),
  };
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
  const lastEmittedValueRef = useRef('');

  // Selected country object & limits
  const currentCountryObj = useMemo(() => {
    return (
      ALL_COUNTRIES.find((c) => c.code === selectedCountry) ||
      ALL_COUNTRIES.find((c) => c.code === 'IN') ||
      ALL_COUNTRIES[0]
    );
  }, [selectedCountry]);

  const currentCountryLimits = useMemo(() => {
    return getCountryDigitLimits(selectedCountry);
  }, [selectedCountry]);

  // Sync with incoming external value (e.g. database load or form reset)
  useEffect(() => {
    // If incoming value is what we just emitted from this component, don't touch local nationalNumber!
    if (value === lastEmittedValueRef.current) {
      return;
    }

    if (!value) {
      setNationalNumber('');
      return;
    }

    const { country: extractedCountry, nationalNumber: extractedNational } = extractCountryAndNational(
      value,
      selectedCountry
    );

    if (extractedCountry && extractedCountry !== selectedCountry) {
      setSelectedCountry(extractedCountry);
    }
    setNationalNumber(extractedNational);
  }, [value]);

  // Filtered country list based on search query
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

  // Dynamic Validation logic
  const validationError = useMemo(() => {
    const cleanDigits = (nationalNumber || '').replace(/\D/g, '');
    const limits = currentCountryLimits;

    if (!cleanDigits) {
      if (required && touched) {
        return 'Phone number is required.';
      }
      return null;
    }

    // Requirement: Show clear error if user entered fewer digits than required
    if (cleanDigits.length < limits.min) {
      return `Please enter ${limits.min} digits for ${currentCountryObj.name} (${currentCountryObj.callingCode}). Currently entered: ${cleanDigits.length} digits.`;
    }

    // If too many digits (failsafe)
    if (cleanDigits.length > limits.max) {
      return `Phone number cannot exceed ${limits.max} digits for ${currentCountryObj.name}.`;
    }

    // Full libphonenumber-js validity check
    const isValid = isValidPhoneNumber(cleanDigits, selectedCountry);
    if (!isValid && touched) {
      return `Please enter a valid phone number for ${currentCountryObj.name} (${currentCountryObj.callingCode}).`;
    }

    return null;
  }, [nationalNumber, selectedCountry, required, touched, currentCountryObj, currentCountryLimits]);

  // Emit canonical E.164 change to parent
  const notifyChange = (newNationalNumber, newCountry) => {
    const countryObj = ALL_COUNTRIES.find((c) => c.code === newCountry) || currentCountryObj;
    const cleanDigits = (newNationalNumber || '').replace(/\D/g, '');

    let fullE164 = '';
    let isValid = false;

    if (cleanDigits) {
      const parsed = parsePhoneNumberFromString(cleanDigits, newCountry);
      if (parsed && parsed.isValid()) {
        fullE164 = parsed.number; // e.g. "+919876543210"
        isValid = true;
      } else {
        const stripped = cleanDigits.startsWith('0') && cleanDigits.length > 1 ? cleanDigits.replace(/^0+/, '') : cleanDigits;
        fullE164 = `${countryObj.callingCode}${stripped}`;
        isValid = isValidPhoneNumber(cleanDigits, newCountry);
      }
    } else {
      isValid = !required;
    }

    lastEmittedValueRef.current = fullE164;

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

  // Keyboard navigation & strict prevention of extra digits
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

    // Block any non-digit key
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    // Allow replacing if user highlighted/selected text
    const selStart = numberInputRef.current?.selectionStart;
    const selEnd = numberInputRef.current?.selectionEnd;
    if (selStart !== null && selEnd !== null && selStart !== selEnd) {
      return;
    }

    // STRICT REQUIREMENT: Block typing extra digits beyond valid country length
    if (!canAcceptMoreDigits(nationalNumber, selectedCountry)) {
      e.preventDefault();
    }
  };

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    let sanitized = sanitizeNationalDigits(rawVal, selectedCountry);
    if (selectedCountry === 'IN' && sanitized.startsWith('0') && sanitized.length > 1) {
      sanitized = sanitized.replace(/^0+/, '');
    }
    setNationalNumber(sanitized);
    notifyChange(sanitized, selectedCountry);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    if (!pastedText) return;

    // If user pasted full international format with '+', detect country
    if (pastedText.trim().startsWith('+')) {
      const { country: parsedCountry, nationalNumber: parsedNational } = extractCountryAndNational(
        pastedText.trim(),
        selectedCountry
      );
      setSelectedCountry(parsedCountry);
      setNationalNumber(parsedNational);
      notifyChange(parsedNational, parsedCountry);
      return;
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

    let sanitized = sanitizeNationalDigits(targetText, selectedCountry);
    if (selectedCountry === 'IN' && sanitized.startsWith('0') && sanitized.length > 1) {
      sanitized = sanitized.replace(/^0+/, '');
    }
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
    const newLimits = getCountryDigitLimits(newCountry);
    let reSanitized = nationalNumber.slice(0, newLimits.max);
    if (newCountry === 'IN' && reSanitized.startsWith('0') && reSanitized.length > 1) {
      reSanitized = reSanitized.replace(/^0+/, '');
    }
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

        {/* National Number Input Field - PURE DIGITS ONLY, NO COUNTRY CODE PREPENDED */}
        <input
          ref={numberInputRef}
          id={id || name}
          name={name}
          type="tel"
          inputMode="numeric"
          maxLength={currentCountryLimits.max}
          disabled={disabled}
          required={required}
          value={nationalNumber}
          onKeyDown={handleKeyDown}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onBlur={() => setTouched(true)}
          placeholder={
            placeholder ||
            `e.g. ${currentCountryLimits.example} (${currentCountryLimits.expected} digits)`
          }
          className={`w-full px-3.5 py-2.5 bg-surface border border-l-0 border-outline-variant rounded-r-xl text-sm font-mono text-on-surface focus:outline-none focus:border-primary transition-colors h-[42px] ${
            displayError ? 'border-rose-500 focus:border-rose-600 bg-rose-50/10' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-container-low' : ''}`}
          aria-invalid={!!displayError}
        />
      </div>

      {/* Validation Message & Digit Counter */}
      <div className="flex items-center justify-between px-1">
        {displayError ? (
          <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 mt-1 animate-in fade-in duration-150">
            <span className="material-symbols-outlined text-xs">error</span>
            <span>{displayError}</span>
          </p>
        ) : (
          touched &&
          nationalNumber &&
          isValidPhoneNumber(nationalNumber, selectedCountry) && (
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              <span>Valid {currentCountryObj.name} phone number</span>
            </p>
          )
        )}
        {nationalNumber && (
          <span className="text-[10px] text-on-surface-variant font-mono ml-auto mt-1">
            {nationalNumber.length} / {currentCountryLimits.expected} digits
          </span>
        )}
      </div>
    </div>
  );
};

export default PhoneNumberInput;