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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId'); 

    if (!token || !userId) {
      setError("You must be logged in to register resources.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create the base item in the items collection
      const itemRes = await fetch('http://localhost:5000/api/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendor_id: userId,
          item_name: formData.name,
          fields: {
            provider: formData.provider,
            location: formData.location,
            unit: formData.unit,
            status: formData.status
          }
        })
      });

      const itemData = await itemRes.json();
      if (!itemRes.ok) throw new Error(itemData.error || "Failed to create item.");
      
      const createdItemId = itemData.id;

      // 2. Generate the ticket batch for the specified quantity
      const ticketRes = await fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_id: createdItemId,
          quantity: parseInt(formData.quantity, 10)
        })
      });

      const ticketData = await ticketRes.json();
      if (!ticketRes.ok) throw new Error(ticketData.error || "Failed to generate ticket pool.");

      // 3. Create the resource for the frontend to show without needing an immediate total refresh
      const newResource = {
        id: createdItemId, 
        name: formData.name,
        total: Number(formData.quantity),
        remaining: Number(formData.quantity),
        status: formData.status,
        provider: formData.provider,
        location: formData.location,
        unit: formData.unit,
      };
    
      addResource(newResource); 
      setActivePage({ page: "home" });

    } catch (err) {
      console.error("Resource Registration Error: ", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      
      {/* Back Button */}
      <button
        onClick={() => setActivePage({ page: "home" })}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 mb-4"
        disabled={loading}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        Register New Resource
      </h2>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
          {error}
        </div>
      )}

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
            min="1"
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
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register Resource"}
        </button>
      </form>
    </div>
  );
}