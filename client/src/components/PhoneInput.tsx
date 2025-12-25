import React, { useState, useMemo, useEffect } from "react";
import { Phone, ChevronDown } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";
import { Button } from "./ui/button";
import { validatePhoneNumber, formatPhoneNumber } from "../utils/phoneValidation";

// Country codes data with ISO country codes for flags
const countryCodes = [
  { code: "+44", country: "United Kingdom", iso: "GB" },
  { code: "+1", country: "United States", iso: "US" },
  { code: "+1", country: "Canada", iso: "CA" },
  { code: "+61", country: "Australia", iso: "AU" },
  { code: "+64", country: "New Zealand", iso: "NZ" },
  { code: "+27", country: "South Africa", iso: "ZA" },
  { code: "+33", country: "France", iso: "FR" },
  { code: "+49", country: "Germany", iso: "DE" },
  { code: "+39", country: "Italy", iso: "IT" },
  { code: "+34", country: "Spain", iso: "ES" },
  { code: "+31", country: "Netherlands", iso: "NL" },
  { code: "+32", country: "Belgium", iso: "BE" },
  { code: "+41", country: "Switzerland", iso: "CH" },
  { code: "+43", country: "Austria", iso: "AT" },
  { code: "+45", country: "Denmark", iso: "DK" },
  { code: "+46", country: "Sweden", iso: "SE" },
  { code: "+47", country: "Norway", iso: "NO" },
  { code: "+358", country: "Finland", iso: "FI" },
  { code: "+353", country: "Ireland", iso: "IE" },
  { code: "+351", country: "Portugal", iso: "PT" },
  { code: "+30", country: "Greece", iso: "GR" },
  { code: "+48", country: "Poland", iso: "PL" },
  { code: "+420", country: "Czech Republic", iso: "CZ" },
  { code: "+36", country: "Hungary", iso: "HU" },
  { code: "+40", country: "Romania", iso: "RO" },
  { code: "+7", country: "Russia", iso: "RU" },
  { code: "+86", country: "China", iso: "CN" },
  { code: "+81", country: "Japan", iso: "JP" },
  { code: "+82", country: "South Korea", iso: "KR" },
  { code: "+91", country: "India", iso: "IN" },
  { code: "+65", country: "Singapore", iso: "SG" },
  { code: "+60", country: "Malaysia", iso: "MY" },
  { code: "+66", country: "Thailand", iso: "TH" },
  { code: "+84", country: "Vietnam", iso: "VN" },
  { code: "+62", country: "Indonesia", iso: "ID" },
  { code: "+63", country: "Philippines", iso: "PH" },
  { code: "+971", country: "United Arab Emirates", iso: "AE" },
  { code: "+966", country: "Saudi Arabia", iso: "SA" },
  { code: "+972", country: "Israel", iso: "IL" },
  { code: "+90", country: "Turkey", iso: "TR" },
  { code: "+20", country: "Egypt", iso: "EG" },
  { code: "+234", country: "Nigeria", iso: "NG" },
  { code: "+254", country: "Kenya", iso: "KE" },
  { code: "+55", country: "Brazil", iso: "BR" },
  { code: "+52", country: "Mexico", iso: "MX" },
  { code: "+54", country: "Argentina", iso: "AR" },
  { code: "+56", country: "Chile", iso: "CL" },
  { code: "+57", country: "Colombia", iso: "CO" },
];

interface PhoneInputProps {
  value: string; // Format: "{countryCode}|{phoneNumber}" or just phoneNumber
  onChange: (value: string) => void; // Returns: "{countryCode}|{phoneNumber}"
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  id?: string;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  label,
  placeholder = "7123 456789",
  error,
  required = false,
  id,
  className = "",
}: PhoneInputProps) {
  const [countryCodeOpen, setCountryCodeOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  
  // Parse value: format is "{countryCode}|{phoneNumber}" or just phoneNumber
  const parseValue = (val: string) => {
    if (!val || !val.trim()) {
      return {
        code: "+44",
        number: "",
        country: "United Kingdom",
        iso: "GB",
      };
    }
    
    // Check if value contains separator "|"
    if (val.includes('|')) {
      const [code, number] = val.split('|');
      const country = countryCodes.find(c => c.code === code) || countryCodes[0];
      return {
        code: code || "+44",
        number: number || "",
        country: country.country,
        iso: country.iso,
      };
    }

    // Legacy format: try to parse as full phone with country code
    const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
    for (const country of sortedCodes) {
      if (val.startsWith(country.code)) {
        return {
          code: country.code,
          number: val.substring(country.code.length).trim().replace(/\D/g, ''),
          country: country.country,
          iso: country.iso,
        };
      }
    }
    
    // If no country code found, treat as phone number only
    return {
      code: "+44",
      number: val.replace(/\D/g, ''),
      country: "United Kingdom",
      iso: "GB",
    };
  };

  const { code: selectedCode, number: phoneNumber, country: selectedCountry, iso: selectedIso } = useMemo(
    () => parseValue(value),
    [value]
  );

  const handleCodeChange = (newCode: string, newCountry: string, newIso: string) => {
    // Format: "{countryCode}|{phoneNumber}"
    const newValue = phoneNumber ? `${newCode}|${phoneNumber}` : `${newCode}|`;
    onChange(newValue);
    setCountryCodeOpen(false);
  };

  const handleNumberChange = (newNumber: string) => {
    console.log('[PhoneInput] Step 1: User input received:', newNumber);
    // Remove non-digit characters
    let cleaned = newNumber.replace(/\D/g, '');
    console.log('[PhoneInput] Step 2: After removing non-digits:', cleaned);
    
    // Remove country code if user typed it (e.g., 44, 1, etc.)
    const codeDigits = selectedCode.replace(/\D/g, '');
    console.log('[PhoneInput] Step 3: Selected country code:', selectedCode, 'Digits:', codeDigits);
    if (cleaned.startsWith(codeDigits) && cleaned.length > codeDigits.length + 8) {
      // If phone number starts with the selected country code and is long enough (9+ digits), remove it
      cleaned = cleaned.substring(codeDigits.length);
      console.log('[PhoneInput] Step 4: Removed country code from input:', cleaned);
    } else if (cleaned.startsWith('44') && cleaned.length > 10) {
      // Remove UK country code if present (if total length > 10, meaning 9+ digits after removing 44)
      cleaned = cleaned.substring(2);
      console.log('[PhoneInput] Step 4: Removed UK country code 44:', cleaned);
    } else if (cleaned.startsWith('1') && cleaned.length > 10 && !cleaned.startsWith('11') && !cleaned.startsWith('12') && !cleaned.startsWith('13') && !cleaned.startsWith('14') && !cleaned.startsWith('15') && !cleaned.startsWith('16') && !cleaned.startsWith('17') && !cleaned.startsWith('18') && !cleaned.startsWith('19')) {
      // Remove US/Canada country code if present (but not if it's part of the number like 11, 12, etc.)
      cleaned = cleaned.substring(1);
      console.log('[PhoneInput] Step 4: Removed US/Canada country code 1:', cleaned);
    }
    
    // Format phone number (limit to 9-11 digits, remove excess from front if over 11)
    const formatted = formatPhoneNumber(cleaned);
    console.log('[PhoneInput] Step 5: Formatted phone number:', formatted);
    
    // Format: "{countryCode}|{phoneNumber}"
    const newValue = `${selectedCode}|${formatted}`;
    console.log('[PhoneInput] Step 6: Final value to send:', newValue);
    onChange(newValue);
  };

  // Validate on value change
  useEffect(() => {
    if (!phoneNumber || phoneNumber.length === 0) {
      setValidationError(undefined);
      return;
    }

    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.isValid) {
      setValidationError(validation.error);
    } else {
      setValidationError(undefined);
    }
  }, [phoneNumber]);

  // Filter countries for search
  const [searchQuery, setSearchQuery] = useState("");
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countryCodes;
    const query = searchQuery.toLowerCase();
    return countryCodes.filter(
      (country) =>
        country.country.toLowerCase().includes(query) ||
        country.code.includes(query)
    );
  }, [searchQuery]);

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-1.5 block">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <Popover open={countryCodeOpen} onOpenChange={setCountryCodeOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={`h-10 px-3 border-2 rounded-xl font-['Poppins',sans-serif] text-[13px] flex items-center gap-2 ${
                error || validationError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FE8A0F]'
              }`}
            >
              <ReactCountryFlag
                countryCode={selectedIso}
                svg
                style={{
                  width: '20px',
                  height: '15px',
                  borderRadius: '2px',
                }}
                title={selectedCountry}
              />
              <span className="text-[#2c353f]">{selectedCode}</span>
              <ChevronDown className="h-4 w-4 text-[#8d8d8d]" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search country..." 
                className="h-9"
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {filteredCountries.map((country, index) => (
                    <CommandItem
                      key={`${country.code}-${country.country}-${index}`}
                      value={`${country.code} ${country.country}`}
                      onSelect={() => handleCodeChange(country.code, country.country, country.iso)}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <ReactCountryFlag
                        countryCode={country.iso}
                        svg
                        style={{
                          width: '20px',
                          height: '15px',
                          borderRadius: '2px',
                        }}
                        title={country.country}
                      />
                      <span className="mr-2 font-medium">{country.code}</span>
                      <span>{country.country}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Phone Number Input */}
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8d8d8d]" />
          <Input
            id={id}
            type="tel"
            placeholder={placeholder}
            value={phoneNumber}
            onChange={(e) => handleNumberChange(e.target.value)}
            maxLength={11}
            className={`pl-10 h-10 border-2 rounded-xl font-['Poppins',sans-serif] text-[13px] ${
              error || validationError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#FE8A0F]'
            }`}
            required={required}
          />
        </div>
      </div>
      {(error || validationError) && (
        <p className="mt-1 text-[11px] text-red-600 font-['Poppins',sans-serif]">
          {error || validationError}
        </p>
      )}
    </div>
  );
}
