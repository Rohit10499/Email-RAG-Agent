import React, { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch"; // shadcn/ui switch
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function Settings() {
  const [settings, setSettings] = useState({
    notifications: false,
    auto_reply: false,
  });
  const [loading, setLoading] = useState(true);

  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:8000/settings"); // backend endpoint
        const data = await res.json();
        setSettings(data);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (field) => {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch("http://localhost:8000/settings", {
        method: "POST", // if you later add POST support in backend
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert("✅ Settings saved successfully!");
      } else {
        alert("❌ Failed to save settings");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("❌ Error saving settings");
    }
  };

  if (loading) return <p className="text-center">Loading settings...</p>;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <Card className="w-full max-w-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">⚙️ Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notifications */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Enable Notifications</span>
            <Switch
              checked={settings.notifications}
              onCheckedChange={() => handleToggle("notifications")}
            />
          </div>

          {/* Auto-reply */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Enable Auto-reply</span>
            <Switch
              checked={settings.auto_reply}
              onCheckedChange={() => handleToggle("auto_reply")}
            />
          </div>

          <Button
            className="w-full mt-4"
            variant="default"
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;
