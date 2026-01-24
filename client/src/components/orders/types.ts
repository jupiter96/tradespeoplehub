// Order-related type definitions

export interface OrderFile {
  url: string;
  fileName: string;
  fileType: 'image' | 'video' | 'document';
}

export interface OrderAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
}

export interface OrderBooking {
  date?: string;
  time?: string;
  timeSlot?: string;
}

export interface RevisionRequest {
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  reason?: string;
  additionalNotes?: string;
  files?: OrderFile[];
}

export interface DisputeInfo {
  status: string;
  reason?: string;
  requirements?: string;
  unmetRequirements?: string;
  offerAmount?: number;
  evidenceFiles?: OrderFile[];
  responseDeadline?: string;
  clientResponse?: string;
  professionalResponse?: string;
}

export interface AdditionalInformation {
  message?: string;
  files?: OrderFile[];
  submittedAt?: string;
}

export interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity?: number;
  image?: string;
  video?: string;
  videoThumbnail?: string;
}

export interface Order {
  id: string;
  service: string;
  category?: string;
  professional: string;
  professionalId?: string;
  professionalName?: string;
  professionalAvatar?: string;
  clientId?: string;
  clientName?: string;
  clientAvatar?: string;
  status: 'In Progress' | 'Completed' | 'Cancelled' | 'Cancellation Pending' | 'disputed' | 'delivered';
  deliveryStatus?: 'pending' | 'active' | 'delivered' | 'completed' | 'cancelled';
  date: string;
  amount: string;
  amountValue: number;
  subtotal?: number;
  serviceFee?: number;
  discount?: number;
  description?: string;
  expectedDelivery?: string;
  scheduledDate?: string;
  deliveredDate?: string;
  deliveryMessage?: string;
  deliveryFiles?: OrderFile[];
  address?: OrderAddress;
  booking?: OrderBooking;
  revisionRequest?: RevisionRequest;
  disputeInfo?: DisputeInfo;
  additionalInformation?: AdditionalInformation;
  rating?: number;
  review?: string;
  professionalReview?: { rating: number; comment?: string; reviewedAt?: string };
  hasReview?: boolean;
  items?: OrderItem[];
  metadata?: {
    professionalCompleteRequest?: {
      completionMessage?: string;
      completionFiles?: OrderFile[];
    };
    cancellationRequest?: {
      status: 'pending' | 'approved' | 'rejected';
      reason?: string;
      requestedBy?: string;
    };
  };
}

export interface ServiceThumbnail {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface TimelineEvent {
  id: string;
  at?: string;
  label: string;
  description?: string;
  message?: string;
  files?: OrderFile[];
  colorClass: string;
  icon: React.ReactNode;
}

