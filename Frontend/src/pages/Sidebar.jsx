"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../components/sidebar";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import {
  IconBrandTabler,
  IconSettings,
  IconHistory,
  IconReportAnalytics,
  IconBellRinging,
  IconTimeline,
  IconLayoutDashboard,
} from "@tabler/icons-react";

import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

// Import your pages
import Dashboard from "./Dashboard";
import Logs from "./Logs";
import History from "./History";
import Escalations from "./Escalations";
import Analytics from "./Analytics";
import Settings from "./Settings";

export function SidebarDemo() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  // All navigation items (from App.jsx merged here)
  const links = [
    {
      label: "Dashboard",
      href: "/",
      icon: <IconLayoutDashboard className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Logs",
      href: "/logs",
      icon: <IconTimeline className="h-5 w-5 shrink-0" />,
    },
    {
      label: "History",
      href: "/history",
      icon: <IconHistory className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Escalations",
      href: "/escalations",
      icon: <IconBellRinging className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: <IconReportAnalytics className="h-5 w-5 shrink-0" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="h-5 w-5 shrink-0" />,
    },
  ];

  return (
    <div
    className={cn(
    "flex w-full flex-1 overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
    "h-screen"
  )}
    >
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(link.href)}
                  className={`cursor-pointer ${
                    location.pathname === link.href
                      ? "bg-orange-500 text-white rounded-md shadow-md"
                      : "hover:bg-yellow-400 hover:text-black rounded-md"
                  }`}
                >
                  <SidebarLink link={link} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Admin",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main content routes */}
      <div className="flex flex-1 p-6 overflow-y-auto bg-yellow-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/history" element={<History />} />
          <Route path="/escalations" element={<Escalations />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

// Logo full
export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        Email Agent
      </motion.span>
    </a>
  );
};

// Logo icon
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded bg-black dark:bg-white" />
    </a>
  );
};

export default SidebarDemo;
