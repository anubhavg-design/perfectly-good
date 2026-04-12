import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import { ArrowLeft, Package, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

function AddEditDrop() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!itemId;

  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pickupStart, setPickupStart] = useState("");
  const [pickupEnd, setPickupEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    loadMenu();
    if (isEdit) loadDrop();
  }, [itemId]);

  const loadMenu = async () => {
    try {
      const res = await axios.get(`${API}/vendor/menu`, { withCredentials: true });
      setMenuItems(res.data);
    } catch (err) {
      console.error("Error loading menu:", err);
    } finally {
      setLoadingMenu(false);
    }
  };

  const loadDrop = async () => {
    try {
      const res = await axios.get(`${API}/drops/${itemId}`, { withCredentials: true });
      const drop = res.data;
      setDiscountedPrice(drop.discounted_price);
      setQuantity(drop.quantity_available);
      setPickupStart(drop.pickup_start_time);
      setPickupEnd(drop.pickup_end_time);
      // Try to match menu item
      if (drop.menu_item_id) {
        setSelectedMenuItem({ menu_item_id: drop.menu_item_id, name: drop.name, description: drop.description, original_price: drop.original_price, image_url: drop.image_url });
      }
    } catch (err) {
      toast.error("Failed to load drop");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMenuItem) { toast.error("Select a menu item"); return; }
    if (!discountedPrice || !quantity || !pickupStart || !pickupEnd) { toast.error("Fill all fields"); return; }
    if (parseFloat(discountedPrice) >= selectedMenuItem.original_price) { toast.error("Discounted price must be less than original"); return; }

    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/vendor/drops/${itemId}`, {
          discounted_price: parseFloat(discountedPrice),
          quantity_available: parseInt(quantity),
          pickup_start_time: pickupStart,
          pickup_end_time: pickupEnd,
        }, { withCredentials: true });
        toast.success("Drop updated!");
      } else {
        await axios.post(`${API}/vendor/drops`, {
          menu_item_id: selectedMenuItem.menu_item_id,
          discounted_price: parseFloat(discountedPrice),
          quantity_available: parseInt(quantity),
          pickup_start_time: pickupStart,
          pickup_end_time: pickupEnd,
        }, { withCredentials: true });
        toast.success("Drop created!");
      }
      navigate("/vendor");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save drop");
    } finally {
      setLoading(false);
    }
  };

  const imgSrc = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

  const savings = selectedMenuItem && discountedPrice
    ? ((selectedMenuItem.original_price - parseFloat(discountedPrice)) / selectedMenuItem.original_price * 100).toFixed(0)
    : 0;

  return (
    <div className="container-mobile" data-testid="add-edit-drop-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] px-4 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#1A2E1A] hover:text-[#2E7D32] transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium">{isEdit ? "Edit Drop" : "Create Drop"}</span>
        </button>
      </div>

      <div className="px-6 py-6 pb-24">
        {/* Step 1: Select from menu */}
        {!isEdit && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-[#1A2E1A] mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
              1. Select Menu Item
            </h2>
            {loadingMenu ? (
              <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-3 border-solid border-[#2E7D32] border-r-transparent"></div></div>
            ) : menuItems.length === 0 ? (
              <div className="text-center py-8 bg-[#F4F1EA] rounded-2xl">
                <p className="text-sm text-[#4A5D4E] mb-2">No menu items available</p>
                <p className="text-xs text-[#4A5D4E]">Ask your admin to add items to your menu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.menu_item_id}
                    type="button"
                    onClick={() => setSelectedMenuItem(item)}
                    className={`w-full flex gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedMenuItem?.menu_item_id === item.menu_item_id
                        ? "border-[#2E7D32] bg-[#2E7D32]/5 ring-1 ring-[#2E7D32]"
                        : "border-[#E5E2DA] bg-white hover:border-[#2E7D32]/50"
                    }`}
                    data-testid="menu-item-select"
                  >
                    <div className="w-14 h-14 bg-[#F4F1EA] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image_url ? <img src={imgSrc(item.image_url)} alt="" className="w-full h-full object-cover" /> : <Package size={20} className="text-[#E5E2DA]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#1A2E1A] text-sm">{item.name}</h4>
                      <p className="text-xs text-[#4A5D4E] truncate">{item.description}</p>
                      <p className="text-sm font-medium text-[#1A2E1A] mt-0.5">&#8377;{item.original_price}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected item preview (edit mode) */}
        {isEdit && selectedMenuItem && (
          <div className="mb-6 bg-[#F4F1EA] rounded-2xl p-4 flex gap-3">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {selectedMenuItem.image_url ? <img src={imgSrc(selectedMenuItem.image_url)} alt="" className="w-full h-full object-cover" /> : <Package size={24} className="text-[#E5E2DA]" />}
            </div>
            <div>
              <h3 className="font-medium text-[#1A2E1A]">{selectedMenuItem.name}</h3>
              <p className="text-xs text-[#4A5D4E]">{selectedMenuItem.description}</p>
              <p className="text-sm font-medium text-[#1A2E1A] mt-1">Original: &#8377;{selectedMenuItem.original_price}</p>
            </div>
          </div>
        )}

        {/* Step 2: Set drop details */}
        {(selectedMenuItem || isEdit) && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-lg font-medium text-[#1A2E1A]" style={{ fontFamily: "Outfit, sans-serif" }}>
              {isEdit ? "Update Details" : "2. Set Drop Details"}
            </h2>

            {/* Discounted Price */}
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">
                Discounted Price <span className="text-[#C65D47]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5D4E]">&#8377;</span>
                <input
                  type="number" step="0.01" value={discountedPrice}
                  onChange={(e) => setDiscountedPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  placeholder={selectedMenuItem ? `Less than ${selectedMenuItem.original_price}` : ""}
                  data-testid="discounted-price-input" required
                />
              </div>
              {selectedMenuItem && discountedPrice && parseFloat(discountedPrice) < selectedMenuItem.original_price && (
                <p className="text-xs text-[#2E7D32] mt-1 font-medium">{savings}% discount — Customers save &#8377;{(selectedMenuItem.original_price - parseFloat(discountedPrice)).toFixed(2)}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Quantity Available <span className="text-[#C65D47]">*</span></label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                placeholder="10" data-testid="quantity-input" required />
            </div>

            {/* Pickup Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Pickup Start <span className="text-[#C65D47]">*</span></label>
                <input type="time" value={pickupStart} onChange={(e) => setPickupStart(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  data-testid="pickup-start-input" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Pickup End <span className="text-[#C65D47]">*</span></label>
                <input type="time" value={pickupEnd} onChange={(e) => setPickupEnd(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  data-testid="pickup-end-input" required />
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Fixed bottom button */}
      {(selectedMenuItem || isEdit) && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#E5E2DA] px-6 py-4">
          <Button onClick={handleSubmit} disabled={loading}
            className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            data-testid="save-drop-button">
            {loading ? "Saving..." : isEdit ? "Update Drop" : "Create Drop"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default AddEditDrop;
