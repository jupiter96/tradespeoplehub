import React from "react";
import { formatDateOrdinal } from "./utils";

type RevisionRequestLike = {
  index?: number;
  status?: string;
  milestoneIndex?: number;
};

type OrderLike = {
  date?: string;
  status?: string;
  metadata?: {
    paymentType?: string;
    milestones?: Array<{
      name?: string;
      description?: string;
      amount?: number;
      price?: number;
      dueInDays?: number;
      deliveryInDays?: number;
      hours?: number;
      noOf?: number;
      chargePer?: string;
    }>;
    milestoneDeliveries?: Array<{ milestoneIndex: number }>;
    disputeResolvedMilestoneIndices?: number[];
  };
  revisionRequest?: RevisionRequestLike | RevisionRequestLike[];
  createdAt?: string;
};

interface OrderMilestoneTableProps {
  order: OrderLike;
  /** Client view uses "In Progress" label; professional uses "Active". Default "Active". */
  inProgressLabel?: string;
}

export default function OrderMilestoneTable({ order, inProgressLabel = "Active" }: OrderMilestoneTableProps) {
  const paymentType = order.metadata?.paymentType;
  const milestones = order.metadata?.milestones;
  if (paymentType !== "milestone" || !Array.isArray(milestones) || milestones.length === 0) {
    return null;
  }

  const orderDate = order.date ? new Date(order.date) : (order.createdAt ? new Date(order.createdAt) : new Date());
  const milestoneDeliveries = order.metadata?.milestoneDeliveries;
  const disputeResolvedIndices = order.metadata?.disputeResolvedMilestoneIndices;
  const orderStatus = (order.status || "").toLowerCase();
  const revisionRequests = order.revisionRequest
    ? Array.isArray(order.revisionRequest)
      ? order.revisionRequest
      : [order.revisionRequest]
    : [];
  const activeRevisionMilestoneIndices = (() => {
    const fromMilestoneIndex = revisionRequests
      .filter((rr) => rr && (rr.status === "pending" || rr.status === "in_progress") && typeof rr.milestoneIndex === "number")
      .map((rr) => rr.milestoneIndex as number);
    const fallback: number[] = [];
    const activeWithoutIndex = revisionRequests.filter(
      (rr) => rr && (rr.status === "pending" || rr.status === "in_progress") && (rr.milestoneIndex === undefined || rr.milestoneIndex === null)
    );
    if (activeWithoutIndex.length > 0 && Array.isArray(milestoneDeliveries) && milestoneDeliveries.length === 1) {
      fallback.push(0);
    }
    return new Set([...fromMilestoneIndex, ...fallback]);
  })();

  return (
    <div className="mb-6">
      <h4 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-semibold mb-3">
        Created Milestones
      </h4>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full font-['Poppins',sans-serif] text-[13px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Milestone Name</th>
              <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Delivery Date</th>
              <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Hours</th>
              <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Description</th>
              <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Amount</th>
              <th className="text-left py-3 px-4 font-semibold text-[#2c353f]">Status</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((m, idx) => {
              const deliveryDate = new Date(orderDate);
              const days = m.deliveryInDays ?? m.dueInDays ?? 0;
              deliveryDate.setDate(deliveryDate.getDate() + (typeof days === "number" ? days : 0));
              const unitPrice = m.price ?? m.amount ?? 0;
              const noOfVal = m.noOf ?? m.hours ?? 1;
              const amt = unitPrice * (typeof noOfVal === "number" ? noOfVal : 1);
              const isMilestoneDelivered =
                Array.isArray(milestoneDeliveries) &&
                milestoneDeliveries.some((d) => d.milestoneIndex === idx);
              const isMilestoneResolvedByDispute =
                Array.isArray(disputeResolvedIndices) && disputeResolvedIndices.includes(idx);
              const isThisMilestoneInRevision = activeRevisionMilestoneIndices.has(idx);
              const milestoneStatus = (() => {
                if (isThisMilestoneInRevision) return { label: "Revision", color: "text-yellow-600" };
                if (isMilestoneDelivered) return { label: "Delivered", color: "text-green-600" };
                if (isMilestoneResolvedByDispute) return { label: "Resolved (dispute)", color: "text-green-600" };
                if (orderStatus === "offer created") return { label: "Offer created", color: "text-gray-500" };
                if (orderStatus === "in progress") return { label: inProgressLabel, color: "text-blue-600" };
                if (orderStatus === "delivered") return { label: "Delivered", color: "text-green-600" };
                if (orderStatus === "completed") return { label: "Completed", color: "text-green-700 font-semibold" };
                if (orderStatus === "cancelled") return { label: "Cancelled", color: "text-red-600" };
                if (orderStatus === "disputed") return { label: "Disputed", color: "text-red-500" };
                if (orderStatus === "cancellation pending") return { label: "Cancellation Pending", color: "text-orange-500" };
                return { label: order.status || "Pending", color: "text-gray-500" };
              })();
              return (
                <tr key={idx} className="border-b border-gray-100 last:border-b-0">
                  <td className="py-3 px-4 text-[#2c353f]">{m.name || "—"}</td>
                  <td className="py-3 px-4 text-[#2c353f]">{formatDateOrdinal(deliveryDate.toISOString())}</td>
                  <td className="py-3 px-4 text-[#2c353f]">{typeof noOfVal === "number" ? noOfVal : "—"}</td>
                  <td className="py-3 px-4 text-[#6b6b6b] max-w-[200px] truncate">
                    {m.description || (m.chargePer ? `${m.chargePer} x${noOfVal}` : "—")}
                  </td>
                  <td className="py-3 px-4 text-[#FE8A0F] font-medium">
                    £{typeof amt === "number" ? amt.toFixed(2) : "0.00"}
                  </td>
                  <td className={`py-3 px-4 ${milestoneStatus.color}`}>{milestoneStatus.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
