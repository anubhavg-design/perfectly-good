import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import { ArrowLeft, Package, MapPin, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

function Checkout() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [drop, setDrop] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadDrop();
    loadRazorpayScript();
  }, [itemId]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const loadDrop = async () => {
    try {
      const response = await axios.get(`${API}/drops/${itemId}`, {
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

  const handleCheckout = async () => {
    setProcessing(true);
    
    try {
      // Create Razorpay order
      const orderResponse = await axios.post(
        `${API}/orders/create`,
        {
          food_item_id: itemId,
          quantity: quantity
        },
        { withCredentials: true }
      );

      const { razorpay_order_id, amount, currency, key_id } = orderResponse.data;

      // Get user info
      const userResponse = await axios.get(`${API}/auth/me`, { withCredentials: true });
      const user = userResponse.data;

      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        order_id: razorpay_order_id,
        name: "Perfectly Good",
        description: drop.name,
        image: "https://via.placeholder.com/100",
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await axios.post(
              `${API}/orders/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                food_item_id: itemId,
                quantity: quantity
              },
              { withCredentials: true }
            );

            toast.success('Order placed successfully!');
            navigate('/orders');
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: "#2E7D32"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
      razorpay.on('payment.failed', function (response) {
        toast.error('Payment failed');
      });

    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container-mobile flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2E7D32] border-r-transparent"></div>
      </div>
    );
  }

  if (!drop) return null;

  const subtotal = drop.discounted_price * quantity;
  const convenienceFee = Math.round(subtotal * 5) / 100;
  const total = subtotal + convenienceFee;

  return (
    <div className="container-mobile" data-testid="checkout-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#1A2E1A] hover:text-[#2E7D32] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Checkout</span>
        </button>
      </div>

      <div className="px-6 py-6">
        {/* Order Summary */}
        <h2 className="text-2xl font-medium text-[#1A2E1A] mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Order Summary
        </h2>

        {/* Item card */}
        <div className="bg-white border border-[#E5E2DA] rounded-2xl overflow-hidden mb-6">
          <div className="flex gap-4 p-4">
            <div className="w-20 h-20 bg-[#F4F1EA] rounded-xl flex items-center justify-center flex-shrink-0">
              {drop.image_url ? (
                <img
                  src={drop.image_url.startsWith("http") ? drop.image_url : `${process.env.REACT_APP_BACKEND_URL}${drop.image_url}`}
                  alt={drop.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Package size={32} className="text-[#E5E2DA]" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-[#1A2E1A] mb-1">{drop.name}</h3>
              <p className="text-sm text-[#4A5D4E] mb-2">{drop.vendor_name}</p>
              <p className="text-lg font-medium text-[#2E7D32]">₹{drop.discounted_price}</p>
            </div>
          </div>
        </div>

        {/* Quantity selector */}
        <div className="bg-[#F4F1EA] rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-[#1A2E1A] mb-3">Quantity</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-xl bg-white border border-[#E5E2DA] flex items-center justify-center text-[#1A2E1A] font-medium hover:bg-[#F4F1EA] transition-colors"
              data-testid="decrease-quantity"
            >
              -
            </button>
            <span className="text-xl font-medium text-[#1A2E1A] min-w-[3rem] text-center" data-testid="quantity-value">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(drop.quantity_available, quantity + 1))}
              disabled={quantity >= drop.quantity_available}
              className="w-10 h-10 rounded-xl bg-white border border-[#E5E2DA] flex items-center justify-center text-[#1A2E1A] font-medium hover:bg-[#F4F1EA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="increase-quantity"
            >
              +
            </button>
          </div>
        </div>

        {/* Pickup details */}
        <div className="border border-[#E5E2DA] rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-medium text-[#1A2E1A] mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Pickup Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-[#2E7D32] mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#1A2E1A]">Pickup Time</p>
                <p className="text-sm text-[#4A5D4E]">{drop.pickup_start_time} - {drop.pickup_end_time}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-[#2E7D32] mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#1A2E1A]">Location</p>
                <p className="text-sm text-[#4A5D4E]">{drop.vendor_name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="bg-[#F4F1EA] rounded-2xl p-6 mb-20">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#4A5D4E]">Item price</span>
            <span className="text-[#1A2E1A]">&#8377;{drop.discounted_price}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#4A5D4E]">Quantity</span>
            <span className="text-[#1A2E1A]">&times; {quantity}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#4A5D4E]">Subtotal</span>
            <span className="text-[#1A2E1A]">&#8377;{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#4A5D4E]">Convenience fee (5%)</span>
            <span className="text-[#1A2E1A]">&#8377;{convenienceFee.toFixed(2)}</span>
          </div>
          <div className="border-t border-[#E5E2DA] my-4"></div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium text-[#1A2E1A]" style={{ fontFamily: 'Outfit, sans-serif' }}>Total</span>
            <span className="text-2xl font-medium text-[#2E7D32]" data-testid="total-price">&#8377;{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#E5E2DA] px-6 py-4">
        <Button
          onClick={handleCheckout}
          disabled={processing}
          className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          data-testid="confirm-order-button"
        >
          {processing ? 'Processing...' : `Pay ₹${total.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}

export default Checkout;
