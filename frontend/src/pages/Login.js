import { useState } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function formatApiError(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  return String(detail);
}

function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot" | "reset"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/register`, { name, email, password }, { withCredentials: true });
      toast.success("Account created!");
      navigate("/");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email });
      toast.success("Check your email for reset instructions");
      // In test mode, auto-fill the token returned from API
      if (res.data.reset_token) {
        setResetToken(res.data.reset_token);
        setMode("reset");
      }
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, { token: resetToken, new_password: newPassword });
      toast.success("Password reset successfully! Please log in.");
      setMode("login");
      setPassword("");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-mobile min-h-screen flex flex-col items-center justify-center px-6" data-testid="login-page">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-medium text-[#1A2E1A] mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
            Perfectly Good
          </h1>
          <p className="text-[#4A5D4E] text-base">
            Save food. Save money.<br />Discover discounted surplus food nearby.
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

        {/* ---- LOGIN ---- */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                placeholder="you@example.com" required data-testid="login-email-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                placeholder="Min 6 characters" required minLength={6} data-testid="login-password-input" />
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setMode("forgot")} className="text-sm text-[#2E7D32] hover:underline" data-testid="forgot-password-link">
                Forgot password?
              </button>
            </div>
            <Button type="submit" disabled={loading}
              className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              data-testid="login-submit-button">
              {loading ? "Please wait..." : "Sign In"}
            </Button>
            <p className="text-sm text-[#4A5D4E] text-center mt-6">
              Don't have an account?
              <button type="button" onClick={() => setMode("register")} className="text-[#2E7D32] font-medium ml-1 hover:underline" data-testid="toggle-auth-mode">
                Register
              </button>
            </p>
          </form>
        )}

        {/* ---- REGISTER ---- */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                placeholder="Your name" data-testid="register-name-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                placeholder="you@example.com" required data-testid="login-email-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                placeholder="Min 6 characters" required minLength={6} data-testid="login-password-input" />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              data-testid="login-submit-button">
              {loading ? "Please wait..." : "Create Account"}
            </Button>
            <p className="text-sm text-[#4A5D4E] text-center mt-6">
              Already have an account?
              <button type="button" onClick={() => setMode("login")} className="text-[#2E7D32] font-medium ml-1 hover:underline" data-testid="toggle-auth-mode">
                Sign In
              </button>
            </p>
          </form>
        )}

        {/* ---- FORGOT PASSWORD ---- */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <button type="button" onClick={() => setMode("login")} className="flex items-center gap-1 text-sm text-[#4A5D4E] hover:text-[#1A2E1A] mb-2">
              <ArrowLeft size={16} /> Back to login
            </button>
            <h2 className="text-xl font-medium text-[#1A2E1A]" style={{ fontFamily: "Outfit, sans-serif" }}>Reset Password</h2>
            <p className="text-sm text-[#4A5D4E]">Enter your email and we'll send you a reset link.</p>
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                placeholder="you@example.com" required data-testid="forgot-email-input" />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              data-testid="forgot-submit-button">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        {/* ---- RESET PASSWORD ---- */}
        {mode === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <button type="button" onClick={() => setMode("login")} className="flex items-center gap-1 text-sm text-[#4A5D4E] hover:text-[#1A2E1A] mb-2">
              <ArrowLeft size={16} /> Back to login
            </button>
            <h2 className="text-xl font-medium text-[#1A2E1A]" style={{ fontFamily: "Outfit, sans-serif" }}>Set New Password</h2>
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">Reset Token</label>
              <input type="text" value={resetToken} onChange={(e) => setResetToken(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                placeholder="Paste your reset token" required data-testid="reset-token-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A2E1A] mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2E7D32] bg-white"
                placeholder="Min 6 characters" required minLength={6} data-testid="new-password-input" />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full bg-[#2E7D32] hover:bg-[#205a22] text-white font-medium py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
              data-testid="reset-submit-button">
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;
