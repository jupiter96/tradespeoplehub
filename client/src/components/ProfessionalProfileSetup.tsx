import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import Nav from "../imports/Nav";
import Footer from "./Footer";
import { useAccount } from "./AccountContext";
import ProfessionalRegistrationSteps from "./ProfessionalRegistrationSteps";
import SEOHead from "./SEOHead";

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
  const { isLoggedIn, userRole } = useAccount();

  // Redirect to login if not logged in or not a professional
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else if (userRole !== "professional") {
      navigate("/account");
    } else {
      // This page used legacy hardcoded sectors/categories.
      // Keep the route for compatibility but render the DB-driven wizard instead.
    }
  }, [isLoggedIn, userRole, navigate]);

  return (
    <>
      <SEOHead
        title="Professional Profile Setup"
        description="Professional profile setup page"
        robots="noindex,nofollow"
      />
      <ProfessionalRegistrationSteps />
    </>
  );
}
