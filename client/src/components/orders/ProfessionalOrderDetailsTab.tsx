import { Order } from "./types";
import { formatDate } from "./utils";

interface ProfessionalOrderDetailsTabProps {
  order: Order;
}

export default function ProfessionalOrderDetailsTab({
  order,
}: ProfessionalOrderDetailsTabProps) {
  return (
    <div className="bg-white rounded-xl p-8 shadow-md">
      <h2 className="font-['Poppins',sans-serif] text-[24px] text-[#2c353f] mb-4">
        {order.service}
      </h2>

      {/* Service Category */}
      <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6">
        <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
          {order.category || "Professional Service"}
        </p>
      </div>

      {/* Offer Includes Section */}
      <div className="mb-6">
        <h3 className="font-['Poppins',sans-serif] text-[16px] text-[#2c353f] mb-3">
          Offer Includes
        </h3>
        <ul className="space-y-2 list-disc list-inside">
          <li className="font-['Poppins',sans-serif] text-[14px] text-blue-600 hover:underline cursor-pointer">
            Professional service delivery
          </li>
          <li className="font-['Poppins',sans-serif] text-[14px] text-blue-600 hover:underline cursor-pointer">
            Quality assured work
          </li>
          {order.description && (
            <li className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
              {order.description}
            </li>
          )}
        </ul>
      </div>

      {/* Price Breakdown Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <tbody>
            <tr className="bg-gray-50">
              <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Price
              </td>
              <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                £10.00/Hours
              </td>
            </tr>
            <tr className="border-t border-gray-200">
              <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Delivered by
              </td>
              <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                {(order as any).scheduledDate ? formatDate((order as any).scheduledDate) : "10-12-2025"}
              </td>
            </tr>
            {(order.booking?.date || order.booking?.time) && (
              <tr className="border-t border-gray-200">
                <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                  Delivery Date & Time
                </td>
                <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                  {order.booking?.date ? formatDate(order.booking.date) : "TBD"}
                  {order.booking?.time && ` at ${order.booking.time}`}
                  {order.booking?.timeSlot && ` (${order.booking.timeSlot})`}
                </td>
              </tr>
            )}
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Total no. of Hours
              </td>
              <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                2
              </td>
            </tr>
            <tr className="border-t border-gray-200">
              <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Quantity
              </td>
              <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                {order.items?.[0]?.quantity || 1}
              </td>
            </tr>
            <tr className="border-t border-gray-200">
              <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Price
              </td>
              <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                £10.00
              </td>
            </tr>
            <tr className="bg-gray-50 border-t border-gray-200">
              <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Sub Total
              </td>
              <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                £20.00
              </td>
            </tr>
            <tr className="border-t border-gray-200">
              <td className="px-4 py-3 font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Service Fee
              </td>
              <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                £5.00
              </td>
            </tr>
            <tr className="bg-gray-50 border-t-2 border-gray-300">
              <td className="px-4 py-3 font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                Total
              </td>
              <td className="px-4 py-3 text-right font-['Poppins',sans-serif] text-[16px] text-[#2c353f]">
                {order.amount}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
