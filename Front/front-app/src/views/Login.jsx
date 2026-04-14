import React, { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function Login({ onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState("123@123");
  const [password, setPassword] = useState("pass");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Temporary fake authentication
    if (email && password) {
      if (email === "123@123" && password === "pass") {
        alert("Login successful!");
        onLogin("vendor");
        return;
      }

      try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid email or password");
      }

      const data = await response.json();
      console.log("Login successful, received data:", data);
      const user_type = data.user_type;
      const token = data.token;

      // Store the token in localStorage for future requests
      localStorage.setItem("authToken", token);
      localStorage.setItem("userType", user_type);

      // alert("Login successful!");
      onLogin(user_type); // Tell App.js that login succeeded and pass the user type
    } 
    catch (error) {
      console.error("Error during login:", error);
      alert("Login failed. Please try again.");
    }
    } else {
      alert("Please enter both email and password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-3">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
          <p className="text-slate-500 text-sm">
            Sign in to access the Rationing Manager
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
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
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition pr-12"
                placeholder="Enter your password"
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

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-500 transition shadow-lg shadow-emerald-200/50"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Don’t have an account?{" "}
          <button
            type = "button"
            onClick = {onSwitchToSignup}
            className="text-emerald-600 font-medium hover:underline"
          > 
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}