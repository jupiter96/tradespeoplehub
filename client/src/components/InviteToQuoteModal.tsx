import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar as CalendarIcon, MapPin, DollarSign, FileText, X, Upload } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { cn } from "./ui/utils";

interface InviteToQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalName: string;
  professionalId: string;
  category?: string;
}

// Unified 15 categories
const categories = [
  { value: "home-garden", label: "Home & Garden" },
  { value: "business", label: "Business Services" },
  { value: "personal", label: "Personal Services" },
  { value: "repair-maintenance", label: "Repair & Maintenance" },
  { value: "technology", label: "Technology Services" },
  { value: "education", label: "Education & Tutoring" },
  { value: "beauty-wellness", label: "Beauty & Wellness" },
  { value: "health-fitness", label: "Health & Fitness" },
  { value: "legal-financial", label: "Legal & Financial" },
  { value: "events", label: "Event Services" },
  { value: "pets", label: "Pet Services" },
  { value: "automotive", label: "Automotive" },
  { value: "moving-storage", label: "Moving & Storage" },
  { value: "creative", label: "Creative Services" },
  { value: "other", label: "Other Services" }
];

const budgetOptions = [
  { value: "under-100", label: "Under £100" },
  { value: "100-250", label: "£100 - £250" },
  { value: "250-500", label: "£250 - £500" },
  { value: "500-1000", label: "£500 - £1,000" },
  { value: "1000-2500", label: "£1,000 - £2,500" },
  { value: "2500-5000", label: "£2,500 - £5,000" },
  { value: "over-5000", label: "Over £5,000" }
];

const urgencyOptions = [
  { value: "asap", label: "ASAP" },
  { value: "this-week", label: "This Week" },
  { value: "this-month", label: "This Month" },
  { value: "flexible", label: "Flexible" }
];

export default function InviteToQuoteModal({
  isOpen,
  onClose,
  professionalName,
  professionalId,
  category
}: InviteToQuoteModalProps) {
  const [formData, setFormData] = useState({
    category: category || "",
    title: "",
    description: "",
    postcode: "",
    budget: "",
    urgency: "",
    images: [] as File[]
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages].slice(0, 5) // Max 5 images
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.category || !formData.title || !formData.description || !formData.postcode) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Here you would typically send the data to your backend
    toast.success(`Quote request sent to ${professionalName}!`, {
      description: "They will review your request and provide a quote soon."
    });
    
    // Reset form and close
    setFormData({
      category: category || "",
      title: "",
      description: "",
      postcode: "",
      budget: "",
      urgency: "",
      images: []
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[22px] text-[#2c353f]">
            Request Quote from {professionalName}
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            Describe your job and {professionalName} will provide you with a custom quote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category" className="font-['Poppins',sans-serif] text-[14px] font-medium">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger className="font-['Poppins',sans-serif]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="font-['Poppins',sans-serif]">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-['Poppins',sans-serif] text-[14px] font-medium">
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Fix leaking tap in kitchen"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="font-['Poppins',sans-serif]"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-['Poppins',sans-serif] text-[14px] font-medium">
              Job Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the job..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="font-['Poppins',sans-serif] min-h-[120px]"
            />
            <p className="text-[12px] text-gray-500 font-['Poppins',sans-serif]">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Postcode */}
          <div className="space-y-2">
            <Label htmlFor="postcode" className="font-['Poppins',sans-serif] text-[14px] font-medium">
              Postcode <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="postcode"
                placeholder="e.g., SW1A 1AA"
                value={formData.postcode}
                onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value.toUpperCase() }))}
                className="font-['Poppins',sans-serif] pl-10"
              />
            </div>
          </div>

          {/* Budget and Urgency - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget" className="font-['Poppins',sans-serif] text-[14px] font-medium">
                Budget Range
              </Label>
              <Select value={formData.budget} onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                <SelectTrigger className="font-['Poppins',sans-serif]">
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  {budgetOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="font-['Poppins',sans-serif]">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label htmlFor="urgency" className="font-['Poppins',sans-serif] text-[14px] font-medium">
                When do you need it?
              </Label>
              <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}>
                <SelectTrigger className="font-['Poppins',sans-serif]">
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  {urgencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="font-['Poppins',sans-serif]">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="font-['Poppins',sans-serif] text-[14px] font-medium">
              Add Photos (Optional)
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-[14px] text-gray-600 font-['Poppins',sans-serif]">
                  Click to upload images
                </span>
                <span className="text-[12px] text-gray-400 font-['Poppins',sans-serif] mt-1">
                  Max 5 images
                </span>
              </label>
            </div>

            {/* Image Previews */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 font-['Poppins',sans-serif]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-[#FE8A0F] hover:bg-[#FF9E2C] text-white font-['Poppins',sans-serif]"
          >
            Send Quote Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
