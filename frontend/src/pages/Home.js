import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import BottomNav from "../components/BottomNav";
import DropCard from "../components/DropCard";
import { MapPin, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

function Home() {
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Request geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setUserLocation(location);
          loadDrops(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to get your location. Showing all drops.');
          loadDrops(null);
        }
      );
    } else {
      loadDrops(null);
    }
  }, []);

  const loadDrops = async (location) => {
    try {
      const params = location ? { lat: location.lat, lon: location.lon } : {};
      const response = await axios.get(`${API}/drops`, {
        params,
        withCredentials: true
      });
      setDrops(response.data);
    } catch (error) {
      console.error('Error loading drops:', error);
      toast.error('Failed to load drops');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-mobile" data-testid="home-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-[#1A2E1A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Perfectly Good
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-[#4A5D4E]">
              <MapPin size={14} />
              <span>{userLocation ? 'Near you' : 'All locations'}</span>
            </div>
          </div>
          <button className="p-2 rounded-xl hover:bg-[#F4F1EA] transition-colors">
            <SlidersHorizontal size={20} className="text-[#4A5D4E]" />
          </button>
        </div>
      </div>

      {/* Drops Feed */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2E7D32] border-r-transparent"></div>
          </div>
        ) : drops.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#4A5D4E]">No drops available right now</p>
            <p className="text-sm text-[#4A5D4E] mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drops.map((drop) => (
              <DropCard
                key={drop.item_id}
                drop={drop}
                onClick={() => navigate(`/drop/${drop.item_id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}

export default Home;
