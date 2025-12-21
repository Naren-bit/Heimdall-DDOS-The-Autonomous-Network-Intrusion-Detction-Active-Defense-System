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

// Define Schema
const LogSchema = new mongoose.Schema({
  timestamp: String,
  src: String,
  dst: String,
  protocol: String,
  status: String,
  message: String
});
const Log = mongoose.model('Log', LogSchema);

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

// Start Server on Port 5000
server.listen(5000, () => console.log('🚀 NODE SERVER RUNNING ON PORT 5000'));