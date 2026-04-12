import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import BottomNav from "../components/BottomNav";
import { Plus, Package, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

function VendorDashboard() {
  const [drops, setDrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drops');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dropsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/vendor/drops`, { withCredentials: true }),
        axios.get(`${API}/vendor/orders`, { withCredentials: true })
      ]);
      setDrops(dropsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleDropStatus = async (itemId, currentStatus) => {
    try {
      await axios.put(
        `${API}/vendor/drops/${itemId}`,
        { is_active: !currentStatus },
        { withCredentials: true }
      );
      toast.success('Drop status updated');
      loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="container-mobile" data-testid="vendor-dashboard">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-medium text-[#1A2E1A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Vendor Dashboard
          </h1>
          <Button
            onClick={() => navigate('/vendor/add-drop')}
            className="bg-[#2E7D32] hover:bg-[#205a22] text-white rounded-xl px-4 py-2 flex items-center gap-2"
            data-testid="add-drop-button"
          >
            <Plus size={18} />
            Add Drop
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E2DA] px-4">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('drops')}
            className={`py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'drops'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-[#4A5D4E]'
            }`}
            data-testid="drops-tab"
          >
            My Drops
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'orders'
                ? 'border-[#2E7D32] text-[#2E7D32]'
                : 'border-transparent text-[#4A5D4E]'
            }`}
            data-testid="orders-tab"
          >
            Orders ({orders.length})
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2E7D32] border-r-transparent"></div>
          </div>
        ) : activeTab === 'drops' ? (
          drops.length === 0 ? (
            <div className="text-center py-20">
              <Package size={64} className="text-[#E5E2DA] mx-auto mb-4" />
              <p className="text-[#1A2E1A] font-medium mb-2">No drops yet</p>
              <p className="text-sm text-[#4A5D4E] mb-6">Create your first food drop!</p>
              <Button
                onClick={() => navigate('/vendor/add-drop')}
                className="bg-[#2E7D32] hover:bg-[#205a22] text-white rounded-xl px-6 py-2"
              >
                Add Drop
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {drops.map((drop) => (
                <div
                  key={drop.item_id}
                  className="bg-white border border-[#E5E2DA] rounded-2xl overflow-hidden"
                  data-testid="vendor-drop-card"
                >
                  <div className="flex gap-4 p-4">
                    <div className="w-20 h-20 bg-[#F4F1EA] rounded-xl flex items-center justify-center flex-shrink-0">
                      {drop.image_url ? (
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}${drop.image_url}`}
                          alt={drop.name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Package size={32} className="text-[#E5E2DA]" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-[#1A2E1A]">{drop.name}</h3>
                          <p className="text-sm text-[#4A5D4E] mt-1">₹{drop.discounted_price}</p>
                        </div>
                        <button
                          onClick={() => toggleDropStatus(drop.item_id, drop.is_active)}
                          className="text-[#2E7D32]"
                          data-testid="toggle-drop-status"
                        >
                          {drop.is_active ? (
                            <ToggleRight size={32} className="text-[#2E7D32]" />
                          ) : (
                            <ToggleLeft size={32} className="text-[#4A5D4E]" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-[#4A5D4E] mb-3">
                        <span>{drop.quantity_available} left</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          drop.is_active
                            ? 'bg-[#2E7D32]/10 text-[#2E7D32]'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {drop.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => navigate(`/vendor/edit-drop/${drop.item_id}`)}
                        className="text-sm text-[#2E7D32] hover:underline"
                        data-testid="edit-drop-button"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          orders.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#4A5D4E]">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="bg-white border border-[#E5E2DA] rounded-2xl p-4"
                  data-testid="vendor-order-card"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-[#1A2E1A]">{order.food_item_name}</h3>
                      <p className="text-sm text-[#4A5D4E] mt-1">Qty: {order.quantity}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#2E7D32]/10 text-[#2E7D32]">
                      {order.status}
                    </span>
                  </div>
                  <div className="text-lg font-medium text-[#2E7D32]">
                    ₹{order.total_price.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <BottomNav active="vendor" />
    </div>
  );
}

export default VendorDashboard;
