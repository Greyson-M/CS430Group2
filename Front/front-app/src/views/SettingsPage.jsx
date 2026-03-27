import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage({ setActivePage, language, setLanguage }) {
  const [activeTab, setActiveTab] = useState("account");

  // Account state
  const [username, setUsername] = useState("currentUsername");
  const [email, setEmail] = useState("user@example.com");
  const [resourceType, setResourceType] = useState("holder");

  // Security state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notifications state
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    console.log({
      username,
      email,
      resourceType,
      password,
      confirmPassword,
      notifications,
    });
    alert("Settings saved!");
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
     {/* Back Button */}
      <button
        onClick={() => setActivePage("home")}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 mb-4 cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {["account", "security", "notifications"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 -mb-px font-medium ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-4">
        {activeTab === "account" && (
          <div>
            {/* Username */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            {/* Language */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>

            {/* Resource Type */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">
                I am a:
              </label>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="resourceType"
                    value="holder"
                    checked={resourceType === "holder"}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="form-radio cursor-pointer"
                  />
                  Resource Distributor
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="resourceType"
                    value="wanter"
                    checked={resourceType === "wanter"}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="form-radio cursor-pointer"
                  />
                  Resource Recipient
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div>
            {/* Password */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-sm text-gray-700">Enable notifications</span>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition cursor-pointer"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}