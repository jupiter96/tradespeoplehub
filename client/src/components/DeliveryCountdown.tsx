import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface DeliveryCountdownProps {
  expectedDelivery: string; // ISO date string
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
}

export default function DeliveryCountdown({ expectedDelivery }: DeliveryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOverdue: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expectedDelivery).getTime() - new Date().getTime();
      const absoluteDifference = Math.abs(difference);
      
      return {
        days: Math.floor(absoluteDifference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((absoluteDifference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((absoluteDifference / 1000 / 60) % 60),
        seconds: Math.floor((absoluteDifference / 1000) % 60),
        isOverdue: difference < 0
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expectedDelivery]);

  const formatDeliveryDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    // Get ordinal suffix
    const getOrdinal = (dayNumber: number) => {
      const suffixes = ["th", "st", "nd", "rd"];
      const remainder = dayNumber % 100;
      return suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0];
    };
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const endHours = String((date.getHours() + 1) % 24).padStart(2, '0');
    const endMinutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${dayName} ${day}${getOrdinal(day)} ${month}, ${year} ${hours}:${minutes}-${endHours}:${endMinutes}`;
  };

  return (
    <div className={`${timeLeft.isOverdue ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'} border rounded-xl p-6`}>
      {/* Expected Delivery Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full ${timeLeft.isOverdue ? 'bg-red-100' : 'bg-blue-100'} flex items-center justify-center`}>
          {timeLeft.isOverdue ? (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          ) : (
            <Clock className="w-5 h-5 text-blue-600" />
          )}
        </div>
        <div>
          <p className={`font-['Poppins',sans-serif] text-[14px] ${timeLeft.isOverdue ? 'text-red-700' : 'text-[#6b6b6b]'}`}>
            {timeLeft.isOverdue ? '⚠️ Delivery overdue by:' : 'Expected delivery:'}
          </p>
          <p className="font-['Poppins',sans-serif] text-[14px] text-[#2c353f]">
            {formatDeliveryDate(expectedDelivery)}
          </p>
        </div>
      </div>

      {/* Countdown Timer */}
      <div className={`grid grid-cols-3 gap-4 rounded-xl p-4 border ${
        timeLeft.isOverdue 
          ? 'bg-gradient-to-br from-red-100 to-red-50 border-red-200' 
          : 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-200'
      }`}>
        {/* Days */}
        <div className="text-center">
          <div className={`font-['Poppins',sans-serif] text-[32px] mb-1 ${
            timeLeft.isOverdue ? 'text-red-700' : 'text-[#2c353f]'
          }`}>
            {timeLeft.days}
          </div>
          <div className={`font-['Poppins',sans-serif] text-[13px] ${
            timeLeft.isOverdue ? 'text-red-600' : 'text-[#6b6b6b]'
          }`}>
            Days
          </div>
        </div>

        {/* Hours */}
        <div className="text-center">
          <div className={`font-['Poppins',sans-serif] text-[32px] mb-1 ${
            timeLeft.isOverdue ? 'text-red-700' : 'text-[#2c353f]'
          }`}>
            {timeLeft.hours}
          </div>
          <div className={`font-['Poppins',sans-serif] text-[13px] ${
            timeLeft.isOverdue ? 'text-red-600' : 'text-[#6b6b6b]'
          }`}>
            Hours
          </div>
        </div>

        {/* Minutes */}
        <div className="text-center">
          <div className={`font-['Poppins',sans-serif] text-[32px] mb-1 ${
            timeLeft.isOverdue ? 'text-red-700' : 'text-[#2c353f]'
          }`}>
            {timeLeft.minutes}
          </div>
          <div className={`font-['Poppins',sans-serif] text-[13px] ${
            timeLeft.isOverdue ? 'text-red-600' : 'text-[#6b6b6b]'
          }`}>
            Minutes
          </div>
        </div>
      </div>

      {/* Warning message for overdue */}
      {timeLeft.isOverdue && (
        <div className="mt-4 bg-red-100 border border-red-200 rounded-lg p-3">
          <p className="font-['Poppins',sans-serif] text-[13px] text-red-700 text-center">
            Please contact the professional or request support
          </p>
        </div>
      )}

      {/* Optional: Progress bar for normal delivery */}
      {!timeLeft.isOverdue && timeLeft.days < 7 && (
        <div className="mt-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000"
              style={{ 
                width: `${Math.min(100, ((7 - timeLeft.days) / 7) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}