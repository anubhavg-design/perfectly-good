import { useState } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  return String(detail);
}

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          toast.error("Name is required");
          setLoading(false);
          return;
        }
        await axios.post(`${API}/auth/register`, { name, email, password }, { withCredentials: true });
        toast.success("Account created!");
      } else {
        await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
        toast.success("Welcome back!");
      }
      navigate("/");
    } catch (err) {
      const msg = formatApiError(err.response?.data?.detail);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-mobile min-h-screen flex flex-col items-center justify-center px-6" data-testid="login-page">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-medium text-[#1A2E1A] mb-3"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Perfectly Good
          </h1>
          <p className="text-[#4A5D4E] text-base">
            Save food. Save money.
            <br />
            Discover discounted surplus food nearby.
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="w-36 h-36 bg-gradient-to-br from-[#2E7D32]/10 to-[#C65D47]/10 rounded-full flex items-center justify-center">
            <svg className="w-20 h-20 text-[#2E7D32]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow bg-white"
                placeholder="Your name"
                data-testid="register-name-input"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow bg-white"
              placeholder="you@example.com"
              required
              data-testid="login-email-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-shadow bg-white"
              placeholder="Min 6 characters"
              required
              minLength={6}
              data-testid="login-password-input"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            data-testid="login-submit-button"
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <p className="text-sm text-[#4A5D4E] text-center mt-6">
          {isRegister ? "Already have an account?" : "Don't have an account?"}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-[#2E7D32] font-medium ml-1 hover:underline"
            data-testid="toggle-auth-mode"
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
