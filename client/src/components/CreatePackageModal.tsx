import { useState } from "react";
import { X, Plus, Trash2, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "sonner@2.0.3";

// Admin-defined feature options for packages
const PACKAGE_FEATURE_OPTIONS = [
  { id: "feature-1", label: "Professional consultation included" },
  { id: "feature-2", label: "24/7 emergency support" },
  { id: "feature-3", label: "Quality guarantee" },
  { id: "feature-4", label: "Free follow-up visit" },
  { id: "feature-5", label: "All materials included" },
  { id: "feature-6", label: "Insurance covered" },
  { id: "feature-7", label: "Before & after photos" },
  { id: "feature-8", label: "Detailed report provided" },
  { id: "feature-9", label: "Eco-friendly options" },
  { id: "feature-10", label: "Senior discount available" },
  { id: "feature-11", label: "Free quote revision" },
  { id: "feature-12", label: "Weekend service available" },
  { id: "feature-13", label: "Licensed & certified" },
  { id: "feature-14", label: "No hidden fees" },
  { id: "feature-15", label: "Satisfaction guaranteed" },
  { id: "feature-16", label: "Multi-service discount" },
  { id: "feature-17", label: "Priority booking" },
  { id: "feature-18", label: "Flexible scheduling" },
  { id: "feature-19", label: "Money-back guarantee" },
  { id: "feature-20", label: "Cleanup included" },
];

interface Package {
  id: string;
  name: string;
  price: string;
  deliveryType: string; // "same-day" or "standard"
  description: string;
  features: string[]; // Selected feature IDs
}

interface CreatePackageModalProps {
  onClose: () => void;
  onSave: (packages: Package[]) => void;
}

export default function CreatePackageModal({ onClose, onSave }: CreatePackageModalProps) {
  // Helper function to get random features
  const getRandomFeatures = (count: number = 3): string[] => {
    const shuffled = [...PACKAGE_FEATURE_OPTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(f => f.id);
  };

  const [packages, setPackages] = useState<Package[]>([
    {
      id: "basic",
      name: "Basic",
      price: "",
      deliveryType: "standard",
      description: "",
      features: getRandomFeatures(3)
    },
    {
      id: "standard",
      name: "Standard",
      price: "",
      deliveryType: "standard",
      description: "",
      features: getRandomFeatures(3)
    },
    {
      id: "premium",
      name: "Premium",
      price: "",
      deliveryType: "same-day",
      description: "",
      features: getRandomFeatures(3)
    }
  ]);

  const togglePackageFeature = (packageId: string, featureId: string) => {
    setPackages(packages.map(pkg => {
      if (pkg.id === packageId) {
        const hasFeature = pkg.features.includes(featureId);
        return {
          ...pkg,
          features: hasFeature 
            ? pkg.features.filter(f => f !== featureId)
            : [...pkg.features, featureId]
        };
      }
      return pkg;
    }));
  };

  const handleSave = () => {
    const validPackages = packages.filter(p => p.price && p.name);
    
    if (validPackages.length === 0) {
      toast.error("Please fill in at least one package with name and price");
      return;
    }

    onSave(validPackages);
    toast.success(`${validPackages.length} package(s) created successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col" 
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex-1 pr-4">
            <h2 className="font-['Poppins',sans-serif] text-[18px] sm:text-[22px] text-[#2c353f]">
              Create Service Package
            </h2>
            <p className="font-['Poppins',sans-serif] text-[12px] sm:text-[13px] text-[#6b6b6b] mt-1">
              Create bundled service packages to offer better value to your clients
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-[#6b6b6b]" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-4 sm:space-y-6">
            <p className="font-['Poppins',sans-serif] text-[13px] sm:text-[14px] text-[#6b6b6b]">
              Create pricing packages for your service. Clients can choose the package that best fits their needs.
            </p>
            
            {/* Package Forms */}
            {packages.map((pkg, displayIndex) => {
              const actualIndex = displayIndex;
              
              return (
              <div key={pkg.id} className="border-2 border-gray-200 rounded-xl p-4 sm:p-5 space-y-4">
                <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                  {pkg.name} Package
                </h3>
                
                <div>
                  <Label className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1 block">
                    Price (£)
                  </Label>
                  <Input
                    type="number"
                    value={pkg.price}
                    onChange={(e) => {
                      const updated = [...packages];
                      updated[actualIndex].price = e.target.value;
                      setPackages(updated);
                    }}
                    placeholder="0.00"
                    className="font-['Poppins',sans-serif] text-[14px] border-gray-300"
                  />
                </div>

                <div>
                  <Label className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-2 block">
                    Delivery Type
                  </Label>
                  <RadioGroup 
                    value={pkg.deliveryType} 
                    onValueChange={(value) => {
                      const updated = [...packages];
                      updated[actualIndex].deliveryType = value;
                      setPackages(updated);
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label 
                        htmlFor={`${pkg.id}-standard`}
                        className={`
                          flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                          ${pkg.deliveryType === "standard" 
                            ? 'border-[#FE8A0F] bg-[#FFF5EB] shadow-md' 
                            : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                          }
                        `}
                      >
                        <RadioGroupItem 
                          value="standard" 
                          id={`${pkg.id}-standard`}
                          className="sr-only"
                        />
                        <span 
                          className={`
                            font-['Poppins',sans-serif] text-[12px] text-center
                            ${pkg.deliveryType === "standard" ? 'text-[#FE8A0F]' : 'text-[#2c353f]'}
                          `}
                        >
                          Standard Delivery
                        </span>
                        {pkg.deliveryType === "standard" && (
                          <CheckCircle className="w-4 h-4 ml-2 text-[#FE8A0F]" />
                        )}
                      </label>
                      <label 
                        htmlFor={`${pkg.id}-same-day`}
                        className={`
                          flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                          ${pkg.deliveryType === "same-day" 
                            ? 'border-[#FE8A0F] bg-[#FFF5EB] shadow-md' 
                            : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-sm'
                          }
                        `}
                      >
                        <RadioGroupItem 
                          value="same-day" 
                          id={`${pkg.id}-same-day`}
                          className="sr-only"
                        />
                        <span 
                          className={`
                            font-['Poppins',sans-serif] text-[12px] text-center
                            ${pkg.deliveryType === "same-day" ? 'text-[#FE8A0F]' : 'text-[#2c353f]'}
                          `}
                        >
                          Same Day Delivery
                        </span>
                        {pkg.deliveryType === "same-day" && (
                          <CheckCircle className="w-4 h-4 ml-2 text-[#FE8A0F]" />
                        )}
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-1 block">
                    Description
                  </Label>
                  <Textarea
                    value={pkg.description}
                    onChange={(e) => {
                      const updated = [...packages];
                      updated[actualIndex].description = e.target.value;
                      setPackages(updated);
                    }}
                    placeholder="Describe what's included..."
                    className="font-['Poppins',sans-serif] text-[14px] border-gray-300 min-h-[80px] resize-none"
                  />
                </div>

                <div>
                  <Label className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3 block">
                    Features (Select up to 5)
                  </Label>
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
                    {PACKAGE_FEATURE_OPTIONS.map((option) => {
                      const isSelected = pkg.features.includes(option.id);
                      const canSelect = pkg.features.length < 5 || isSelected;
                      
                      return (
                        <label
                          key={option.id}
                          className={`
                            flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                            ${isSelected 
                              ? 'border-[#FE8A0F] bg-[#FFF5EB]' 
                              : canSelect 
                                ? 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50' 
                                : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            }
                          `}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={!canSelect}
                            onCheckedChange={() => togglePackageFeature(pkg.id, option.id)}
                            className={`
                              mt-0.5 flex-shrink-0
                              ${isSelected ? 'border-[#FE8A0F] data-[state=checked]:bg-[#FE8A0F]' : ''}
                            `}
                          />
                          <span className={`
                            font-['Poppins',sans-serif] text-[13px] leading-snug
                            ${isSelected ? 'text-[#2c353f]' : 'text-[#6b6b6b]'}
                          `}>
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d] mt-2">
                    {pkg.features.length} of 5 features selected
                  </p>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="font-['Poppins',sans-serif] border-gray-300 hover:bg-gray-100 text-[13px] sm:text-[14px] px-4 sm:px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] transition-all duration-300 font-['Poppins',sans-serif] text-[13px] sm:text-[14px] px-4 sm:px-6"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Create Package
          </Button>
        </div>
      </div>
    </div>
  );
}
