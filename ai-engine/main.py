from scapy.all import sniff, IP, TCP, UDP, ICMP, send
import requests
<<<<<<< HEAD
import threading
import time
=======
>>>>>>> b918e8e (Added the Backend + AI Engine modules)
from datetime import datetime
import logging

# Mute Scapy's verbose messages
logging.getLogger("scapy.runtime").setLevel(logging.ERROR)

<<<<<<< HEAD
# --- CONFIGURATION ---
INTERFACE = "eth0"  # Update to "Wi-Fi" or "Ethernet" if on Windows
API_BASE = "http://localhost:5000/api"

# 🚫 IGNORE LIST (Internal Dashboard Noise)
IGNORE_PORTS = {5000, 5173, 27017}

# 🔒 GLOBAL CACHES
BLOCKED_IPS = set()
KNOWN_NODES = {}  # Cache to prevent spamming the Node API

print(f"🔥 HEIMDALL AI ENGINE STARTED ON {INTERFACE}")
print("   (Syncing Firewall & Discovering Nodes...)")

# --- 1. FIREWALL SYNC THREAD ---
def sync_firewall_rules():
    """Background thread to fetch blocked IPs from the Backend"""
    global BLOCKED_IPS
    while True:
        try:
            response = requests.get(f"{API_BASE}/firewall", timeout=2)
            if response.status_code == 200:
                rules = response.json()
                BLOCKED_IPS = {rule['ip'] for rule in rules}
        except Exception:
            pass 
        time.sleep(2)

threading.Thread(target=sync_firewall_rules, daemon=True).start()

# --- 2. NODE FINGERPRINTING (PASSIVE) ---
def analyze_node(src_ip, packet):
    """Guess the OS based on TTL and update the backend."""
    # Rate limit: Only update the same IP once every 60 seconds
    if src_ip in KNOWN_NODES and (time.time() - KNOWN_NODES[src_ip]['last_check'] < 60):
        return

    detected_os = "Unknown"
    if IP in packet:
        ttl = packet[IP].ttl
        # Basic Passive Fingerprinting Rules
        if ttl <= 64:
            detected_os = "Linux/Unix/Mac/Mobile"
        elif ttl <= 128:
            detected_os = "Windows"
        elif ttl <= 255:
            detected_os = "Network Device (Cisco/Router)"

    try:
        # Send discovery data to Node.js
        data = {"ip": src_ip, "os": detected_os}
        requests.post(f"{API_BASE}/nodes/update", json=data, timeout=0.1)
        
        # Update local cache
        KNOWN_NODES[src_ip] = {'last_check': time.time()}
        print(f"🔍 DISCOVERED NODE: {src_ip} ({detected_os})")
    except:
        pass

def send_kill_packet(src_ip, dst_ip, sport, dport):
    """Sends a spoofed TCP RST packet to kill the connection."""
=======
# CONFIGURATION
INTERFACE = "eth0"
NODE_API_URL = "http://localhost:5000/api/log"

# 🔴 ATTACKER IP
ATTACK_IP = "1.2.3.4"

# 🚫 IGNORE LIST (Internal Dashboard Noise)
# We MUST hide these ports, otherwise the dashboard logs itself!
IGNORE_PORTS = {5000, 5173, 27017}

print(f"🔥 HEIMDALL FULL MONITOR STARTED ON {INTERFACE}")
print("   (Monitoring ALL traffic. Active Defense enabled for {ATTACK_IP}...)")

def send_kill_packet(src_ip, dst_ip, sport, dport):
    """
    Sends a spoofed TCP RST (Reset) packet to kill the connection.
    """
>>>>>>> b918e8e (Added the Backend + AI Engine modules)
    rst_pkt = IP(src=dst_ip, dst=src_ip) / TCP(sport=dport, dport=sport, flags="R")
    send(rst_pkt, verbose=False)

def packet_callback(packet):
    try:
        if IP in packet:
            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            
<<<<<<< HEAD
            # Smart Noise Filter (Loopback)
            if src_ip == "127.0.0.1" or dst_ip == "127.0.0.1": return

            # --- A. DISCOVER NODE ---
            analyze_node(src_ip, packet)

            # Determine Protocol & Ports
            protocol = "Other"; sport = 0; dport = 0
            if TCP in packet: 
                protocol = "TCP"; sport = packet[TCP].sport; dport = packet[TCP].dport
                if sport in IGNORE_PORTS or dport in IGNORE_PORTS: return
=======
            # --- 1. SMART NOISE FILTER ---
            # Don't show traffic from the Dashboard to the Backend (Infinite Loop)
            if src_ip == "127.0.0.1" or dst_ip == "127.0.0.1":
                return

            # Don't show traffic on internal ports (Backend/Frontend/DB)
            if TCP in packet:
                if packet[TCP].sport in IGNORE_PORTS or packet[TCP].dport in IGNORE_PORTS:
                    return
            
            # Determine Protocol & Ports
            protocol = "Other"
            sport = 0
            dport = 0
            
            if TCP in packet: 
                protocol = "TCP"
                sport = packet[TCP].sport
                dport = packet[TCP].dport
>>>>>>> b918e8e (Added the Backend + AI Engine modules)
            elif UDP in packet: 
                protocol = "UDP"
            elif ICMP in packet: 
                protocol = "ICMP"
            else:
<<<<<<< HEAD
                return

            # --- B. FIREWALL CHECK (ACTIVE DEFENSE) ---
            if src_ip in BLOCKED_IPS:
                print(f"⛔ BLOCKED PACKET from {src_ip}")
                
                # Active Defense: Kill TCP connections
                if protocol == "TCP":
                    send_kill_packet(src_ip, dst_ip, sport, dport)

                # Log Block to Dashboard
                log_data = {
                    "timestamp": datetime.now().strftime("%H:%M:%S"),
                    "src": src_ip, "dst": dst_ip, "protocol": protocol,
                    "status": "BLOCKED", "message": "Blocked by Manual Firewall Rule"
                }
                try:
                    requests.post(f"{API_BASE}/log", json=log_data, timeout=0.1)
                    # Penalty: Drop Trust Score
                    requests.post(f"{API_BASE}/nodes/penalize", json={"ip": src_ip, "penalty": 10}, timeout=0.1)
                except: pass
                
                return # Stop processing

            # --- C. ALLOWED TRAFFIC LOGGING ---
            log_data = {
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "src": src_ip, "dst": dst_ip, "protocol": protocol,
                "status": "ALLOWED", "message": f"✅ Traffic accepted from {src_ip}"
            }
            try:
                requests.post(f"{API_BASE}/log", json=log_data, timeout=0.1)
            except: pass
=======
                return # Skip ARP/IGMP junk

            # --- 2. ACTIVE DEFENSE LOGIC ---
            is_attack = (src_ip == ATTACK_IP)

            if is_attack:
                status = "BLOCKED"
                message = f"🚫 PACKET KILLED: {src_ip} connection terminated."
                print(f"⚡ DETECTED ATTACK from {src_ip} -> SENDING KILL PACKET")
                
                # 🔫 SHOOT BACK: Kill the connection
                if protocol == "TCP":
                    send_kill_packet(src_ip, dst_ip, sport, dport)
            else:
                status = "ALLOWED"
                message = f"✅ Traffic accepted from {src_ip}"

            # --- 3. LOG TO DASHBOARD ---
            log_data = {
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "src": src_ip,
                "dst": dst_ip,
                "protocol": protocol,
                "status": status,
                "message": message
            }

            try:
                requests.post(NODE_API_URL, json=log_data, timeout=0.1)
            except:
                pass 
>>>>>>> b918e8e (Added the Backend + AI Engine modules)

    except Exception:
        pass

if __name__ == "__main__":
    sniff(iface=INTERFACE, prn=packet_callback, store=0)