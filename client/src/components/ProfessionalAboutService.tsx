import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";

export default function ProfessionalAboutService() {
  const navigate = useNavigate();
  const { updateProfile, isLoggedIn, userRole, userInfo } = useAccount();
  const [formData, setFormData] = useState({
    aboutService: "",
    hasTradeQualification: "no",
    hasPublicLiability: "no",
    qualifications: "",
  });
  const [charCount, setCharCount] = useState(0);

  // Redirect to login if not logged in or not a professional
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else if (userRole !== "professional") {
      navigate("/account");
    }
  }, [isLoggedIn, userRole, navigate]);

  const handleAboutServiceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setFormData({ ...formData, aboutService: text });
    setCharCount(text.length);
  };

  const handleSaveAndContinue = async () => {
    if (charCount < 100) {
      alert("Please write at least 100 characters about your service");
      return;
    }
    
    try {
      // Prepare update data
      const updateData: any = {
        firstName: userInfo?.firstName || "",
        lastName: userInfo?.lastName || "",
        email: userInfo?.email || "",
        phone: userInfo?.phone || "",
        postcode: userInfo?.postcode || "",
        address: userInfo?.address || "",
        tradingName: userInfo?.tradingName || "",
        aboutService: formData.aboutService,
        hasTradeQualification: formData.hasTradeQualification,
        hasPublicLiability: formData.hasPublicLiability,
      };
      
      // Include qualifications if trade qualification is yes
      if (formData.hasTradeQualification === "yes") {
        updateData.publicProfile = {
          qualifications: formData.qualifications || "",
        };
      }
      
      // Save to backend
      await updateProfile(updateData);
      // Navigate to account page
      navigate("/account");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save. Please try again.");
    }
  };

  const handleDoLater = () => {
    // Skip this page and go directly to account
    navigate("/account");
  };

  const handleBack = () => {
    navigate("/professional-setup");
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
              About your service
            </h1>

            {/* Description */}
            <div className="mb-6">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-4">
                Please tell the customers about your business, experience and quality of your work.
                <br />
                It's the first thing users reads about you, so it's essential to make sure it is well written.
              </p>

              <Textarea
                value={formData.aboutService}
                onChange={handleAboutServiceChange}
                placeholder="Describe your business, experience, and what makes your service special..."
                className="min-h-[280px] border-2 border-gray-300 focus:border-[#3B82F6] rounded-xl font-['Poppins',sans-serif] text-[14px] resize-none"
              />
              
              <div className="mt-2 text-right">
                <span className={`font-['Poppins',sans-serif] text-[13px] ${charCount < 100 ? 'text-red-500' : 'text-green-600'}`}>
                  {charCount < 100 ? `Minimum 100 Characters (${100 - charCount} more needed)` : `${charCount} Characters`}
                </span>
              </div>
            </div>

            {/* Trade Qualification */}
            <div className="mb-6 pt-4">
              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-4 text-center">
                Do you have any trade qualification or accreditation?
              </h3>
              <RadioGroup
                value={formData.hasTradeQualification}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    hasTradeQualification: value,
                    // Clear qualifications if switching to "no"
                    qualifications: value === "no" ? "" : formData.qualifications
                  });
                }}
                className="flex items-center justify-center gap-8"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="trade-yes" className="border-2 border-gray-400 text-[#FE8A0F]" />
                  <Label htmlFor="trade-yes" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] cursor-pointer">
                    YES
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="trade-no" className="border-2 border-gray-400 text-[#FE8A0F]" />
                  <Label htmlFor="trade-no" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] cursor-pointer">
                    NO
                  </Label>
                </div>
              </RadioGroup>
              
              {/* Qualifications Input - Show when YES is selected */}
              {formData.hasTradeQualification === "yes" && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                    Please list your qualifications and accreditations (with the relevant registration number) in this section. If you're a time served Professional, leave this section blank.
                  </p>
                  <Textarea
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    placeholder="Enter your qualifications and accreditations with registration numbers..."
                    className="min-h-[120px] border-2 border-gray-300 focus:border-[#3B82F6] rounded-xl font-['Poppins',sans-serif] text-[14px] resize-none"
                  />
                </div>
              )}
            </div>

            {/* Public Liability Insurance */}
            <div className="mb-8">
              <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-4 text-center">
                Do you have public liability insurance?
              </h3>
              <RadioGroup
                value={formData.hasPublicLiability}
                onValueChange={(value) => setFormData({ ...formData, hasPublicLiability: value })}
                className="flex items-center justify-center gap-8"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="insurance-yes" className="border-2 border-gray-400 text-[#FE8A0F]" />
                  <Label htmlFor="insurance-yes" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] cursor-pointer">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="insurance-no" className="border-2 border-gray-400 text-[#FE8A0F]" />
                  <Label htmlFor="insurance-no" className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button
                onClick={handleSaveAndContinue}
                className="w-full sm:w-auto px-10 h-12 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[15px]"
              >
                Save and Continue
              </Button>
              <Button
                onClick={handleDoLater}
                variant="ghost"
                className="w-full sm:w-auto px-10 h-12 text-[#6b6b6b] hover:text-[#2c353f] hover:bg-gray-100 rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[15px]"
              >
                Do This Later
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center">
            <p className="font-['Poppins',sans-serif] text-[12px] text-[#8d8d8d]">
              You can always update this information later in your account settings
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
