"use client";

interface StatusTabsProps {
  activeTab: "pending" | "approved" | "rejected" | "banned";
  onTabChange: (tab: "pending" | "approved" | "rejected" | "banned") => void;
}

export function StatusTabs({ activeTab, onTabChange }: StatusTabsProps) {
  return (
    <div className="flex space-x-4 mb-6">
      {["pending", "approved", "rejected", "banned"].map((tab) => (
        <button
          key={tab}
          onClick={() =>
            onTabChange(tab as "pending" | "approved" | "rejected" | "banned")
          }
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === tab
              ? "bg-teal-500 text-white"
              : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}
