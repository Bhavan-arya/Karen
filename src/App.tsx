import React, { useState } from "react";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ReAuth from "./components/ReAuth";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<"login" | "dashboard" | "reauth">("login");
  const [pendingUser, setPendingUser] = useState<any>(null);

  const handleLoginSuccess = (
    userData: any,
    riskScore: number,
    action: string,
  ) => {
    if (action === "require_facial") {
      setPendingUser(userData);
      setView("reauth");
    } else {
      if (action === "notify_user") {
        alert(
          "Warning: Unusual login behavior detected. An alert has been sent to your email.",
        );
      }
      setUser(userData);
      setView("dashboard");
    }
  };

  const handleReAuthSuccess = () => {
    setUser(pendingUser);
    setPendingUser(null);
    setView("dashboard");
  };

  const handleReAuthCancel = () => {
    setPendingUser(null);
    setView("login");
  };

  const handleLogout = () => {
    setUser(null);
    setView("login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans">
      {view === "login" && <Login onLoginSuccess={handleLoginSuccess} />}
      {view === "reauth" && (
        <ReAuth onSuccess={handleReAuthSuccess} onCancel={handleReAuthCancel} />
      )}
      {view === "dashboard" && <Dashboard onLogout={handleLogout} />}
    </div>
  );
}
