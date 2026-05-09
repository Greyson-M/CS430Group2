import React, { useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function Signup({ onSignup, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (!role) {
      setError("Please select a role.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const registerResponse = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_type: role === "distributor" ? "vendors" : "wanters",
          username: email,
          password: password,
        }),
      });

      const registerData = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) {
        throw new Error(registerData.error || registerData.message || "Failed to register.");
      }

      const loginResponse = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const loginData = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok) {
        throw new Error(loginData.error || loginData.message || "Account created, but automatic login failed.");
      }

      localStorage.setItem("authToken", loginData.token);
      localStorage.setItem("userType", loginData.user_type);
      localStorage.setItem("userId", loginData.user_id);

      onSignup(loginData.user_type);
    } catch (submissionError) {
      console.error("Error during signup:", submissionError);
      setError(submissionError.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <UserPlus className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Create Account</h2>
          <p className="text-slate-500 text-sm">
            Sign up to access the Rationing Manager
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-medium font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-medium font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-medium font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition pr-12"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-medium font-medium text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition"
              placeholder="Confirm your password"
            />
          </div>

          <div className="mb-4">
            <label className="block text-medium font-medium text-slate-700 mb-1">Role</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-medium">
                <input
                  type="radio"
                  name="role"
                  value="distributor"
                  checked={role === "distributor"}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-radio"
                />
                Resource Distributor
              </label>
              <label className="flex items-center gap-1 text-medium">
                <input
                  type="radio"
                  name="role"
                  value="recipient"
                  checked={role === "recipient"}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-radio"
                />
                Resource Recipient
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-500 transition shadow-lg shadow-emerald-200/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-emerald-600 font-medium hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}