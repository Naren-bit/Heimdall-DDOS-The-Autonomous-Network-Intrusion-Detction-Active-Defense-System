from scapy.all import sniff, IP, TCP, UDP, ICMP, send
import requests
from datetime import datetime
import logging

# Mute Scapy's verbose messages
logging.getLogger("scapy.runtime").setLevel(logging.ERROR)

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
    rst_pkt = IP(src=dst_ip, dst=src_ip) / TCP(sport=dport, dport=sport, flags="R")
    send(rst_pkt, verbose=False)

def packet_callback(packet):
    try:
        if IP in packet:
            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            
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
            elif UDP in packet: 
                protocol = "UDP"
            elif ICMP in packet: 
                protocol = "ICMP"
            else:
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

    except Exception:
        pass

if __name__ == "__main__":
    sniff(iface=INTERFACE, prn=packet_callback, store=0)