import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface AddressSuggestion {
  postcode: string;
  line_1: string;
  line_2?: string;
  line_3?: string;
  town_or_city: string;
  county?: string;
  country: string;
  // Additional fields for Royal Mail API formatting
  buildingNumber?: string;
  buildingName?: string;
  streetName?: string;
  cityName?: string;
  provinceName?: string;
  countryName?: string;
}

interface AddressAutocompleteProps {
  postcode: string;
  onPostcodeChange: (value: string) => void;
  address?: string;
  onAddressChange?: (value: string) => void;
  townCity?: string;
  onTownCityChange?: (value: string) => void;
  county?: string;
  onCountyChange?: (value: string) => void;
  onAddressSelect?: (address: {
    postcode: string;
    address: string;
    townCity: string;
    county?: string;
  }) => void;
  label?: string;
  required?: boolean;
  className?: string;
  showAddressField?: boolean;
  showTownCityField?: boolean;
  showCountyField?: boolean;
  combinedAddressMode?: boolean; // New prop for combined address + town/city in one field
  addressLabel?: string; // Custom label for address field
}

import { resolveApiUrl } from "../config/api";

export default function AddressAutocomplete({
  postcode,
  onPostcodeChange,
  address,
  onAddressChange,
  townCity,
  onTownCityChange,
  county,
  onCountyChange,
  onAddressSelect,
  label = "Postcode",
  required = false,
  className = "",
  showAddressField = true,
  showTownCityField = true,
  showCountyField = false,
  combinedAddressMode = false,
  addressLabel = "Address",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isHoveringSuggestions, setIsHoveringSuggestions] = useState(false);
  const [isHoveringAddressSuggestions, setIsHoveringAddressSuggestions] = useState(false);
  const [isHoveringCitySuggestions, setIsHoveringCitySuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [selectedCityIndex, setSelectedCityIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [postcodeAddresses, setPostcodeAddresses] = useState<AddressSuggestion[]>([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [addressJustSelected, setAddressJustSelected] = useState(false);
  const [postcodeJustSelected, setPostcodeJustSelected] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    line1: '',
    line2: '',
    townCity: '',
    county: '',
    postcode: '',
  });
  
  // Manual form is completely independent - no syncing with autocomplete
  
  // Handle manual address changes
  const handleManualAddressChange = (field: string, value: string) => {
    const updated = { ...manualAddress, [field]: value };
    setManualAddress(updated);
    
    // Build combined address in format: [address line, city, county, postcode]
    const addressParts: string[] = [];
    const addressLine = [updated.line1, updated.line2].filter(Boolean).join(', ');
    if (addressLine) addressParts.push(addressLine);
    if (updated.townCity) addressParts.push(updated.townCity);
    if (updated.county) addressParts.push(updated.county);
    if (updated.postcode) addressParts.push(updated.postcode);
    
    const combinedAddress = addressParts.join(', ');
    
    // Update parent components immediately with combined address
    if (field === 'line1' || field === 'line2' || field === 'townCity' || field === 'county' || field === 'postcode') {
      onAddressChange?.(combinedAddress);
    }
    if (field === 'townCity') {
      onTownCityChange?.(value);
    }
    if (field === 'postcode') {
      onPostcodeChange(value);
    }
    
    // Call onAddressSelect when all required fields are filled
    if (updated.line1 && updated.townCity && updated.postcode) {
      onAddressSelect?.({
        postcode: updated.postcode,
        address: combinedAddress,
        townCity: updated.townCity,
        county: updated.county,
      });
    }
  };
  
  // Manual form is completely independent - no syncing with autocomplete fields
  const wrapperRef = useRef<HTMLDivElement>(null);
  const addressWrapperRef = useRef<HTMLDivElement>(null);
  const cityWrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const addressDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cityDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // UK major cities list for autocomplete
  const UK_CITIES = [
    "London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield",
    "Edinburgh", "Bristol", "Cardiff", "Belfast", "Newcastle", "Nottingham", "Leicester",
    "Southampton", "Portsmouth", "Brighton", "Reading", "Northampton", "Luton", "Bolton",
    "Bournemouth", "Norwich", "Swindon", "Southend-on-Sea", "Middlesbrough", "Peterborough",
    "Cambridge", "Oxford", "Ipswich", "York", "Exeter", "Plymouth", "Bath", "Canterbury",
    "Durham", "Lincoln", "St Albans", "Worcester", "Hereford", "Chester", "Carlisle",
    "Aberdeen", "Dundee", "Inverness", "Perth", "Stirling", "Dumfries", "Ayr", "Falkirk"
  ];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setShowSuggestions(false);
      }
      if (addressWrapperRef.current && !addressWrapperRef.current.contains(target)) {
        setShowAddressSuggestions(false);
      }
      if (cityWrapperRef.current && !cityWrapperRef.current.contains(target)) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch address suggestions using Addressy API
  const fetchSuggestions = async (postcodeValue: string) => {
    if (!postcodeValue || postcodeValue.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      setPostcodeAddresses([]);
      return;
    }

    const cleanPostcode = postcodeValue.replace(/\s+/g, "").toUpperCase();
    const formattedPostcode = postcodeValue.trim().toUpperCase();
    
    // Only fetch addresses if at least 5 characters are entered
    if (cleanPostcode.length < 5) {
      setSuggestions([]);
      setShowSuggestions(false);
      setPostcodeAddresses([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResponse = await fetch(
        resolveApiUrl(`/api/address/search?postcode=${encodeURIComponent(cleanPostcode)}`),
        {
          credentials: 'include',
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.status === 200 && searchData.result && searchData.result.length > 0) {
          const addresses = searchData.result.map((item: any) => ({
            postcode: item.postcode || formattedPostcode,
            line_1: item.line_1 || "",
            line_2: item.line_2,
            line_3: item.line_3,
            town_or_city: item.town_or_city || "",
            county: item.county || "",
            country: item.country || "United Kingdom",
            buildingNumber: item.buildingNumber,
            buildingName: item.buildingName,
            streetName: item.streetName,
            cityName: item.cityName,
            provinceName: item.provinceName,
            countryName: item.countryName,
          }));
          
          // Sort addresses: building numbers first, then numerically, then alphabetically
          const sortedAddresses = addresses.sort((a, b) => {
            const startsWithNumberA = /^\d/.test(a.line_1 || "");
            const startsWithNumberB = /^\d/.test(b.line_1 || "");
            
            if (startsWithNumberA && !startsWithNumberB) return -1;
            if (!startsWithNumberA && startsWithNumberB) return 1;
            
            if (startsWithNumberA && startsWithNumberB) {
              const numA = parseInt(a.line_1?.match(/^\d+/)?.[0] || "0") || 0;
              const numB = parseInt(b.line_1?.match(/^\d+/)?.[0] || "0") || 0;
              if (numA !== numB) return numA - numB;
            }
            
            return (a.line_1 || "").localeCompare(b.line_1 || "");
          });
          
          setSuggestions(sortedAddresses);
          setShowSuggestions(sortedAddresses.length > 0);
          setPostcodeAddresses(sortedAddresses);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
          setPostcodeAddresses([]);
        }
      } else {
        const errorData = await searchResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch addresses');
      }
    } catch (err) {
      console.error("Address lookup error:", err);
      setError("Unable to find addresses for this postcode. Please enter manually.");
      setSuggestions([]);
      setShowSuggestions(false);
      setPostcodeAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch address suggestions by address text (when postcode is available)
  const fetchAddressSuggestions = async (addressValue: string) => {
    if (!addressValue || addressValue.trim().length < 2) {
      // If input is empty or too short, show all addresses if postcode is available
      if (postcode && postcodeAddresses.length > 0) {
        setAddressSuggestions(postcodeAddresses.slice(0, 10));
        setShowAddressSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
      return;
    }

    // If postcode addresses are already loaded, filter them
    if (postcodeAddresses.length > 0) {
      const searchTerm = addressValue.toLowerCase().trim();
      const filtered = postcodeAddresses.filter((addr) => {
        // For combined address mode, search in both address lines and town/city
        const addressLines = [
          addr.line_1,
          addr.line_2,
          addr.line_3,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        
        const townCity = (addr.town_or_city || "").toLowerCase();
        const fullAddress = combinedAddressMode 
          ? `${addressLines}, ${townCity}`
          : addressLines;
        
        return fullAddress.includes(searchTerm);
      }).slice(0, 10);

      setAddressSuggestions(filtered);
      setShowAddressSuggestions(filtered.length > 0);
      return;
    }

    // If no postcode addresses loaded but postcode exists, fetch them first
    if (postcode && postcode.trim().length >= 5) {
      setIsAddressLoading(true);
      try {
        await fetchSuggestions(postcode);
        // After fetching, filter the results
        setTimeout(() => {
          if (postcodeAddresses.length > 0) {
            const searchTerm = addressValue.toLowerCase().trim();
            const filtered = postcodeAddresses.filter((addr) => {
              const addressLines = [
                addr.line_1,
                addr.line_2,
                addr.line_3,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              
              const townCity = (addr.town_or_city || "").toLowerCase();
              const fullAddress = combinedAddressMode 
                ? `${addressLines}, ${townCity}`
                : addressLines;
              
              return fullAddress.includes(searchTerm);
            }).slice(0, 10);

            setAddressSuggestions(filtered);
            setShowAddressSuggestions(filtered.length > 0);
          }
        }, 100);
      } catch (err) {
        console.error("Error fetching address suggestions:", err);
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      } finally {
        setIsAddressLoading(false);
      }
    } else {
      // No postcode available, clear suggestions
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  };

  // Filter addresses based on address line input (backward compatibility)
  const filterAddressSuggestions = (addressValue: string) => {
    fetchAddressSuggestions(addressValue);
  };

  // Filter cities based on input
  const filterCitySuggestions = (cityValue: string) => {
    if (!cityValue || cityValue.trim().length < 2) {
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      return;
    }

    const searchTerm = cityValue.toLowerCase().trim();
    const filtered = UK_CITIES.filter((city) =>
      city.toLowerCase().includes(searchTerm)
    ).slice(0, 10);

    // Also include cities from postcode addresses if available
    if (postcodeAddresses.length > 0) {
      const validCities = postcodeAddresses
        .map((addr) => addr.town_or_city)
        .filter((city): city is string => Boolean(city));
      const uniqueCities: string[] = Array.from(new Set(validCities));
      const postcodeCities = uniqueCities.filter((city: string) => city.toLowerCase().includes(searchTerm));
      
      const combined: string[] = Array.from(new Set([...filtered, ...postcodeCities])).slice(0, 10);
      setCitySuggestions(combined);
    } else {
      setCitySuggestions(filtered);
    }
    
    setShowCitySuggestions(filtered.length > 0 || (postcodeAddresses.length > 0 && postcodeAddresses.some(addr => addr.town_or_city?.toLowerCase().includes(searchTerm))));
  };

  // Check if all address fields are filled (address is selected)
  const isAddressFilled = postcode && postcode.trim().length > 0 && 
                          address && address.trim().length > 0 && 
                          townCity && townCity.trim().length > 0;

  // Debounced postcode change handler
  useEffect(() => {
    // Don't fetch suggestions if address is already filled (unless user is clearing it)
    if (isAddressFilled && postcode && postcode.trim().length > 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (postcode && postcode.trim().length >= 1) {
        fetchSuggestions(postcode);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setPostcodeAddresses([]);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [postcode, isAddressFilled]);

  // Debounced address line change handler
  useEffect(() => {
    // Don't show suggestions if address was just selected
    if (addressJustSelected || postcodeJustSelected) {
      return;
    }

    // Don't fetch suggestions if address is already filled (unless user is clearing it)
    if (isAddressFilled && address && address.trim().length > 0) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    if (addressDebounceTimerRef.current) {
      clearTimeout(addressDebounceTimerRef.current);
    }

    addressDebounceTimerRef.current = setTimeout(() => {
      if (address) {
        // Fetch or filter address suggestions only if user is actively typing
        fetchAddressSuggestions(address);
      } else {
        // If input is empty, don't automatically show suggestions
        // User should focus on the field or start typing to see suggestions
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
    }, 300);

    return () => {
      if (addressDebounceTimerRef.current) {
        clearTimeout(addressDebounceTimerRef.current);
      }
    };
  }, [address, postcode, postcodeAddresses, combinedAddressMode, addressJustSelected, postcodeJustSelected, isAddressFilled]);

  // Debounced city change handler
  useEffect(() => {
    if (cityDebounceTimerRef.current) {
      clearTimeout(cityDebounceTimerRef.current);
    }

    cityDebounceTimerRef.current = setTimeout(() => {
      if (townCity) {
        filterCitySuggestions(townCity);
      } else {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      }
    }, 300);

    return () => {
      if (cityDebounceTimerRef.current) {
        clearTimeout(cityDebounceTimerRef.current);
      }
    };
  }, [townCity, postcodeAddresses]);

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onPostcodeChange(value);
    setError(null);
    setSelectedIndex(-1);
    // Reset the flag when user starts typing again
    if (postcodeJustSelected) {
      setPostcodeJustSelected(false);
    }
  };

  // Handle selection from postcode suggestions - update postcode and address field
  const handleSelectPostcodeSuggestion = (suggestion: AddressSuggestion) => {
    // Build address field from line_1 and streetName
    // If line_1 already contains streetName, use line_1 as is
    // Otherwise, combine buildingNumber + streetName or line_1 + streetName
    let addressLine = suggestion.line_1 || "";
    
    if (suggestion.streetName && suggestion.streetName.trim()) {
      const line1Lower = (addressLine || "").toLowerCase();
      const streetNameLower = suggestion.streetName.toLowerCase();
      
      // Check if streetName is already included in line_1
      if (!line1Lower.includes(streetNameLower)) {
        // If we have buildingNumber, combine buildingNumber + streetName
        if (suggestion.buildingNumber && suggestion.buildingNumber.trim()) {
          addressLine = `${suggestion.buildingNumber} ${suggestion.streetName}`.trim();
        } else {
          // Otherwise, combine line_1 + streetName
          addressLine = `${addressLine} ${suggestion.streetName}`.trim();
        }
      }
      // If streetName is already in line_1, use line_1 as is
    } else if (suggestion.buildingNumber && suggestion.buildingNumber.trim()) {
      // If we only have buildingNumber, use it with line_1 if available
      if (addressLine && !addressLine.includes(suggestion.buildingNumber)) {
        addressLine = `${suggestion.buildingNumber} ${addressLine}`.trim();
      } else if (!addressLine) {
        addressLine = suggestion.buildingNumber;
      }
    }
    
    const townCity = suggestion.town_or_city || "";
    const county = suggestion.county || "";
    
    // Set flags to prevent dropdown from showing
    setPostcodeJustSelected(true);
    setAddressJustSelected(true);
    
    // Update all fields - call individual callbacks first, then onAddressSelect
    onPostcodeChange(suggestion.postcode);
    
    // Update address field
    if (onAddressChange) {
      onAddressChange(addressLine);
    }
    
    // Update town/city field - ensure this is called
    if (onTownCityChange) {
      onTownCityChange(townCity);
    }
    
    // Update county field
    if (onCountyChange) {
      onCountyChange(county);
    }
    
    // Call onAddressSelect if provided (for parent component updates)
    // This should be called after individual callbacks to ensure all fields are updated
    if (onAddressSelect) {
      onAddressSelect({
        postcode: suggestion.postcode,
        address: addressLine,
        townCity: townCity,
        county: county,
      });
    }
    
    // Close all dropdowns
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    setSelectedAddressIndex(-1);
    
    // Don't reset flags if address is filled - keep search disabled
    // Only reset if user clears the fields (checked via isAddressFilled in next render)
    setTimeout(() => {
      // Check if address is still filled after delay
      const stillFilled = postcode && postcode.trim().length > 0 && 
                          addressLine && addressLine.trim().length > 0 && 
                          townCity && townCity.trim().length > 0;
      if (!stillFilled) {
        setPostcodeJustSelected(false);
        setAddressJustSelected(false);
      }
    }, 1000);
  };

  // Handle selection from address suggestions - update all fields
  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    // Build address field from line_1 and streetName
    // If line_1 already contains streetName, use line_1 as is
    // Otherwise, combine buildingNumber + streetName or line_1 + streetName
    let addressLine = suggestion.line_1 || "";
    
    if (suggestion.streetName && suggestion.streetName.trim()) {
      const line1Lower = (addressLine || "").toLowerCase();
      const streetNameLower = suggestion.streetName.toLowerCase();
      
      // Check if streetName is already included in line_1
      if (!line1Lower.includes(streetNameLower)) {
        // If we have buildingNumber, combine buildingNumber + streetName
        if (suggestion.buildingNumber && suggestion.buildingNumber.trim()) {
          addressLine = `${suggestion.buildingNumber} ${suggestion.streetName}`.trim();
        } else {
          // Otherwise, combine line_1 + streetName
          addressLine = `${addressLine} ${suggestion.streetName}`.trim();
        }
      }
      // If streetName is already in line_1, use line_1 as is
    } else if (suggestion.buildingNumber && suggestion.buildingNumber.trim()) {
      // If we only have buildingNumber, use it with line_1 if available
      if (addressLine && !addressLine.includes(suggestion.buildingNumber)) {
        addressLine = `${suggestion.buildingNumber} ${addressLine}`.trim();
      } else if (!addressLine) {
        addressLine = suggestion.buildingNumber;
      }
    }
    
    const townCity = suggestion.town_or_city || "";
    const county = suggestion.county || "";

    // Set flags to prevent dropdown from showing
    setAddressJustSelected(true);
    setPostcodeJustSelected(true);
    
    // Close all dropdowns immediately
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    setSelectedAddressIndex(-1);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    // Update postcode if it changed
    if (suggestion.postcode && suggestion.postcode !== postcode) {
      onPostcodeChange(suggestion.postcode);
    }

    // Update postcode if it changed
    if (suggestion.postcode && suggestion.postcode !== postcode) {
      onPostcodeChange(suggestion.postcode);
    }

    // Update address field
    if (onAddressChange) {
      onAddressChange(addressLine);
    }

    // Update town/city field - ensure this is called
    if (onTownCityChange) {
      onTownCityChange(townCity);
    }

    // Update county field (even if empty)
    if (onCountyChange) {
      onCountyChange(county);
    }

    // Call onAddressSelect if provided (for parent component updates)
    // This should be called after individual callbacks to ensure all fields are updated
    if (onAddressSelect) {
      onAddressSelect({
        postcode: suggestion.postcode,
        address: addressLine,
        townCity: townCity,
        county: county,
      });
    }

    // Don't reset flags if address is filled - keep search disabled
    // Only reset if user clears the fields (checked via isAddressFilled in next render)
    setTimeout(() => {
      // Check if address is still filled after delay
      const stillFilled = suggestion.postcode && suggestion.postcode.trim().length > 0 && 
                          addressLine && addressLine.trim().length > 0 && 
                          townCity && townCity.trim().length > 0;
      if (!stillFilled) {
        setAddressJustSelected(false);
        setPostcodeJustSelected(false);
      }
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
                  case "Enter":
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                      handleSelectPostcodeSuggestion(suggestions[selectedIndex]);
                    }
                    break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  const formatAddressDisplay = (suggestion: AddressSuggestion): string => {
    // Format: address line, city, postcode
    const addressLine = suggestion.line_1 || "";
    const cityName = suggestion.town_or_city || "";
    const postalCode = (suggestion.postcode || "").replace(/\s+/g, "").toUpperCase();
    
    const parts = [
      addressLine,
      cityName,
      postalCode,
    ].filter(Boolean);

    return parts.join(" ");
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Postcode Input */}
      <div>
        <Label htmlFor="postcode" className="text-black dark:text-white">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50 dark:text-white/50" />
          <Input
            id="postcode"
            type="text"
            value={postcode}
            onChange={handlePostcodeChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              // Don't show suggestions if postcode was just selected or address is filled
              if (postcodeJustSelected || addressJustSelected || isAddressFilled) {
                return;
              }
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              } else if (postcode && postcode.trim().length >= 1) {
                // Trigger search on focus if we have input
                fetchSuggestions(postcode);
              }
            }}
            onBlur={() => {
              // Close dropdown when field loses focus, but only if not hovering over suggestions
              setTimeout(() => {
                if (!postcodeJustSelected && !addressJustSelected && !isHoveringSuggestions) {
                  setShowSuggestions(false);
                }
              }, 200);
            }}
            placeholder="e.g., SW1A 1AA"
            required={required}
            className={`pl-10 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white ${
              error ? "border-red-500" : ""
            }`}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#FE8A0F]" />
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
        {!error && !isLoading && !address?.trim() && !showManualEntry && (
          <p className="mt-1 text-[10px] text-black/60 dark:text-white/60">
            No addresses found.{" "}
            <button
              type="button"
              onClick={() => {
                setShowManualEntry(true);
                // Pre-fill postcode if available
                if (postcode) {
                  setManualAddress(prev => ({ ...prev, postcode }));
                }
              }}
              className="text-[10px] text-[#FE8A0F] hover:underline cursor-pointer"
            >
              Please enter manually.
            </button>
          </p>
        )}
      </div>

      {/* Address Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && !postcodeJustSelected && !isAddressFilled && (
        <div 
          className="absolute z-50 mt-1 w-full rounded-lg border-2 border-[#FE8A0F] bg-white dark:bg-black shadow-lg max-h-[400px] overflow-y-auto"
          onMouseEnter={() => setIsHoveringSuggestions(true)}
          onMouseLeave={() => setIsHoveringSuggestions(false)}
          onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking on dropdown
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.postcode}-${index}`}
              type="button"
              onClick={() => handleSelectPostcodeSuggestion(suggestion)}
              className={`w-full px-4 py-3 text-left hover:bg-[#FE8A0F]/10 transition-colors border-b border-[#FE8A0F]/20 last:border-b-0 ${
                selectedIndex === index
                  ? "bg-[#FE8A0F]/20"
                  : "bg-transparent"
              }`}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#FE8A0F] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black dark:text-white">
                    {formatAddressDisplay(suggestion)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Address and Town/City Fields (if enabled) */}
      {showAddressField && !showManualEntry && (
        <div ref={addressWrapperRef} className="mt-4 relative">
          <Label htmlFor="address" className="text-black dark:text-white">
            {addressLabel} {required && <span className="text-red-500">*</span>}
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50 dark:text-white/50" />
            <Input
              id="address"
              type="text"
              value={combinedAddressMode && address 
                ? address 
                : address || ""}
              onChange={(e) => {
                const newValue = e.target.value;
                // Only update if the value actually changed (not from selection)
                if (newValue !== address) {
                  onAddressChange?.(newValue);
                  setSelectedAddressIndex(-1);
                  // Reset the flag when user manually types (actively editing)
                  if (addressJustSelected || postcodeJustSelected) {
                    setAddressJustSelected(false);
                    setPostcodeJustSelected(false);
                  }
                }
              }}
              onFocus={() => {
                // Don't show suggestions if address was just selected or address is filled
                if (addressJustSelected || postcodeJustSelected || isAddressFilled) {
                  return;
                }
                // Only show suggestions if user is actively interacting with the address field
                // Don't automatically show suggestions when postcode is entered
                if (address && address.trim().length >= 1) {
                  // If there's already input, show suggestions
                  if (addressSuggestions.length > 0) {
                    setShowAddressSuggestions(true);
                  } else {
                    // Trigger search on focus if we have input
                    fetchAddressSuggestions(address);
                  }
                } else if (postcode && postcodeAddresses.length > 0) {
                  // Only show suggestions if address field is empty and user focuses on it
                  setAddressSuggestions(postcodeAddresses.slice(0, 10));
                  setShowAddressSuggestions(true);
                } else if (postcode && postcode.trim().length >= 5) {
                  // Fetch addresses if postcode is available but not loaded
                  fetchAddressSuggestions("");
                }
              }}
              onBlur={() => {
                // Close dropdown when field loses focus, but only if not hovering over suggestions
                setTimeout(() => {
                  if (!addressJustSelected && !postcodeJustSelected && !isHoveringAddressSuggestions) {
                    setShowAddressSuggestions(false);
                  }
                }, 200);
              }}
              onKeyDown={(e) => {
                if (!showAddressSuggestions || addressSuggestions.length === 0) return;
                switch (e.key) {
                  case "ArrowDown":
                    e.preventDefault();
                    setSelectedAddressIndex((prev) =>
                      prev < addressSuggestions.length - 1 ? prev + 1 : prev
                    );
                    break;
                  case "ArrowUp":
                    e.preventDefault();
                    setSelectedAddressIndex((prev) => (prev > 0 ? prev - 1 : -1));
                    break;
                  case "Enter":
                    e.preventDefault();
                    if (selectedAddressIndex >= 0 && selectedAddressIndex < addressSuggestions.length) {
                      handleSelectAddressSuggestion(addressSuggestions[selectedAddressIndex]);
                    }
                    break;
                  case "Escape":
                    setShowAddressSuggestions(false);
                    break;
                }
              }}
              placeholder={combinedAddressMode ? "Street address, Town/City" : "Street address"}
              className="pl-10 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
            />
            {isAddressLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#FE8A0F]" />
            )}
          </div>
          {!postcode && address && address.trim().length >= 1 && (
            <p className="mt-1 text-xs text-black/60 dark:text-white/60">
              Enter a postcode first for address suggestions
            </p>
          )}
          
          {/* Message when no address suggestions found */}
          {postcode && postcode.trim().length >= 5 && !isAddressLoading && address && address.trim().length >= 1 && showAddressSuggestions && addressSuggestions.length === 0 && (
            <p className="mt-1 text-xs text-black/60 dark:text-white/60">
              No addresses found.{" "}
              <button
                type="button"
                onClick={() => {
                  setShowManualEntry(true);
                  // Pre-fill postcode if available
                  if (postcode) {
                    setManualAddress(prev => ({ ...prev, postcode }));
                  }
                }}
                className="text-[#FE8A0F] hover:underline cursor-pointer"
              >
                Please enter manually.
              </button>
            </p>
          )}
          
          {/* Address Suggestions Dropdown - Same style as postcode suggestions */}
          {showAddressSuggestions && addressSuggestions.length > 0 && !addressJustSelected && !isAddressFilled && (
            <div 
              className="absolute z-50 mt-1 w-full rounded-lg border-2 border-[#FE8A0F] bg-white dark:bg-black shadow-lg max-h-[400px] overflow-y-auto"
              onMouseEnter={() => setIsHoveringAddressSuggestions(true)}
              onMouseLeave={() => setIsHoveringAddressSuggestions(false)}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking on dropdown
            >
              {addressSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.postcode}-${suggestion.line_1}-${index}`}
                  type="button"
                  onClick={() => handleSelectAddressSuggestion(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-[#FE8A0F]/10 transition-colors border-b border-[#FE8A0F]/20 last:border-b-0 ${
                    selectedAddressIndex === index
                      ? "bg-[#FE8A0F]/20"
                      : "bg-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-[#FE8A0F] mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black dark:text-white">
                        {formatAddressDisplay(suggestion)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showTownCityField && !showManualEntry && (
        <div ref={cityWrapperRef} className="mt-4 relative">
          <Label htmlFor="townCity" className="text-black dark:text-white">
            Town/City {required && <span className="text-red-500">*</span>}
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50 dark:text-white/50" />
            <Input
              id="townCity"
              type="text"
              value={townCity || ""}
              onChange={(e) => {
                const newValue = e.target.value;
                onTownCityChange?.(newValue);
                setSelectedCityIndex(-1);
                // Reset flags when user manually types or clears the field
                if (addressJustSelected || postcodeJustSelected) {
                  setAddressJustSelected(false);
                  setPostcodeJustSelected(false);
                }
              }}
              onFocus={() => {
                if (citySuggestions.length > 0) {
                  setShowCitySuggestions(true);
                }
              }}
              onBlur={() => {
                // Close dropdown when field loses focus, but only if not hovering over suggestions
                setTimeout(() => {
                  if (!isHoveringCitySuggestions) {
                    setShowCitySuggestions(false);
                  }
                }, 200);
              }}
              onKeyDown={(e) => {
                if (!showCitySuggestions || citySuggestions.length === 0) return;
                switch (e.key) {
                  case "ArrowDown":
                    e.preventDefault();
                    setSelectedCityIndex((prev) =>
                      prev < citySuggestions.length - 1 ? prev + 1 : prev
                    );
                    break;
                  case "ArrowUp":
                    e.preventDefault();
                    setSelectedCityIndex((prev) => (prev > 0 ? prev - 1 : -1));
                    break;
                  case "Enter":
                    e.preventDefault();
                    if (selectedCityIndex >= 0 && selectedCityIndex < citySuggestions.length) {
                      onTownCityChange?.(citySuggestions[selectedCityIndex]);
                      setShowCitySuggestions(false);
                    }
                    break;
                  case "Escape":
                    setShowCitySuggestions(false);
                    break;
                }
              }}
              placeholder="Town or city"
              className="pl-10 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
            />
            {isCityLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#FE8A0F]" />
            )}
          </div>
          
          {/* City Suggestions Dropdown */}
          {showCitySuggestions && citySuggestions.length > 0 && (
            <div 
              className="absolute z-50 mt-1 w-full rounded-lg border-2 border-[#FE8A0F] bg-white dark:bg-black shadow-lg max-h-[400px] overflow-y-auto"
              onMouseEnter={() => setIsHoveringCitySuggestions(true)}
              onMouseLeave={() => setIsHoveringCitySuggestions(false)}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur when clicking on dropdown
            >
              {citySuggestions.map((city, index) => (
                <button
                  key={`city-${city}-${index}`}
                  type="button"
                  onClick={() => {
                    onTownCityChange?.(city);
                    setShowCitySuggestions(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-[#FE8A0F]/10 transition-colors border-b border-[#FE8A0F]/20 last:border-b-0 ${
                    selectedCityIndex === index
                      ? "bg-[#FE8A0F]/20"
                      : "bg-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#FE8A0F] flex-shrink-0" />
                    <p className="text-sm font-medium text-black dark:text-white">
                      {city}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* County Field (optional) */}
      {showCountyField && !showManualEntry && (
        <div className="mt-4 relative">
          <Label htmlFor="county" className="text-black dark:text-white">
            County
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50 dark:text-white/50" />
            <Input
              id="county"
              type="text"
              value={county || ""}
              onChange={(e) => {
                onCountyChange?.(e.target.value);
              }}
              placeholder="County (optional)"
              className="pl-10 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Manual Address Entry Form */}
      {showManualEntry && (
        <div className="mt-4 space-y-4 p-4 border-2 border-[#FE8A0F] rounded-lg bg-white/50 dark:bg-black/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-black dark:text-white">Enter Address Manually</h3>
            <button
              type="button"
              onClick={() => {
                setShowManualEntry(false);
                setManualAddress({
                  line1: '',
                  line2: '',
                  townCity: '',
                  county: '',
                  postcode: '',
                });
              }}
              className="text-xs text-black/60 dark:text-white/60 hover:text-[#FE8A0F]"
            >
              Close
            </button>
          </div>
          
          <div>
            <Label htmlFor="manual-line1" className="text-black dark:text-white">
              Address line 1 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="manual-line1"
              type="text"
              value={manualAddress.line1}
              onChange={(e) => handleManualAddressChange('line1', e.target.value)}
              onKeyDown={(e) => {
                // Allow all keys including spaces
                if (e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              placeholder="Street address"
              required
              className="mt-1 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="manual-line2" className="text-black dark:text-white">
              Address line 2
            </Label>
            <Input
              id="manual-line2"
              type="text"
              value={manualAddress.line2}
              onChange={(e) => handleManualAddressChange('line2', e.target.value)}
              onKeyDown={(e) => {
                // Allow all keys including spaces
                if (e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              placeholder="Apartment, suite, etc. (optional)"
              className="mt-1 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="manual-townCity" className="text-black dark:text-white">
              Town / City <span className="text-red-500">*</span>
            </Label>
            <Input
              id="manual-townCity"
              type="text"
              value={manualAddress.townCity}
              onChange={(e) => handleManualAddressChange('townCity', e.target.value)}
              onKeyDown={(e) => {
                // Allow all keys including spaces
                if (e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              placeholder="Town or city"
              required
              className="mt-1 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="manual-county" className="text-black dark:text-white">
              County
            </Label>
            <Input
              id="manual-county"
              type="text"
              value={manualAddress.county}
              onChange={(e) => handleManualAddressChange('county', e.target.value)}
              onKeyDown={(e) => {
                // Allow all keys including spaces
                if (e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              placeholder="County (optional)"
              className="mt-1 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
            />
          </div>
          
          <div>
            <Label htmlFor="manual-postcode" className="text-black dark:text-white">
              Postcode <span className="text-red-500">*</span>
            </Label>
            <Input
              id="manual-postcode"
              type="text"
              value={manualAddress.postcode}
              onChange={(e) => handleManualAddressChange('postcode', e.target.value)}
              onKeyDown={(e) => {
                // Allow all keys including spaces
                if (e.key === ' ') {
                  e.stopPropagation();
                }
              }}
              placeholder="e.g., SW1A 1AA"
              required
              className="mt-1 bg-white dark:bg-black border-[#FE8A0F] text-black dark:text-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}