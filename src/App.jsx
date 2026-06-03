import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  AlertTriangle,
  Radio,
  Wifi,
  Shield,
  Activity,
  Navigation,
  Clock,
  Users,
  Signal,
  Zap,
  ChevronRight,
  Cpu,
  Globe,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const AWS_URL = "https://m53u0qspv6.execute-api.ap-south-1.amazonaws.com/prod"; // ← REPLACE THIS

const SEVERITY_CONFIG = {
  CRITICAL: {
    color: "#ff0033",
    glow: "#ff003388",
    bg: "bg-red-900/40",
    border: "border-red-500/60",
    text: "text-red-400",
    badge: "bg-red-600",
    ring: "#ff0033",
    pulse: "animate-ping",
  },
  HIGH: {
    color: "#ff6a00",
    glow: "#ff6a0088",
    bg: "bg-orange-900/40",
    border: "border-orange-500/60",
    text: "text-orange-400",
    badge: "bg-orange-600",
    ring: "#ff6a00",
    pulse: "animate-ping",
  },
  MEDIUM: {
    color: "#ffd600",
    glow: "#ffd60088",
    bg: "bg-yellow-900/40",
    border: "border-yellow-500/60",
    text: "text-yellow-400",
    badge: "bg-yellow-600",
    ring: "#ffd600",
    pulse: "animate-ping",
  },
  LOW: {
    color: "#00e5ff",
    glow: "#00e5ff88",
    bg: "bg-cyan-900/40",
    border: "border-cyan-500/60",
    text: "text-cyan-400",
    badge: "bg-cyan-700",
    ring: "#00e5ff",
    pulse: "animate-ping",
  },
};

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

// ─── Mock Data for Demo (remove when AWS is live) ────────────────────────────
const MOCK_DATA = [
  {
    packet_id: "PKT-001",
    victim_name: "Arjun Sharma",
    gps_lat: 28.6139,
    gps_long: 77.209,
    severity: "CRITICAL",
    emergency_type: "Trapped Under Debris",
    packet_trace: ["AA:BB:CC:11", "DD:EE:FF:22", "GG:HH:II:33", "GATEWAY"],
  },
  {
    packet_id: "PKT-002",
    victim_name: "Priya Mehta",
    gps_lat: 28.6229,
    gps_long: 77.2195,
    severity: "HIGH",
    emergency_type: "Medical Emergency",
    packet_trace: ["11:22:33:AA", "44:55:66:BB", "GATEWAY"],
  },
  {
    packet_id: "PKT-003",
    victim_name: "Ravi Kumar",
    gps_lat: 28.605,
    gps_long: 77.225,
    severity: "CRITICAL",
    emergency_type: "Flash Flood",
    packet_trace: ["CC:DD:EE:FF", "00:11:22:33", "44:55:66:77", "88:99:AA:BB", "GATEWAY"],
  },
  {
    packet_id: "PKT-004",
    victim_name: "Sunita Devi",
    gps_lat: 28.63,
    gps_long: 77.2,
    severity: "MEDIUM",
    emergency_type: "Building Collapse",
    packet_trace: ["FF:EE:DD:CC", "BB:AA:99:88", "GATEWAY"],
  },
  {
    packet_id: "PKT-005",
    victim_name: "Mohammed Ali",
    gps_lat: 28.595,
    gps_long: 77.215,
    severity: "HIGH",
    emergency_type: "Fire Rescue",
    packet_trace: ["12:34:56:78", "9A:BC:DE:F0", "GATEWAY"],
  },
];

// ─── Create Pulse Marker Icon ─────────────────────────────────────────────────
const createPulseIcon = (severity) => {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.CRITICAL;
  return L.divIcon({
    className: "",
    html: `
      <div class="sos-marker-wrapper" style="position:relative; width:40px; height:40px;">
        <div class="sos-ring" style="
          position:absolute; inset:0; border-radius:50%;
          background:${cfg.color}22;
          border:2px solid ${cfg.color};
          animation: markerPing 1.5s cubic-bezier(0,0,0.2,1) infinite;
          box-shadow: 0 0 20px ${cfg.glow};
        "></div>
        <div class="sos-ring" style="
          position:absolute; inset:6px; border-radius:50%;
          background:${cfg.color}44;
          border:2px solid ${cfg.color};
          animation: markerPing 1.5s cubic-bezier(0,0,0.2,1) infinite 0.3s;
        "></div>
        <div style="
          position:absolute; inset:12px; border-radius:50%;
          background:${cfg.color};
          box-shadow: 0 0 12px ${cfg.color}, 0 0 30px ${cfg.glow};
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -24],
  });
};

// ─── Map Controller (for flyTo) ───────────────────────────────────────────────
function MapController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.gps_lat, target.gps_long], 15, {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.25,
      });
    }
  }, [target, map]);
  return null;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = "text-cyan-400", pulse = false }) {
  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      <Icon size={18} className={`${color} shrink-0 relative z-10`} />
      <div className="relative z-10 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">{label}</p>
        <p className={`text-lg font-bold font-mono ${color} leading-tight`}>
          {value}
          {pulse && <span className="inline-block ml-1 w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
        </p>
      </div>
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ packet, isActive, onClick }) {
  const cfg = SEVERITY_CONFIG[packet.severity] || SEVERITY_CONFIG.LOW;
  return (
    <div
      onClick={onClick}
      className={`
        group relative cursor-pointer rounded-lg border p-3 mb-2 transition-all duration-300
        ${cfg.bg} ${cfg.border}
        ${isActive ? "ring-1 ring-white/30 scale-[1.01]" : "hover:scale-[1.01] hover:border-white/30"}
      `}
    >
      {/* Active indicator line */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 text-[9px] font-black font-mono tracking-widest px-1.5 py-0.5 rounded ${cfg.badge} text-white`}>
            {packet.severity}
          </span>
          <p className="text-white text-sm font-semibold font-mono truncate">{packet.victim_name}</p>
        </div>
        <ChevronRight size={14} className={`${cfg.text} shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform`} />
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <AlertTriangle size={11} className={cfg.text} />
        <p className="text-gray-300 text-xs">{packet.emergency_type}</p>
      </div>

      {/* Mesh trace */}
      <div className="flex flex-wrap items-center gap-1 mt-1">
        {packet.packet_trace.map((node, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${node === "GATEWAY" ? "bg-green-900/60 text-green-400 border border-green-500/40" : "bg-gray-800/80 text-gray-400 border border-white/10"}`}>
              {node === "GATEWAY" ? "⬡ GATEWAY" : node}
            </span>
            {i < packet.packet_trace.length - 1 && (
              <span className="text-gray-600 text-[8px]">›</span>
            )}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-1 mt-2">
        <Signal size={9} className="text-gray-600" />
        <p className="text-gray-600 text-[9px] font-mono">{packet.packet_id}</p>
        <span className="text-gray-700 mx-1">·</span>
        <p className="text-gray-600 text-[9px] font-mono">{packet.packet_trace.length - 1} hops</p>
      </div>
    </div>
  );
}

// ─── Scanning State ───────────────────────────────────────────────────────────
function ScanningState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-16">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border border-cyan-500/30 animate-[spin_8s_linear_infinite]" />
        <div className="absolute inset-3 rounded-full border border-cyan-400/40 animate-[spin_5s_linear_infinite_reverse]" />
        <div className="absolute inset-6 rounded-full border border-cyan-300/50 animate-[spin_3s_linear_infinite]" />
        <div className="absolute inset-9 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <Radio size={16} className="text-cyan-400 animate-pulse" />
        </div>
        {/* Radar sweep */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="w-full h-full rounded-full animate-[spin_2s_linear_infinite]" style={{
            background: "conic-gradient(from 0deg, transparent 270deg, #00e5ff44 360deg)"
          }} />
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-cyan-400 font-mono text-sm tracking-widest uppercase animate-pulse">
          Scanning Mesh Frequencies...
        </p>
        <p className="text-gray-600 font-mono text-xs">Awaiting SOS Packets from P2P Nodes</p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="w-1 bg-cyan-500/60 rounded-full animate-pulse" style={{
            height: `${12 + Math.sin(i) * 8}px`,
            animationDelay: `${i * 0.15}s`
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [sosPackets, setSosPackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapTarget, setMapTarget] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [syncStatus, setSyncStatus] = useState("IDLE");
  const [criticalCount, setCriticalCount] = useState(0);

  const sortedPackets = [...sosPackets].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99)
  );

  const fetchData = useCallback(async () => {
    setSyncStatus("SYNCING");
    try {
      const res = await fetch(AWS_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error("Network error");
      const result = await res.json();
      console.log("✅ RAW AWS RESPONSE:", result);

      let finalData = [];

      // This is the magic "unwrapping" step
      if (result.body) {
        // If the data is a string inside 'body', turn it into a real list
        finalData = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      } else if (Array.isArray(result)) {
        // If AWS sent the array directly
        finalData = result;
      }

      console.log("✅ UNWRAPPED DATA:", finalData);

      // Update your state with the real list
      setSosPackets(finalData.length ? finalData : MOCK_DATA);
      setCriticalCount(finalData.filter((p) => p.severity === "CRITICAL").length);
      setLastSync(new Date());
      setSyncStatus(finalData.length ? "LIVE" : "DEMO");
    } catch (err) {
      // Use mock data if AWS not configured
      setSosPackets(MOCK_DATA);
      setCriticalCount(MOCK_DATA.filter((p) => p.severity === "CRITICAL").length);
      setLastSync(new Date());
      setSyncStatus("DEMO");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAlertClick = (packet) => {
    setActiveId(packet.packet_id);
    setMapTarget({ ...packet, _ts: Date.now() });
  };

  const mapCenter = sosPackets.length
    ? [sosPackets[0].gps_lat, sosPackets[0].gps_long]
    : [28.6139, 77.209];

  return (
    <div className="h-screen w-screen bg-gray-950 text-white overflow-hidden flex flex-col font-mono">

      {/* ── HEADER ── */}
      <header className="relative flex items-center justify-between px-6 py-3 border-b border-white/10 bg-gray-950/90 backdrop-blur-md z-50 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/20 via-transparent to-cyan-950/20" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="relative">
            <Shield size={28} className="text-red-500" style={{ filter: "drop-shadow(0 0 8px #ff0033)" }} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          </div>
          <div>
            <h1 className="text-white text-base font-black tracking-[0.2em] uppercase leading-none">
              GOD'S EYE
            </h1>
            <p className="text-gray-500 text-[9px] tracking-[0.3em] uppercase">
              P2P-RescueNet · Command Center
            </p>
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-white/10 mx-2" />

          {/* Status Beacon */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
            <span className={`w-2 h-2 rounded-full ${syncStatus === "LIVE" ? "bg-green-400" : syncStatus === "SYNCING" ? "bg-yellow-400 animate-pulse" : "bg-cyan-400"}`}
              style={syncStatus === "LIVE" ? { boxShadow: "0 0 6px #4ade80" } : {}} />
            <span className="text-[10px] tracking-widest text-gray-400 uppercase">{syncStatus}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="hidden md:grid grid-cols-3 gap-2">
            <StatCard icon={Zap} label="Total SOS" value={sosPackets.length} color="text-red-400" />
            <StatCard icon={AlertTriangle} label="Critical" value={criticalCount} color="text-red-500" pulse />
            <StatCard icon={Activity} label="Mesh Nodes" value={sosPackets.reduce((a, p) => a + p.packet_trace.length, 0)} color="text-cyan-400" />
          </div>
          {lastSync && (
            <div className="hidden lg:flex items-center gap-1.5 text-gray-600 text-[9px]">
              <Clock size={10} />
              <span>SYNC {lastSync.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── SIDEBAR ── */}
        <aside className="relative w-80 xl:w-96 shrink-0 flex flex-col border-r border-white/10 bg-gray-900/80 backdrop-blur-md z-40 overflow-hidden">
          {/* Sidebar grid texture */}
          <div className="absolute inset-0 opacity-[0.01]" style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }} />

          {/* Sidebar Header */}
          <div className="relative z-10 p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-red-400 animate-pulse" />
                <span className="text-xs uppercase tracking-widest text-gray-300 font-black">Live Alert Feed</span>
              </div>
              <span className="text-[10px] font-mono text-gray-500 border border-white/10 px-2 py-0.5 rounded">
                {sortedPackets.length} ACTIVE
              </span>
            </div>

            {/* Total SOS Banner */}
            <div className="relative rounded-lg border border-red-500/30 bg-red-950/30 p-3 overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-red-700" />
              <p className="text-[9px] uppercase tracking-widest text-red-400/80 mb-1">Total SOS Active</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-red-400 leading-none" style={{ textShadow: "0 0 30px #f83d6288" }}>
                  {sosPackets.length.toString().padStart(2, "0")}
                </span>
                <div className="flex flex-col">
                  <span className="text-[9px] text-red-800/60 uppercase">signals</span>
                  <span className="text-[9px] text-red-800/60 uppercase">detected</span>
                </div>
              </div>
            </div>

            {/* Severity breakdown */}
            <div className="grid grid-cols-4 gap-1 mt-2">
              {Object.entries(SEVERITY_CONFIG).map(([level, cfg]) => {
                const count = sosPackets.filter((p) => p.severity === level).length;
                return (
                  <div key={level} className={`rounded text-center py-1.5 px-1 border ${cfg.border} ${cfg.bg}`}>
                    <p className={`text-xs font-black ${cfg.text}`}>{count}</p>
                    <p className="text-[8px] text-gray-500 uppercase tracking-wider">{level.slice(0, 3)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert List */}
          <div className="flex-1 overflow-y-auto p-3 relative z-10 scrollbar-thin">
            {loading ? (
              <ScanningState />
            ) : sortedPackets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
                <Globe size={80} className="text-gray-900" />
                <p className="text-gray-600 text-xs uppercase tracking-widest">No Signals Detected</p>
              </div>
            ) : (
              sortedPackets.map((packet) => (
                <AlertCard
                  key={packet.packet_id}
                  packet={packet}
                  isActive={activeId === packet.packet_id}
                  onClick={() => handleAlertClick(packet)}
                />
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="relative z-10 p-3 border-t border-white/10 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cpu size={10} className="text-cyan-500" />
                <span className="text-[9px] text-gray-600 uppercase tracking-wider">P2P-RescueNet v2.4</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] text-gray-600">NDRF AUTHORIZED</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAP ── */}
        <div className="flex-1 relative">
          {/* Map overlay scanlines */}
          <div className="absolute inset-0 z-10 pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)"
          }} />

          {/* Corner decorations */}
          {["top-4 left-4 border-t-2 border-l-2", "top-4 right-4 border-t-2 border-r-2", "bottom-4 left-4 border-b-2 border-l-2", "bottom-4 right-4 border-b-2 border-r-2"].map((cls, i) => (
            <div key={i} className={`absolute z-10 w-6 h-6 border-cyan-500/40 pointer-events-none ${cls}`} />
          ))}

          {/* Map HUD top-right */}
          <div className="absolute top-4 right-4 z-20 space-y-2">
            <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur border border-white/10 rounded-lg px-3 py-2">
              <Navigation size={12} className="text-cyan-400" />
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Mesh Grid Active</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur border border-white/10 rounded-lg px-3 py-2">
              <Users size={12} className="text-red-400" />
              <span className="text-[10px] font-mono text-red-400">{sosPackets.length} SOS Signals</span>
            </div>
          </div>

          {/* Leaflet Map */}
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ width: "100%", height: "100%" }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
            />

            <MapController target={mapTarget} />

            {sortedPackets.map((packet) => (
              <Marker
                key={packet.packet_id}
                position={[packet.gps_lat, packet.gps_long]}
                icon={createPulseIcon(packet.severity)}
              >
                <Popup
                  className="sos-popup"
                  maxWidth={320}
                  closeButton={true}
                >
                  <div className="sos-popup-inner font-mono">
                    {/* Popup Header */}
                    <div className="flex items-center justify-between mb-3 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <div>
                        <p className="text-white font-bold text-sm">{packet.victim_name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{packet.packet_id}</p>
                      </div>
                      <span style={{
                        background: SEVERITY_CONFIG[packet.severity]?.color + "33",
                        border: `1px solid ${SEVERITY_CONFIG[packet.severity]?.color}`,
                        color: SEVERITY_CONFIG[packet.severity]?.color,
                        fontSize: "10px",
                        fontWeight: "900",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        letterSpacing: "0.1em",
                      }}>
                        {packet.severity}
                      </span>
                    </div>

                    {/* Emergency Type */}
                    <div className="flex items-center gap-2 mb-3 p-2 rounded" style={{ background: "rgba(197, 15, 52, 0.1)", border: "1px solid rgba(217, 40, 76, 0.2)" }}>
                      <AlertTriangle size={12} style={{ color: "#ff0033" }} />
                      <p className="text-white text-xs font-semibold">{packet.emergency_type}</p>
                    </div>

                    {/* GPS */}
                    <div className="mb-3">
                      <p style={{ color: "#6b7280", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>GPS Coordinates</p>
                      <p style={{ color: "#00e5ff", fontSize: "11px" }}>
                        {packet.gps_lat.toFixed(6)}°N, {packet.gps_long.toFixed(6)}°E
                      </p>
                    </div>

                    {/* Mesh Trace */}
                    <div>
                      <p style={{ color: "#6b7280", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "6px" }}>
                        Mesh Trace · {packet.packet_trace.length - 1} hops
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "center" }}>
                        {packet.packet_trace.map((node, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{
                              fontSize: "9px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontFamily: "monospace",
                              background: node === "GATEWAY" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                              border: node === "GATEWAY" ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.1)",
                              color: node === "GATEWAY" ? "#4ade80" : "#9ca3af",
                            }}>
                              {node === "GATEWAY" ? "⬡ GATEWAY" : node}
                            </span>
                            {i < packet.packet_trace.length - 1 && (
                              <span style={{ color: "#374151", fontSize: "10px" }}>›</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');

        * { font-family: 'Share Tech Mono', monospace; }

        @keyframes markerPing {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }

        /* Leaflet popup override */
        .leaflet-popup-content-wrapper {
          background: rgba(10, 12, 18, 0.97) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 10px !important;
          box-shadow: 0 0 40px rgba(0, 229, 255, 0.1), 0 20px 60px rgba(0,0,0,0.8) !important;
          padding: 0 !important;
          backdrop-filter: blur(12px) !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          padding: 0 !important;
          width: 300px !important;
        }
        .sos-popup-inner {
          padding: 16px;
        }
        .leaflet-popup-tip-container {
          display: none !important;
        }
        .leaflet-popup-close-button {
          color: #6b7280 !important;
          font-size: 16px !important;
          top: 8px !important;
          right: 8px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #fff !important;
        }

        /* Attribution */
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.6) !important;
          color: #374151 !important;
          font-size: 8px !important;
        }
        .leaflet-control-attribution a { color: #4b5563 !important; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}