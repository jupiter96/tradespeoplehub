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
  if (order.status === "In Progress" && 
      order.status !== "disputed" &&
      order.deliveryStatus !== "delivered" &&
      order.deliveryStatus !== "completed" &&
      order.deliveryStatus !== "cancelled" &&
      order.deliveryStatus !== "dispute") {
    push(
      {
        at: order.expectedDelivery || (order as any).scheduledDate || (order as any).createdAt || order.date,
        label: "Service In Progress",
        description:
          "You are currently working on this service. Make sure to deliver on time.",
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

  // Work delivered - handle multiple deliveries (first delivery and revision re-delivery)
  const rev = order.revisionRequest;
  const revisionRequestedAt = rev && (rev as any).requestedAt ? new Date((rev as any).requestedAt).getTime() : null;
  const revisionCompletedAt = rev?.status === 'completed' && (rev as any).respondedAt 
    ? new Date((rev as any).respondedAt).getTime() 
    : null;
  
  // Group delivery files by upload time to identify separate deliveries
  if (order.deliveryFiles && order.deliveryFiles.length > 0) {
    // Sort files by upload time
    const sortedFiles = [...order.deliveryFiles].sort((a: any, b: any) => {
      const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return aTime - bTime;
    });
    
    // First delivery: files uploaded before revision request (or all files if no revision)
    const firstDeliveryFiles = revisionRequestedAt 
      ? sortedFiles.filter((file: any) => {
          const fileUploadTime = file.uploadedAt ? new Date(file.uploadedAt).getTime() : 0;
          return fileUploadTime < revisionRequestedAt;
        })
      : sortedFiles;
    
    // Second delivery: files uploaded after revision request (when revision is completed)
    const secondDeliveryFiles = rev?.status === 'completed' && revisionRequestedAt
      ? sortedFiles.filter((file: any) => {
          const fileUploadTime = file.uploadedAt ? new Date(file.uploadedAt).getTime() : 0;
          return fileUploadTime >= revisionRequestedAt;
        })
      : [];
    
    // First delivery event
    if (firstDeliveryFiles.length > 0) {
      const firstDeliveryDate = firstDeliveryFiles[0]?.uploadedAt || (order as any).deliveredDate;
      const firstMessage = order.deliveryMessage?.includes('[Revision]')
        ? order.deliveryMessage.split('\n\n[Revision]')[0]?.trim()
        : order.deliveryMessage;
      
      push(
        {
          at: firstDeliveryDate,
          label: "Work Delivered",
          description: "You delivered the work to the client.",
          message: firstMessage,
          files: firstDeliveryFiles,
          colorClass: "bg-purple-500",
          icon: <Truck className="w-5 h-5 text-white" />,
        },
        "delivered"
      );
    } else if (!rev && (order.deliveryStatus === "delivered" || order.status === "delivered" || order.deliveryMessage)) {
      // Fallback: if no files but status is delivered and no revision, show delivery event
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
        "delivered"
      );
    }
    
    // Second delivery event (after revision completion)
    if (rev?.status === 'completed' && secondDeliveryFiles.length > 0) {
      const secondDeliveryDate = secondDeliveryFiles[0]?.uploadedAt || (order as any).deliveredDate;
      const revisionMessage = order.deliveryMessage?.includes('[Revision]')
        ? order.deliveryMessage.split('[Revision]')[1]?.trim()
        : order.deliveryMessage;
      
      push(
        {
          at: secondDeliveryDate,
          label: "Work Delivered",
          description: "You delivered the revised work to the client.",
          message: revisionMessage,
          files: secondDeliveryFiles,
          colorClass: "bg-purple-500",
          icon: <Truck className="w-5 h-5 text-white" />,
        },
        "delivered-revision"
      );
    } else if (rev?.status === 'completed' && revisionCompletedAt && (order.deliveryStatus === "delivered" || order.status === "delivered")) {
      // If revision is completed but no new files, show second delivery with current deliveredDate
      // This handles the case where revision was completed but no new files were uploaded
      const revisionMessage = order.deliveryMessage?.includes('[Revision]')
        ? order.deliveryMessage.split('[Revision]')[1]?.trim()
        : order.deliveryMessage;
      
      push(
        {
          at: (order as any).deliveredDate || (rev as any).respondedAt,
          label: "Work Delivered",
          description: "You delivered the revised work to the client.",
          message: revisionMessage,
          files: secondDeliveryFiles.length > 0 ? secondDeliveryFiles : order.deliveryFiles,
          colorClass: "bg-purple-500",
          icon: <Truck className="w-5 h-5 text-white" />,
        },
        "delivered-revision"
      );
    }
  } else if (order.deliveryStatus === "delivered" || order.status === "delivered" || order.deliveryMessage) {
    // Fallback: if no files but status is delivered, show delivery event
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
      "delivered"
    );
  }

  if (order.revisionRequest?.status) {
    push(
      {
        at: (order.revisionRequest as any).requestedAt,
        label: "Revision Requested",
        description: "Client requested a modification.",
        message: (order.revisionRequest as any).clientMessage || order.revisionRequest.reason,
        files: (order.revisionRequest as any).clientFiles,
        colorClass: "bg-orange-500",
        icon: <AlertTriangle className="w-5 h-5 text-white" />,
      },
      "revision-requested"
    );
  }

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

  // Revision events (rev already declared above)
  if (rev && (rev as any).requestedAt) {
    push(
      {
        at: (rev as any).requestedAt,
        label: "Revision Requested",
        description: rev.reason
          ? `Client requested a revision. Reason: ${rev.reason}`
          : "Client requested a revision.",
        colorClass: "bg-purple-500",
        icon: <Edit className="w-5 h-5 text-white" />,
      },
      "revision-requested"
    );
  }
  if (rev && (rev as any).respondedAt && rev.status) {
    const getRevisionDescription = () => {
      if (rev.status === "rejected") {
        return (rev as any).additionalNotes 
          ? `Revision request was rejected. Reason: ${(rev as any).additionalNotes}`
          : "Revision request was rejected.";
      } else if (rev.status === "in_progress") {
        return (rev as any).additionalNotes 
          ? `Revision accepted. ${(rev as any).additionalNotes}`
          : "Revision accepted. Work resumed.";
      } else if (rev.status === "completed") {
        return "Revision completed and work re-delivered.";
      }
      return (rev as any).additionalNotes || undefined;
    };

    push(
      {
        at: (rev as any).respondedAt,
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
      "revision-responded"
    );
  }

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
