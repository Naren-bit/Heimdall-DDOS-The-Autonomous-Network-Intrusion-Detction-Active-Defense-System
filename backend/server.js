const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(express.json()); // Allow parsing JSON from Python

// 1. Create HTTP Server & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 2. Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/heimdall')
  .then(() => console.log('✅ NODE: Connected to MongoDB'))
  .catch(err => console.error('❌ NODE: Mongo Error:', err));

// --- Schema 1: Network Logs (Existing) ---
const LogSchema = new mongoose.Schema({
  timestamp: String,
  src: String,
  dst: String,
  protocol: String,
  status: String,
  message: String
});
const Log = mongoose.model('Log', LogSchema);

// --- Schema 2: Firewall Rules (NEW) ---
const firewallSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  action: { type: String, default: 'DENY' }, // DENY or ALLOW
  reason: { type: String, default: 'Manual Admin Block' },
  addedAt: { type: Date, default: Date.now }
});
const FirewallRule = mongoose.model('FirewallRule', firewallSchema);

// 3. WebSocket Connection (For React Frontend)
wss.on('connection', (ws) => {
  console.log('⚡ REACT CONNECTED TO NODE.JS');
  
  // Send last 50 logs immediately upon connection
  Log.find().sort({_id: -1}).limit(50).then(logs => {
    ws.send(JSON.stringify(logs));
  });
});

// 4. API Endpoint (For Python to send data)
app.post('/api/log', async (req, res) => {
  const newLog = req.body;

  // A. Save to MongoDB
  try {
    const logEntry = new Log(newLog);
    await logEntry.save();
    
    // B. Broadcast to all connected React clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        // Wrap in array because Frontend expects a list
        client.send(JSON.stringify([newLog])); 
      }
    });

    res.status(200).send("Log Received");
  } catch (err) {
    console.error("Error saving log:", err);
    res.status(500).send("Error");
  }
});

// --- NEW API ROUTES: FIREWALL MANAGEMENT ---

// GET: Fetch all active rules
app.get('/api/firewall', async (req, res) => {
  try {
    const rules = await FirewallRule.find().sort({ addedAt: -1 });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add a new block rule
app.post('/api/firewall', async (req, res) => {
  try {
    const { ip, reason } = req.body;
    const newRule = new FirewallRule({ ip, reason });
    await newRule.save();
    res.json(newRule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove a rule (Unban)
app.delete('/api/firewall/:id', async (req, res) => {
  try {
    await FirewallRule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rule deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Schema 3: Network Nodes (Device Discovery) ---
const nodeSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  mac: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' }, // Windows, Linux, etc.
  type: { type: String, default: 'Device' }, // Server, Workstation, Mobile
  trustScore: { type: Number, default: 100 }, // 0 to 100
  status: { type: String, default: 'Online' },
  lastSeen: { type: Date, default: Date.now }
});
const NetworkNode = mongoose.model('NetworkNode', nodeSchema);

// --- API: Get All Nodes ---
app.get('/api/nodes', async (req, res) => {
  try {
    // Return nodes sorted by lastSeen (most active first)
    const nodes = await NetworkNode.find().sort({ lastSeen: -1 });
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Register/Update a Node ---
app.post('/api/nodes/update', async (req, res) => {
  const { ip, os, mac } = req.body;
  try {
    let node = await NetworkNode.findOne({ ip });
    
    if (node) {
      // Update existing node
      node.lastSeen = Date.now();
      node.status = 'Online';
      if (os && os !== 'Unknown') node.os = os; // Update OS if we found a better match
      if (mac) node.mac = mac;
      await node.save();
    } else {
      // Discover new node
      node = new NetworkNode({ 
        ip, 
        os: os || 'Unknown', 
        mac: mac || 'Unknown',
        trustScore: 100 // New devices start trusted
      });
      await node.save();
    }
    res.json({ success: true, node });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API: Penalize a Node (Lower Trust Score) ---
app.post('/api/nodes/penalize', async (req, res) => {
  const { ip, penalty } = req.body;
  try {
    let node = await NetworkNode.findOne({ ip });
    if (node) {
      node.trustScore = Math.max(0, node.trustScore - penalty);
      await node.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Start Server on Port 5000
server.listen(5000, () => console.log('🚀 NODE SERVER RUNNING ON PORT 5000'));