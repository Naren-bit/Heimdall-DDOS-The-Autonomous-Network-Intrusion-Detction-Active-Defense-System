import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Smartphone, Laptop, Monitor, Wifi, 
  ShieldAlert, RefreshCw, Cpu, Ban 
} from 'lucide-react';

const NetworkNodes = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState(null); // To show loading state on specific card

  const fetchNodes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/nodes');
      const data = await response.json();
      setNodes(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching nodes:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- NEW: QUICK BLOCK FUNCTION ---
  const handleQuickBlock = async (ip) => {
    setBlocking(ip); // Show spinner on this card
    try {
      // 1. Add to Firewall
      await fetch('http://localhost:5000/api/firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, reason: 'Quick Block from Node Map' }),
      });
      
      // 2. Penalize Trust Score immediately
      await fetch('http://localhost:5000/api/nodes/penalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, penalty: 50 }),
      });

      // 3. Refresh data
      fetchNodes();
      alert(`🚫 Blocked Node: ${ip}`); // Simple feedback
    } catch (error) {
      console.error("Block failed", error);
    }
    setBlocking(null);
  };

  const getIcon = (os) => {
    const lower = os.toLowerCase();
    if (lower.includes('linux') || lower.includes('server')) return <Server className="w-8 h-8 text-blue-400" />;
    if (lower.includes('windows')) return <Monitor className="w-8 h-8 text-indigo-400" />;
    if (lower.includes('android') || lower.includes('ios')) return <Smartphone className="w-8 h-8 text-green-400" />;
    return <Laptop className="w-8 h-8 text-gray-400" />;
  };

  const getTrustColor = (score) => {
    if (score >= 80) return "text-green-500 border-green-500/30";
    if (score >= 50) return "text-yellow-500 border-yellow-500/30";
    return "text-red-500 border-red-500/30";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 bg-[#050505] min-h-screen text-gray-100 font-sans"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-purple-400 flex items-center gap-3">
            <Cpu className="w-8 h-8" /> Network Topography
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Active fingerprinting and trust analysis of connected entities.</p>
        </div>
        
        <div className="bg-[#0a0a0a] px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-mono text-gray-400">SCANNING ACTIVE</span>
          </div>
          <button onClick={fetchNodes} className="hover:bg-gray-800 p-1 rounded transition">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {nodes.map((node) => (
            <motion.div
              key={node._id}
              variants={cardVariants}
              whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.5)" }}
              className={`bg-[#0a0a0a] rounded-xl border ${getTrustColor(node.trustScore)} border-opacity-50 p-6 relative overflow-hidden group`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-slide"></div>

              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#111] rounded-lg border border-gray-800">
                  {getIcon(node.os)}
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold font-mono ${getTrustColor(node.trustScore).split(' ')[0]}`}>
                    {node.trustScore}%
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Trust Score</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase">IP Address</label>
                  <p className="font-mono text-lg text-gray-200 tracking-wide">{node.ip}</p>
                </div>
                
                <div className="flex justify-between">
                   <div>
                      <label className="text-xs text-gray-500 uppercase">OS Family</label>
                      <p className="text-sm text-gray-300">{node.os}</p>
                   </div>
                   <div className="text-right">
                      <label className="text-xs text-gray-500 uppercase">Status</label>
                      <p className="text-sm text-green-400 flex items-center justify-end gap-1">
                        <Wifi size={12} /> {node.status}
                      </p>
                   </div>
                </div>

                {/* Trust Meter */}
                <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${node.trustScore}%` }}
                     className={`h-full ${node.trustScore > 80 ? 'bg-green-500' : node.trustScore > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                   />
                </div>

                {/* QUICK ACTIONS ROW */}
                <div className="pt-4 mt-2 border-t border-gray-800 flex justify-end">
                    <button 
                        onClick={() => handleQuickBlock(node.ip)}
                        disabled={blocking === node.ip}
                        className="flex items-center gap-2 text-xs font-bold bg-red-500/10 text-red-500 px-3 py-2 rounded hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                    >
                        {blocking === node.ip ? <RefreshCw size={14} className="animate-spin"/> : <Ban size={14} />}
                        QUICK BLOCK
                    </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {nodes.length === 0 && !loading && (
        <div className="text-center py-20 text-gray-600">
          <Wifi className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p>No active nodes discovered yet.</p>
          <p className="text-sm">Waiting for network traffic...</p>
        </div>
      )}
    </motion.div>
  );
};

export default NetworkNodes;