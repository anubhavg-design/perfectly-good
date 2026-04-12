import { useNavigate, useLocation } from "react-router-dom";
import { House, Receipt, User, Storefront } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function BottomNav({ active }) {
  const navigate = useNavigate();
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const response = await axios.get(`${API}/auth/me`, { withCredentials: true });
        setIsVendor(response.data.role === 'vendor');
      } catch (error) {
        console.error('Error checking role:', error);
      }
    };
    checkRole();
  }, []);

  const navItems = isVendor ? [
    { id: 'home', label: 'Home', icon: House, path: '/' },
    { id: 'vendor', label: 'Dashboard', icon: Storefront, path: '/vendor' },
    { id: 'orders', label: 'Orders', icon: Receipt, path: '/orders' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ] : [
    { id: 'home', label: 'Home', icon: House, path: '/' },
    { id: 'orders', label: 'Orders', icon: Receipt, path: '/orders' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-[#E5E2DA] px-4 py-3 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]" data-testid="bottom-nav">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 transition-colors"
              data-testid={`nav-${item.id}`}
              data-active={isActive}
            >
              <Icon
                size={24}
                weight={isActive ? "fill" : "regular"}
                className={isActive ? "text-[#2E7D32]" : "text-[#4A5D4E]"}
              />
              <span className={`text-xs ${isActive ? "text-[#2E7D32] font-medium" : "text-[#4A5D4E]"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BottomNav;
