import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Badge } from "./ui/badge";
import { Clock, Calendar as CalendarIcon, CheckCircle2, X } from "lucide-react";
import { Separator } from "./ui/separator";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date, time: string, timeSlot: string) => void;
  sellerName: string;
  serviceTitle: string;
}

const timeSlots = [
  { slot: "Morning", times: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] },
  { slot: "Afternoon", times: ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"] },
  { slot: "Evening", times: ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30"] }
];

export default function BookingModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  sellerName,
  serviceTitle 
}: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleConfirm = () => {
    if (selectedDate && selectedTime && selectedTimeSlot) {
      onConfirm(selectedDate, selectedTime, selectedTimeSlot);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedTimeSlot("");
    setShowTimePicker(false);
    onClose();
  };

  const handleTimeClick = (time: string, slot: string) => {
    setSelectedTime(time);
    setSelectedTimeSlot(slot);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // Fade out calendar and show time picker
      setTimeout(() => {
        setShowTimePicker(true);
      }, 300);
    }
  };

  const handleBackToCalendar = () => {
    setShowTimePicker(false);
    setSelectedTime("");
    setSelectedTimeSlot("");
  };

  // Disable past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="font-['Poppins',sans-serif] text-[24px] md:text-[28px] text-[#2c353f] mb-2">
                Select Appointment Time
              </DialogTitle>
              <DialogDescription className="font-['Poppins',sans-serif] text-[14px] text-[#6b6b6b]">
                Choose a convenient date and time for your service with {sellerName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Service Info Banner */}
        <div className="bg-gradient-to-r from-[#FFF5EB] to-[#FFE8CC] rounded-xl p-4 mb-6">
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#2c353f]">
            <span className="font-medium">Service:</span> {serviceTitle}
          </p>
          <p className="font-['Poppins',sans-serif] text-[13px] text-[#6b6b6b] mt-1">
            <span className="font-medium">Professional:</span> {sellerName}
          </p>
        </div>

        {/* Single Unified Picker Box */}
        <div className="border-2 border-gray-200 rounded-2xl p-4 md:p-6 bg-gradient-to-br from-white to-gray-50 min-h-[400px] relative overflow-hidden">
          
          {/* Calendar View */}
          <div 
            className={`absolute inset-0 p-4 md:p-6 transition-all duration-300 ${
              showTimePicker 
                ? 'opacity-0 pointer-events-none translate-x-[-20px]' 
                : 'opacity-100 translate-x-0'
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#FE8A0F] rounded-full flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium">
                Select Date
              </h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-2 md:p-4 shadow-sm flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < today}
                className="font-['Poppins',sans-serif]"
              />
            </div>
            {selectedDate && !showTimePicker && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-green-700 font-medium">
                    {formatDate(selectedDate)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Time Picker View */}
          <div 
            className={`absolute inset-0 p-4 md:p-6 transition-all duration-300 ${
              showTimePicker 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 pointer-events-none translate-x-[20px]'
            }`}
          >
            {/* Header with Back Button */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleBackToCalendar}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Back to calendar"
              >
                <svg 
                  className="w-4 h-4 text-[#2c353f]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-['Poppins',sans-serif] text-[16px] md:text-[18px] text-[#2c353f] font-medium">
                    Select Time
                  </h3>
                  {selectedDate && (
                    <p className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] text-[#6b6b6b]">
                      {selectedDate.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div className="space-y-4 max-h-[280px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {timeSlots.map((slotGroup) => (
                <div key={slotGroup.slot}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#6b6b6b] flex-shrink-0" />
                    <Badge 
                      variant="outline" 
                      className="font-['Poppins',sans-serif] text-[11px] md:text-[12px] border-[#FE8A0F] text-[#FE8A0F]"
                    >
                      {slotGroup.slot}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {slotGroup.times.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeClick(time, slotGroup.slot)}
                        className={`
                          py-2 md:py-2.5 px-2 md:px-3 rounded-lg border-2 transition-all font-['Poppins',sans-serif] text-[12px] md:text-[13px]
                          ${selectedTime === time 
                            ? "border-[#3B82F6] bg-blue-50 text-[#3B82F6] font-medium shadow-sm" 
                            : "border-gray-200 bg-white hover:border-[#3B82F6] hover:bg-blue-50 text-[#2c353f]"
                          }
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Time Confirmation */}
            {selectedTime && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <p className="font-['Poppins',sans-serif] text-[12px] md:text-[13px] text-blue-700 font-medium">
                    Selected: {selectedTime} ({selectedTimeSlot})
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Summary and Actions */}
        <div>
          {selectedDate && selectedTime ? (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-4">
              <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f] mb-2">
                <span className="font-medium">Your Appointment:</span>
              </p>
              <p className="font-['Poppins',sans-serif] text-[16px] text-[#FE8A0F] font-medium">
                {formatDate(selectedDate)} at {selectedTime}
              </p>
              <p className="font-['Poppins',sans-serif] text-[12px] text-[#6b6b6b] mt-1">
                The professional will contact you to confirm details
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="font-['Poppins',sans-serif] text-[13px] text-yellow-800">
                Please select both date and time to continue
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime}
              className="flex-1 bg-[#FE8A0F] hover:bg-[#FFB347] hover:shadow-[0_0_20px_rgba(254,138,15,0.6)] text-white py-6 rounded-xl transition-all duration-300 font-['Poppins',sans-serif] text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Confirm & Continue
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="px-6 py-6 rounded-xl font-['Poppins',sans-serif] text-[15px] border-2"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
