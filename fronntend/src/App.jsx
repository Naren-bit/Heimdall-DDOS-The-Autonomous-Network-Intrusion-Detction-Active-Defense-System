import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Activity, Lock, AlertTriangle, Search, Wifi, Server, FileText, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css'

// IMPORT YOUR COMPONENTS
import FirewallRules from './components/FirewallRules';
import NetworkNodes from './components/NetworkNodes';

function App() {
  const [logs, setLogs] = useState([])
  const [connectionStatus, setConnectionStatus] = useState("Disconnected")
  const [chartData, setChartData] = useState([])
  const [activeTab, setActiveTab] = useState("Live Traffic");
  const [searchQuery, setSearchQuery] = useState(""); 
  
  // --- NEW: PAUSE STATE ---
  const [isPaused, setIsPaused] = useState(false);

  // Force re-render for charts
  const [, setTick] = useState(0);

  // DYNAMIC STATS
  const totalPackets = logs.length;
  const blockedCount = logs.filter(l => l.status === "BLOCKED").length;
  const allowedCount = logs.filter(l => l.status === "ALLOWED").length;

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000") 

    ws.onopen = () => setConnectionStatus("Connected")
    
    ws.onmessage = (event) => {
      // --- PAUSE LOGIC ---
      // If paused, we ignore incoming updates for the UI
      if (isPaused) return;

      const incoming = JSON.parse(event.data);
      const newLogs = Array.isArray(incoming) ? incoming : [incoming];

      setLogs(prev => [...newLogs.reverse(), ...prev].slice(0, 50));
      
      setChartData(prev => {
        const now = new Date().toLocaleTimeString();
        const newPoint = { time: now, packets: newLogs.length + Math.floor(Math.random() * 2) };
        return [...prev, newPoint].slice(-15); 
      });

      setTick(t => t + 1);
    }

    ws.onclose = () => setConnectionStatus("Disconnected")
    return () => ws.close()
  }, [isPaused]) // Re-bind if pause state changes (optional, but good practice)

  // FILTER LOGIC
  const filteredLogs = logs.filter(log => 
    log.src.includes(searchQuery) || 
    log.dst.includes(searchQuery) || 
    log.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#050505] text-gray-100 font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-gray-800 hidden md:flex flex-col z-20">
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <motion.div
            animate={{ rotate: connectionStatus === "Connected" ? 0 : 360 }}
            transition={{ duration: 2, repeat: connectionStatus === "Connected" ? 0 : Infinity, ease: "linear" }}
          >
             <Shield className={`w-8 h-8 ${connectionStatus === "Connected" ? "text-blue-500" : "text-red-500"}`} />
          </motion.div>
          <span className="text-xl font-bold tracking-wider text-gray-100">HEIMDALL</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<Activity />} 
            label="Live Traffic" 
            isActive={activeTab === "Live Traffic"} 
            onClick={() => setActiveTab("Live Traffic")}
          />
          <NavItem 
            icon={<AlertTriangle />} 
            label="Threat Intelligence" 
            isActive={activeTab === "Threat Intelligence"} 
            onClick={() => setActiveTab("Threat Intelligence")}
          />
          <NavItem 
            icon={<Server />} 
            label="Network Nodes" 
            isActive={activeTab === "Network Nodes"} 
            onClick={() => setActiveTab("Network Nodes")}
          />
          <NavItem 
            icon={<Lock />} 
            label="Firewall Rules" 
            isActive={activeTab === "Firewall Rules"} 
            onClick={() => setActiveTab("Firewall Rules")}
          />
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <motion.div 
                animate={{ scale: connectionStatus === "Connected" ? [1, 1.2, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-2 h-2 rounded-full ${connectionStatus === "Connected" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500"}`} 
            />
            System: <span className={connectionStatus === "Connected" ? "text-green-400" : "text-red-400"}>{connectionStatus}</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#050505]">
        {/* TOP BAR */}
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
          <h1 className="text-lg font-medium text-gray-300">Dashboard / <span className="text-blue-400">{activeTab}</span></h1>
          <div className="flex items-center gap-4">
             {/* SEARCH BAR */}
             <motion.div 
               whileFocus={{ scale: 1.02, borderColor: "#3b82f6" }}
               className="bg-[#111] border border-gray-700 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm focus-within:border-blue-500 transition-colors"
             >
               <Search className="w-4 h-4 text-gray-500" />
               <input 
                 type="text" 
                 placeholder="Search IP..." 
                 className="bg-transparent outline-none w-32 text-gray-300 placeholder-gray-600"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)} 
               />
             </motion.div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin">
          
          {/* ANIMATED VIEW SWITCHER */}
          <AnimatePresence mode='wait'>
            <motion.div
                key={activeTab} // Using key forces Framer Motion to detect the change
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
            >
                {activeTab === "Live Traffic" ? (
                    <>
                    {/* STATS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard title="Packets on Screen" value={totalPackets} icon={<Wifi className="text-blue-500" />} />
                        <StatCard title="Threats Visible" value={blockedCount} icon={<Shield className="text-red-500" />} isAlert />
                        <StatCard title="Safe Traffic" value={allowedCount} icon={<Activity className="text-green-500" />} />
                        <StatCard title="Active Nodes" value="3" icon={<Server className="text-purple-500" />} />
                    </div>

                    {/* CHART & THREAT LEVEL */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-72 mt-6">
                        <div className="lg:col-span-2 bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 shadow-lg relative">
                            <h3 className="text-sm font-semibold text-gray-400 mb-4 ml-2">Network Throughput (Packets/sec)</h3>
                            <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={chartData}>
                                <defs>
                                <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#222" strokeDasharray="3 3" />
                                <XAxis dataKey="time" stroke="#444" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                                <YAxis stroke="#444" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                                <Tooltip 
                                contentStyle={{backgroundColor: '#111', borderColor: '#333', color: '#fff'}} 
                                itemStyle={{color: '#3b82f6'}}
                                cursor={false} 
                                />
                                <Area 
                                type="monotone" 
                                dataKey="packets" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorPv)" 
                                isAnimationActive={false} 
                                />
                            </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* THREAT LEVEL INDICATOR */}
                        <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 flex flex-col justify-center items-center relative overflow-hidden">
                            <div className={`absolute inset-0 z-0 opacity-20 ${blockedCount > 0 ? "bg-red-900" : "bg-green-900"}`}></div>
                            <motion.div 
                                animate={{ scale: blockedCount > 0 ? [1, 1.1, 1] : 1 }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="z-10 bg-[#111] p-4 rounded-full border border-gray-800 mb-4"
                            >
                                {blockedCount > 0 ? <AlertTriangle size={32} className="text-red-500" /> : <Shield size={32} className="text-green-500" />}
                            </motion.div>
                            <h3 className="text-sm font-semibold text-gray-400 z-10 mb-1">Current Threat Level</h3>
                            <div className={`text-4xl font-black z-10 tracking-wider ${blockedCount > 0 ? "text-red-500" : "text-green-500"}`}>
                                {blockedCount > 0 ? "CRITICAL" : "SECURE"}
                            </div>
                        </div>
                    </div>

                    {/* LOGS TABLE */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl overflow-hidden shadow-lg flex-1 mt-6">
                        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#0f0f0f]">
                        <h3 className="font-semibold text-gray-200">Live Packet Stream</h3>
                        
                        <div className="flex items-center gap-4">
                            {/* --- NEW PAUSE BUTTON --- */}
                            <button 
                                onClick={() => setIsPaused(!isPaused)}
                                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold border transition-colors ${isPaused ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
                            >
                                {isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
                                {isPaused ? "RESUME" : "PAUSE"}
                            </button>

                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-blue-500 animate-pulse'}`}></span>
                                <span className="text-xs text-gray-500 uppercase tracking-widest">{isPaused ? "PAUSED" : "LIVE"}</span>
                            </div>
                        </div>

                        </div>
                        <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#111] text-gray-500 uppercase text-xs sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 font-medium tracking-wider">Time</th>
                                <th className="px-6 py-3 font-medium tracking-wider">Source</th>
                                <th className="px-6 py-3 font-medium tracking-wider">Destination</th>
                                <th className="px-6 py-3 font-medium tracking-wider">Proto</th>
                                <th className="px-6 py-3 font-medium tracking-wider">Status</th>
                                <th className="px-6 py-3 font-medium tracking-wider">Message</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                            <AnimatePresence initial={false}>
                                {filteredLogs.map((log, i) => (
                                <motion.tr 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`font-mono text-xs border-l-2 ${log.status === "BLOCKED" ? "bg-red-900/10 border-red-500 hover:bg-red-900/20" : "bg-transparent border-transparent hover:bg-gray-900"}`}
                                >
                                    <td className="px-6 py-3 text-gray-500">{log.timestamp}</td>
                                    <td className="px-6 py-3 text-blue-300">{log.src}</td>
                                    <td className="px-6 py-3 text-gray-400">{log.dst}</td>
                                    <td className="px-6 py-3"><span className="px-2 py-0.5 rounded bg-[#1a1a1a] border border-gray-800 text-gray-400">{log.protocol}</span></td>
                                    <td className="px-6 py-3">
                                    {log.status === "BLOCKED" ? (
                                        <span className="inline-flex items-center gap-1 text-red-400 font-bold bg-red-400/10 px-2 py-0.5 rounded"><Shield size={10}/> BLOCKED</span>
                                    ) : (
                                        <span className="text-green-500 bg-green-500/10 px-2 py-0.5 rounded">ALLOWED</span>
                                    )}
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 truncate max-w-xs">{log.message}</td>
                                </motion.tr>
                                ))}
                            </AnimatePresence>
                            </tbody>
                        </table>
                        </div>
                    </div>
                    </>
                ) : activeTab === "Firewall Rules" ? (
                    <FirewallRules />
                ) : activeTab === "Network Nodes" ? (
                    <NetworkNodes />
                ) : (
                    /* PLACEHOLDER FOR THREAT INTELLIGENCE */
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                        <FileText size={48} className="opacity-20" />
                        <p>Module <span className="text-blue-400 font-mono">{activeTab}</span> is currently under development.</p>
                        <button onClick={() => setActiveTab("Live Traffic")} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">Return to Live Monitor</button>
                    </div>
                )}
            </motion.div>
          </AnimatePresence>

        </div>
      </main>
    </div>
  )
}

const NavItem = ({ icon, label, isActive, onClick }) => (
  <motion.div 
    onClick={onClick}
    whileHover={{ scale: 1.02, x: 5, backgroundColor: "#151515" }}
    whileTap={{ scale: 0.98 }}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-200 group
    ${isActive 
      ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
      : "text-gray-400 border border-transparent"}`}
  >
    <div className={`transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
      {icon}
    </div>
    <span className="font-medium text-sm">{label}</span>
  </motion.div>
)

const StatCard = ({ title, value, icon, isAlert }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    className={`bg-[#0a0a0a] p-5 rounded-xl border transition-colors ${isAlert ? "border-red-900/30 bg-red-900/5 shadow-[0_0_20px_rgba(220,38,38,0.05)]" : "border-gray-800 shadow-lg"} flex items-center justify-between`}
  >
    <div>
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{title}</p>
      <h3 className={`text-2xl font-bold mt-1 font-mono ${isAlert ? "text-red-500" : "text-gray-100"}`}>{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${isAlert ? "bg-red-900/20 text-red-500" : "bg-[#151515] text-gray-400"}`}>
      {icon}  
    </div>
  </motion.div>
)

export default App