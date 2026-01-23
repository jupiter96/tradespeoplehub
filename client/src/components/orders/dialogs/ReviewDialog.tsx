import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "../types";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSubmit: (orderId: string, rating: number, review: string) => Promise<void>;
}

interface StarRatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function StarRating({ label, value, onChange }: StarRatingProps) {
  return (
    <div>
      <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
        {label}
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value ? "fill-[#FE8A0F] text-[#FE8A0F]" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewDialog({
  open,
  onOpenChange,
  order,
  onSubmit,
}: ReviewDialogProps) {
  const [communicationRating, setCommunicationRating] = useState(5);
  const [serviceAsDescribedRating, setServiceAsDescribedRating] = useState(5);
  const [buyAgainRating, setBuyAgainRating] = useState(5);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const averageRating = Math.round(
      (communicationRating + serviceAsDescribedRating + buyAgainRating) / 3
    );

    if (averageRating === 0) {
      toast.error("Please provide ratings");
      return;
    }

    if (!order) return;

    setIsSubmitting(true);
    try {
      await onSubmit(order.id, averageRating, review);
      toast.success("Thank you for your feedback! Your review has been submitted.");
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCommunicationRating(5);
    setServiceAsDescribedRating(5);
    setBuyAgainRating(5);
    setReview("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="font-['Poppins',sans-serif] text-[20px]">
            Rate Your Experience
          </DialogTitle>
          <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            How was your experience with this service?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <StarRating
            label="Communication with the professional"
            value={communicationRating}
            onChange={setCommunicationRating}
          />

          <StarRating
            label="Service as described"
            value={serviceAsDescribedRating}
            onChange={setServiceAsDescribedRating}
          />

          <StarRating
            label="Would you use this service again?"
            value={buyAgainRating}
            onChange={setBuyAgainRating}
          />

          <div>
            <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] mb-2 block">
              Write a review (optional)
            </Label>
            <Textarea
              placeholder="Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="font-['Poppins',sans-serif] text-[13px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-['Poppins',sans-serif]">
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#FE8A0F] hover:bg-[#e07d0d] text-white font-['Poppins',sans-serif]"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

