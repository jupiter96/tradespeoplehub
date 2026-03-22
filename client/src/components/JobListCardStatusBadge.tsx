import type { Job } from "./JobsContext";
import { CheckCircle, Clock } from "lucide-react";
import { cn } from "./ui/utils";

const CLIENT_LABEL: Record<Job["status"], string> = {
  open: "Open",
  "awaiting-accept": "Awaiting Accept",
  "in-progress": "In Progress",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  closed: "Closed",
};

const badgeBase =
  "inline-flex items-center justify-center rounded-md border font-medium font-['Poppins',sans-serif] gap-1 shrink-0 whitespace-nowrap shadow-sm [&>svg]:size-3";

function badgeSizeClasses(size: "normal" | "large") {
  return size === "large" ? "px-4 py-2 text-[14px] sm:text-[16px]" : "px-2 py-0.5 text-[11px]";
}

/** Tailwind palette only (avoids shadcn Badge / theme overriding background). */
function clientStatusClass(status: Job["status"]): string {
  switch (status) {
    case "open":
      return "bg-blue-600 text-white";
    case "awaiting-accept":
      return "bg-orange-600 text-white";
    case "in-progress":
      return "bg-blue-500 text-white";
    case "delivered":
      return "bg-purple-500 text-white";
    case "completed":
      return "bg-green-500 text-white";
    case "cancelled":
      return "bg-red-600 text-white";
    case "closed":
      return "bg-gray-400 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

/** Client My Jobs / Available list — render in right column top */
export function ClientJobListStatusBadge({
  status,
  size = "normal",
}: {
  status: Job["status"];
  size?: "normal" | "large";
}) {
  return (
    <span
      className={cn(badgeBase, badgeSizeClasses(size), clientStatusClass(status))}
      role="status"
    >
      {CLIENT_LABEL[status] ?? status}
    </span>
  );
}

function proActiveLabel(status: Job["status"]): string {
  switch (status) {
    case "awaiting-accept":
      return "Awaiting Accept";
    case "in-progress":
      return "In Progress";
    case "delivered":
      return "Delivered";
    case "completed":
      return "Completed";
    default:
      return CLIENT_LABEL[status as Job["status"]] ?? String(status);
  }
}

function proActiveClass(status: Job["status"]): string {
  switch (status) {
    case "open":
      return "bg-blue-600 text-white";
    case "awaiting-accept":
      return "bg-orange-600 text-white";
    case "in-progress":
      return "bg-blue-500 text-white";
    case "delivered":
      return "bg-purple-500 text-white";
    case "completed":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

/** Pro Active Jobs list — right column top */
export function ProActiveJobListStatusBadge({
  status,
  size = "normal",
}: {
  status: Job["status"];
  size?: "normal" | "large";
}) {
  const icon =
    status === "awaiting-accept" ? (
      <Clock className="shrink-0" aria-hidden />
    ) : status === "in-progress" || status === "delivered" || status === "completed" ? (
      <CheckCircle className="shrink-0" aria-hidden />
    ) : null;

  return (
    <span className={cn(badgeBase, badgeSizeClasses(size), proActiveClass(status))} role="status">
      {icon}
      {proActiveLabel(status)}
    </span>
  );
}

/** Tab count pills next to My Jobs tabs — unified brand orange. */
const tabCountBadgeClass =
  "bg-[#FE8A0F] text-white border border-[#e57d0e] shadow-sm";

export function StatusCountBadge({
  status,
  count,
  size = "normal",
  variant: _variant = "client",
  className,
}: {
  status: Job["status"];
  count: number;
  size?: "normal" | "large";
  variant?: "client" | "pro";
  className?: string;
}) {
  return (
    <span
      className={cn(badgeBase, badgeSizeClasses(size), tabCountBadgeClass, className)}
      aria-label={`${CLIENT_LABEL[status] ?? status}: ${count}`}
    >
      {count}
    </span>
  );
}

/** Red Urgent pill next to job title (client/pro My Jobs lists) when job was posted with urgent timing. */
export function JobUrgentTitleBadge({ timing }: { timing?: Job["timing"] }) {
  if (timing !== "urgent") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide",
        "bg-red-600 text-white border border-red-700 shadow-sm shrink-0 font-['Poppins',sans-serif]"
      )}
    >
      Urgent
    </span>
  );
}
