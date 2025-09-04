import React, { useEffect, useState } from "react";
import { Switch } from "../ui/switch"; // shadcn/ui switch
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import config from "../config";

function Settings() {
  const [settings, setSettings] = useState({
    notifications: false,
    auto_reply: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${config.API_BASE}/settings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        setError(err.message || "Error fetching settings");
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
      setSaving(true);
      setError("");
      const res = await fetch(`${config.API_BASE}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert("✅ Settings saved successfully!");
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to save settings");
      }
    } catch (err) {
      setError(err.message || "Error saving settings");
    } finally {
      setSaving(false);
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

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button
            className="w-full mt-4"
            variant="default"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default Settings;