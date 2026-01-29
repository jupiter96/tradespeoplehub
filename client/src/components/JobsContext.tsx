import { createContext, useContext, useState, ReactNode } from "react";

export interface JobQuote {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalAvatar?: string;
  professionalRating: number;
  professionalReviews: number;
  price: number;
  deliveryTime: string;
  message: string;
  submittedAt: string;
  status: "pending" | "accepted" | "rejected" | "awarded";
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
  description: string;
  amount: number;
  status: "awaiting-accept" | "in-progress" | "released" | "disputed";
  createdAt: string;
  releasedAt?: string;
  disputeId?: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  sector: string;
  categories: string[];
  postcode: string;
  location: string;
  timing: "urgent" | "flexible" | "specific";
  specificDate?: string;
  budgetType: "fixed" | "hourly";
  budgetAmount: number;
  status: "active" | "awaiting-accept" | "in-progress" | "completed" | "cancelled";
  postedAt: string;
  quotes: JobQuote[];
  clientId: string;
  milestones?: Milestone[];
  awardedProfessionalId?: string;
}

interface JobsContextType {
  jobs: Job[];
  disputes: Dispute[];
  addJob: (job: Omit<Job, "id" | "postedAt" | "quotes">) => Job;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  getJobById: (id: string) => Job | undefined;
  getUserJobs: (userId: string) => Job[];
  addQuoteToJob: (jobId: string, quote: Omit<JobQuote, "id" | "submittedAt" | "status">) => void;
  updateQuoteStatus: (jobId: string, quoteId: string, status: "accepted" | "rejected" | "awarded") => void;
  getAvailableJobs: () => Job[]; // For professionals to see jobs they can quote on
  getProfessionalQuotes: (professionalId: string) => { job: Job; quote: JobQuote }[]; // Get all quotes submitted by a professional
  getProfessionalActiveJobs: (professionalId: string) => Job[]; // Get jobs where professional's quote was accepted
  awardJobWithMilestone: (jobId: string, quoteId: string, professionalId: string, milestoneAmount: number) => void;
  awardJobWithoutMilestone: (jobId: string, quoteId: string, professionalId: string) => void;
  updateMilestoneStatus: (jobId: string, milestoneId: string, status: Milestone["status"]) => void;
  requestMilestoneRelease: (jobId: string, milestoneId: string) => void;
  addMilestone: (jobId: string, description: string, amount: number) => void;
  deleteMilestone: (jobId: string, milestoneId: string) => void;
  acceptMilestone: (jobId: string, milestoneId: string) => void;
  createDispute: (jobId: string, milestoneId: string, reason: string, evidence?: string) => string;
  getDisputeById: (disputeId: string) => Dispute | undefined;
  addDisputeMessage: (disputeId: string, message: string) => void;
  makeDisputeOffer: (disputeId: string, amount: number) => void;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export function JobsProvider({ children }: { children: ReactNode }) {
  const normalizeAvatar = (value?: string) =>
    value && !/images\.unsplash\.com/i.test(value) ? value : undefined;

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [jobs, setJobs] = useState<Job[]>(
    [
    // 1. ACTIVE Job - With pending quotes (client-1)
    {
      id: "job-1",
      title: "Kitchen Plumbing Repair Needed",
      description: "Need a plumber to fix a leaking kitchen sink and check the water pressure. The leak has been getting worse over the past week.",
      sector: "Home & Garden",
      categories: ["Plumbing"],
      postcode: "SW1A 1AA",
      location: "Westminster, London",
      timing: "urgent",
      budgetType: "fixed",
      budgetAmount: 150,
      status: "active",
      postedAt: "2024-11-10T10:30:00Z",
      quotes: [
        {
          id: "quote-1",
          professionalId: "pro-1",
          professionalName: "John Smith Plumbing",
          professionalAvatar: undefined,
          professionalRating: 4.8,
          professionalReviews: 127,
          price: 135,
          deliveryTime: "Same day",
          message: "I can come today afternoon to fix your kitchen sink. I have 10 years of experience and all necessary tools. Price includes parts and labor.",
          submittedAt: "2024-11-10T11:00:00Z",
          status: "pending",
        },
        {
          id: "quote-2",
          professionalId: "pro-2",
          professionalName: "FastFix Plumbing Ltd",
          professionalAvatar: undefined,
          professionalRating: 4.9,
          professionalReviews: 234,
          price: 145,
          deliveryTime: "Within 2 hours",
          message: "Emergency service available. We can be there within 2 hours. Fully licensed and insured with 15 years experience.",
          submittedAt: "2024-11-10T11:30:00Z",
          status: "pending",
        },
        {
          id: "quote-3-rejected",
          professionalId: "pro-3",
          professionalName: "Budget Plumbers",
          professionalAvatar: undefined,
          professionalRating: 4.2,
          professionalReviews: 45,
          price: 180,
          deliveryTime: "Tomorrow",
          message: "Can do it tomorrow morning.",
          submittedAt: "2024-11-10T12:00:00Z",
          status: "rejected",
        },
      ],
      clientId: "client-1",
    },

    // 2. ACTIVE Job - No quotes yet (client-1)
    {
      id: "job-2",
      title: "Living Room Painting",
      description: "Looking for a professional painter to paint my living room. Approximately 20m². Walls need preparation and two coats of paint.",
      sector: "Home & Garden",
      categories: ["Painting & Decorating"],
      postcode: "E1 6AN",
      location: "Tower Hamlets, London",
      timing: "flexible",
      budgetType: "fixed",
      budgetAmount: 400,
      status: "active",
      postedAt: "2024-11-09T14:20:00Z",
      quotes: [],
      clientId: "client-1",
    },

    // 3. AWAITING-ACCEPT Job - With awaiting-accept milestone (client-1)
    {
      id: "job-3",
      title: "Office Deep Cleaning",
      description: "Need professional deep cleaning service for a 100m² office space. Including carpets, windows, and all surfaces.",
      sector: "Cleaning & Maintenance",
      categories: ["Cleaning"],
      postcode: "EC2A 4BX",
      location: "Shoreditch, London",
      timing: "specific",
      specificDate: "2024-11-15",
      budgetType: "fixed",
      budgetAmount: 350,
      status: "awaiting-accept",
      postedAt: "2024-11-08T09:00:00Z",
      quotes: [
        {
          id: "quote-3-1",
          professionalId: "pro-4",
          professionalName: "CleanPro Services",
          professionalAvatar: undefined,
          professionalRating: 4.7,
          professionalReviews: 89,
          price: 320,
          deliveryTime: "1 day",
          message: "We provide professional deep cleaning with eco-friendly products.",
          submittedAt: "2024-11-08T10:00:00Z",
          status: "awarded",
        },
      ],
      clientId: "client-1",
      awardedProfessionalId: "pro-4",
      milestones: [
        {
          id: "milestone-awaiting-1",
          description: "Full payment for office cleaning",
          amount: 320,
          status: "awaiting-accept",
          createdAt: "2024-11-08T11:00:00Z",
        },
      ],
    },

    // 4. IN-PROGRESS Job - With pending, in-progress, and released milestones (client-1)
    {
      id: "job-4",
      title: "Bathroom Renovation",
      description: "Complete bathroom renovation including tiling, plumbing, and electrical work. Need experienced professional.",
      sector: "Home & Garden",
      categories: ["Building & Construction"],
      postcode: "W1A 1AA",
      location: "Westminster, London",
      timing: "specific",
      specificDate: "2024-11-20",
      budgetType: "fixed",
      budgetAmount: 3500,
      status: "in-progress",
      postedAt: "2024-11-01T09:00:00Z",
      quotes: [
        {
          id: "quote-4-1",
          professionalId: "pro-1",
          professionalName: "Expert Builders Ltd",
          professionalAvatar: undefined,
          professionalRating: 4.9,
          professionalReviews: 145,
          price: 3200,
          deliveryTime: "2 weeks",
          message: "We specialize in bathroom renovations with 20+ years experience. We'll handle everything from start to finish.",
          submittedAt: "2024-11-01T10:00:00Z",
          status: "accepted",
        },
      ],
      clientId: "client-1",
      awardedProfessionalId: "pro-1",
      milestones: [
        {
          id: "milestone-4-1",
          description: "Initial deposit - Materials and preparation",
          amount: 1000,
          status: "released",
          createdAt: "2024-11-02T10:00:00Z",
          releasedAt: "2024-11-03T14:00:00Z",
        },
        {
          id: "milestone-4-2",
          description: "Mid-project payment - Plumbing and electrical complete",
          amount: 1200,
          status: "in-progress",
          createdAt: "2024-11-02T10:00:00Z",
        },
        {
          id: "milestone-4-3",
          description: "Final payment - Tiling and finishing complete",
          amount: 1000,
          status: "in-progress",
          createdAt: "2024-11-02T10:00:00Z",
        },
      ],
    },

    // 5. IN-PROGRESS Job - With disputed milestone (client-1)
    {
      id: "job-5",
      title: "Website Development",
      description: "Need a full-stack developer to build an e-commerce website with payment integration.",
      sector: "Technology & IT",
      categories: ["Web Development"],
      postcode: "SW7 2AZ",
      location: "South Kensington, London",
      timing: "flexible",
      budgetType: "fixed",
      budgetAmount: 5000,
      status: "in-progress",
      postedAt: "2024-10-15T09:00:00Z",
      quotes: [
        {
          id: "quote-5-1",
          professionalId: "pro-1",
          professionalName: "TechWizards Ltd",
          professionalAvatar: undefined,
          professionalRating: 4.6,
          professionalReviews: 78,
          price: 4800,
          deliveryTime: "4 weeks",
          message: "We'll build a modern, responsive e-commerce site with full payment integration.",
          submittedAt: "2024-10-15T11:00:00Z",
          status: "accepted",
        },
      ],
      clientId: "client-1",
      awardedProfessionalId: "pro-1",
      milestones: [
        {
          id: "milestone-5-1",
          description: "Design and mockup completion",
          amount: 1600,
          status: "released",
          createdAt: "2024-10-16T10:00:00Z",
          releasedAt: "2024-10-25T14:00:00Z",
        },
        {
          id: "milestone-5-2",
          description: "Backend development and API integration",
          amount: 1600,
          status: "disputed",
          createdAt: "2024-10-16T10:00:00Z",
        },
        {
          id: "milestone-5-3",
          description: "Frontend development and testing",
          amount: 1600,
          status: "in-progress",
          createdAt: "2024-10-16T10:00:00Z",
        },
      ],
    },

    // 6. COMPLETED Job - All milestones released (client-1)
    {
      id: "job-6",
      title: "Garden Landscaping",
      description: "Need a professional to redesign and landscape my garden. About 50m² area with lawn, flower beds, and paving.",
      sector: "Home & Garden",
      categories: ["Gardening & Landscaping"],
      postcode: "SW3 5TN",
      location: "Chelsea, London",
      timing: "flexible",
      budgetType: "fixed",
      budgetAmount: 2500,
      status: "completed",
      postedAt: "2024-10-01T13:15:00Z",
      quotes: [
        {
          id: "quote-6-1",
          professionalId: "pro-6",
          professionalName: "Green Thumb Landscaping",
          professionalAvatar: undefined,
          professionalRating: 4.9,
          professionalReviews: 156,
          price: 2300,
          deliveryTime: "1 week",
          message: "We'll transform your garden into a beautiful outdoor space.",
          submittedAt: "2024-10-01T14:00:00Z",
          status: "awarded",
        },
      ],
      clientId: "client-1",
      awardedProfessionalId: "pro-6",
      milestones: [
        {
          id: "milestone-6-1",
          description: "Initial payment - Design and materials",
          amount: 1150,
          status: "released",
          createdAt: "2024-10-02T10:00:00Z",
          releasedAt: "2024-10-02T15:00:00Z",
        },
        {
          id: "milestone-6-2",
          description: "Final payment - Installation complete",
          amount: 1150,
          status: "released",
          createdAt: "2024-10-02T10:00:00Z",
          releasedAt: "2024-10-09T16:00:00Z",
        },
      ],
    },

    // 7. CANCELLED Job (client-1)
    {
      id: "job-7",
      title: "Roof Repair",
      description: "Need to fix some damaged tiles on the roof and check for leaks.",
      sector: "Home & Garden",
      categories: ["Roofing"],
      postcode: "N1 9AG",
      location: "Islington, London",
      timing: "urgent",
      budgetType: "fixed",
      budgetAmount: 800,
      status: "cancelled",
      postedAt: "2024-10-20T09:00:00Z",
      quotes: [
        {
          id: "quote-7-1",
          professionalId: "pro-7",
          professionalName: "TopRoof Services",
          professionalAvatar: undefined,
          professionalRating: 4.7,
          professionalReviews: 92,
          price: 750,
          deliveryTime: "2 days",
          message: "We can inspect and repair your roof professionally.",
          submittedAt: "2024-10-20T10:00:00Z",
          status: "pending",
        },
      ],
      clientId: "client-1",
    },

    // 8. ACTIVE Job for different client (client-2)
    {
      id: "job-8",
      title: "Logo Design",
      description: "Need a creative logo design for my new startup. Looking for modern and minimalist style.",
      sector: "Creative & Design",
      categories: ["Graphic Design"],
      postcode: "SE1 9SG",
      location: "Southwark, London",
      timing: "flexible",
      budgetType: "fixed",
      budgetAmount: 500,
      status: "active",
      postedAt: "2024-11-11T10:00:00Z",
      quotes: [
        {
          id: "quote-8-1",
          professionalId: "pro-1",
          professionalName: "John Smith Plumbing",
          professionalAvatar: undefined,
          professionalRating: 4.8,
          professionalReviews: 127,
          price: 450,
          deliveryTime: "3 days",
          message: "I'll create 3 unique logo concepts for you to choose from.",
          submittedAt: "2024-11-11T11:00:00Z",
          status: "pending",
        },
      ],
      clientId: "client-2",
    },

    // 9. IN-PROGRESS Job - Car repair with milestone (client-2)
    {
      id: "job-9",
      title: "Car Repair Service",
      description: "Need brake pad replacement and general service for my car.",
      sector: "Automotive",
      categories: ["Car Repair"],
      postcode: "W2 1JH",
      location: "Paddington, London",
      timing: "urgent",
      budgetType: "fixed",
      budgetAmount: 250,
      status: "in-progress",
      postedAt: "2024-11-09T08:00:00Z",
      quotes: [
        {
          id: "quote-9-1",
          professionalId: "pro-1",
          professionalName: "Auto Expert Services",
          professionalAvatar: undefined,
          professionalRating: 4.8,
          professionalReviews: 127,
          price: 220,
          deliveryTime: "Same day",
          message: "Can service your car today. We use genuine parts.",
          submittedAt: "2024-11-09T09:00:00Z",
          status: "accepted",
        },
      ],
      clientId: "client-2",
      awardedProfessionalId: "pro-1",
      milestones: [
        {
          id: "milestone-9-1",
          description: "Brake pad replacement and car service",
          amount: 220,
          status: "in-progress",
          createdAt: "2024-11-09T10:00:00Z",
        },
      ],
    },

    // 10. IN-PROGRESS Job - Electrical work with milestones (client-3)
    {
      id: "job-10",
      title: "Electrical Rewiring",
      description: "Full house rewiring for a 3-bedroom property. Need Part P certified electrician.",
      sector: "Home & Garden",
      categories: ["Electrical"],
      postcode: "NW1 6XE",
      location: "Camden, London",
      timing: "specific",
      specificDate: "2024-11-18",
      budgetType: "fixed",
      budgetAmount: 2800,
      status: "in-progress",
      postedAt: "2024-11-05T09:30:00Z",
      quotes: [
        {
          id: "quote-10-1",
          professionalId: "pro-1",
          professionalName: "PowerWorks Electrical",
          professionalAvatar: undefined,
          professionalRating: 4.9,
          professionalReviews: 203,
          price: 2600,
          deliveryTime: "1 week",
          message: "Fully certified and insured electrician. We'll complete the full rewiring with all certifications provided.",
          submittedAt: "2024-11-05T10:15:00Z",
          status: "accepted",
        },
      ],
      clientId: "client-3",
      awardedProfessionalId: "pro-1",
      milestones: [
        {
          id: "milestone-10-1",
          description: "First fix - Cables and back boxes",
          amount: 1300,
          status: "released",
          createdAt: "2024-11-06T09:00:00Z",
          releasedAt: "2024-11-10T16:00:00Z",
        },
        {
          id: "milestone-10-2",
          description: "Second fix - Sockets, switches and testing",
          amount: 1300,
          status: "in-progress",
          createdAt: "2024-11-06T09:00:00Z",
        },
        {
          id: "milestone-10-3",
          description: "Additional electrical work - New sockets in garage",
          amount: 400,
          status: "in-progress",
          createdAt: "2024-11-12T14:00:00Z",
        },
      ],
    },

    // 11. IN-PROGRESS Job - Mobile app development (client-3)
    {
      id: "job-11",
      title: "Mobile App Development",
      description: "Need an iOS and Android app for my fitness business. App should include workout tracking, progress charts, and user profiles.",
      sector: "Technology & IT",
      categories: ["Mobile Development"],
      postcode: "SE10 9GB",
      location: "Greenwich, London",
      timing: "flexible",
      budgetType: "fixed",
      budgetAmount: 8000,
      status: "in-progress",
      postedAt: "2024-10-20T11:00:00Z",
      quotes: [
        {
          id: "quote-11-1",
          professionalId: "pro-1",
          professionalName: "MobileFirst Developers",
          professionalAvatar: undefined,
          professionalRating: 4.7,
          professionalReviews: 156,
          price: 7500,
          deliveryTime: "6 weeks",
          message: "We specialize in fitness apps with React Native. We'll deliver both iOS and Android versions with backend included.",
          submittedAt: "2024-10-20T12:30:00Z",
          status: "accepted",
        },
      ],
      clientId: "client-3",
      awardedProfessionalId: "pro-1",
      milestones: [
        {
          id: "milestone-11-1",
          description: "UI/UX Design and prototype",
          amount: 2500,
          status: "released",
          createdAt: "2024-10-21T10:00:00Z",
          releasedAt: "2024-10-30T15:00:00Z",
        },
        {
          id: "milestone-11-2",
          description: "Core features development",
          amount: 2500,
          status: "released",
          createdAt: "2024-10-21T10:00:00Z",
          releasedAt: "2024-11-08T14:00:00Z",
        },
        {
          id: "milestone-11-3",
          description: "Testing and deployment",
          amount: 2500,
          status: "in-progress",
          createdAt: "2024-10-21T10:00:00Z",
        },
      ],
    },

    // 12. IN-PROGRESS Job - Kitchen fitting (client-4)
    {
      id: "job-12",
      title: "Kitchen Installation",
      description: "Need experienced fitter to install new kitchen units, worktops, and appliances. All materials supplied.",
      sector: "Home & Garden",
      categories: ["Building & Construction"],
      postcode: "SW19 3TA",
      location: "Wimbledon, London",
      timing: "specific",
      specificDate: "2024-11-16",
      budgetType: "fixed",
      budgetAmount: 1800,
      status: "in-progress",
      postedAt: "2024-11-07T13:00:00Z",
      quotes: [
        {
          id: "quote-12-1",
          professionalId: "pro-1",
          professionalName: "Kitchen Pro Installers",
          professionalAvatar: undefined,
          professionalRating: 4.8,
          professionalReviews: 189,
          price: 1650,
          deliveryTime: "3 days",
          message: "Professional kitchen fitters with 15 years experience. We'll handle everything from removal to final installation.",
          submittedAt: "2024-11-07T14:20:00Z",
          status: "accepted",
        },
      ],
      clientId: "client-4",
      awardedProfessionalId: "pro-1",
      milestones: [
        {
          id: "milestone-12-1",
          description: "Remove old kitchen and preparation",
          amount: 550,
          status: "released",
          createdAt: "2024-11-08T09:00:00Z",
          releasedAt: "2024-11-08T17:00:00Z",
        },
        {
          id: "milestone-12-2",
          description: "Unit installation and worktop fitting",
          amount: 1100,
          status: "in-progress",
          createdAt: "2024-11-08T09:00:00Z",
        },
      ],
    },

    // 13. IN-PROGRESS Job - Pest control (client-4)
    {
      id: "job-13",
      title: "Pest Control Service",
      description: "Need professional pest control for mouse problem in loft. Looking for humane removal and prevention.",
      sector: "Cleaning & Maintenance",
      categories: ["Pest Control"],
      postcode: "HA1 2TN",
      location: "Harrow, London",
      timing: "urgent",
      budgetType: "fixed",
      budgetAmount: 180,
      status: "in-progress",
      postedAt: "2024-11-12T08:30:00Z",
      quotes: [
        {
          id: "quote-13-1",
          professionalId: "pro-1",
          professionalName: "SafeGuard Pest Control",
          professionalAvatar: undefined,
          professionalRating: 4.9,
          professionalReviews: 276,
          price: 165,
          deliveryTime: "Same day",
          message: "Emergency pest control available today. We use humane methods and provide 6-month guarantee.",
          submittedAt: "2024-11-12T09:15:00Z",
          status: "accepted",
        },
      ],
      clientId: "client-4",
      awardedProfessionalId: "pro-1",
      milestones: [
        {
          id: "milestone-13-1",
          description: "Full payment - Pest control and prevention",
          amount: 165,
          status: "in-progress",
          createdAt: "2024-11-12T10:00:00Z",
        },
      ],
    },
    ].map((job) => ({
      ...job,
      quotes: (job.quotes || []).map((q) => ({
        ...q,
        professionalAvatar: normalizeAvatar(q.professionalAvatar),
      })),
    }))
  );

  const addJob = (jobData: Omit<Job, "id" | "postedAt" | "quotes">) => {
    const newJob: Job = {
      ...jobData,
      id: `job-${Date.now()}`,
      postedAt: new Date().toISOString(),
      quotes: [],
    };
    setJobs((prev) => [newJob, ...prev]);
    return newJob;
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs((prev) =>
      prev.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );
  };

  const deleteJob = (id: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== id));
  };

  const getJobById = (id: string) => {
    return jobs.find((job) => job.id === id);
  };

  const getUserJobs = (userId: string) => {
    return jobs.filter((job) => job.clientId === userId);
  };

  const addQuoteToJob = (
    jobId: string,
    quoteData: Omit<JobQuote, "id" | "submittedAt" | "status">
  ) => {
    const newQuote: JobQuote = {
      ...quoteData,
      id: `quote-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, quotes: [...job.quotes, newQuote] }
          : job
      )
    );
  };

  const updateQuoteStatus = (
    jobId: string,
    quoteId: string,
    status: "accepted" | "rejected" | "awarded"
  ) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              quotes: job.quotes.map((quote) =>
                quote.id === quoteId ? { ...quote, status } : quote
              ),
              status: status === "accepted" ? "in-progress" : job.status,
            }
          : job
      )
    );
  };

  const getAvailableJobs = () => {
    return jobs.filter((job) => job.status === "active");
  };

  const getProfessionalQuotes = (professionalId: string) => {
    const result: { job: Job; quote: JobQuote }[] = [];
    jobs.forEach((job) => {
      job.quotes.forEach((quote) => {
        if (quote.professionalId === professionalId) {
          result.push({ job, quote });
        }
      });
    });
    return result;
  };

  const getProfessionalActiveJobs = (professionalId: string) => {
    return jobs.filter((job) => 
      job.status === "in-progress" && 
      job.quotes.some((quote) => 
        quote.professionalId === professionalId && quote.status === "accepted"
      )
    );
  };

  const awardJobWithMilestone = (
    jobId: string,
    quoteId: string,
    professionalId: string,
    milestoneAmount: number
  ) => {
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      description: "Milestone payment",
      amount: milestoneAmount,
      status: "awaiting-accept",
      createdAt: new Date().toISOString(),
    };

    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              quotes: job.quotes.map((quote) =>
                quote.id === quoteId ? { ...quote, status: "awarded" as const } : quote
              ),
              status: "awaiting-accept" as const,
              awardedProfessionalId: professionalId,
              milestones: [newMilestone],
            }
          : job
      )
    );
  };

  const awardJobWithoutMilestone = (
    jobId: string,
    quoteId: string,
    professionalId: string
  ) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              quotes: job.quotes.map((quote) =>
                quote.id === quoteId ? { ...quote, status: "awarded" as const } : quote
              ),
              awardedProfessionalId: professionalId,
            }
          : job
      )
    );
  };

  const updateMilestoneStatus = (
    jobId: string,
    milestoneId: string,
    status: Milestone["status"]
  ) => {
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

  const requestMilestoneRelease = (jobId: string, milestoneId: string) => {
    // Professional requests release - could trigger notification to client
    updateMilestoneStatus(jobId, milestoneId, "in-progress");
  };

  const addMilestone = (jobId: string, description: string, amount: number) => {
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      description,
      amount,
      status: "awaiting-accept",
      createdAt: new Date().toISOString(),
    };

    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              milestones: [...(job.milestones || []), newMilestone],
            }
          : job
      )
    );
  };

  const deleteMilestone = (jobId: string, milestoneId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              milestones: job.milestones?.filter((m) => m.id !== milestoneId) || [],
            }
          : job
      )
    );
  };

  const acceptMilestone = (jobId: string, milestoneId: string) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: "in-progress" as const,
              milestones: job.milestones?.map((milestone) =>
                milestone.id === milestoneId
                  ? { ...milestone, status: "in-progress" as const }
                  : milestone
              ),
            }
          : job
      )
    );
  };

  const createDispute = (jobId: string, milestoneId: string, reason: string, evidence?: string): string => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return "";

    const milestone = job.milestones?.find((m) => m.id === milestoneId);
    if (!milestone) return "";

    const disputeId = `dispute-${Date.now()}`;
    const currentUser = localStorage.getItem("currentUserId") || "client-1";
    const currentUserName = localStorage.getItem("currentUserName") || "David James";
    const isClient = job.clientId === currentUser;

    const newDispute: Dispute = {
      id: disputeId,
      jobId,
      milestoneId,
      claimantId: currentUser,
      claimantName: currentUserName,
      respondentId: isClient ? (job.awardedProfessionalId || "") : job.clientId,
      respondentName: isClient ? "MatJohn LTD" : "David James",
      amount: milestone.amount,
      reason,
      evidence,
      status: "open",
      messages: [
        {
          id: `msg-${Date.now()}`,
          userId: currentUser,
          userName: currentUserName,
          message: reason,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      teamInterventionTime: new Date(Date.now() + 53 * 60 * 1000).toISOString(), // 53 minutes from now
    };

    setDisputes((prev) => [...prev, newDispute]);

    // Update milestone status and link dispute
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              milestones: j.milestones?.map((m) =>
                m.id === milestoneId
                  ? { ...m, status: "disputed" as const, disputeId }
                  : m
              ),
            }
          : j
      )
    );

    return disputeId;
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

  return (
    <JobsContext.Provider
      value={{
        jobs,
        disputes,
        addJob,
        updateJob,
        deleteJob,
        getJobById,
        getUserJobs,
        addQuoteToJob,
        updateQuoteStatus,
        getAvailableJobs,
        getProfessionalQuotes,
        getProfessionalActiveJobs,
        awardJobWithMilestone,
        awardJobWithoutMilestone,
        updateMilestoneStatus,
        requestMilestoneRelease,
        addMilestone,
        deleteMilestone,
        acceptMilestone,
        createDispute,
        getDisputeById,
        addDisputeMessage,
        makeDisputeOffer,
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