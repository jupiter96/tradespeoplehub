import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";

// Define sectors and their services
const sectors = {
  "Home & Garden": [
    "Basic Outline Plans for quote and planning applications",
    "Full regulation plans for builder and building reg",
    "Structural calculations",
    "Bathroom Fitters",
    "Handyman",
    "Builders",
    "Gardeners",
    "Cleaners",
    "Plumbers",
    "Electricians",
    "Painters & Decorators",
    "Carpenters",
    "Landscaping",
    "Roofing",
    "Kitchen Fitters"
  ],
  "Business Services": [
    "Legal & Advice",
    "Accounting & Bookkeeping",
    "Marketing & Advertising",
    "Web Design & Development",
    "Graphic Design",
    "Content Writing",
    "SEO Services",
    "Social Media Management",
    "Business Consulting",
    "Virtual Assistant"
  ],
  "Personal Services": [
    "Personal Training",
    "Massage Therapy",
    "Hair & Beauty",
    "Photography",
    "Event Planning",
    "Catering",
    "Tutoring",
    "Music Lessons",
    "Pet Care",
    "Childcare"
  ],
  "Repair & Maintenance": [
    "General Repairs",
    "Appliance Repair",
    "Furniture Repair",
    "Lock & Key Services",
    "Window & Door Repair",
    "Drywall Repair",
    "Fence Repair",
    "Pressure Washing"
  ],
  "Technology Services": [
    "Computer Repair",
    "IT Support",
    "Software Development",
    "Network Setup",
    "Data Recovery",
    "Phone Repair",
    "Smart Home Installation",
    "Cybersecurity"
  ],
  "Education & Tutoring": [
    "Academic Tutoring",
    "Language Learning",
    "Music Lessons",
    "Art Classes",
    "Test Preparation",
    "Career Coaching",
    "Professional Training",
    "Online Courses"
  ],
  "Beauty & Wellness": [
    "Hair Styling",
    "Makeup Services",
    "Nail Services",
    "Spa Services",
    "Skin Care",
    "Barber Services",
    "Beauty Consultation",
    "Mobile Beauty Services"
  ],
  "Health & Wellness": [
    "Physiotherapy",
    "Nutrition Consulting",
    "Yoga Instruction",
    "Mental Health Counseling",
    "Chiropractor",
    "Acupuncture",
    "Personal Care",
    "Fitness Training"
  ],
  "Legal & Financial": [
    "Legal Consulting",
    "Tax Services",
    "Financial Planning",
    "Accounting",
    "Insurance Services",
    "Real Estate Law",
    "Business Law",
    "Estate Planning"
  ],
  "Event Services": [
    "Event Planning",
    "Catering",
    "Photography",
    "Videography",
    "DJ Services",
    "Decoration",
    "Entertainment",
    "Venue Setup"
  ],
  "Pet Services": [
    "Pet Grooming",
    "Dog Walking",
    "Pet Sitting",
    "Veterinary Services",
    "Pet Training",
    "Pet Photography",
    "Pet Transportation",
    "Pet Boarding"
  ],
  "Automotive": [
    "Car Repair & Maintenance",
    "Mobile Mechanic",
    "Car Detailing",
    "Tyre Services",
    "Car Inspection",
    "Auto Electrical",
    "Body Shop & Paint",
    "Car Locksmith"
  ],
  "Moving & Storage": [
    "House Moving",
    "Office Relocation",
    "Packing Services",
    "Storage Solutions",
    "Furniture Moving",
    "International Moving",
    "Same Day Moving",
    "Moving Supplies"
  ]
};

export default function ProfessionalProfileSetup() {
  const navigate = useNavigate();
  const { updateUserInfo, isLoggedIn, userRole } = useAccount();
  const [selectedSectors, setSelectedSectors] = useState<string[]>(["Home & Garden"]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Redirect to login if not logged in or not a professional
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else if (userRole !== "professional") {
      navigate("/account");
    }
  }, [isLoggedIn, userRole, navigate]);

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSectorToggle = (sector: string) => {
    setSelectedSectors(prev => {
      if (prev.includes(sector)) {
        // Must have at least 1 sector
        if (prev.length === 1) {
          alert("You must select at least one sector");
          return prev;
        }
        return prev.filter(s => s !== sector);
      } else {
        // Maximum 3 sectors
        if (prev.length >= 3) {
          alert("You can select a maximum of 3 sectors");
          return prev;
        }
        return [...prev, sector];
      }
    });
    // Reset services when sectors change
    setSelectedServices([]);
  };

  const handleSaveAndContinue = () => {
    if (selectedSectors.length === 0) {
      alert("Please select at least one sector");
      return;
    }
    if (selectedServices.length === 0) {
      alert("Please select at least one service");
      return;
    }
    // Save sectors and services to AccountContext
    updateUserInfo({
      sectors: selectedSectors,
      sector: selectedSectors[0], // For backward compatibility
      services: selectedServices
    });
    console.log("Selected Sectors:", selectedSectors);
    console.log("Selected Services:", selectedServices);
    // Navigate to about service page
    navigate("/professional-about");
  };

  const handleBack = () => {
    // Go back to login or previous page
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Nav />
      
      <div className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 mb-4 font-['Poppins',sans-serif] text-[14px] text-[#3B82F6] hover:text-[#FE8A0F] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h1 className="font-['Poppins',sans-serif] text-[24px] sm:text-[28px] text-[#2c353f] mb-6 text-center">
              Which sectors do you cover?
            </h1>

            {/* Sector Selection */}
            <div className="mb-6">
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                Select Sectors (1-3 sectors)
              </Label>
              <div className="space-y-2 mb-4 p-4 border border-gray-200 rounded-xl max-h-[250px] overflow-y-auto">
                {Object.keys(sectors).map((sector) => (
                  <div key={sector} className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-[#FFF5EB] transition-colors">
                    <Checkbox
                      id={`sector-${sector}`}
                      checked={selectedSectors.includes(sector)}
                      onCheckedChange={() => handleSectorToggle(sector)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={`sector-${sector}`}
                      className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] cursor-pointer leading-relaxed flex-1"
                    >
                      {sector}
                    </Label>
                    {selectedSectors.includes(sector) && (
                      <CheckCircle2 className="w-4 h-4 text-[#FE8A0F] flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                Selected: {selectedSectors.length}/3 sectors
              </p>
            </div>

            {/* Services Checkboxes */}
            <div className="mb-5">
              <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                Select Services You Offer
              </Label>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                {selectedSectors.flatMap(sector => 
                  sectors[sector as keyof typeof sectors].map((service) => ({
                    service,
                    sector
                  })
                )).map(({ service, sector }, index) => (
                  <div key={`${sector}-${service}-${index}`} className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-[#FFF5EB] transition-colors">
                    <Checkbox
                      id={`service-${sector}-${service}-${index}`}
                      checked={selectedServices.includes(service)}
                      onCheckedChange={() => handleServiceToggle(service)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={`service-${sector}-${service}-${index}`}
                      className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] cursor-pointer leading-relaxed flex-1"
                    >
                      {service}
                      <span className="text-[11px] text-[#8d8d8d] ml-2">({sector})</span>
                    </Label>
                    {selectedServices.includes(service) && (
                      <CheckCircle2 className="w-4 h-4 text-[#FE8A0F] flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Selected Count */}
              {selectedServices.length > 0 && (
                <div className="mt-3 p-2.5 bg-[#FFF5EB] border border-[#FE8A0F]/20 rounded-xl">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
                    <span className="text-[#FE8A0F]">{selectedServices.length}</span> service{selectedServices.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>

            {/* Save and Continue Button */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleSaveAndContinue}
                className="w-full sm:w-auto px-12 h-11 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[15px]"
              >
                Save and Continue
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center">
            <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
              You can always update your services later in your account settings
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
