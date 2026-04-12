import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import DropDetail from "./pages/DropDetail";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import VendorDashboard from "./pages/VendorDashboard";
import AddEditDrop from "./pages/AddEditDrop";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/drop/:itemId" element={<ProtectedRoute><DropDetail /></ProtectedRoute>} />
          <Route path="/checkout/:itemId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/vendor" element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>} />
          <Route path="/vendor/add-drop" element={<ProtectedRoute><AddEditDrop /></ProtectedRoute>} />
          <Route path="/vendor/edit-drop/:itemId" element={<ProtectedRoute><AddEditDrop /></ProtectedRoute>} />
        </Routes>
        <Toaster position="top-center" />
      </BrowserRouter>
    </div>
  );
}

export default App;
