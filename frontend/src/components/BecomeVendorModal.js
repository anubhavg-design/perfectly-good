import { useState } from "react";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import { X, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

function BecomeVendorModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Restaurant',
    location: { lat: 0, lon: 0, address: '' }
  });
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
            }
          });
          toast.success('Location captured!');
          setGettingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Failed to get location');
          setGettingLocation(false);
        }
      );
    } else {
      toast.error('Geolocation not supported');
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location.lat) {
      toast.error('Please fill all fields and get location');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/vendor/create`, formData, { withCredentials: true });
      onSuccess();
    } catch (error) {
      console.error('Error creating vendor:', error);
      toast.error(error.response?.data?.detail || 'Failed to create vendor account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
        data-testid="become-vendor-modal"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-medium text-[#1A2E1A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Become a Vendor
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#F4F1EA] flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-[#4A5D4E]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A2E1A] mb-2">Business Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow"
              placeholder="e.g., Green Café"
              data-testid="vendor-name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A2E1A] mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow"
              data-testid="vendor-category-select"
            >
              <option>Restaurant</option>
              <option>Café</option>
              <option>Bakery</option>
              <option>Grocery Store</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A2E1A] mb-2">Location</label>
            {formData.location.lat === 0 ? (
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gettingLocation}
                className="w-full px-4 py-3 border-2 border-dashed border-[#E5E2DA] rounded-xl hover:border-[#2E7D32] hover:bg-[#2E7D32]/5 transition-colors flex items-center justify-center gap-2 text-[#4A5D4E] disabled:opacity-50"
                data-testid="get-location-button"
              >
                <MapPin size={18} />
                {gettingLocation ? 'Getting location...' : 'Get Current Location'}
              </button>
            ) : (
              <div className="px-4 py-3 border border-[#E5E2DA] rounded-xl bg-[#F4F1EA] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-[#2E7D32]" />
                  <span className="text-sm text-[#4A5D4E]">{formData.location.address}</span>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="text-xs text-[#2E7D32] hover:underline"
                >
                  Update
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            data-testid="submit-vendor-button"
          >
            {loading ? 'Creating...' : 'Create Vendor Account'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default BecomeVendorModal;
