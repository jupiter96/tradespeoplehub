import { ShieldCheck } from "lucide-react";

interface VerificationBadgeProps {
  /** When true, shows the shield-with-check badge (fully verified). When false, renders nothing. */
  fullyVerified?: boolean;
  /** Size of the icon wrapper. */
  size?: "sm" | "md";
  /** Optional title for the badge (tooltip). */
  title?: string;
  className?: string;
}

/**
 * Badge shown next to a professional's trading name when they have passed all 6 verification steps.
 * Transparent background, blue icon (ShieldCheck).
 */
export default function VerificationBadge({
  fullyVerified,
  size = "md",
  title = "Fully verified professional",
  className = "",
}: VerificationBadgeProps) {
  if (!fullyVerified) return null;

  const sizeClasses = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  const iconClasses = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <span
      className={`flex-shrink-0 inline-flex items-center justify-center rounded bg-transparent text-blue-600 ${sizeClasses} ${className}`}
      title={title}
      aria-label={title}
    >
      <ShieldCheck className={iconClasses} aria-hidden />
    </span>
  );
}
