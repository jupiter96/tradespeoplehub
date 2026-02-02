import { useState, useEffect } from "react";
import { Order } from "./types";
import { formatDate, formatMoney } from "./utils";
import { resolveApiUrl } from "../../config/api";

interface OrderDetailsTabProps {
  order: Order;
  formatMoneyFn?: (value?: number | string, fallback?: string) => string;
}

function getPriceUnitLabel(packageType?: string, chargePer?: string): string {
  const unit = packageType || chargePer || "service";
  if (unit === "service" || unit === "fixed") return "service";
  if (unit === "per hour") return "hour";
  if (unit === "per day") return "day";
  if (unit === "per item") return "item";
  return unit.replace(/^per\s+/i, "").replace(/\s+/g, " ");
}

export default function OrderDetailsTab({
  order,
  formatMoneyFn,
}: OrderDetailsTabProps) {
  const [serviceDetails, setServiceDetails] = useState<{
    description?: string;
    attributes?: string[];
    idealFor?: string[];
  } | null>(null);

  const formatVal = formatMoneyFn || formatMoney;
  const meta = (order as any).metadata || {};
  const primaryItem = order.items?.[0];
  const priceUnitLabel = getPriceUnitLabel(
    primaryItem?.packageType || (primaryItem as any)?.packageType,
    meta.chargePer
  );
  const priceUnitDisplay =
    priceUnitLabel === "service" || priceUnitLabel === "fixed"
      ? "service"
      : priceUnitLabel;

  // Use metadata first, then fetch from service if sourceServiceId exists
  const description =
    meta.serviceDescription ||
    serviceDetails?.description ||
    (order as any).description ||
    "";
  const attributes: string[] =
    meta.attributes && Array.isArray(meta.attributes)
      ? meta.attributes
      : serviceDetails?.attributes || [];
  const idealFor: string[] =
    meta.idealFor && Array.isArray(meta.idealFor)
      ? meta.idealFor
      : serviceDetails?.idealFor || [];

  useEffect(() => {
    const sourceServiceId = meta.sourceServiceId;
    if (!sourceServiceId || meta.serviceDescription) return;

    const fetchService = async () => {
      try {
        const res = await fetch(resolveApiUrl(`/api/services/${sourceServiceId}`), {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const svc = data.service || data;
        setServiceDetails({
          description: svc.description || undefined,
          attributes:
            (svc.packages?.[0]?.features || svc.highlights || []).filter(Boolean) ||
            [],
          idealFor: svc.idealFor || [],
        });
      } catch {
        // Ignore
      }
    };
    fetchService();
  }, [meta.sourceServiceId, meta.serviceDescription]);

  // Delivery by: order date + delivery days
  const orderDate = order.date ? new Date(order.date) : new Date();
  const deliveryDays = meta.deliveryDays ?? 0;
  const deliveryByDate = new Date(orderDate);
  deliveryByDate.setDate(deliveryByDate.getDate() + (typeof deliveryDays === "number" ? deliveryDays : 0));
  const deliveryByStr =
    order.scheduledDate ||
    order.expectedDelivery ||
    (order.booking?.date ? `${order.booking.date}${order.booking?.starttime ? ` at ${order.booking.starttime}` : ""}` : "") ||
    formatDate(deliveryByDate.toISOString());

  const isCustomOffer = meta.fromCustomOffer === true;
  const quantity = isCustomOffer && (meta.quantity ?? 0) > 0
    ? meta.quantity
    : (primaryItem?.quantity ?? 1);
  const unitPrice = isCustomOffer && (meta.unitPrice ?? 0) > 0
    ? meta.unitPrice
    : (primaryItem?.price ?? 0);
  const subtotal = order.subtotal ?? order.amountValue ?? unitPrice * quantity;
  const discount = order.discount ?? 0;
  const serviceFee = order.serviceFee ?? 0;
  const total = order.amountValue ?? order.amount ?? subtotal - discount + serviceFee;
  const promoCode = meta.promoCode || (order as any).promoCode?.code;

  const serviceTitle = order.service || primaryItem?.title || "Service";

  return (
    <div className="bg-white rounded-xl p-8 shadow-md">
      {/* Service Title */}
      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-4">
        {serviceTitle}
      </h2>

      {/* Service Description (About your service) */}
      {description && (
        <div className="mb-6">
          <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-semibold mb-2">
            About this service
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b] whitespace-pre-wrap">
            {description}
          </p>
        </div>
      )}

      {/* Offer Includes (attributes + ideal for) */}
      {(attributes.length > 0 || idealFor.length > 0) && (
        <div className="mb-6">
          <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] font-semibold mb-3">
            Offer includes
          </h3>
          <ul className="space-y-2 list-disc list-inside">
            {attributes.map((attr, i) => (
              <li
                key={i}
                className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]"
              >
                {attr}
              </li>
            ))}
            {idealFor.map((item, i) => (
              <li
                key={`ideal-${i}`}
                className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]"
              >
                Ideal for: {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Price Breakdown Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full font-['Poppins',sans-serif]">
          <tbody>
            <tr className="bg-gray-50">
              <td className="px-4 py-3 text-[14px] text-[#6b6b6b]">
                Price ({priceUnitDisplay === "service" || priceUnitDisplay === "fixed" ? "per service" : `per ${priceUnitDisplay}`})
              </td>
              <td className="px-4 py-3 text-right text-[14px] text-[#2c353f]">
                £{formatVal(unitPrice)}{priceUnitDisplay !== "service" && priceUnitDisplay !== "fixed" ? `/${priceUnitDisplay}` : ""}
              </td>
            </tr>
            <tr className="border-t border-gray-200">
              <td className="px-4 py-3 text-[14px] text-[#6b6b6b]">
                Delivery by
              </td>
              <td className="px-4 py-3 text-right text-[14px] text-[#2c353f]">
                {order.booking?.date && order.booking?.starttime
                  ? `${formatDate(order.booking.date)} at ${order.booking.starttime}${order.booking.endtime && order.booking.endtime !== order.booking.starttime ? ` - ${order.booking.endtime}` : ""}${order.booking.timeSlot ? ` (${order.booking.timeSlot})` : ""}`
                  : typeof deliveryByStr === "string" && /^\d{4}-\d{2}-\d{2}/.test(deliveryByStr)
                    ? formatDate(deliveryByStr)
                    : deliveryByStr}
              </td>
            </tr>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="px-4 py-3 text-[14px] text-[#6b6b6b]">
                Total no. of {priceUnitDisplay === "hour" ? "hours" : priceUnitDisplay === "day" ? "days" : priceUnitDisplay === "item" ? "items" : priceUnitDisplay + "s"}
              </td>
              <td className="px-4 py-3 text-right text-[14px] text-[#2c353f]">
                {quantity}
              </td>
            </tr>
            <tr className="border-t border-gray-200">
              <td className="px-4 py-3 text-[14px] text-[#6b6b6b]">
                Subtotal
              </td>
              <td className="px-4 py-3 text-right text-[14px] text-[#2c353f]">
                £{formatVal(subtotal)}
              </td>
            </tr>
            {discount > 0 && (
              <tr className="border-t border-gray-200">
                <td className="px-4 py-3 text-[14px] text-[#6b6b6b]">
                  Discount{promoCode ? ` (${promoCode})` : ""}
                </td>
                <td className="px-4 py-3 text-right text-[14px] text-green-600">
                  -£{formatVal(discount)}
                </td>
              </tr>
            )}
            <tr className="border-t border-gray-200">
              <td className="px-4 py-3 text-[14px] text-[#6b6b6b]">
                Service Fee
              </td>
              <td className="px-4 py-3 text-right text-[14px] text-[#2c353f]">
                £{formatVal(serviceFee ?? 0)}
              </td>
            </tr>
            <tr className="bg-gray-50 border-t-2 border-gray-300">
              <td className="px-4 py-3 text-[16px] font-semibold text-[#2c353f]">
                Total
              </td>
              <td className="px-4 py-3 text-right text-[16px] font-semibold text-[#2c353f]">
                £{formatVal(typeof total === "string" ? parseFloat(total) : total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
