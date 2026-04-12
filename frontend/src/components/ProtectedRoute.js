import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function ProtectedRoute({ children }) {
  const [authState, setAuthState] = useState(null); // null = checking, true = ok, false = denied
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get(`${API}/auth/me`, { withCredentials: true });
        setAuthState(true);
      } catch {
        setAuthState(false);
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  if (authState === null) {
    return (
      <div className="container-mobile flex items-center justify-center min-h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2E7D32] border-r-transparent"></div>
      </div>
    );
  }

  return authState ? children : null;
}

export default ProtectedRoute;
