import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Star, MapPin, Info, Check } from "lucide-react";
import { resolveAvatarUrl, getTwoLetterInitials } from "./orders/utils";
import VerificationBadge from "./VerificationBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface Professional {
  id: string;
  name: string;
  title: string;
  /** Short headline from professional profile (from backend). */
  profileTitle?: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  location: string;
  skills?: string[];
  responseTime?: string;
  portfolioImages?: string[];
  relevanceScore?: number;
  /** Distance in miles from job location (from backend). */
  distanceMiles?: number | null;
  /** Bio/About Me from professional profile (from backend). */
  bio?: string | null;
  /** True when all 6 verification steps are verified (from backend). */
  fullyVerified?: boolean;
}

interface InviteProfessionalsListProps {
  professionals: Professional[];
  /** Called when user confirms invite in the modal. Optional message from the textarea. */
  onInvite: (professional: Professional, message?: string) => void;
  invitedProfessionalIds: Set<string>;
}

export default function InviteProfessionalsList({
  professionals,
  onInvite,
  invitedProfessionalIds,
}: InviteProfessionalsListProps) {
  const [showInvitedOnly, setShowInvitedOnly] = useState(false);
  const [selectedProForInvite, setSelectedProForInvite] = useState<Professional | null>(null);
  const [inviteMessage, setInviteMessage] = useState("");
  const navigate = useNavigate();

  const openInviteModal = (pro: Professional) => {
    setSelectedProForInvite(pro);
    setInviteMessage("");
  };
  const closeInviteModal = () => {
    setSelectedProForInvite(null);
    setInviteMessage("");
  };
  const handleConfirmInvite = () => {
    if (!selectedProForInvite) return;
    onInvite(selectedProForInvite, inviteMessage.trim() || undefined);
    closeInviteModal();
  };

  if (professionals.length === 0) return null;

  // Navigate to professional profile
  const handleNavigateToProfile = (professionalId: string) => {
    navigate(`/profile/${professionalId}`);
  };

  // Filter professionals based on toggle
  const filteredProfessionals = showInvitedOnly
    ? professionals.filter(pro => invitedProfessionalIds.has(pro.id))
    : professionals;

  return (
    <div className="mt-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="font-['Poppins',sans-serif] text-[20px] text-[#2c353f] font-semibold mb-2">
          Recommended Professionals
        </h2>
        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] mb-5">
          These professionals match your job requirements and are ready to help
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] font-medium mb-1">
              Invite the professionals that match your needs to send you offers
            </p>
            <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
              View new offers in the 'Quotes' tab.
            </p>
          </div>
        </div>
      </div>

      {/* Header with count and toggle */}
      <div className="flex items-center justify-between mb-5">
        <p className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f]">
          <span className="font-semibold">Found {filteredProfessionals.length} professionals</span> who match your brief
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInvitedOnly}
            onChange={(e) => setShowInvitedOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#FE8A0F] focus:ring-[#FE8A0F]"
          />
          <span className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b]">
            Show invited professionals only
          </span>
        </label>
      </div>

      {/* Professionals List - Card: rounded square avatar left of trading name */}
      <div className="space-y-4">
        {filteredProfessionals.map((pro) => {
          return (
            <div
              key={pro.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#FE8A0F] hover:shadow-md transition-all duration-300"
            >
              {/* Mobile: avatar + (name + button same row), then rating under name */}
              <div className="block sm:hidden p-4">
                <div className="flex gap-3 items-start">
                  <div
                    className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-pointer shadow-sm flex items-center justify-center"
                    onClick={() => handleNavigateToProfile(pro.id)}
                  >
                    {resolveAvatarUrl(pro.image) ? (
                      <img src={resolveAvatarUrl(pro.image)!} alt={pro.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-['Poppins',sans-serif] text-lg font-semibold text-[#FE8A0F]">
                        {getTwoLetterInitials(pro.name, "P")}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <h3
                          className="font-['Poppins',sans-serif] text-[15px] text-[#2c353f] font-bold truncate cursor-pointer hover:text-[#FE8A0F] transition-colors"
                          onClick={() => handleNavigateToProfile(pro.id)}
                        >
                          {pro.name}
                        </h3>
                        <VerificationBadge fullyVerified={pro.fullyVerified} size="sm" />
                      </div>
                      {invitedProfessionalIds.has(pro.id) ? (
                        <Button
                          disabled
                          className="flex-shrink-0 bg-green-50 text-green-700 border-2 border-green-300 font-['Poppins',sans-serif] text-[12px] font-semibold h-8 px-3 cursor-not-allowed"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Invited
                        </Button>
                      ) : (
                        <Button
                          onClick={() => openInviteModal(pro)}
                          className="flex-shrink-0 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[12px] font-semibold h-8 px-3"
                        >
                          Send invitation
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= Math.floor(pro.rating) ? "text-[#FE8A0F] fill-[#FE8A0F]" : "text-gray-300 fill-gray-300"
                            }`}
                          />
                        ))}
                        <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] font-semibold ml-0.5">
                          {Number(pro.rating).toFixed(1)}
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">({pro.reviewCount} {Number(pro.reviewCount) < 2 ? "review" : "reviews"})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FE8A0F] flex-shrink-0" />
                        <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] font-medium truncate">
                          {pro.distanceMiles != null ? `${Number(pro.distanceMiles).toFixed(1)} miles away` : pro.location || "—"}
                        </span>
                      </div>
                    </div>
                    {!!pro.profileTitle && (
                      <p className="mt-1 font-['Poppins',sans-serif] text-[12px] text-[#2c353f] font-bold">
                        {pro.profileTitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Desktop: avatar + name block in one row; rating under name; about me full width (under avatar too) */}
              <div className="hidden sm:block p-5">
                <div className="flex gap-4">
                  {/* Avatar: rounded square, same row as trading name block */}
                  <div
                    className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 cursor-pointer shadow-sm flex items-center justify-center self-start"
                    onClick={() => handleNavigateToProfile(pro.id)}
                  >
                    {resolveAvatarUrl(pro.image) ? (
                      <img
                        src={resolveAvatarUrl(pro.image)!}
                        alt={pro.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-['Poppins',sans-serif] text-xl font-semibold text-[#FE8A0F]">
                        {getTwoLetterInitials(pro.name, "P")}
                      </span>
                    )}
                  </div>
                  {/* Trading name (same row as button, right) + rating under name + location + skills */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3
                          className="font-['Poppins',sans-serif] text-[17px] text-[#2c353f] font-bold truncate cursor-pointer hover:text-[#FE8A0F] transition-colors"
                          onClick={() => handleNavigateToProfile(pro.id)}
                        >
                          {pro.name}
                        </h3>
                        <VerificationBadge fullyVerified={pro.fullyVerified} size="md" />
                      </div>
                      {invitedProfessionalIds.has(pro.id) ? (
                        <Button
                          disabled
                          className="flex-shrink-0 bg-green-50 text-green-700 border-2 border-green-300 font-['Poppins',sans-serif] text-[13px] font-semibold h-9 px-5 cursor-not-allowed"
                        >
                          <Check className="w-4 h-4 mr-1.5" />
                          Invited
                        </Button>
                      ) : (
                        <Button
                          onClick={() => openInviteModal(pro)}
                          className="flex-shrink-0 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] text-[13px] font-semibold h-9 px-5"
                        >
                          Send invitation
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.floor(pro.rating) ? "text-[#FE8A0F] fill-[#FE8A0F]" : "text-gray-300 fill-gray-300"
                            }`}
                          />
                        ))}
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-bold ml-0.5">
                          {Number(pro.rating).toFixed(1)}
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">({pro.reviewCount} {Number(pro.reviewCount) < 2 ? "review" : "reviews"})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#FE8A0F] flex-shrink-0" />
                        <span className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium truncate">
                          {pro.distanceMiles != null
                            ? `${Number(pro.distanceMiles).toFixed(1)} miles away${pro.location ? ` • ${pro.location}` : ""}`
                            : pro.location || "—"}
                        </span>
                      </div>
                    </div>
                    {!!pro.profileTitle && (
                      <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-bold mb-2">
                        {pro.profileTitle}
                      </p>
                    )}
                    {pro.skills && pro.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pro.skills.slice(0, 3).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-blue-50 border border-blue-200 text-[#2c353f] font-['Poppins',sans-serif] text-[11px] font-semibold px-3 py-0.5 rounded-full"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Bio from profile: full width, no label; 250 chars then "..." */}
                {(pro.bio != null && pro.bio !== "") && (
                  <div className="pt-4">
                    <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] leading-relaxed">
                      {pro.bio.length > 250 ? `${pro.bio.slice(0, 250)}...` : pro.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm invite modal: pro info + message + Send invitation */}
      <Dialog open={!!selectedProForInvite} onOpenChange={(open: boolean) => !open && closeInviteModal()}>
        <DialogContent className="w-[90vw] max-w-md bg-white p-5">
          <DialogHeader>
            <DialogTitle className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f]">
              Send invitation
            </DialogTitle>
          </DialogHeader>
          {selectedProForInvite && (
            <div className="space-y-4">
              {/* Pro info section */}
              <div className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div
                  className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
                  onClick={() => { closeInviteModal(); handleNavigateToProfile(selectedProForInvite.id); }}
                >
                  {resolveAvatarUrl(selectedProForInvite.image) ? (
                    <img
                      src={resolveAvatarUrl(selectedProForInvite.image)!}
                      alt={selectedProForInvite.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center font-['Poppins',sans-serif] text-lg font-semibold text-[#FE8A0F]">
                      {getTwoLetterInitials(selectedProForInvite.name, "P")}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-['Poppins',sans-serif] text-[15px] font-bold text-[#2c353f] truncate">
                      {selectedProForInvite.name}
                    </span>
                    <VerificationBadge fullyVerified={selectedProForInvite.fullyVerified} size="sm" />
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.floor(selectedProForInvite.rating) ? "text-[#FE8A0F] fill-[#FE8A0F]" : "text-gray-300 fill-gray-300"
                        }`}
                      />
                    ))}
                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] font-semibold ml-0.5">
                      {Number(selectedProForInvite.rating).toFixed(1)}
                    </span>
                    <span className="font-['Poppins',sans-serif] text-[11px] text-[#8d8d8d]">
                      ({selectedProForInvite.reviewCount} {selectedProForInvite.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FE8A0F] flex-shrink-0" />
                    <span className="font-['Poppins',sans-serif] text-[12px] text-[#2c353f] truncate">
                      {selectedProForInvite.distanceMiles != null
                        ? `${Number(selectedProForInvite.distanceMiles).toFixed(1)} miles away${selectedProForInvite.location ? ` • ${selectedProForInvite.location}` : ""}`
                        : selectedProForInvite.location || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message field */}
              <div>
                <Label className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f] font-medium mb-1.5 block">
                  Message <span className="text-[#6b6b6b] font-normal">(optional)</span>
                </Label>
                <Textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a message to your invitation..."
                  className="font-['Poppins',sans-serif] text-[13px] min-h-[80px] resize-y border-gray-200 focus:ring-[#FE8A0F] focus:border-[#FE8A0F]"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeInviteModal}
                  className="flex-1 font-['Poppins',sans-serif] border-gray-300 text-[#2c353f]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmInvite}
                  className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] text-white font-['Poppins',sans-serif] font-semibold"
                >
                  Send invitation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}