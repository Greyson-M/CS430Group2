import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function RegisterResource({ setActivePage, addResource }) {
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    location: "",
    quantity: "",
    unit: "",
    status: "Public",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // TODO (backend): This form will eventually submit to POST /api/resources
  // Currently updates frontend state only
  const handleSubmit = (e) => {
    e.preventDefault();

    const newResource = {
      id: Date.now(), // temp ID
      name: formData.name,
      total: Number(formData.quantity),
      remaining: Number(formData.quantity),
      status: formData.status,
      provider: formData.provider,
      location: formData.location,
      unit: formData.unit,
    };
  
  // TODO (backend): Replace addResource with API call
  // POST /api/resources
  // Expected response: created resource object with DB-generated ID
  addResource(newResource); ///////////
  setActivePage({ page: "home" });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      
      {/* Back Button */}
      <button
        onClick={() => setActivePage({ page: "home" })}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 mb-4"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Register New Resource
      </h2>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Resource Name */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Resource Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
          />
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Provider
          </label>
          <input
            type="text"
            name="provider"
            value={formData.provider}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
          />
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Unit (e.g., Liters, Kits)
          </label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none"
          >
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition"
        >
          Register Resource
        </button>
      </form>
    </div>
  );
}