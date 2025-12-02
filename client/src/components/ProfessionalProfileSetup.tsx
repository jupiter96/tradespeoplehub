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
  const [selectedSector, setSelectedSector] = useState<string>("");
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

  const handleSectorChange = (sector: string) => {
    // Only allow one sector selection
    setSelectedSector(sector);
    // Reset services when sector changes
    setSelectedServices([]);
  };

  const handleSaveAndContinue = () => {
    if (!selectedSector) {
      alert("Please select a sector");
      return;
    }
    if (selectedServices.length === 0) {
      alert("Please select at least one service");
      return;
    }
    // Save sector and services to AccountContext
    updateUserInfo({
      sector: selectedSector,
      services: selectedServices
    });
    console.log("Selected Sector:", selectedSector);
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
                Select Sector <span className="text-xs text-gray-500 font-normal">(You can only select one sector)</span>
              </Label>
              <div className="space-y-2 mb-4 p-4 border border-gray-200 rounded-xl max-h-[250px] overflow-y-auto">
                {Object.keys(sectors).map((sector) => (
                  <label
                    key={sector}
                    htmlFor={`sector-${sector}`}
                    className={`flex items-start space-x-3 p-2.5 rounded-lg hover:bg-[#FFF5EB] transition-colors cursor-pointer ${
                      selectedSector === sector ? 'bg-[#FFF5EB] border border-[#FE8A0F]' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      id={`sector-${sector}`}
                      name="sector"
                      value={sector}
                      checked={selectedSector === sector}
                      onChange={() => handleSectorChange(sector)}
                      className="mt-0.5 w-4 h-4 text-[#FE8A0F] border-gray-300 focus:ring-[#FE8A0F] focus:ring-2 cursor-pointer"
                    />
                    <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] leading-relaxed flex-1">
                      {sector}
                    </span>
                    {selectedSector === sector && (
                      <CheckCircle2 className="w-4 h-4 text-[#FE8A0F] flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b]">
                Note: You can only select one sector. Once selected, it cannot be changed. However, you can select multiple categories within your chosen sector.
              </p>
            </div>

            {/* Services Checkboxes */}
            {selectedSector && (
              <div className="mb-5">
                <Label className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-3 block">
                  Select Categories/Services You Offer <span className="text-xs text-gray-500 font-normal">(You can select multiple)</span>
                </Label>
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
                  {sectors[selectedSector as keyof typeof sectors]?.map((service, index) => (
                    <div key={`${selectedSector}-${service}-${index}`} className="flex items-start space-x-3 p-2.5 rounded-lg hover:bg-[#FFF5EB] transition-colors">
                      <Checkbox
                        id={`service-${selectedSector}-${service}-${index}`}
                        checked={selectedServices.includes(service)}
                        onCheckedChange={() => handleServiceToggle(service)}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`service-${selectedSector}-${service}-${index}`}
                        className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] cursor-pointer leading-relaxed flex-1"
                      >
                        {service}
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
            )}

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
