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
}

interface AddressAutocompleteProps {
  postcode: string;
  onPostcodeChange: (value: string) => void;
  address?: string;
  onAddressChange?: (value: string) => void;
  townCity?: string;
  onTownCityChange?: (value: string) => void;
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
  combinedAddressMode?: boolean; // New prop for combined address + town/city in one field
  addressLabel?: string; // Custom label for address field
}

const POSTCODES_API_BASE = "https://api.postcodes.io";

export default function AddressAutocomplete({
  postcode,
  onPostcodeChange,
  address,
  onAddressChange,
  townCity,
  onTownCityChange,
  onAddressSelect,
  label = "Postcode",
  required = false,
  className = "",
  showAddressField = true,
  showTownCityField = true,
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [selectedCityIndex, setSelectedCityIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [postcodeAddresses, setPostcodeAddresses] = useState<AddressSuggestion[]>([]);
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

  // Fetch address suggestions
  const fetchSuggestions = async (postcodeValue: string) => {
    if (!postcodeValue || postcodeValue.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clean postcode (remove spaces, uppercase)
    const cleanPostcode = postcodeValue.replace(/\s+/g, "").toUpperCase();

    if (cleanPostcode.length < 1) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For very short inputs (1-2 chars), use query search for faster results
      if (cleanPostcode.length <= 2) {
        const searchResponse = await fetch(
          `${POSTCODES_API_BASE}/postcodes?q=${encodeURIComponent(cleanPostcode)}&limit=20`
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.status === 200 && searchData.result && searchData.result.length > 0) {
            const addresses = searchData.result.map((item: any) => ({
              postcode: item.postcode,
              line_1: item.line_1 || "",
              line_2: item.line_2,
              line_3: item.line_3,
              town_or_city: item.post_town || item.ward || "",
              county: item.county,
              country: item.country || "England",
            }));
            setSuggestions(addresses);
            setShowSuggestions(addresses.length > 0);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
        setIsLoading(false);
        return;
      }

      // For longer inputs (3+ chars), use autocomplete API
      const response = await fetch(
        `${POSTCODES_API_BASE}/postcodes/${encodeURIComponent(cleanPostcode)}/autocomplete`
      );

      if (!response.ok) {
        // Fallback to query search
        const searchResponse = await fetch(
          `${POSTCODES_API_BASE}/postcodes?q=${encodeURIComponent(cleanPostcode)}&limit=20`
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.status === 200 && searchData.result && searchData.result.length > 0) {
            const addresses = searchData.result.map((item: any) => ({
              postcode: item.postcode,
              line_1: item.line_1 || "",
              line_2: item.line_2,
              line_3: item.line_3,
              town_or_city: item.post_town || item.ward || "",
              county: item.county,
              country: item.country || "England",
            }));
            setSuggestions(addresses);
            setShowSuggestions(addresses.length > 0);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.status === 200 && data.result && data.result.length > 0) {
        // Fetch detailed addresses for each postcode suggestion
        const detailedAddresses: AddressSuggestion[] = [];

        // Limit to 10 for performance
        const postcodesToFetch = data.result.slice(0, 10);
        
        // Fetch in parallel for better performance
        const fetchPromises = postcodesToFetch.map(async (postcodeSuggestion: string) => {
          try {
            const detailResponse = await fetch(
              `${POSTCODES_API_BASE}/postcodes/${encodeURIComponent(postcodeSuggestion)}`
            );

            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              if (detailData.status === 200 && detailData.result) {
                return {
                  postcode: detailData.result.postcode,
                  line_1: detailData.result.line_1 || "",
                  line_2: detailData.result.line_2,
                  line_3: detailData.result.line_3,
                  town_or_city: detailData.result.post_town || detailData.result.ward || "",
                  county: detailData.result.county,
                  country: detailData.result.country || "England",
                };
              }
            }
          } catch (err) {
            return null;
          }
          return null;
        });

        const results = await Promise.all(fetchPromises);
        const validAddresses = results.filter((addr): addr is AddressSuggestion => addr !== null);

        setSuggestions(validAddresses);
        setShowSuggestions(validAddresses.length > 0);
      } else {
        // Try alternative search if autocomplete doesn't work
        const searchResponse = await fetch(
          `${POSTCODES_API_BASE}/postcodes?q=${encodeURIComponent(cleanPostcode)}&limit=20`
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.status === 200 && searchData.result && searchData.result.length > 0) {
            const addresses = searchData.result.map((item: any) => ({
              postcode: item.postcode,
              line_1: item.line_1 || "",
              line_2: item.line_2,
              line_3: item.line_3,
              town_or_city: item.post_town || item.ward || "",
              county: item.county,
              country: item.country || "England",
            }));
            setSuggestions(addresses);
            setShowSuggestions(addresses.length > 0);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    } catch (err) {
      console.error("Address lookup error:", err);
      setError("Unable to find addresses for this postcode");
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch addresses for a postcode (used for address line filtering)
  const fetchPostcodeAddresses = async (postcodeValue: string) => {
    if (!postcodeValue || postcodeValue.trim().length < 1) {
      setPostcodeAddresses([]);
      return;
    }

    const cleanPostcode = postcodeValue.replace(/\s+/g, "").toUpperCase();
    
    try {
      const response = await fetch(
        `${POSTCODES_API_BASE}/postcodes/${encodeURIComponent(cleanPostcode)}/autocomplete`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 200 && data.result && data.result.length > 0) {
          const addresses: AddressSuggestion[] = [];
          
          for (const pc of data.result.slice(0, 20)) {
            try {
              const detailResponse = await fetch(
                `${POSTCODES_API_BASE}/postcodes/${encodeURIComponent(pc)}`
              );
              if (detailResponse.ok) {
                const detailData = await detailResponse.json();
                if (detailData.status === 200 && detailData.result) {
                  addresses.push({
                    postcode: detailData.result.postcode,
                    line_1: detailData.result.line_1 || "",
                    line_2: detailData.result.line_2,
                    line_3: detailData.result.line_3,
                    town_or_city: detailData.result.post_town || detailData.result.ward || "",
                    county: detailData.result.county,
                    country: detailData.result.country || "England",
                  });
                }
              }
            } catch (err) {
              continue;
            }
          }
          
          setPostcodeAddresses(addresses);
        }
      }
    } catch (err) {
      console.error("Error fetching postcode addresses:", err);
    }
  };

  // Filter addresses based on address line input
  const filterAddressSuggestions = (addressValue: string) => {
    if (!addressValue || addressValue.trim().length < 1) {
      // If input is empty, show all addresses if postcode is available
      if (postcode && postcodeAddresses.length > 0) {
        setAddressSuggestions(postcodeAddresses.slice(0, 10));
        setShowAddressSuggestions(true);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
      return;
    }

    if (postcodeAddresses.length === 0) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

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
      const postcodeCities = Array.from(
        new Set(postcodeAddresses.map((addr) => addr.town_or_city).filter(Boolean))
      ).filter((city) => city.toLowerCase().includes(searchTerm));
      
      const combined = Array.from(new Set([...filtered, ...postcodeCities])).slice(0, 10);
      setCitySuggestions(combined);
    } else {
      setCitySuggestions(filtered);
    }
    
    setShowCitySuggestions(filtered.length > 0 || (postcodeAddresses.length > 0 && postcodeAddresses.some(addr => addr.town_or_city?.toLowerCase().includes(searchTerm))));
  };

  // Debounced postcode change handler
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (postcode && postcode.trim().length >= 1) {
        fetchSuggestions(postcode);
        if (postcode.trim().length >= 3) {
          fetchPostcodeAddresses(postcode);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setPostcodeAddresses([]);
      }
    }, 300); // 300ms debounce for faster response

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [postcode]);

  // Debounced address line change handler
  useEffect(() => {
    if (addressDebounceTimerRef.current) {
      clearTimeout(addressDebounceTimerRef.current);
    }

    addressDebounceTimerRef.current = setTimeout(() => {
      if (address) {
        if (postcode && postcodeAddresses.length === 0) {
          // Fetch addresses if we have postcode but no addresses yet
          fetchPostcodeAddresses(postcode).then(() => {
            filterAddressSuggestions(address);
          });
        } else {
          filterAddressSuggestions(address);
        }
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
      }
    }, 300);

    return () => {
      if (addressDebounceTimerRef.current) {
        clearTimeout(addressDebounceTimerRef.current);
      }
    };
  }, [address, postcode, postcodeAddresses, combinedAddressMode]);

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
  };

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    const fullAddress = [
      suggestion.line_1,
      suggestion.line_2,
      suggestion.line_3,
    ]
      .filter(Boolean)
      .join(", ");

    if (onAddressSelect) {
      onAddressSelect({
        postcode: suggestion.postcode,
        address: fullAddress,
        townCity: suggestion.town_or_city,
        county: suggestion.county,
      });
    } else {
      if (onAddressChange) {
        onAddressChange(fullAddress);
      }
      if (onTownCityChange) {
        onTownCityChange(suggestion.town_or_city);
      }
      onPostcodeChange(suggestion.postcode);
    }

    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
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
          handleSelectAddress(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  const formatAddressDisplay = (suggestion: AddressSuggestion): string => {
    const parts = [
      suggestion.line_1,
      suggestion.line_2,
      suggestion.line_3,
      suggestion.town_or_city,
      suggestion.county,
      suggestion.postcode,
      suggestion.country,
    ].filter(Boolean);

    return parts.join(", ");
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
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              } else if (postcode && postcode.trim().length >= 1) {
                // Trigger search on focus if we have input
                fetchSuggestions(postcode);
              }
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
        {!error && postcode && postcode.trim().length >= 3 && !isLoading && suggestions.length === 0 && (
          <p className="mt-1 text-xs text-black/60 dark:text-white/60">
            No addresses found. Please check the postcode or enter manually.
          </p>
        )}
      </div>

      {/* Address Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border-2 border-[#FE8A0F] bg-white dark:bg-black shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.postcode}-${index}`}
              type="button"
              onClick={() => handleSelectAddress(suggestion)}
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
                  {suggestion.county && (
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                      {suggestion.county}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Address and Town/City Fields (if enabled) */}
      {showAddressField && (
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
                onAddressChange?.(e.target.value);
                setSelectedAddressIndex(-1);
              }}
              onFocus={() => {
                if (addressSuggestions.length > 0) {
                  setShowAddressSuggestions(true);
                } else if (postcode && postcodeAddresses.length > 0) {
                  // Show all addresses for the postcode when focusing on empty field
                  setAddressSuggestions(postcodeAddresses.slice(0, 10));
                  setShowAddressSuggestions(true);
                } else if (address && address.trim().length >= 1) {
                  // Trigger search on focus if we have input
                  filterAddressSuggestions(address);
                }
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
                      handleSelectAddress(addressSuggestions[selectedAddressIndex]);
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
              Enter a postcode first for better address suggestions
            </p>
          )}
          
          {/* Address Suggestions Dropdown */}
          {showAddressSuggestions && addressSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border-2 border-[#FE8A0F] bg-white dark:bg-black shadow-lg max-h-60 overflow-y-auto">
              {addressSuggestions.map((suggestion, index) => {
                const addressLine = [suggestion.line_1, suggestion.line_2, suggestion.line_3].filter(Boolean).join(", ");
                const fullAddress = combinedAddressMode 
                  ? `${addressLine}, ${suggestion.town_or_city}`
                  : addressLine;
                
                return (
                  <button
                    key={`${suggestion.postcode}-${suggestion.line_1}-${index}`}
                    type="button"
                    onClick={() => handleSelectAddress(suggestion)}
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
                      {fullAddress}
                    </p>
                    <p className="text-xs text-black/60 dark:text-white/60 mt-1">
                      {[suggestion.town_or_city, suggestion.county, suggestion.postcode, suggestion.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showTownCityField && (
        <div ref={cityWrapperRef} className="mt-4 relative">
          <Label htmlFor="townCity" className="text-black dark:text-white">
            Town/City
          </Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50 dark:text-white/50" />
            <Input
              id="townCity"
              type="text"
              value={townCity || ""}
              onChange={(e) => {
                onTownCityChange?.(e.target.value);
                setSelectedCityIndex(-1);
              }}
              onFocus={() => {
                if (citySuggestions.length > 0) {
                  setShowCitySuggestions(true);
                }
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
            <div className="absolute z-50 mt-1 w-full rounded-lg border-2 border-[#FE8A0F] bg-white dark:bg-black shadow-lg max-h-60 overflow-y-auto">
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
    </div>
  );
}

