import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import { ArrowLeft, Plus, Upload, X, MapPin, Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

function AdminPanel() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("vendors"); // "vendors" | "add-vendor" | "menu"
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const navigate = useNavigate();

  // Vendor form
  const [vendorForm, setVendorForm] = useState({ name: "", category: "Restaurant", email: "", password: "", location: { lat: 0, lon: 0, address: "" }, logo_url: "" });
  // Menu item form
  const [menuForm, setMenuForm] = useState({ name: "", description: "", original_price: "", image_url: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = async () => {
    try {
      const res = await axios.get(`${API}/admin/vendors`, { withCredentials: true });
      setVendors(res.data);
    } catch (err) {
      if (err.response?.status === 403) { toast.error("Admin access required"); navigate("/"); }
      else toast.error("Failed to load vendors");
    } finally { setLoading(false); }
  };

  const loadMenu = async (vendor) => {
    setSelectedVendor(vendor);
    try {
      const res = await axios.get(`${API}/admin/vendors/${vendor.vendor_id}/menu`, { withCredentials: true });
      setMenuItems(res.data);
      setActiveView("menu");
    } catch (err) { toast.error("Failed to load menu"); }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setVendorForm(prev => ({ ...prev, location: { lat: pos.coords.latitude, lon: pos.coords.longitude, address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` } }));
        toast.success("Location captured!");
      },
      () => toast.error("Failed to get location")
    );
  };

  const handleUpload = async (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axios.post(`${API}/admin/upload`, fd, { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } });
      if (target === "logo") setVendorForm(prev => ({ ...prev, logo_url: res.data.image_url }));
      else setMenuForm(prev => ({ ...prev, image_url: res.data.image_url }));
      toast.success("Image uploaded!");
    } catch (err) { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const createVendor = async (e) => {
    e.preventDefault();
    if (!vendorForm.name || !vendorForm.email || !vendorForm.password) { toast.error("Fill required fields"); return; }
    try {
      await axios.post(`${API}/admin/vendors`, vendorForm, { withCredentials: true });
      toast.success("Vendor created!");
      setVendorForm({ name: "", category: "Restaurant", email: "", password: "", location: { lat: 0, lon: 0, address: "" }, logo_url: "" });
      setActiveView("vendors");
      loadVendors();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to create vendor"); }
  };

  const addMenuItem = async (e) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.original_price) { toast.error("Name and price are required"); return; }
    try {
      await axios.post(`${API}/admin/vendors/${selectedVendor.vendor_id}/menu`, {
        ...menuForm,
        original_price: parseFloat(menuForm.original_price)
      }, { withCredentials: true });
      toast.success("Menu item added!");
      setMenuForm({ name: "", description: "", original_price: "", image_url: "" });
      loadMenu(selectedVendor);
    } catch (err) { toast.error("Failed to add menu item"); }
  };

  const deleteMenuItem = async (menuItemId) => {
    try {
      await axios.delete(`${API}/admin/menu-items/${menuItemId}`, { withCredentials: true });
      toast.success("Menu item removed");
      loadMenu(selectedVendor);
    } catch (err) { toast.error("Failed to remove"); }
  };

  const [confirmDelete, setConfirmDelete] = useState(null);

  const deleteVendor = async (vendorId) => {
    try {
      await axios.delete(`${API}/admin/vendors/${vendorId}`, { withCredentials: true });
      toast.success("Vendor deleted");
      setConfirmDelete(null);
      loadVendors();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed to delete vendor"); }
  };

  const imgSrc = (url) => url ? (url.startsWith("http") ? url : `${process.env.REACT_APP_BACKEND_URL}${url}`) : null;

  return (
    <div className="container-mobile" data-testid="admin-panel">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] px-4 py-4">
        <div className="flex items-center gap-3">
          {activeView !== "vendors" && (
            <button onClick={() => { setActiveView("vendors"); setSelectedVendor(null); }} className="p-1">
              <ArrowLeft size={20} className="text-[#1A2E1A]" />
            </button>
          )}
          <h1 className="text-2xl font-medium text-[#1A2E1A]" style={{ fontFamily: "Outfit, sans-serif" }}>
            {activeView === "vendors" ? "Admin Panel" : activeView === "add-vendor" ? "Add Vendor" : `Menu: ${selectedVendor?.name}`}
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 pb-24">
        {/* ---------- VENDORS LIST ---------- */}
        {activeView === "vendors" && (
          <>
            <Button onClick={() => setActiveView("add-vendor")} className="w-full mb-6 bg-[#2E7D32] hover:bg-[#205a22] text-white rounded-xl py-3 flex items-center justify-center gap-2" data-testid="add-vendor-button">
              <Plus size={18} /> Onboard New Vendor
            </Button>

            {loading ? (
              <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2E7D32] border-r-transparent"></div></div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-20"><p className="text-[#4A5D4E]">No vendors yet</p></div>
            ) : (
              <div className="space-y-3">
                {vendors.map((v) => (
                  <div key={v.vendor_id} className="bg-white border border-[#E5E2DA] rounded-2xl p-4" data-testid="admin-vendor-card">
                    <div className="flex gap-3 items-start">
                      <div className="w-14 h-14 bg-[#F4F1EA] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {v.logo_url ? <img src={imgSrc(v.logo_url)} alt="" className="w-full h-full object-cover" /> : <Package size={24} className="text-[#E5E2DA]" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-[#1A2E1A]">{v.name}</h3>
                        <p className="text-xs text-[#4A5D4E] mt-0.5">{v.category} &middot; {v.user_email}</p>
                        {v.location?.address && <p className="text-xs text-[#4A5D4E] flex items-center gap-1 mt-1"><MapPin size={11} />{v.location.address}</p>}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => loadMenu(v)} className="flex-1 text-sm font-medium text-[#2E7D32] bg-[#2E7D32]/10 py-2 rounded-lg hover:bg-[#2E7D32]/20 transition-colors" data-testid="manage-menu-button">
                        Manage Menu
                      </button>
                      {confirmDelete === v.vendor_id ? (
                        <div className="flex gap-1">
                          <button onClick={() => deleteVendor(v.vendor_id)} className="text-xs font-medium text-white bg-[#C65D47] px-3 py-2 rounded-lg hover:bg-[#b04d3a] transition-colors" data-testid="confirm-delete-vendor">
                            Yes, delete
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs font-medium text-[#4A5D4E] bg-[#F4F1EA] px-3 py-2 rounded-lg hover:bg-[#E5E2DA] transition-colors">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(v.vendor_id)} className="px-3 py-2 text-[#C65D47] hover:bg-[#C65D47]/10 rounded-lg transition-colors" data-testid="delete-vendor-button">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Back to home */}
            <button onClick={() => navigate("/")} className="mt-6 text-sm text-[#4A5D4E] hover:text-[#1A2E1A] flex items-center gap-1">
              <ArrowLeft size={14} /> Back to Home
            </button>
          </>
        )}

        {/* ---------- ADD VENDOR ---------- */}
        {activeView === "add-vendor" && (
          <form onSubmit={createVendor} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Business Name <span className="text-[#C65D47]">*</span></label>
              <input type="text" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]" placeholder="e.g., Green Leaf Bakery" data-testid="admin-vendor-name" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Category</label>
                <select value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                  className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white" data-testid="admin-vendor-category">
                  <option>Restaurant</option><option>Bakery</option><option>Cafe</option><option>Grocery Store</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Location</label>
                <button type="button" onClick={handleGetLocation} className="w-full px-4 py-3 border border-dashed border-[#E5E2DA] rounded-xl text-sm text-[#4A5D4E] hover:border-[#2E7D32] transition-colors flex items-center justify-center gap-1" data-testid="admin-get-location">
                  <MapPin size={14} /> {vendorForm.location.lat ? "Update" : "Get Location"}
                </button>
              </div>
            </div>
            {vendorForm.location.address && <p className="text-xs text-[#4A5D4E] -mt-2">{vendorForm.location.address}</p>}
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Vendor Login Email <span className="text-[#C65D47]">*</span></label>
              <input type="email" value={vendorForm.email} onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]" placeholder="vendor@business.com" data-testid="admin-vendor-email" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Vendor Password <span className="text-[#C65D47]">*</span></label>
              <input type="text" value={vendorForm.password} onChange={(e) => setVendorForm({ ...vendorForm, password: e.target.value })}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32]" placeholder="Temporary password" data-testid="admin-vendor-password" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Logo / Cover Photo</label>
              {vendorForm.logo_url ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-[#F4F1EA]">
                  <img src={imgSrc(vendorForm.logo_url)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setVendorForm({ ...vendorForm, logo_url: "" })} className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow"><X size={14} /></button>
                </div>
              ) : (
                <label className="w-full h-32 border-2 border-dashed border-[#E5E2DA] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#2E7D32] transition-colors">
                  <Upload size={24} className="text-[#4A5D4E] mb-1" />
                  <span className="text-xs text-[#4A5D4E]">{uploading ? "Uploading..." : "Upload logo"}</span>
                  <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "logo")} className="hidden" />
                </label>
              )}
            </div>
            <Button type="submit" className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white rounded-xl py-3.5 font-medium" data-testid="admin-create-vendor-submit">
              Create Vendor Account
            </Button>
          </form>
        )}

        {/* ---------- MENU MANAGEMENT ---------- */}
        {activeView === "menu" && selectedVendor && (
          <>
            {/* Add menu item form */}
            <div className="bg-[#F4F1EA] rounded-2xl p-5 mb-6">
              <h3 className="text-lg font-medium text-[#1A2E1A] mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Add Menu Item</h3>
              <form onSubmit={addMenuItem} className="space-y-3">
                <input type="text" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E5E2DA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white" placeholder="Item name *" data-testid="menu-item-name" required />
                <textarea value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E5E2DA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white resize-none" rows="2" placeholder="Description" data-testid="menu-item-description" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D4E] text-sm">&#8377;</span>
                    <input type="number" step="0.01" value={menuForm.original_price} onChange={(e) => setMenuForm({ ...menuForm, original_price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2.5 border border-[#E5E2DA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white" placeholder="Original price *" data-testid="menu-item-price" required />
                  </div>
                  <div>
                    {menuForm.image_url ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 border border-[#E5E2DA] rounded-xl bg-white">
                        <img src={imgSrc(menuForm.image_url)} alt="" className="w-8 h-8 rounded object-cover" />
                        <span className="text-xs text-[#4A5D4E] flex-1 truncate">Uploaded</span>
                        <button type="button" onClick={() => setMenuForm({ ...menuForm, image_url: "" })}><X size={14} className="text-[#4A5D4E]" /></button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-dashed border-[#E5E2DA] rounded-xl cursor-pointer hover:border-[#2E7D32] transition-colors text-xs text-[#4A5D4E]">
                        <Upload size={14} /> {uploading ? "..." : "Photo"}
                        <input type="file" accept="image/*" onChange={(e) => handleUpload(e, "menu")} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white rounded-xl py-2.5 text-sm" data-testid="add-menu-item-submit">
                  <Plus size={16} className="mr-1" /> Add to Menu
                </Button>
              </form>
            </div>

            {/* Menu items list */}
            <h3 className="text-lg font-medium text-[#1A2E1A] mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
              Menu Items ({menuItems.length})
            </h3>
            {menuItems.length === 0 ? (
              <div className="text-center py-12"><p className="text-sm text-[#4A5D4E]">No menu items yet. Add items above.</p></div>
            ) : (
              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div key={item.menu_item_id} className="bg-white border border-[#E5E2DA] rounded-xl p-3 flex gap-3 items-center" data-testid="menu-item-card">
                    <div className="w-14 h-14 bg-[#F4F1EA] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image_url ? <img src={imgSrc(item.image_url)} alt="" className="w-full h-full object-cover" /> : <Package size={20} className="text-[#E5E2DA]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#1A2E1A] text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-[#4A5D4E] truncate">{item.description}</p>
                      <p className="text-sm font-medium text-[#2E7D32] mt-0.5">&#8377;{item.original_price}</p>
                    </div>
                    <button onClick={() => deleteMenuItem(item.menu_item_id)} className="p-2 text-[#C65D47] hover:bg-[#C65D47]/10 rounded-lg transition-colors" data-testid="delete-menu-item">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
