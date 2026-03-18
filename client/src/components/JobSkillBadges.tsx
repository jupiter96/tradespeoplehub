import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function JobSkillBadges({
  categories,
  maxVisible = 5,
  jobSlug,
  jobId,
}: {
  categories?: string[] | null;
  maxVisible?: number;
  jobSlug?: string;
  jobId?: string;
}) {
  const navigate = useNavigate();

  const safeCategories = (categories || []).filter(Boolean);
  const visible = safeCategories.slice(0, maxVisible);
  const hasMore = safeCategories.length > maxVisible;

  const jobPath = jobSlug ? `/job/${jobSlug}` : jobId ? `/job/${jobId}` : null;

  if (safeCategories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((category, idx) => (
        <Badge
          key={`${category}-${idx}`}
          variant="outline"
          className="bg-[#E3F2FD] text-[#1976D2] border-[#1976D2]/30 font-['Poppins',sans-serif] text-[11px]"
        >
          {category}
        </Badge>
      ))}

      {hasMore && jobPath && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 px-2 font-['Poppins',sans-serif] text-[11px] bg-[#E3F2FD]/40 text-[#1976D2] border-[#1976D2]/30 hover:bg-[#E3F2FD]/60"
          onClick={(e) => {
            e.stopPropagation();
            navigate(jobPath);
          }}
        >
          More
        </Button>
      )}
    </div>
  );
}

