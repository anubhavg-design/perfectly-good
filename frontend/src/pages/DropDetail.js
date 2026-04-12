import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import { ArrowLeft, Clock, MapPin, Package } from "lucide-react";
import { Button } from "../components/ui/button";
import CountdownTimer from "../components/CountdownTimer";
import { toast } from "sonner";

function DropDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [drop, setDrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setUserLocation(location);
          loadDrop(location);
        },
        () => loadDrop(null)
      );
    } else {
      loadDrop(null);
    }
  }, [itemId]);

  const loadDrop = async (location) => {
    try {
      const params = location ? { lat: location.lat, lon: location.lon } : {};
      const response = await axios.get(`${API}/drops/${itemId}`, {
        params,
        withCredentials: true
      });
      setDrop(response.data);
    } catch (error) {
      console.error('Error loading drop:', error);
      toast.error('Failed to load drop details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-mobile flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2E7D32] border-r-transparent"></div>
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="container-mobile flex items-center justify-center">
        <p className="text-[#4A5D4E]">Drop not found</p>
      </div>
    );
  }

  const savings = ((drop.original_price - drop.discounted_price) / drop.original_price * 100).toFixed(0);

  return (
    <div className="container-mobile" data-testid="drop-detail-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#1A2E1A] hover:text-[#2E7D32] transition-colors"
          data-testid="back-button"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Image */}
      <div className="relative h-80 bg-[#F4F1EA]">
        {drop.image_url ? (
          <img
            src={`${process.env.REACT_APP_BACKEND_URL}${drop.image_url}`}
            alt={drop.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={80} className="text-[#E5E2DA]" />
          </div>
        )}
        
        {/* Floating badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
            <span className="text-[#1A2E1A] text-sm font-medium">{savings}% OFF</span>
          </div>
        </div>
        
        <div className="absolute top-4 right-4">
          <div className="bg-[#C65D47]/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm">
            <span className="text-white text-sm font-medium">{drop.quantity_available} left!</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <h1 className="text-3xl font-medium text-[#1A2E1A] mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {drop.name}
        </h1>
        
        <div className="flex items-center gap-2 mb-6">
          <MapPin size={16} className="text-[#4A5D4E]" />
          <span className="text-[#4A5D4E]">{drop.vendor_name}</span>
          {drop.distance && (
            <span className="text-[#2E7D32] font-medium ml-1">{drop.distance} km away</span>
          )}
        </div>

        <p className="text-base text-[#4A5D4E] leading-relaxed mb-6">
          {drop.description}
        </p>

        {/* Pricing */}
        <div className="bg-[#F4F1EA] rounded-2xl p-6 mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-4xl font-medium text-[#2E7D32]">₹{drop.discounted_price}</span>
            <span className="text-xl text-[#C65D47] line-through">₹{drop.original_price}</span>
          </div>
          <p className="text-sm text-[#4A5D4E]">You save ₹{(drop.original_price - drop.discounted_price).toFixed(2)}</p>
        </div>

        {/* Pickup Details */}
        <div className="border border-[#E5E2DA] rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-medium text-[#1A2E1A] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Pickup Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-[#2E7D32] mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#1A2E1A]">Pickup Window</p>
                <p className="text-sm text-[#4A5D4E]">{drop.pickup_start_time} - {drop.pickup_end_time}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-[#2E7D32] mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#1A2E1A]">Location</p>
                <p className="text-sm text-[#4A5D4E]">{drop.vendor_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Time urgency */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-[#4A5D4E]">Time remaining:</span>
          <CountdownTimer endTime={drop.pickup_end_time} />
        </div>
      </div>

      {/* Fixed bottom reserve button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#E5E2DA] px-6 py-4">
        <Button
          onClick={() => navigate(`/checkout/${itemId}`)}
          disabled={drop.quantity_available === 0 || !drop.is_active}
          className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="reserve-button"
        >
          {drop.quantity_available === 0 ? 'Sold Out' : `Reserve for ₹${drop.discounted_price}`}
        </Button>
      </div>
    </div>
  );
}

export default DropDetail;
