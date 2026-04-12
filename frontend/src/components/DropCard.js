import { useNavigate } from "react-router-dom";
import { Clock, MapPin, Package } from "lucide-react";
import CountdownTimer from "./CountdownTimer";

function DropCard({ drop, onClick }) {
  const savings = ((drop.original_price - drop.discounted_price) / drop.original_price * 100).toFixed(0);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#E5E2DA] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
      data-testid="drop-card"
    >
      {/* Image */}
      <div className="relative h-48 bg-[#F4F1EA]">
        {drop.image_url ? (
          <img
            src={`${process.env.REACT_APP_BACKEND_URL}${drop.image_url}`}
            alt={drop.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-[#E5E2DA]" />
          </div>
        )}
        
        {/* Floating badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="text-[#1A2E1A] text-xs font-medium">{savings}% OFF</span>
          </div>
          {drop.distance && (
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <MapPin size={12} className="text-[#2E7D32]" />
              <span className="text-[#1A2E1A] text-xs font-medium">{drop.distance} km</span>
            </div>
          )}
        </div>
        
        {/* Quantity badge */}
        <div className="absolute top-3 right-3">
          <div className="bg-[#C65D47]/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-white text-xs font-medium">{drop.quantity_available} left!</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-medium text-[#1A2E1A] mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {drop.name}
        </h3>
        <p className="text-sm text-[#4A5D4E] mb-3">{drop.vendor_name}</p>
        
        {/* Pricing */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-medium text-[#2E7D32]">₹{drop.discounted_price}</span>
          <span className="text-sm text-[#C65D47] line-through">₹{drop.original_price}</span>
        </div>
        
        {/* Pickup time & countdown */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-[#4A5D4E]">
            <Clock size={14} />
            <span>{drop.pickup_start_time}</span>
          </div>
          <CountdownTimer endTime={drop.pickup_end_time} />
        </div>
      </div>
    </div>
  );
}

export default DropCard;
