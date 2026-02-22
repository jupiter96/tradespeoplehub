import React from "react";
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  FileText,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Truck,
  Edit,
  XCircle,
  Check,
  MessageCircle,
  Handshake,
} from "lucide-react";
import { TimelineEvent, Order } from "./types";

export function buildProfessionalTimeline(order: Order): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  const push = (event: Omit<TimelineEvent, "id">, id: string) => {
    events.push({ ...event, id });
  };
  const formatAcceptedAt = (isoString?: string): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const day = date.getDate();
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${dayNames[date.getDay()]} ${day}${getOrdinal(day)} ${monthNames[date.getMonth()]}, ${date.getFullYear()} ${hours}:${minutes}`;
  };

  // Order placed
  if (order.date) {
    push(
      {
        at: (order as any).createdAt || order.date,
        label: "Order Placed",
        description: `${order.client || "Client"} placed this order.`,
        colorClass: "bg-gray-800",
        icon: <ShoppingBag className="w-5 h-5 text-blue-600" />,
      },
      "placed"
    );
  }

  // Custom offer created by professional (awaiting client response) / expired
  if (order.status === "offer created" || order.status === "offer expired") {
    push(
      {
        at: (order as any).createdAt || order.date,
        label: "You made an offer.",
        description: "Custom offer sent to the client.",
        colorClass: "bg-blue-600",
        icon: <FileText className="w-5 h-5 text-blue-600" />,
      },
      "offer-created"
    );
    // Expected response time / expiration as a timeline event
    const rd = (order as any).metadata?.responseDeadline;
    if (rd) {
      const deadline = new Date(rd);
      const now = new Date();
      const expired = order.status === "offer expired" || deadline.getTime() <= now.getTime();
      push(
        {
          at: deadline.toISOString(),
          label: expired ? "Offer has been expired!" : "Expected Response Time",
          description: expired
            ? "This custom offer expired because the response time has passed."
            : "The client should respond to this offer before the expected response time.",
          colorClass: expired ? "bg-red-600" : "bg-amber-500",
          icon: <Clock className="w-5 h-5 text-blue-600" />,
        },
        "offer-response-deadline"
      );
    }
  }
  if (
    (order as any).metadata?.customOfferStatus === "rejected" &&
    (order as any).metadata?.customOfferRejectedBy === "client"
  ) {
    push(
      {
        at: (order as any).metadata?.customOfferRejectedAt || (order as any).updatedAt,
        label: "Your offer was rejected.",
        description: "The client rejected your custom offer.",
        colorClass: "bg-red-600",
        icon: <XCircle className="w-5 h-5 text-blue-600" />,
      },
      "offer-rejected"
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
        icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
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
        icon: <Clock className="w-5 h-5 text-blue-600" />,
      },
      "pending-delivery"
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
        icon: <FileText className="w-5 h-5 text-blue-600" />,
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
        icon: <Clock className="w-5 h-5 text-blue-600" />,
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
        message:
          ext.status === "rejected"
            ? "Your extension request has been rejected. Please deliver the work by the original deadline."
            : undefined,
        colorClass: ext.status === "approved" ? "bg-green-600" : "bg-red-600",
        icon:
          ext.status === "approved" ? (
            <ThumbsUp className="w-5 h-5 text-blue-600" />
          ) : (
            <ThumbsDown className="w-5 h-5 text-blue-600" />
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
          icon: <Truck className="w-5 h-5 text-blue-600" />,
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
        icon: <Truck className="w-5 h-5 text-blue-600" />,
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
        icon: <AlertTriangle className="w-5 h-5 text-blue-600" />,
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
            <XCircle className="w-5 h-5 text-blue-600" />
          ) : (
            <Check className="w-5 h-5 text-blue-600" />
          ),
      },
      "cancellation-responded"
    );
  }

  // Revision events - handle as array
  const revisionRequests = (order as any).revisionRequest
    ? (Array.isArray((order as any).revisionRequest) ? (order as any).revisionRequest : [(order as any).revisionRequest])
    : [];
  revisionRequests.forEach((rev: any) => {
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
          icon: <Edit className="w-5 h-5 text-blue-600" />,
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
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            ) : rev.status === "rejected" ? (
              <XCircle className="w-5 h-5 text-blue-600" />
            ) : (
              <FileText className="w-5 h-5 text-blue-600" />
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
        icon: <FileText className="w-5 h-5 text-blue-600" />,
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
        icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
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
        icon: <XCircle className="w-5 h-5 text-blue-600" />,
      },
      "order-cancelled"
    );
  }

  // Dispute events
  const disp = order.disputeInfo;
  if (disp && (disp.createdAt || order.deliveryStatus === "dispute")) {
    const disputeOpenedDescription =
      disp.reason ||
      disp.requirements ||
      "A dispute was opened for this order. Please review and respond.";
    
    // Determine if professional is claimant or respondent
    const claimantIdRaw = (disp as any).claimantId;
    const claimantId = claimantIdRaw?.toString?.() || claimantIdRaw;
    const professionalId = (order as any).professionalId || (order as any).professional;
    const isProfessionalClaimant = claimantId && professionalId && claimantId.toString() === professionalId.toString();
    const clientDisplayName = order.client || disp.claimantName || disp.respondentName || "Client";
    
    // Build warning message based on dispute state
    let disputeWarningMessage = "";
    const hasReply = Boolean(disp.respondedAt);
    
    if (!hasReply) {
      const responseDeadlineStr = disp.responseDeadline
        ? formatAcceptedAt(disp.responseDeadline)
        : "the deadline";
      
      if (isProfessionalClaimant) {
        // Professional opened the dispute, waiting for client response
        disputeWarningMessage = `⏳ Awaiting Response\n${clientDisplayName} has until ${responseDeadlineStr} to respond. If they don't respond within the time frame, the case will be closed in your favour.`;
      } else {
        // Client opened the dispute, professional needs to respond
        disputeWarningMessage = `⚠️ Response Required\nYou have until ${responseDeadlineStr} to respond. Not responding within the time frame will result in closing the case and deciding in ${clientDisplayName}'s favour. Any decision reached is final and irrevocable.`;
      }
    }
    
    push(
      {
        at: disp.createdAt || (order as any).updatedAt,
        label: "Dispute Opened",
        description: disputeOpenedDescription,
        message: disputeWarningMessage || undefined,
        colorClass: "bg-red-700",
        icon: <AlertTriangle className="w-5 h-5 text-blue-600" />,
      },
      "dispute-opened"
    );
  }
  if (disp?.respondedAt) {
    const claimantIdRaw = (disp as any).claimantId;
    const claimantId = claimantIdRaw?.toString?.() || claimantIdRaw;
    const professionalId = (order as any).professionalId || (order as any).professional;
    const clientDisplayName = order.client || disp.claimantName || disp.respondentName || "Client";
    if (claimantId && professionalId && claimantId.toString() === professionalId.toString()) {
      const negotiationDeadlineStr = disp.negotiationDeadline
        ? formatAcceptedAt(disp.negotiationDeadline).split(" ").slice(1, 4).join(" ")
        : "the deadline";
      const arbitrationFeeAmount = typeof disp.arbitrationFeeAmount === "number"
        ? ` The arbitration fee is £${disp.arbitrationFeeAmount.toFixed(2)} per party.`
        : "";
      push(
        {
          at: disp.respondedAt,
          label: "Dispute Response Received",
          description: `${clientDisplayName} responded to your dispute.`,
          message: `You have until ${negotiationDeadlineStr} to negotiate and reach a settlement directly. If you are unable to reach an agreement, you may request our team to arbitrate the case by paying the required arbitration fee.${arbitrationFeeAmount}`,
          colorClass: "bg-blue-600",
          icon: <MessageCircle className="w-5 h-5 text-blue-600" />,
        },
        "dispute-responded"
      );
    }
  }
  if (disp?.arbitrationPayments && disp.arbitrationPayments.length === 1) {
    const payment = disp.arbitrationPayments[0];
    const professionalId = (order as any).professionalId || (order as any).professional;
    const clientDisplayName = order.client || disp.claimantName || disp.respondentName || "Client";
    const paidByProfessional = payment?.userId?.toString?.() === professionalId?.toString?.();
    const paidAtStr = payment.paidAt ? formatAcceptedAt(payment.paidAt) : "";
    const deadlineStr = disp.arbitrationFeeDeadline
      ? formatAcceptedAt(disp.arbitrationFeeDeadline).split(" ").slice(1, 4).join(" ")
      : "the deadline";
    if (paidByProfessional) {
      push(
        {
          at: payment.paidAt || disp.arbitrationRequestedAt || disp.respondedAt,
          label: "Arbitration Fee Paid",
          description: `You have paid your arbitration fees${paidAtStr ? ` on ${paidAtStr}` : ""}`,
          message: `${clientDisplayName} has until ${deadlineStr} to pay arbitration fees. Failure to make the payment within this timeframe will result in the case being closed and a decision made in your favor.`,
          colorClass: "bg-blue-600",
          icon: <MessageCircle className="w-5 h-5 text-blue-600" />,
        },
        "arbitration-fee-paid"
      );
    } else {
      push(
        {
          at: payment.paidAt || disp.arbitrationRequestedAt || disp.respondedAt,
          label: "Arbitration Fee Paid",
          description: `${clientDisplayName} has paid its arbitration fees${paidAtStr ? ` on ${paidAtStr}` : ""}.`,
          message: `You have until ${deadlineStr} to pay arbitration fees. Failure to make the payment within this timeframe will result in the case being closed and a decision made in ${clientDisplayName}´s favor.`,
          colorClass: "bg-blue-600",
          icon: <MessageCircle className="w-5 h-5 text-blue-600" />,
        },
        "arbitration-fee-paid"
      );
    }
  }
  if (disp?.arbitrationPayments && disp.arbitrationPayments.length >= 2) {
    const uniquePayers = new Set(disp.arbitrationPayments.map((p: any) => p?.userId?.toString?.()).filter(Boolean));
    if (uniquePayers.size >= 2) {
      const latestPayment = disp.arbitrationPayments
        .filter((p: any) => p?.paidAt)
        .sort((a: any, b: any) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())[0];
      const paidAtStr = latestPayment?.paidAt ? formatAcceptedAt(latestPayment.paidAt) : "";
      push(
        {
          at: latestPayment?.paidAt || disp.arbitrationRequestedAt || disp.respondedAt,
          label: "Arbitration Fees Paid",
          description: `Both have paid arbitration fees.${paidAtStr ? ` ${paidAtStr}` : ""}`,
          message: "The dispute team will now step in, review and decide on the case.",
          colorClass: "bg-blue-600",
          icon: <MessageCircle className="w-5 h-5 text-blue-600" />,
        },
        "arbitration-fees-paid"
      );
    }
  }
  if (disp && disp.closedAt) {
    const clientDisplayName = order.client || disp.claimantName || disp.respondentName || "Client";
    const acceptedTimestamp = formatAcceptedAt(disp.acceptedAt || disp.closedAt);
    const winnerIdRaw = (disp as any).winnerId;
    const winnerId = winnerIdRaw?.toString?.() || winnerIdRaw;
    const professionalId = (order as any).professionalId || (order as any).professional;
    const isProfessionalWinner =
      winnerId &&
      professionalId &&
      winnerId.toString() === professionalId.toString();
    const autoClosedDeadline = disp.responseDeadline
      ? new Date(disp.responseDeadline).toISOString().split("T")[0]
      : "the deadline";
    const disputeClosedDescription =
      disp.acceptedByRole === "professional"
        ? `Offer accepted and dispute closed by you. ${acceptedTimestamp}\nThank you for accepting the offer and closing the dispute.`
        : disp.acceptedByRole === "client"
          ? `Your offer was accepted and the dispute closed by ${clientDisplayName}. ${acceptedTimestamp}\nThank you for your settlement offer.`
          : (disp.decisionNotes || "Dispute has been resolved and closed.");
    const isArbUnpaidAutoClose =
      disp.autoClosed &&
      !isProfessionalWinner &&
      typeof disp.decisionNotes === "string" &&
      disp.decisionNotes.includes("unpaid arbitration fee");
    const disputeClosedMessage = disp.acceptedByRole === "professional"
      ? `Offer accepted and dispute closed by you. ${acceptedTimestamp}\nThank you for accepting the offer and closing the dispute.`
      : disp.acceptedByRole === "client"
        ? `Your offer was accepted and the dispute closed by ${clientDisplayName}. ${acceptedTimestamp}\nThank you for your settlement offer.`
      : disp.adminDecision
        ? (disp.decisionNotes || `Decision: Dispute decided in the favour of the selected party.\ncomment: No additional comment provided.`)
        : (isArbUnpaidAutoClose
          ? (isProfessionalWinner
            ? `The order dispute was closed and decided automatically on ${formatAcceptedAt(disp.closedAt)}.\n${clientDisplayName} failed to pay the arbitration fee within the given time frame. As a result, the dispute has been decided in your favour.`
            : `The order dispute was closed and decided automatically on ${formatAcceptedAt(disp.closedAt)}.\nYou have failed to pay the arbitration fee within the given time frame. As a result, the dispute has been decided in the favor of ${clientDisplayName}.`)
          : (disp.autoClosed
            ? `Your order dispute has been automatically closed and resolved due to no response before the ${autoClosedDeadline}`
            : undefined));
    push(
      {
        at: disp.closedAt,
        label: "Dispute Closed",
        description: disputeClosedDescription,
        message: disputeClosedMessage,
        colorClass: "bg-gray-700",
        icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
      },
      "dispute-closed"
    );
  }
  // Offer history events
  if (disp?.offerHistory && disp.offerHistory.length > 0) {
    const clientDisplayName = order.client || disp.claimantName || disp.respondentName || "Client";
    (disp.offerHistory as any[]).forEach((offer: any, idx: number) => {
      if (!offer || typeof offer.amount !== "number") return;
      const madeByProfessional = offer.role === "professional";
      const offerDateStr = offer.offeredAt ? formatAcceptedAt(offer.offeredAt) : "";
      if (madeByProfessional) {
        push(
          {
            at: offer.offeredAt,
            label: "You made an offer.",
            description: `You proposed £${offer.amount.toFixed(2)} as a settlement amount.${offerDateStr ? ` ${offerDateStr}` : ""}`,
            message: `You proposed £${offer.amount.toFixed(2)} as a settlement. ${clientDisplayName} has been notified and can accept or counter with their own offer.`,
            colorClass: "bg-amber-500",
            icon: <Handshake className="w-5 h-5 text-amber-600" />,
          },
          `dispute-offer-${idx}`
        );
      } else {
        push(
          {
            at: offer.offeredAt,
            label: "You received an offer.",
            description: `${clientDisplayName} proposed £${offer.amount.toFixed(2)} as a settlement amount.${offerDateStr ? ` ${offerDateStr}` : ""}`,
            message: `${clientDisplayName} has proposed £${offer.amount.toFixed(2)} as a settlement. You can accept this offer to resolve the dispute, or counter with your own offer.`,
            colorClass: "bg-amber-500",
            icon: <Handshake className="w-5 h-5 text-amber-600" />,
          },
          `dispute-offer-${idx}`
        );
      }
    });
  }

  // Sort by time
  return events.sort((a, b) => {
    const ta = a.at ? new Date(a.at).getTime() : 0;
    const tb = b.at ? new Date(b.at).getTime() : 0;
    return tb - ta;
  });
}
