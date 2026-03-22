import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { resolveApiUrl } from "../config/api";
import { useAccount } from "./AccountContext";
import { getSocket, connectSocket } from "../services/socket";

export interface JobQuote {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalAvatar?: string;
  professionalFullyVerified?: boolean;
  professionalCountry?: string;
  professionalTownCity?: string;
  professionalRating: number;
  professionalReviews: number;
  professionalProfileTitle?: string;
  price: number;
  deliveryTime: string;
  message: string;
  submittedAt: string;
  status: "pending" | "accepted" | "rejected" | "awarded";
  suggestedMilestones?: {
    id: string;
    description: string;
    amount: number;
    status: "pending" | "accepted" | "rejected";
  }[];
}

export interface DisputeMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
  isTeamResponse?: boolean;
}

export interface DisputeOffer {
  userId: string;
  amount: number;
  timestamp: string;
}

export interface Dispute {
  id: string;
  jobId: string;
  milestoneId: string;
  claimantId: string;
  claimantName: string;
  claimantAvatar?: string;
  respondentId: string;
  respondentName: string;
  respondentAvatar?: string;
  amount: number;
  reason: string;
  evidence?: string;
  status: "open" | "resolved" | "closed";
  messages: DisputeMessage[];
  claimantOffer?: DisputeOffer;
  respondentOffer?: DisputeOffer;
  createdAt: string;
  resolvedAt?: string;
  teamInterventionTime?: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  amount: number;
  status: "awaiting-accept" | "in-progress" | "delivered" | "released" | "disputed" | "cancelled";
  createdAt: string;
  releasedAt?: string;
  disputeId?: string;
  cancelRequestedAt?: string;
  cancelRequestedBy?: string;
  cancelRequestReason?: string;
  cancelRequestStatus?: "pending" | "accepted" | "rejected";
  releaseRequestedAt?: string;
  releaseRequestedBy?: string;
  releaseRequestStatus?: "pending" | "accepted" | "rejected";
}

export interface MilestoneDelivery {
  milestoneIndex: number;
  deliveryMessage: string;
  fileUrls: { url: string; name?: string }[];
  deliveredAt: string | null;
  deliveredBy: string;
  approvedAt: string | null;
  approvedBy: string | null;
  revisionRequestedAt: string | null;
  revisionMessage: string;
  revisionRequestedBy: string | null;
  revisionFileUrls?: { url: string; name?: string }[];
}

export interface Job {
  id: string;
  slug?: string;
  title: string;
  description: string;
  sector: string;
  sectorId?: string;
  categories: string[];
  postcode: string;
  /** Street line only */
  address?: string;
  /** City or town */
  city?: string;
  /** State, county, or region */
  state?: string;
  /** Legacy combined display string */
  location: string;
  timing: "urgent" | "flexible" | "specific" | "soon";
  specificDate?: string;
  budgetType: "fixed" | "hourly";
  budgetAmount: number;
  budgetMin?: number;
  budgetMax?: number;
  status: "open" | "awaiting-accept" | "in-progress" | "delivered" | "completed" | "cancelled" | "closed";
  postedAt: string;
  quotes: JobQuote[];
  clientId: string;
  /** Client display name (for About the Client card) */
  clientName?: string;
  /** Client avatar URL (for About the Client card) */
  clientAvatar?: string;
  /** Client account creation date (Member Since) */
  clientMemberSince?: string;
  /** Client country (for display) */
  clientCountry?: string;
  /** Client city/town (for display) */
  clientCity?: string;
  /** Number of reviews the client has left */
  clientReviewCount?: number;
  /** Average rating of reviews the client has left */
  clientRatingAverage?: number;
  milestones?: Milestone[];
  awardedProfessionalId?: string;
  /** When the client last awarded a pro (awaiting pro accept); ISO string */
  awardPendingAt?: string;
  /** ISO deadline for pro to accept (from server when policy hours > 0) */
  awardAcceptDeadlineAt?: string;
  /** When an open job auto-closes to new quotes; ISO string */
  closesAt?: string;
  /** Pro-submitted plan after award without funded milestones; client accepts/rejects like quote suggestions */
  requestedMilestonePlan?: {
    id: string;
    description: string;
    amount: number;
    status: "pending" | "accepted" | "rejected";
  }[];
  /** Attachments from post-job (name, url, mimeType, size) */
  attachments?: { name: string; url: string; mimeType?: string; size?: number }[];
  /** Pro delivery per milestone; client can approve or request revision */
  milestoneDeliveries?: MilestoneDelivery[];
}

interface JobsContextType {
  jobs: Job[];
  loading: boolean;
  refreshJobs: () => Promise<void>;
  disputes: Dispute[];
  addJob: (job: Omit<Job, "id" | "postedAt" | "quotes"> & { sectorId?: string; sectorSlug?: string; categorySlugs?: string[] }) => Promise<Job>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  getJobById: (id: string) => Job | undefined;
  fetchJobById: (id: string) => Promise<Job | null>;
  getUserJobs: (userId: string) => Job[];
  addQuoteToJob: (
    jobId: string,
    quote: Omit<JobQuote, "id" | "submittedAt" | "status" | "suggestedMilestones"> & {
      suggestedMilestones?: { description: string; amount: number }[];
    }
  ) => Promise<void>;
  updateQuoteStatus: (jobId: string, quoteId: string, status: "accepted" | "rejected" | "awarded") => Promise<void>;
  withdrawQuote: (jobId: string, quoteId: string) => Promise<void>;
  updateQuoteByProfessional: (jobId: string, quoteId: string, data: { price: number; deliveryTime: string; message: string }) => Promise<void>;
  getAvailableJobs: () => Job[];
  getProfessionalQuotes: (professionalId: string) => { job: Job; quote: JobQuote }[];
  getProfessionalActiveJobs: (professionalId: string) => Job[];
  awardJobWithMilestone: (
    jobId: string,
    quoteId: string,
    professionalId: string,
    milestones: { name: string; amount: number }[],
    options?: { paymentSource?: 'wallet' | 'card'; paymentMethodId?: string }
  ) => Promise<void>;
  awardJobWithoutMilestone: (jobId: string, quoteId: string, professionalId: string) => void;
  acceptAward: (jobId: string) => Promise<void>;
  rejectAward: (jobId: string) => Promise<void>;
  updateMilestoneStatus: (jobId: string, milestoneId: string, status: Milestone["status"]) => void | Promise<void>;
  addMilestone: (jobId: string, nameOrDescription: string, amount: number) => void | Promise<void>;
  deleteMilestone: (jobId: string, milestoneId: string) => void | Promise<void>;
  acceptMilestone: (jobId: string, milestoneId: string) => void | Promise<void>;
  requestMilestoneCancel: (jobId: string, milestoneId: string, reason?: string) => Promise<void>;
  respondToCancelRequest: (jobId: string, milestoneId: string, accept: boolean) => Promise<void>;
  requestMilestoneRelease: (jobId: string, milestoneId: string) => Promise<void>;
  respondToReleaseRequest: (jobId: string, milestoneId: string, accept: boolean) => Promise<void>;
  createDispute: (jobId: string, milestoneId: string, reason: string, evidence?: string) => Promise<string>;
  getDisputeById: (disputeId: string) => Dispute | undefined;
  addDisputeMessage: (disputeId: string, message: string) => void;
  makeDisputeOffer: (disputeId: string, amount: number) => void;
  deliverJobMilestone: (jobId: string, milestoneIndex: number, deliveryMessage: string, files?: File[]) => Promise<void>;
  approveMilestoneDelivery: (jobId: string, milestoneId: string) => Promise<void>;
  requestMilestoneRevision: (jobId: string, milestoneId: string, revisionMessage: string, files?: File[]) => Promise<void>;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export function JobsProvider({ children }: { children: ReactNode }) {
  const { userInfo } = useAccount();
  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const matchesProfessionalSector = (job: Job) => {
    // If professional sectors are not set, keep existing behavior (show all).
    // This avoids empty lists due to missing profile data.
    const proSectorsRaw: unknown[] = Array.isArray(userInfo?.sectors)
      ? (userInfo?.sectors as unknown[])
      : userInfo?.sector
        ? [userInfo?.sector]
        : [];

    if (!proSectorsRaw.length) return true;

    const proSectors = new Set(
      proSectorsRaw
        .filter((s) => s != null)
        .map((s) => String(s).toLowerCase())
    );

    const jobSectorId = job.sectorId ? String(job.sectorId).toLowerCase() : "";
    const jobSector = job.sector ? String(job.sector).toLowerCase() : "";

    // Exact match first
    if (jobSectorId && proSectors.has(jobSectorId)) return true;
    if (jobSector && proSectors.has(jobSector)) return true;

    // Fallback: substring match (sector id/slug vs display name mismatch)
    for (const pro of proSectors) {
      if (!pro) continue;
      if (jobSectorId && (jobSectorId.includes(pro) || pro.includes(jobSectorId))) return true;
      if (jobSector && (jobSector.includes(pro) || pro.includes(jobSector))) return true;
    }

    return false;
  };

  // Cache last known jobs to survive hard refresh timing issues.
  // Note: use userId only because role can be temporarily undefined right after refresh.
  const jobsCacheKey = userInfo?.id ? `jobsCache:${userInfo.id}` : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!jobsCacheKey) return;
    try {
      const raw = localStorage.getItem(jobsCacheKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setJobs(parsed as Job[]);
      }
    } catch {
      // ignore cache errors
    }
  }, [jobsCacheKey]);

  const refreshJobs = useCallback(async () => {
    if (!userInfo?.id) return;
    const role = userInfo?.role;
    // If auth context is not ready yet, don't guess role.
    if (!role) return;
    if (role !== "client" && role !== "professional") return;

    setLoading(true);
    try {
      const res = await fetch(resolveApiUrl('/api/jobs'), { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch jobs');
      }
      const data = await res.json();
      // Be tolerant to API response shapes:
      // - Job[] directly
      // - { jobs: Job[] }
      let nextJobs: Job[] | null = null;
      if (Array.isArray(data)) {
        nextJobs = data as Job[];
      } else if (data && Array.isArray((data as any).jobs)) {
        nextJobs = (data as any).jobs as Job[];
      }

      if (nextJobs) {
        setJobs(nextJobs);
        // Cache successful fetch results for resiliency.
        try {
          if (jobsCacheKey) localStorage.setItem(jobsCacheKey, JSON.stringify(nextJobs));
        } catch {
          // ignore cache write errors
        }
      }
    } catch (e) {
      console.error('Jobs fetch error:', e);
      // Keep current jobs on transient failures (prevents "cards disappear").
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id, userInfo?.role, jobsCacheKey]);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  const addJob = async (
    jobData: Omit<Job, "id" | "postedAt" | "quotes"> & { sectorId?: string; sectorSlug?: string; categorySlugs?: string[] }
  ): Promise<Job> => {
    const res = await fetch(resolveApiUrl('/api/jobs'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: jobData.title,
        description: jobData.description,
        sectorId: jobData.sectorId,
        sectorSlug: jobData.sectorSlug,
        sectorName: jobData.sector,
        categorySlugs: jobData.categorySlugs || [],
        categoryLabels: jobData.categories || [],
        attachments: (jobData as any).attachments || [],
        postcode: jobData.postcode,
        address: jobData.address || '',
        city: (jobData as any).city || '',
        state: (jobData as any).state || '',
        location:
          jobData.location != null && jobData.location !== ''
            ? jobData.location
            : jobData.postcode,
        timing: jobData.timing || 'flexible',
        specificDate:
          jobData.specificDate != null && String(jobData.specificDate).trim() !== ""
            ? String(jobData.specificDate).trim()
            : null,
        budgetType: jobData.budgetType || 'fixed',
        budgetAmount: jobData.budgetAmount ?? 0,
        budgetMin: jobData.budgetMin,
        budgetMax: jobData.budgetMax,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create job');
    }
    const job = await res.json();
    setJobs((prev) => [job, ...prev]);
    return job;
  };

  const updateJob = async (id: string, updates: Partial<Job>): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update job');
    }
    const updated = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
  };

  const deleteJob = async (id: string): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${id}`), {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete job');
    }
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const getJobById = (idOrSlug: string): Job | undefined =>
    jobs.find((j) => j.id === idOrSlug || j.slug === idOrSlug);

  const fetchJobById = useCallback(async (idOrSlug: string): Promise<Job | null> => {
    try {
      const res = await fetch(resolveApiUrl(`/api/jobs/${idOrSlug}`), { credentials: 'include' });
      if (!res.ok) return null;
      const job = await res.json();
      setJobs((prev) => {
        const idx = prev.findIndex((j) => j.id === job.id || j.slug === idOrSlug || j.id === idOrSlug);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = job;
          return next;
        }
        return [job, ...prev];
      });
      return job;
    } catch {
      return null;
    }
  }, []);

  // Real-time job updates via Socket.io: refetch job when server pushes job:updated (no polling)
  useEffect(() => {
    if (!userInfo?.id) return;
    const socket = getSocket() || connectSocket(userInfo.id);
    const onJobUpdated = (data: { jobId: string }) => {
      if (data?.jobId) fetchJobById(data.jobId);
    };
    socket.on("job:updated", onJobUpdated);
    return () => {
      socket.off("job:updated", onJobUpdated);
    };
  }, [userInfo?.id, fetchJobById]);

  const getUserJobs = (userId: string): Job[] =>
    jobs.filter((j) => j.clientId === userId);

  const addQuoteToJob = async (
    jobId: string,
    quoteData: Omit<JobQuote, "id" | "submittedAt" | "status" | "suggestedMilestones"> & {
      suggestedMilestones?: { description: string; amount: number }[];
    }
  ): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/quotes`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        price: quoteData.price,
        deliveryTime: quoteData.deliveryTime,
        message: quoteData.message || '',
        suggestedMilestones: (quoteData.suggestedMilestones || [])
          .map((m) => ({
            description: (m.description || '').trim(),
            amount: typeof m.amount === 'string' ? Number(m.amount) : m.amount,
          }))
          .filter((m) => m.description && !isNaN(Number(m.amount)) && Number(m.amount) > 0),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit quote');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const updateQuoteStatus = async (
    jobId: string,
    quoteId: string,
    status: "accepted" | "rejected" | "awarded"
  ): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/quotes/${quoteId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update quote');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const withdrawQuote = async (jobId: string, quoteId: string): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/quotes/${quoteId}`), {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to withdraw quote');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const updateQuoteByProfessional = async (
    jobId: string,
    quoteId: string,
    data: { price: number; deliveryTime: string; message: string }
  ): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/quotes/${quoteId}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        price: data.price,
        deliveryTime: data.deliveryTime,
        message: data.message || '',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update quote');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const getAvailableJobs = (): Job[] =>
    userInfo?.role === 'professional'
      ? jobs.filter((job) => job.status === 'open' && matchesProfessionalSector(job))
      : [];

  const getProfessionalQuotes = (professionalId: string): { job: Job; quote: JobQuote }[] => {
    const result: { job: Job; quote: JobQuote }[] = [];
    jobs.forEach((job) => {
      if (!matchesProfessionalSector(job)) return;
      (job.quotes || []).forEach((quote) => {
        // Exclude any jobs that have been awarded to this professional;
        // awarded jobs should appear only in Active Jobs, not in My Quotes.
        if (
          quote.professionalId === professionalId &&
          job.awardedProfessionalId !== professionalId &&
          quote.status !== "awarded"
        ) {
          result.push({ job, quote });
        }
      });
    });
    return result;
  };

  const getProfessionalActiveJobs = (professionalId: string): Job[] =>
    jobs.filter((job) => {
      if (!matchesProfessionalSector(job)) return false;
      if (job.status === "awaiting-accept") {
        return (
          job.awardedProfessionalId === professionalId ||
          (job.quotes || []).some((q) => q.professionalId === professionalId)
        );
      }
      if (job.status === "completed") {
        return (
          job.awardedProfessionalId === professionalId ||
          (job.quotes || []).some((q) => q.professionalId === professionalId) ||
          (job.milestoneDeliveries || []).some((d) => d?.deliveredBy === professionalId)
        );
      }
      if (job.status === 'in-progress') {
        return (
          job.awardedProfessionalId === professionalId ||
          (job.quotes || []).some(
            (q) =>
              q.professionalId === professionalId &&
              (q.status === "accepted" || q.status === "awarded")
          ) || (job.quotes || []).some((q) => q.professionalId === professionalId)
        );
      }
      if (job.status === 'delivered') {
        // delivered means the client has approved deliveries;
        // ensure it shows up for the awarded professional even if the quote status
        // hasn't been updated to `accepted/awarded`.
        const pid = String(professionalId);
        const toIdString = (v: unknown) => (v == null ? "" : String(v));
        const getAwardedProId = (j: any) =>
          j?.awardedProfessionalId ?? j?.awardedProfessional?.id ?? j?.awardedProfessional?._id;
        const getQuoteProId = (q: any) =>
          q?.professionalId ?? q?.professional?.id ?? q?.professional?._id;
        const getDeliveredById = (d: any) =>
          d?.deliveredBy ?? d?.deliveredById ?? d?.deliveredBy?.id ?? d?.deliveredBy?._id;
        const getApprovedById = (d: any) =>
          d?.approvedBy ?? d?.approvedById ?? d?.approvedBy?.id ?? d?.approvedBy?._id;

        return (
          (job.milestoneDeliveries || []).some((d) => {
            const deliveredBy = toIdString(getDeliveredById(d));
            const approvedBy = toIdString(getApprovedById(d));
            return deliveredBy === pid || approvedBy === pid;
          }) ||
          toIdString(getAwardedProId(job as any)) === pid ||
          // If this job is delivered, the awarded pro should have a quote record.
          // Some backends update job.status before quote.status, so don't rely only on quote status.
          (job.quotes || []).some((q) => toIdString(getQuoteProId(q)) === pid)
        );
      }
      return false;
    });

  const normalizeAvatar = (value?: string) =>
    value && !/images\.unsplash\.com/i.test(value) ? value : undefined;

  const awardJobWithMilestone = async (
    jobId: string,
    quoteId: string,
    professionalId: string,
    milestones: { name: string; amount: number }[],
    options?: { paymentSource?: 'wallet' | 'card'; paymentMethodId?: string }
  ) => {
    const paymentSource = options?.paymentSource === 'card' ? 'card' : 'wallet';
    const body: Record<string, unknown> = {
      status: 'awarded',
      milestones: milestones.map((m) => ({
        name: m.name || 'Milestone',
        description: m.name || 'Milestone',
        amount: m.amount,
      })),
      paymentSource,
    };
    if (paymentSource === 'card' && options?.paymentMethodId) {
      body.paymentMethodId = options.paymentMethodId;
    }
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/quotes/${quoteId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.error || 'Failed to award job') as Error & { code?: string; required?: number; current?: number };
      if (err.code) e.code = err.code;
      if (err.required != null) e.required = err.required;
      if (err.current != null) e.current = err.current;
      throw e;
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const awardJobWithoutMilestone = async (
    jobId: string,
    quoteId: string,
    professionalId: string
  ) => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/quotes/${quoteId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: 'awarded' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to award job');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const acceptAward = async (jobId: string): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/accept-award`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to accept award');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const rejectAward = async (jobId: string): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/reject-award`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reject award');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const updateMilestoneStatus = async (
    jobId: string,
    milestoneId: string,
    status: Milestone["status"]
  ) => {
    if (status === 'released') {
      const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/milestones/${milestoneId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'released' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to release milestone');
      }
      const job = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
      return;
    }
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              milestones: job.milestones?.map((milestone) =>
                milestone.id === milestoneId
                  ? {
                      ...milestone,
                      status,
                      releasedAt: status === "released" ? new Date().toISOString() : milestone.releasedAt,
                    }
                  : milestone
              ),
            }
          : job
      )
    );
  };

  const addMilestone = async (jobId: string, nameOrDescription: string, amount: number) => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/milestones`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: nameOrDescription?.trim() || 'Milestone',
        description: nameOrDescription?.trim() || 'Milestone',
      amount,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const e = new Error(err.error || 'Failed to add milestone') as Error & { code?: string; required?: number; current?: number };
      if (err.code) e.code = err.code;
      if (err.required != null) e.required = err.required;
      if (err.current != null) e.current = err.current;
      throw e;
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const deleteMilestone = async (jobId: string, milestoneId: string) => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/milestones/${milestoneId}`), {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete milestone');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const acceptMilestone = async (jobId: string, milestoneId: string) => {
    await acceptAward(jobId);
  };

  const requestMilestoneCancel = async (jobId: string, milestoneId: string, reason?: string): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/milestones/${milestoneId}/request-cancel`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason: reason || '' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to request cancel');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const respondToCancelRequest = async (jobId: string, milestoneId: string, accept: boolean): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/milestones/${milestoneId}/respond-cancel`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ accept }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to respond to cancel request');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const requestMilestoneRelease = async (jobId: string, milestoneId: string): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/milestones/${milestoneId}/request-release`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to request release');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const respondToReleaseRequest = async (jobId: string, milestoneId: string, accept: boolean): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/milestones/${milestoneId}/respond-release`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ accept }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to respond to release request');
    }
    const job = await res.json();
    setJobs((prev) => prev.map((j) => (j.id === jobId ? job : j)));
  };

  const createDispute = async (jobId: string, milestoneId: string, reason: string, evidence?: string): Promise<string> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/disputes`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ milestoneId, reason: reason.trim(), evidence: evidence?.trim() || undefined }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create dispute');
    }
    const data = await res.json();
    const disputeId = data.dispute?.id || data.disputeId || data.id;
    if (data.job) {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? data.job : j)));
    }
    if (disputeId && data.dispute) {
      setDisputes((prev) => [...prev, data.dispute]);
    }
    return disputeId || '';
  };

  const getDisputeById = (disputeId: string): Dispute | undefined => {
    return disputes.find((d) => d.id === disputeId);
  };

  const addDisputeMessage = (disputeId: string, message: string) => {
    const currentUser = localStorage.getItem("currentUserId") || "client-1";
    const currentUserName = localStorage.getItem("currentUserName") || "David James";

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              messages: [
                ...d.messages,
                {
                  id: `msg-${Date.now()}`,
                  userId: currentUser,
                  userName: currentUserName,
                  message,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : d
      )
    );
  };

  const makeDisputeOffer = (disputeId: string, amount: number) => {
    const currentUser = localStorage.getItem("currentUserId") || "client-1";
    const dispute = disputes.find((d) => d.id === disputeId);
    if (!dispute) return;

    const isClaimant = dispute.claimantId === currentUser;

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === disputeId
          ? {
              ...d,
              ...(isClaimant
                ? {
                    claimantOffer: {
                      userId: currentUser,
                      amount,
                      timestamp: new Date().toISOString(),
                    },
                  }
                : {
                    respondentOffer: {
                      userId: currentUser,
                      amount,
                      timestamp: new Date().toISOString(),
                    },
                  }),
            }
          : d
      )
    );
  };

  const deliverJobMilestone = async (
    jobId: string,
    milestoneIndex: number,
    deliveryMessage: string,
    files?: File[]
  ): Promise<void> => {
    const form = new FormData();
    form.append('milestoneIndex', String(milestoneIndex));
    form.append('deliveryMessage', deliveryMessage);
    if (files?.length) {
      files.forEach((f) => form.append('files', f));
    }
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/deliver-milestone`), {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to deliver milestone');
    }
    const data = await res.json();
    if (data.job) {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? data.job : j)));
    }
  };

  const approveMilestoneDelivery = async (jobId: string, milestoneId: string): Promise<void> => {
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/milestones/${milestoneId}/delivery/approve`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to approve delivery');
    }
    const data = await res.json();
    if (data.job) {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? data.job : j)));
    }
  };

  const requestMilestoneRevision = async (
    jobId: string,
    milestoneId: string,
    revisionMessage: string,
    files?: File[]
  ): Promise<void> => {
    const form = new FormData();
    form.append('revisionMessage', revisionMessage);
    if (files?.length) {
      files.forEach((f) => form.append('files', f));
    }
    const res = await fetch(resolveApiUrl(`/api/jobs/${jobId}/milestones/${milestoneId}/delivery/request-revision`), {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to request revision');
    }
    const data = await res.json();
    if (data.job) {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? data.job : j)));
    }
  };

  return (
    <JobsContext.Provider
      value={{
        jobs,
        loading,
        refreshJobs,
        disputes,
        addJob,
        updateJob,
        deleteJob,
        getJobById,
        fetchJobById,
        getUserJobs,
        addQuoteToJob,
        updateQuoteStatus,
        withdrawQuote,
        updateQuoteByProfessional,
        getAvailableJobs,
        getProfessionalQuotes,
        getProfessionalActiveJobs,
        awardJobWithMilestone,
        awardJobWithoutMilestone,
        acceptAward,
        rejectAward,
        updateMilestoneStatus,
        requestMilestoneRelease,
        addMilestone,
        deleteMilestone,
        acceptMilestone,
        requestMilestoneCancel,
        respondToCancelRequest,
        respondToReleaseRequest,
        createDispute,
        getDisputeById,
        addDisputeMessage,
        makeDisputeOffer,
        deliverJobMilestone,
        approveMilestoneDelivery,
        requestMilestoneRevision,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error("useJobs must be used within JobsProvider");
  }
  return context;
}