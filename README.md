# 🛡️ The Heimdall Active Defense System
> **From Passive Monitoring to Active Neutralization.**

![Project Status](https://img.shields.io/badge/Status-Active_Defense_Online-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Python_%7C_Node.js_%7C_React_%7C_MongoDB-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)

## Overview
**Heimdall** is a next-generation Network Intrusion Detection & Prevention System (NIDS/IPS) designed to bridge the gap between simple traffic logging and active threat mitigation. 

Unlike traditional packet sniffers that only *watch* the network, Heimdall acts as a digital sentry. It analyzes traffic in real-time and, upon detecting a known threat, actively intervenes by injecting **TCP Reset (RST) packets**—instantly severing the attacker's connection before damage can occur.

All of this is visualized on a cinematic, "Hacker-Style" dashboard that gives security analysts a live pulse of their network's health.

---

## Key Features

### Omni-Directional Monitoring
* Captures and analyzes live network packets using **Scapy**.
* Distinguishes between harmless background noise (OS updates, SSDP) and potential threats.

### Active Defense Engine
* **The Kill Switch:** Automatically detects malicious IPs and fires spoofed TCP Reset packets.
* **Instant Mitigation:** Terminates unauthorized connections in milliseconds without human intervention.

### Real-Time Visualization
* **React + Vite Dashboard:** A high-performance UI displaying live packet streams.
* **Dynamic Threat Levels:** Visual indicators shift from "Secure" to "Critical" based on attack volume.

### Smart Filtering
* **Noise Cancellation:** Intelligently ignores internal localhost traffic and dashboard loopback to prevent log flooding.
* **Whitelisting:** Automatically recognizes safe system traffic (Ubuntu/Canonical updates, DNS queries).

---

## The Tech Stack
* **Brain:** Python (Scapy, Requests)
* **Nerve Center:** Node.js & Express
* **Memory:** MongoDB
* **Face:** React.js (Vite) & Tailwind CSS

---

## Installation & Setup

Follow these steps to get Heimdall running on your local Linux or WSL environment.

### Prerequisites
* **Node.js** (v18 or higher)
* **Python** (v3.10 or higher)
* **MongoDB** (Must be installed locally)
* **Root/Sudo Access** (Required for packet sniffing)

### Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/heimdall-active-defense.git](https://github.com/YOUR_USERNAME/heimdall-active-defense.git)
cd heimdall-active-defense
