import { PlayCircle, FileText } from "lucide-react";
import { Order } from "./types";
import { resolveFileUrl, formatDateTime } from "./utils";

interface ProfessionalOrderAdditionalInfoTabProps {
  order: Order;
}

export default function ProfessionalOrderAdditionalInfoTab({
  order,
}: ProfessionalOrderAdditionalInfoTabProps) {
  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-6">
      {/* Client's Additional Information */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-4">
          Additional Information from Client
        </h3>

        {order.additionalInformation?.submittedAt ? (
          <div className="space-y-4">
            {/* Submitted Message */}
            {order.additionalInformation.message && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mb-2">
                  Client's message:
                </p>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
                  {order.additionalInformation.message}
                </p>
              </div>
            )}

            {/* Submitted Files */}
            {order.additionalInformation.files && order.additionalInformation.files.length > 0 && (
              <div>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mb-3">
                  Attachments ({order.additionalInformation.files.length}):
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {order.additionalInformation.files.map((file: any, index: number) => (
                    <div 
                      key={index} 
                      className="relative rounded-lg overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => window.open(resolveFileUrl(file.url), '_blank')}
                    >
                      {file.fileType === 'image' ? (
                        <img 
                          src={resolveFileUrl(file.url)}
                          alt={file.fileName}
                          className="w-full h-24 object-cover"
                        />
                      ) : file.fileType === 'video' ? (
                        <div className="w-full h-24 bg-gray-200 flex items-center justify-center">
                          <PlayCircle className="w-8 h-8 text-gray-600" />
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-600" />
                        </div>
                      )}
                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#6b6b6b] p-2 truncate">
                        {file.fileName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="font-['Poppins',sans-serif] text-[12px] text-blue-600">
              ✓ Submitted on {new Date(order.additionalInformation.submittedAt).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        ) : (
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            No additional information has been submitted by the client yet.
          </p>
        )}
      </div>

      {order.description && (
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-['Poppins',sans-serif] text-[18px] text-[#2c353f] mb-3">
            Client Requirements
          </h3>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
            {order.description}
          </p>
        </div>
      )}
    </div>
  );
}
