"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";

const HEARTBEAT_INTERVAL_MS = 30 * 1000;

const ScreenTracker = () => {
    const { user } = useSelector((s) => s.User);
    const pathname = usePathname();
    const swRef    = useRef(null);

    const [extStatus,  setExtStatus]  = useState("checking"); // "checking" | "connected" | "not-installed"
    const [dismissed, setDismissed] = useState(false);

    // ── Service Worker (offline beacon fallback) ─────────────────────────────
    useEffect(() => {
        if (!user?.employeeId || !("serviceWorker" in navigator)) return;
        navigator.serviceWorker
            .register("/sw-tracking.js", { scope: "/" })
            .then((reg) => { swRef.current = reg; })
            .catch(() => {});
    }, [user?.employeeId]);

    // ── Mark offline on tab close ────────────────────────────────────────────
    useEffect(() => {
        if (!user?.employeeId) return;
        const payload = JSON.stringify({
            employeeId: user.employeeId,
            employeeName: user.employeeName || user.employeeemail || "Employee",
        });
        const markOffline = () => {
            if (navigator.sendBeacon)
                navigator.sendBeacon("/api/tracking/offline", new Blob([payload], { type: "application/json" }));
            // Tell extension to clear credentials on logout/close
            window.postMessage({ type: "HUMANEDGE_CLEAR_CREDENTIALS" }, "*");
        };
        window.addEventListener("beforeunload", markOffline);
        return () => window.removeEventListener("beforeunload", markOffline);
    }, [user?.employeeId]);

    // ── Heartbeat from web app (backup if extension is not installed) ────────
    const sendHeartbeat = async () => {
        if (!user?.employeeId) return;
        try {
            await axios.post("/api/tracking/activity", {
                employeeId: user.employeeId,
                employeeName: user.employeeName || user.employeeemail || "Employee",
                currentPage: window.location.pathname,
            });
        } catch {}
    };

    useEffect(() => {
        if (!user?.employeeId) return;
        sendHeartbeat();
        const t = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
        return () => clearInterval(t);
    }, [user?.employeeId]);

    useEffect(() => { sendHeartbeat(); }, [pathname]);

    // ── Extension communication ──────────────────────────────────────────────
    useEffect(() => {
        if (!user?.employeeId) return;

        // Listen for extension responses
        const onMessage = (event) => {
            if (event.source !== window) return;

            if (event.data?.type === "HUMANEDGE_EXTENSION_READY") {
                // Extension is installed — send credentials immediately
                window.postMessage({
                    type:         "HUMANEDGE_SET_CREDENTIALS",
                    employeeId:   user.employeeId,
                    employeeName: user.employeeName || user.employeeemail || "Employee",
                    baseUrl:      window.location.origin,
                }, "*");
            }

            if (event.data?.type === "HUMANEDGE_CREDENTIALS_ACK") {
                setExtStatus("connected");
            }

            if (event.data?.type === "HUMANEDGE_STATUS") {
                if (event.data.connected) {
                    setExtStatus("connected");
                } else {
                    // Extension IS installed (responded) but no credentials yet — send them now
                    window.postMessage({
                        type:         "HUMANEDGE_SET_CREDENTIALS",
                        employeeId:   user.employeeId,
                        employeeName: user.employeeName || user.employeeemail || "Employee",
                        baseUrl:      window.location.origin,
                    }, "*");
                }
            }
        };

        window.addEventListener("message", onMessage);

        // Ask extension for current status (detects if already connected from prev session)
        window.postMessage({ type: "HUMANEDGE_GET_STATUS" }, "*");

        // If no response in 1.5s → extension not installed
        const timer = setTimeout(() => {
            setExtStatus((prev) => prev === "checking" ? "not-installed" : prev);
        }, 1500);

        return () => {
            window.removeEventListener("message", onMessage);
            clearTimeout(timer);
        };
    }, [user?.employeeId]);

    // ── On logout: clear extension credentials ───────────────────────────────
    useEffect(() => {
        return () => {
            window.postMessage({ type: "HUMANEDGE_CLEAR_CREDENTIALS" }, "*");
        };
    }, []);

    // ── UI ───────────────────────────────────────────────────────────────────

    // Extension connected → small green indicator, no blocking
    if (extStatus === "connected") {
        return (
            <div
                style={{ zIndex: 99999 }}
                className="fixed bottom-5 right-5 bg-white border border-green-200 rounded-xl shadow-md px-3 py-2 flex items-center gap-2 select-none pointer-events-none"
            >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                <span className="text-xs text-slate-600 font-medium">Screen monitored</span>
            </div>
        );
    }

    // Extension not installed → install instructions (non-blocking, just info)
    if (extStatus === "not-installed" && !dismissed) {
        return (
            <div
                style={{ zIndex: 99999 }}
                className="fixed bottom-5 right-5 bg-white border border-amber-200 rounded-2xl shadow-xl p-4 w-72 flex flex-col gap-3"
            >
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2"/>
                            <path d="M8 21h8M12 17v4"/>
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">Install Monitoring Extension</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            Screen monitoring requires the HumanEdge extension. Install it once — no popups ever again.
                        </p>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
                    <p className="font-semibold text-slate-700 mb-1">How to install:</p>
                    <p>1. Open <strong>chrome://extensions</strong></p>
                    <p>2. Enable <strong>Developer mode</strong></p>
                    <p>3. Click <strong>Load unpacked</strong></p>
                    <p>4. Select the <strong>extension</strong> folder</p>
                    <p>5. Refresh this page</p>
                </div>
            </div>
        );
    }

    // Checking... (brief moment on load)
    return null;
};

export default ScreenTracker;
