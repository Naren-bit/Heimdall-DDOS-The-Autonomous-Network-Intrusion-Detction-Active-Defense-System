import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Trash2, Plus, AlertOctagon, Activity, AlertTriangle } from 'lucide-react';

const FirewallRules = () => {
  const [rules, setRules] = useState([]);
  const [newIp, setNewIp] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // State for validation errors

  // Regex for valid IPv4 (e.g., 192.168.1.1)
  const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // Fetch rules from backend on load
  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/firewall');
      const data = await response.json();
      setRules(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching firewall rules:', error);
      setLoading(false);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    // --- 1. VALIDATION CHECKS ---
    if (!newIp) {
      setError('Please enter an IP address.');
      return;
    }
    if (!ipRegex.test(newIp)) {
      setError('Invalid IP format. Use standard IPv4 (e.g., 192.168.1.50)');
      return;
    }
    if (rules.some(r => r.ip === newIp)) {
      setError('This IP is already in the block list.');
      return;
    }

    // --- 2. OPTIMISTIC UI UPDATE ---
    const tempId = Date.now(); 
    // const tempRule = { _id: tempId, ip: newIp, action: 'DENY', reason: 'Manual Admin Block', addedAt: new Date() }; // Not used directly, but good for reference
    
    try {
      const response = await fetch('http://localhost:5000/api/firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: newIp, reason: 'Manual Admin Block' }),
      });
      
      if (response.ok) {
        setNewIp(''); 
        fetchRules(); // Re-sync with real DB ID
      }
    } catch (error) {
      console.error('Error adding rule:', error);
      setError('Failed to connect to server.');
    }
  };

  const handleDelete = async (id) => {
    // Optimistic UI: Remove immediately from screen
    setRules(rules.filter(r => r._id !== id));

    try {
      await fetch(`http://localhost:5000/api/firewall/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting rule:', error);
      fetchRules(); // Revert if failed
    }
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 100, transition: { duration: 0.2 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 bg-[#050505] min-h-screen text-gray-100 font-sans"
    >
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-blue-400 flex items-center gap-3"
          >
            <Shield className="w-8 h-8" /> Firewall Rules
          </motion.h1>
          <p className="text-gray-400 mt-2 text-sm">Manual override control for Heimdall Active Defense.</p>
        </div>
        
        {/* Stats Card with Pulse Effect */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-[#0a0a0a] p-4 rounded-xl border border-gray-800 shadow-[0_0_15px_rgba(220,38,38,0.1)] flex items-center gap-4"
        >
          <div className="bg-red-900/20 p-3 rounded-lg">
             <AlertOctagon className="text-red-500 w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs text-gray-500 uppercase tracking-widest font-bold">Active Bans</span>
            <span className="text-2xl font-mono font-bold text-red-500">{rules.length}</span>
          </div>
        </motion.div>
      </div>

      {/* Add New Rule Form */}
      <motion.div 
        variants={itemVariants}
        className="bg-[#0a0a0a] p-6 rounded-xl border border-gray-800 mb-8 shadow-lg relative overflow-visible" 
      >
        {/* Changed overflow-hidden to overflow-visible so the error message tooltip isn't cut off if positioned outside */}
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl"></div>
        <h3 className="text-lg font-semibold mb-4 text-gray-200 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-500" /> Add New Block Rule
        </h3>
        <form onSubmit={handleAddRule} className="flex gap-4 items-start"> 
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder="Enter IP Address (e.g., 55.66.77.88)"
              value={newIp}
              onChange={(e) => {
                  setNewIp(e.target.value);
                  if(error) setError(''); // Clear error on type
              }}
              className={`w-full bg-[#111] border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-gray-700 focus:border-blue-500'} text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-1 ${error ? 'focus:ring-red-500' : 'focus:ring-blue-500'} transition-all font-mono tracking-wide`}
            />
            
            {/* ERROR MESSAGE ANIMATION */}
            <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -bottom-7 left-0 text-xs text-red-400 font-mono flex items-center gap-1.5"
                  >
                    <AlertTriangle size={12} /> {error}
                  </motion.div>
                )}
            </AnimatePresence>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#b91c1c" }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-red-900/20 flex items-center gap-2 h-full"
          >
            <Shield className="w-4 h-4" /> BLOCK IP
          </motion.button>
        </form>
      </motion.div>

      {/* Rules Table */}
      <motion.div 
        variants={itemVariants}
        className="bg-[#0a0a0a] rounded-xl border border-gray-800 overflow-hidden shadow-xl"
      >
        <div className="px-6 py-4 border-b border-gray-800 bg-[#0f0f0f] flex justify-between items-center">
            <h3 className="font-semibold text-gray-300">Active Enforcement List</h3>
            <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-xs text-red-400 font-mono">LIVE SYNC</span>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-[#111] text-gray-500 uppercase text-xs">
                <tr>
                <th className="px-6 py-4 tracking-wider">Status</th>
                <th className="px-6 py-4 tracking-wider">IP Address</th>
                <th className="px-6 py-4 tracking-wider">Action</th>
                <th className="px-6 py-4 tracking-wider">Reason</th>
                <th className="px-6 py-4 tracking-wider">Added At</th>
                <th className="px-6 py-4 tracking-wider text-right">Controls</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
                <AnimatePresence mode='popLayout'>
                {rules.map((rule) => (
                    <motion.tr 
                        key={rule._id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="group hover:bg-[#111] transition-colors"
                    >
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        <Activity className="w-3 h-3 mr-1.5 animate-pulse" />
                        ACTIVE
                        </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-blue-300 group-hover:text-blue-400 transition-colors">
                        {rule.ip}
                    </td>
                    <td className="px-6 py-4 font-bold text-red-500 tracking-widest text-xs">
                        DENY
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                        {rule.reason}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-mono">
                        {new Date(rule.addedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <motion.button
                        whileHover={{ scale: 1.1, color: "#ef4444" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(rule._id)}
                        className="text-gray-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                        title="Remove Rule"
                        >
                        <Trash2 className="w-4 h-4" />
                        </motion.button>
                    </td>
                    </motion.tr>
                ))}
                </AnimatePresence>
                
                {rules.length === 0 && !loading && (
                    <motion.tr 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }}
                    >
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-600">
                            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No active firewall rules.</p>
                            <p className="text-xs mt-1 opacity-50">System is running in passive monitoring mode.</p>
                        </td>
                    </motion.tr>
                )}
            </tbody>
            </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FirewallRules;