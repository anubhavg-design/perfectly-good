import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      try {
        // Parse endTime (format: "HH:MM" or "HH:MM AM/PM")
        const now = new Date();
        const [hours, minutes] = endTime.split(":").map(s => parseInt(s.replace(/[^0-9]/g, '')));
        
        const endDate = new Date();
        let endHour = hours;
        
        // Handle AM/PM
        if (endTime.toLowerCase().includes('pm') && hours !== 12) {
          endHour = hours + 12;
        } else if (endTime.toLowerCase().includes('am') && hours === 12) {
          endHour = 0;
        }
        
        endDate.setHours(endHour, minutes, 0, 0);
        
        // If end time is past, assume it's tomorrow
        if (endDate < now) {
          endDate.setDate(endDate.getDate() + 1);
        }
        
        const diff = endDate - now;
        
        if (diff <= 0) {
          setTimeLeft("Expired");
          return;
        }
        
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hoursLeft > 0) {
          setTimeLeft(`${hoursLeft}h ${minutesLeft}m`);
        } else {
          setTimeLeft(`${minutesLeft}m`);
        }
      } catch (error) {
        setTimeLeft("-");
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="bg-[#C65D47]/10 px-3 py-1.5 rounded-full flex items-center gap-1.5">
      <Clock size={12} className="text-[#C65D47]" />
      <span className="text-[#C65D47] font-medium text-sm">{timeLeft}</span>
    </div>
  );
}

export default CountdownTimer;
