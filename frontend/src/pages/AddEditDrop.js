import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import { ArrowLeft, Upload, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

function AddEditDrop() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!itemId;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    original_price: '',
    discounted_price: '',
    quantity_available: '',
    pickup_start_time: '',
    pickup_end_time: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      loadDrop();
    }
  }, [itemId]);

  const loadDrop = async () => {
    try {
      const response = await axios.get(`${API}/drops/${itemId}`, {
        withCredentials: true
      });
      const drop = response.data;
      setFormData({
        name: drop.name,
        description: drop.description,
        original_price: drop.original_price,
        discounted_price: drop.discounted_price,
        quantity_available: drop.quantity_available,
        pickup_start_time: drop.pickup_start_time,
        pickup_end_time: drop.pickup_end_time,
        image_url: drop.image_url || ''
      });
      if (drop.image_url) {
        setImagePreview(`${process.env.REACT_APP_BACKEND_URL}${drop.image_url}`);
      }
    } catch (error) {
      console.error('Error loading drop:', error);
      toast.error('Failed to load drop');
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.original_price || !formData.discounted_price) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = formData.image_url;
      
      // Upload image if new file selected
      if (imageFile) {
        setUploading(true);
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        
        const uploadResponse = await axios.post(
          `${API}/vendor/upload`,
          imageFormData,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
        imageUrl = uploadResponse.data.image_url;
        setUploading(false);
      }

      const submitData = {
        ...formData,
        original_price: parseFloat(formData.original_price),
        discounted_price: parseFloat(formData.discounted_price),
        quantity_available: parseInt(formData.quantity_available),
        image_url: imageUrl
      };

      if (isEdit) {
        await axios.put(`${API}/vendor/drops/${itemId}`, submitData, {
          withCredentials: true
        });
        toast.success('Drop updated successfully');
      } else {
        await axios.post(`${API}/vendor/drops`, submitData, {
          withCredentials: true
        });
        toast.success('Drop created successfully');
      }
      
      navigate('/vendor');
    } catch (error) {
      console.error('Error saving drop:', error);
      toast.error(error.response?.data?.detail || 'Failed to save drop');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="container-mobile" data-testid="add-edit-drop-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#1A2E1A] hover:text-[#2E7D32] transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">{isEdit ? 'Edit Drop' : 'Add New Drop'}</span>
        </button>
      </div>

      <div className="px-6 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-[#1A2E1A] mb-2">Food Image</label>
            {imagePreview ? (
              <div className="relative w-full h-48 bg-[#F4F1EA] rounded-2xl overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setFormData({ ...formData, image_url: '' });
                  }}
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors"
                >
                  <X size={16} className="text-[#4A5D4E]" />
                </button>
              </div>
            ) : (
              <label className="w-full h-48 border-2 border-dashed border-[#E5E2DA] rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#2E7D32] hover:bg-[#2E7D32]/5 transition-colors">
                <Upload size={32} className="text-[#4A5D4E] mb-2" />
                <span className="text-sm text-[#4A5D4E]">Click to upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  data-testid="image-upload-input"
                />
              </label>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#1A2E1A] mb-2">
              Item Name <span className="text-[#C65D47]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow"
              placeholder="e.g., Fresh Croissants"
              data-testid="drop-name-input"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#1A2E1A] mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow resize-none"
              rows="3"
              placeholder="Describe your food item..."
              data-testid="drop-description-input"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-2">
                Original Price <span className="text-[#C65D47]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5D4E]">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow"
                  placeholder="100"
                  data-testid="original-price-input"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-2">
                Discounted Price <span className="text-[#C65D47]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5D4E]">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discounted_price}
                  onChange={(e) => setFormData({ ...formData, discounted_price: e.target.value })}
                  className="w-full pl-8 pr-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow"
                  placeholder="50"
                  data-testid="discounted-price-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-[#1A2E1A] mb-2">
              Quantity Available <span className="text-[#C65D47]">*</span>
            </label>
            <input
              type="number"
              value={formData.quantity_available}
              onChange={(e) => setFormData({ ...formData, quantity_available: e.target.value })}
              className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow"
              placeholder="10"
              data-testid="quantity-input"
              required
            />
          </div>

          {/* Pickup Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-2">
                Pickup Start <span className="text-[#C65D47]">*</span>
              </label>
              <input
                type="time"
                value={formData.pickup_start_time}
                onChange={(e) => setFormData({ ...formData, pickup_start_time: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow"
                data-testid="pickup-start-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-2">
                Pickup End <span className="text-[#C65D47]">*</span>
              </label>
              <input
                type="time"
                value={formData.pickup_end_time}
                onChange={(e) => setFormData({ ...formData, pickup_end_time: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow"
                data-testid="pickup-end-input"
                required
              />
            </div>
          </div>
        </form>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#E5E2DA] px-6 py-4">
        <Button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          data-testid="save-drop-button"
        >
          {uploading ? 'Uploading...' : loading ? 'Saving...' : isEdit ? 'Update Drop' : 'Create Drop'}
        </Button>
      </div>
    </div>
  );
}

export default AddEditDrop;
