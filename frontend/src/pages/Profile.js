import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import BottomNav from "../components/BottomNav";
import { User as UserIcon, LogOut, MapPin, Mail, ShoppingBag, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import BecomeVendorModal from "../components/BecomeVendorModal";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="container-mobile flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2E7D32] border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container-mobile" data-testid="profile-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] px-4 py-4">
        <h1 className="text-2xl font-medium text-[#1A2E1A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Profile
        </h1>
      </div>

      <div className="px-6 py-6">
        {/* User Info */}
        <div className="bg-white border border-[#E5E2DA] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#2E7D32] flex items-center justify-center">
                <UserIcon size={32} className="text-white" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-medium text-[#1A2E1A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {user?.name}
              </h2>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[#2E7D32]/10 text-[#2E7D32] mt-1">
                {user?.role === 'vendor' ? 'Vendor' : 'User'}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[#4A5D4E]">
              <Mail size={18} />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-6">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-white border border-[#E5E2DA] rounded-xl p-4 flex items-center gap-3 hover:bg-[#F4F1EA] transition-colors text-left"
              data-testid="admin-panel-button"
            >
              <div className="w-10 h-10 rounded-full bg-[#C65D47]/10 flex items-center justify-center">
                <Shield size={20} className="text-[#C65D47]" />
              </div>
              <div>
                <p className="font-medium text-[#1A2E1A]">Admin Panel</p>
                <p className="text-sm text-[#4A5D4E]">Onboard vendors & manage menus</p>
              </div>
            </button>
          )}
          {user?.role !== 'vendor' && user?.role !== 'admin' && (
            <button
              onClick={() => setShowVendorModal(true)}
              className="w-full bg-white border border-[#E5E2DA] rounded-xl p-4 flex items-center gap-3 hover:bg-[#F4F1EA] transition-colors text-left"
              data-testid="become-vendor-button"
            >
              <div className="w-10 h-10 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
                <ShoppingBag size={20} className="text-[#2E7D32]" />
              </div>
              <div>
                <p className="font-medium text-[#1A2E1A]">Become a Vendor</p>
                <p className="text-sm text-[#4A5D4E]">List your surplus food</p>
              </div>
            </button>
          )}
          
          {user?.role === 'vendor' && (
            <button
              onClick={() => navigate('/vendor')}
              className="w-full bg-white border border-[#E5E2DA] rounded-xl p-4 flex items-center gap-3 hover:bg-[#F4F1EA] transition-colors text-left"
              data-testid="vendor-dashboard-button"
            >
              <div className="w-10 h-10 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
                <ShoppingBag size={20} className="text-[#2E7D32]" />
              </div>
              <div>
                <p className="font-medium text-[#1A2E1A]">Vendor Dashboard</p>
                <p className="text-sm text-[#4A5D4E]">Manage your drops</p>
              </div>
            </button>
          )}
        </div>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-[#C65D47] text-[#C65D47] hover:bg-[#C65D47]/10 rounded-xl py-3 flex items-center justify-center gap-2"
          data-testid="logout-button"
        >
          <LogOut size={18} />
          Logout
        </Button>
      </div>

      <BottomNav active="profile" />
      
      {showVendorModal && (
        <BecomeVendorModal
          onClose={() => setShowVendorModal(false)}
          onSuccess={() => {
            setShowVendorModal(false);
            loadUser();
            toast.success('You are now a vendor!');
          }}
        />
      )}
    </div>
  );
}

export default Profile;
