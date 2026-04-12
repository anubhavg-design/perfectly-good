import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
import BottomNav from "../components/BottomNav";
import DropCard from "../components/DropCard";
import { MapPin, Search, X, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

function Home() {
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = { lat: position.coords.latitude, lon: position.coords.longitude };
          setUserLocation(location);
          loadDrops(location, {});
        },
        () => {
          toast.error("Unable to get your location. Showing all drops.");
          loadDrops(null, {});
        }
      );
    } else {
      loadDrops(null, {});
    }
  }, []);

  const loadCategories = async () => {
    try {
      const res = await axios.get(`${API}/drops/categories`, { withCredentials: true });
      setCategories(res.data);
    } catch (e) { /* ignore */ }
  };

  const loadDrops = useCallback(async (location, filters) => {
    setLoading(true);
    try {
      const params = {};
      if (location) { params.lat = location.lat; params.lon = location.lon; }
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.sortBy) params.sort_by = filters.sortBy;

      const response = await axios.get(`${API}/drops`, { params, withCredentials: true });
      setDrops(response.data);
    } catch (error) {
      console.error("Error loading drops:", error);
      toast.error("Failed to load drops");
    } finally {
      setLoading(false);
    }
  }, []);

  const applyFilters = () => {
    loadDrops(userLocation, { search: searchQuery, category: selectedCategory, maxPrice, sortBy });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setMaxPrice("");
    setSortBy("");
    setShowFilters(false);
    loadDrops(userLocation, {});
  };

  const handleSearch = (e) => {
    e.preventDefault();
    applyFilters();
  };

  const hasActiveFilters = selectedCategory || maxPrice || sortBy;

  return (
    <div className="container-mobile" data-testid="home-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E2DA] px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-medium text-[#1A2E1A]" style={{ fontFamily: "Outfit, sans-serif" }}>
              Perfectly Good
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-[#4A5D4E]">
              <MapPin size={14} />
              <span>{userLocation ? "Near you" : "All locations"}</span>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl transition-colors relative ${showFilters ? "bg-[#2E7D32]/10" : "hover:bg-[#F4F1EA]"}`}
            data-testid="filter-toggle-button"
          >
            <SlidersHorizontal size={20} className={showFilters ? "text-[#2E7D32]" : "text-[#4A5D4E]"} />
            {hasActiveFilters && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C65D47] rounded-full"></span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D4E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food, restaurants..."
            className="w-full pl-10 pr-10 py-2.5 border border-[#E5E2DA] rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow"
            data-testid="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(""); applyFilters(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X size={16} className="text-[#4A5D4E]" />
            </button>
          )}
        </form>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-[#E5E2DA] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200" data-testid="filter-panel">
            {/* Category chips */}
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[#4A5D4E] mb-2 uppercase tracking-wider">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedCategory === cat
                          ? "bg-[#2E7D32] text-white"
                          : "bg-[#F4F1EA] text-[#4A5D4E] hover:bg-[#E5E2DA]"
                      }`}
                      data-testid={`category-chip-${cat}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Sort row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#4A5D4E] mb-1.5 uppercase tracking-wider">Max Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D4E] text-sm">&#8377;</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Any"
                    className="w-full pl-7 pr-3 py-2 border border-[#E5E2DA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                    data-testid="max-price-input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4A5D4E] mb-1.5 uppercase tracking-wider">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5E2DA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                  data-testid="sort-select"
                >
                  <option value="">Distance</option>
                  <option value="price">Price: Low to High</option>
                  <option value="discount">Biggest Discount</option>
                </select>
              </div>
            </div>

            {/* Apply / Clear */}
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="flex-1 bg-[#2E7D32] text-white text-sm font-medium py-2 rounded-xl hover:bg-[#205a22] transition-colors active:scale-[0.98]"
                data-testid="apply-filters-button"
              >
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-[#E5E2DA] text-sm text-[#4A5D4E] rounded-xl hover:bg-[#F4F1EA] transition-colors"
                  data-testid="clear-filters-button"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
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
            <p className="text-sm text-[#4A5D4E] mt-2">
              {hasActiveFilters ? "Try adjusting your filters" : "Check back soon!"}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 text-[#2E7D32] font-medium text-sm hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {drops.map((drop) => (
              <DropCard key={drop.item_id} drop={drop} onClick={() => navigate(`/drop/${drop.item_id}`)} />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}

export default Home;
