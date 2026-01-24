import React from "react";
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  PlayCircle,
  FileText,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Truck,
  Edit,
  XCircle,
  Check,
} from "lucide-react";
import { TimelineEvent, Order } from "./types";

export function buildProfessionalTimeline(order: Order): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const push = (event: Omit<TimelineEvent, "id">, id: string) => {
    events.push({ ...event, id });
  };

  // Order placed
  if (order.date) {
    push(
      {
        at: (order as any).createdAt || order.date,
        label: "Order Placed",
        description: `${order.client || "Client"} placed this order.`,
        colorClass: "bg-gray-800",
        icon: <ShoppingBag className="w-5 h-5 text-white" />,
      },
      "placed"
    );
  }

  // Order accepted by professional
  if ((order as any).acceptedByProfessional && (order as any).acceptedAt) {
    push(
      {
        at: (order as any).acceptedAt,
        label: "Order Accepted",
        description: "You accepted this order.",
        colorClass: "bg-green-600",
        icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      },
      "accepted"
    );
  }

  // Service delivery pending
  if (order.deliveryStatus === "pending") {
    push(
      {
        at: (order as any).scheduledDate || order.expectedDelivery,
        label: "Service Delivery Pending",
        description:
          "Client has completed payment and is awaiting your service delivery.",
        colorClass: "bg-orange-500",
        icon: <Clock className="w-5 h-5 text-white" />,
      },
      "pending-delivery"
    );
  }

  // Service in progress
  // Show when order is created and in progress
  // This should appear right after order is placed if status is "In Progress" and not completed/delivered/cancelled/disputed
  // Also show when revision request is pending (order status is "In Progress" after revision request)
  const isInProgress = order.status === "In Progress" && 
      order.status !== "disputed" &&
      order.deliveryStatus !== "delivered" &&
      order.deliveryStatus !== "completed" &&
      order.deliveryStatus !== "cancelled" &&
      order.deliveryStatus !== "dispute";
  
  // Check if there's any pending revision request
  const revisionRequests = order.revisionRequest 
    ? (Array.isArray(order.revisionRequest) ? order.revisionRequest : [order.revisionRequest])
    : [];
  const hasPendingRevision = revisionRequests.some(rr => rr && rr.status === 'pending');
  
  if (isInProgress || hasPendingRevision) {
    push(
      {
        at: order.expectedDelivery || (order as any).scheduledDate || (order as any).createdAt || order.date,
        label: "Service In Progress",
        description: hasPendingRevision
          ? "Client requested a revision. Please review and respond to the revision request."
          : "You are currently working on this service. Make sure to deliver on time.",
        colorClass: "bg-blue-500",
        icon: <PlayCircle className="w-5 h-5 text-white" />,
      },
      "in-progress"
    );
  }

  // Additional information received
  if (order.additionalInformation?.submittedAt) {
    push(
      {
        at: order.additionalInformation.submittedAt,
        label: "Additional Information Received",
        description: "Client submitted additional information.",
        message: order.additionalInformation.message,
        files: order.additionalInformation.files,
        colorClass: "bg-blue-500",
        icon: <FileText className="w-5 h-5 text-white" />,
      },
      "additional-info"
    );
  }

  // Extension request events
  const ext = (order as any).extensionRequest;
  if (ext?.requestedAt) {
    // Format new delivery date/time
    const newDeliveryFormatted = ext.newDeliveryDate
      ? (() => {
          const d = new Date(ext.newDeliveryDate);
          const dateStr = d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const timeStr = d.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `${dateStr} at ${timeStr}`;
        })()
      : null;

    push(
      {
        at: ext.requestedAt,
        label: "Extension Requested",
        description: ext.reason
          ? `You requested an extension to ${newDeliveryFormatted || "a new date"}. Reason: ${ext.reason}`
          : newDeliveryFormatted
            ? `You requested an extension to ${newDeliveryFormatted}.`
            : "You requested an extension to the delivery time.",
        colorClass: "bg-indigo-500",
        icon: <Clock className="w-5 h-5 text-white" />,
      },
      "extension-requested"
    );
  }
  if (ext?.respondedAt && (ext.status === "approved" || ext.status === "rejected")) {
    // Format new delivery date/time for response
    const newDeliveryFormatted = ext.newDeliveryDate
      ? (() => {
          const d = new Date(ext.newDeliveryDate);
          const dateStr = d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const timeStr = d.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `${dateStr} at ${timeStr}`;
        })()
      : null;

    push(
      {
        at: ext.respondedAt,
        label:
          ext.status === "approved"
            ? "Extension Approved"
            : "Extension Rejected",
        description:
          ext.status === "approved"
            ? newDeliveryFormatted
              ? `New delivery date & time: ${newDeliveryFormatted}`
              : "Extension approved."
            : "Client rejected the extension request.",
        colorClass: ext.status === "approved" ? "bg-green-600" : "bg-red-600",
        icon:
          ext.status === "approved" ? (
            <ThumbsUp className="w-5 h-5 text-white" />
          ) : (
            <ThumbsDown className="w-5 h-5 text-white" />
          ),
      },
      "extension-responded"
    );
  }

  // Work delivered - handle multiple deliveries (all deliveries as separate events)
  // Group delivery files by deliveryNumber to identify separate deliveries
  if (order.deliveryFiles && order.deliveryFiles.length > 0) {
    // Group files by deliveryNumber
    const deliveryGroupsMap = new Map<number, any[]>();
    order.deliveryFiles.forEach((file: any) => {
      const deliveryNum = file.deliveryNumber || 1;
      if (!deliveryGroupsMap.has(deliveryNum)) {
        deliveryGroupsMap.set(deliveryNum, []);
      }
      deliveryGroupsMap.get(deliveryNum)!.push(file);
    });
    
    // Sort files within each group by upload time
    deliveryGroupsMap.forEach((files, deliveryNum) => {
      files.sort((a: any, b: any) => {
        const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return aTime - bTime;
      });
    });
    
    // Parse delivery messages by [Delivery #N] markers
    // Format: "[Delivery #1]\nmessage1\n\n[Delivery #2]\nmessage2\n\n[Delivery #3]\nmessage3"
    // Or: "message1\n\n[Delivery #2]\nmessage2" (first delivery without marker)
    const deliveryMessagesMap = new Map<number, string>();
    
    if (order.deliveryMessage) {
      // Find all [Delivery #N] markers and their positions
      const markerRegex = /\[Delivery #(\d+)\]\n/g;
      const markers: Array<{ number: number; index: number; markerLength: number }> = [];
      let match;
      
      while ((match = markerRegex.exec(order.deliveryMessage)) !== null) {
        markers.push({
          number: parseInt(match[1], 10),
          index: match.index,
          markerLength: match[0].length // Length of "[Delivery #N]\n"
        });
      }
      
      if (markers.length === 0) {
        // No markers - entire message is delivery #1
        deliveryMessagesMap.set(1, order.deliveryMessage.trim());
      } else {
        // Extract messages between markers
        for (let i = 0; i < markers.length; i++) {
          const marker = markers[i];
          const nextMarker = markers[i + 1];
          const startIndex = marker.index + marker.markerLength; // After the marker
          const endIndex = nextMarker ? nextMarker.index : order.deliveryMessage.length;
          const message = order.deliveryMessage.substring(startIndex, endIndex).trim();
          // Remove leading/trailing newlines and separators
          const cleanMessage = message.replace(/^\n+|\n+$/g, '').trim();
          if (cleanMessage) {
            deliveryMessagesMap.set(marker.number, cleanMessage);
          }
        }
        
        // If first marker is not at the start, text before it is delivery #1
        if (markers[0].index > 0) {
          const firstMessage = order.deliveryMessage.substring(0, markers[0].index).trim();
          if (firstMessage) {
            deliveryMessagesMap.set(1, firstMessage);
          }
        }
      }
    }
    
    // Get all unique delivery numbers (from files and messages)
    const allDeliveryNumbers = Array.from(new Set([
      ...Array.from(deliveryGroupsMap.keys()),
      ...Array.from(deliveryMessagesMap.keys()),
      ...(deliveryGroupsMap.size === 0 && deliveryMessagesMap.size === 0 ? [1] : [])
    ])).sort((a, b) => a - b);
    
    // Create timeline event for each delivery
    allDeliveryNumbers.forEach((deliveryNum) => {
      const files = deliveryGroupsMap.get(deliveryNum) || [];
      const deliveryMessage = deliveryMessagesMap.get(deliveryNum) || '';
      const deliveryDate = files.length > 0 
        ? (files[0]?.uploadedAt || (order as any).deliveredDate)
        : (order as any).deliveredDate;
      
      push(
        {
          at: deliveryDate,
          label: "Work Delivered",
          description: "You delivered the work to the client.",
          message: deliveryMessage || undefined,
          files: files,
          colorClass: "bg-purple-500",
          icon: <Truck className="w-5 h-5 text-white" />,
        },
        `delivered-${deliveryNum}`
      );
    });
  } else if (order.deliveryStatus === "delivered" || order.status === "delivered" || order.deliveryMessage) {
    // Fallback: if no files but status is delivered, show single delivery event
    push(
      {
        at: (order as any).deliveredDate || order.deliveryFiles?.[0]?.uploadedAt,
        label: "Work Delivered",
        description: "You delivered the work to the client.",
        message: order.deliveryMessage,
        files: order.deliveryFiles,
        colorClass: "bg-purple-500",
        icon: <Truck className="w-5 h-5 text-white" />,
      },
      "delivered-1"
    );
  }

  // Revision request events - handle as array (revisionRequests already declared above)
  // Cancellation request events
  const canc = (order as any).cancellationRequest;
  if (canc?.requestedAt && canc.status) {
    push(
      {
        at: canc.requestedAt,
        label: "Cancellation Requested",
        description: canc.reason
          ? `Cancellation reason: ${canc.reason}`
          : "A cancellation was requested for this order.",
        files: canc.files && canc.files.length > 0 ? canc.files : undefined,
        colorClass: "bg-red-500",
        icon: <AlertTriangle className="w-5 h-5 text-white" />,
      },
      "cancellation-requested"
    );
  }
  if (canc?.respondedAt && canc.status && canc.status !== "pending") {
    push(
      {
        at: canc.respondedAt,
        label:
          canc.status === "approved"
            ? "Cancellation Approved"
            : canc.status === "rejected"
            ? "Cancellation Rejected"
            : "Cancellation Withdrawn",
        description:
          canc.status === "approved"
            ? "Order was cancelled."
            : canc.status === "rejected"
            ? (canc.rejectionReason 
                ? `Cancellation request was rejected. Reason: ${canc.rejectionReason}`
                : "Cancellation request was rejected.")
            : "Cancellation request was withdrawn.",
        colorClass:
          canc.status === "approved"
            ? "bg-red-600"
            : canc.status === "rejected"
            ? "bg-green-600"
            : "bg-gray-500",
        icon:
          canc.status === "approved" ? (
            <XCircle className="w-5 h-5 text-white" />
          ) : (
            <Check className="w-5 h-5 text-white" />
          ),
      },
      "cancellation-responded"
    );
  }

  // Revision events - handle as array
  revisionRequests.forEach((rev) => {
    if (!rev || !rev.status) return;
    
    // Revision Requested event
    if (rev.requestedAt) {
      push(
        {
          at: rev.requestedAt,
          label: "Revision Requested",
          description: rev.reason
            ? `Client requested a revision. Reason: ${rev.reason}`
            : "Client requested a revision.",
          message: rev.clientMessage || undefined,
          files: rev.clientFiles && rev.clientFiles.length > 0 ? rev.clientFiles : undefined,
          colorClass: "bg-purple-500",
          icon: <Edit className="w-5 h-5 text-white" />,
        },
        `revision-requested-${rev.index || 0}`
      );
    }
    
    // Revision Response event (accepted/rejected/completed)
    if (rev.respondedAt && rev.status !== 'pending') {
      const getRevisionDescription = () => {
        if (rev.status === "rejected") {
          return rev.additionalNotes 
            ? `Revision request was rejected. Reason: ${rev.additionalNotes}`
            : "Revision request was rejected.";
        } else if (rev.status === "in_progress") {
          return rev.additionalNotes 
            ? `Revision accepted. ${rev.additionalNotes}`
            : "Revision accepted. Work resumed.";
        } else if (rev.status === "completed") {
          return "Revision completed and work re-delivered.";
        }
        return rev.additionalNotes || undefined;
      };

      push(
        {
          at: rev.respondedAt,
          label:
            rev.status === "in_progress"
              ? "Revision Accepted"
              : rev.status === "completed"
              ? "Revision Completed"
              : rev.status === "rejected"
              ? "Revision Rejected"
              : "Revision Updated",
          description: getRevisionDescription(),
          colorClass:
            rev.status === "completed"
              ? "bg-green-600"
              : rev.status === "rejected"
              ? "bg-red-600"
              : "bg-purple-500",
          icon:
            rev.status === "completed" ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : rev.status === "rejected" ? (
              <XCircle className="w-5 h-5 text-white" />
            ) : (
              <FileText className="w-5 h-5 text-white" />
            ),
        },
        `revision-responded-${rev.index || 0}`
      );
    }
  });

  // Additional Information event
  const addInfo = order.additionalInformation;
  if (addInfo?.submittedAt) {
    push(
      {
        at: addInfo.submittedAt,
        label: "Additional Information Received",
        description: addInfo.message 
          ? `Client submitted additional information: ${addInfo.message.substring(0, 100)}${addInfo.message.length > 100 ? '...' : ''}`
          : `Client submitted ${addInfo.files?.length || 0} file(s) as additional information.`,
        colorClass: "bg-blue-500",
        icon: <FileText className="w-5 h-5 text-white" />,
      },
      "additional-info"
    );
  }

  // Completion event
  if ((order as any).completedDate || order.status === "Completed") {
    push(
      {
        at: (order as any).completedDate,
        label: "Order Completed",
        description:
          "Order has been completed and funds have been released to your wallet.",
        colorClass: "bg-green-700",
        icon: <CheckCircle2 className="w-5 h-5 text-white" />,
      },
      "completed"
    );
  }

  // Order cancelled event
  if (order.status === "Cancelled" && canc?.respondedAt && canc.status === "approved") {
    push(
      {
        at: canc.respondedAt,
        label: "Order Cancelled",
        description: canc.reason
          ? `Order was cancelled. Reason: ${canc.reason}`
          : "Order has been cancelled.",
        colorClass: "bg-red-700",
        icon: <XCircle className="w-5 h-5 text-white" />,
      },
      "order-cancelled"
    );
  }

  // Dispute events
  const disp = order.disputeInfo;
  if (disp && ((disp as any).createdAt || order.deliveryStatus === "dispute")) {
    push(
      {
        at: (disp as any).createdAt,
        label: "Dispute Opened",
        description:
          disp.reason ||
          "A dispute was opened for this order. Please review and respond.",
        colorClass: "bg-red-700",
        icon: <AlertTriangle className="w-5 h-5 text-white" />,
      },
      "dispute-opened"
    );
  }
  if (disp && (disp as any).closedAt) {
    push(
      {
        at: (disp as any).closedAt,
        label: "Dispute Closed",
        description: (disp as any).decisionNotes || "Dispute has been resolved.",
        colorClass: "bg-gray-700",
        icon: <FileText className="w-5 h-5 text-white" />,
      },
      "dispute-closed"
    );
  }

  // Sort by time
  return events.sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return tb - ta;
  });
}
