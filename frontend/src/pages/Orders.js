import { useEffect, useState } from "react";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import BottomNav from "../components/BottomNav";
import { Package, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders/user`, { withCredentials: true });
      setOrders(response.data);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "reserved": return "bg-[#2E7D32]/10 text-[#2E7D32]";
      case "picked_up": return "bg-blue-500/10 text-blue-600";
      case "cancelled": return "bg-[#C65D47]/10 text-[#C65D47]";
      case "expired": return "bg-gray-200 text-gray-500";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ");

  return (
    <div className="container-mobile" data-testid="orders-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] px-4 py-4">
        <h1 className="text-2xl font-medium text-[#1A2E1A]" style={{ fontFamily: "Outfit, sans-serif" }}>
          My Orders
        </h1>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2E7D32] border-r-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={64} className="text-[#E5E2DA] mx-auto mb-4" />
            <p className="text-[#1A2E1A] font-medium mb-2">No orders yet</p>
            <p className="text-sm text-[#4A5D4E]">Start saving food and money!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.order_id}
                className={`bg-white border rounded-2xl overflow-hidden ${order.status === "expired" ? "border-gray-200 opacity-70" : "border-[#E5E2DA]"}`}
                data-testid="order-card"
              >
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-20 bg-[#F4F1EA] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {order.image_url ? (
                      <img
                        src={order.image_url.startsWith("http") ? order.image_url : `${process.env.REACT_APP_BACKEND_URL}${order.image_url}`}
                        alt={order.food_item_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={32} className="text-[#E5E2DA]" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-[#1A2E1A] mb-1">{order.food_item_name}</h3>
                        <p className="text-sm text-[#4A5D4E]">{order.vendor_name}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    {order.status === "expired" && (
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-500">
                        <AlertTriangle size={12} />
                        <span>This order expired (not picked up in time)</span>
                      </div>
                    )}

                    <div className="space-y-1.5 mt-3">
                      <div className="flex items-center gap-2 text-sm text-[#4A5D4E]">
                        <Package size={14} />
                        <span>Quantity: {order.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#4A5D4E]">
                        <Clock size={14} />
                        <span>{order.pickup_time}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#E5E2DA] flex items-center justify-between">
                      <span className="text-sm text-[#4A5D4E]">Total</span>
                      <span className="text-lg font-medium text-[#2E7D32]">&#8377;{order.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="orders" />
    </div>
  );
}

export default Orders;
