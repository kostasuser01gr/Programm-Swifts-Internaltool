#!/bin/bash
# ============================================================
# ShiftForge — One-Click Server Setup Script
# For Oracle Cloud Free Tier (Ubuntu ARM64) or any Linux machine
# ============================================================

set -e

echo "🚀 ShiftForge Server Setup"
echo "=========================="

# ── 1. System Update ─────────────────────────────────────
echo -e "\n📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# ── 2. Install Docker ────────────────────────────────────
echo -e "\n🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "✅ Docker installed. You may need to log out and back in."
else
  echo "✅ Docker already installed."
fi

# ── 3. Install Docker Compose ────────────────────────────
echo -e "\n🔧 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  sudo apt install -y docker-compose-plugin
  echo "✅ Docker Compose installed."
else
  echo "✅ Docker Compose already installed."
fi

# ── 4. Open Firewall Ports ───────────────────────────────
echo -e "\n🔥 Configuring firewall..."
sudo iptables -I INPUT -p tcp --dport 8090 -j ACCEPT  # PocketBase
sudo iptables -I INPUT -p tcp --dport 11434 -j ACCEPT # Ollama
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT    # Web (optional)
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT   # HTTPS (optional)
# Save rules
sudo sh -c 'iptables-save > /etc/iptables.rules'
echo "✅ Firewall configured."

# ── 5. Clone ShiftForge ─────────────────────────────────
echo -e "\n📥 Setting up ShiftForge..."
SHIFTFORGE_DIR="$HOME/shiftforge"
if [ ! -d "$SHIFTFORGE_DIR" ]; then
  mkdir -p "$SHIFTFORGE_DIR"
  echo "Created $SHIFTFORGE_DIR"
fi
cd "$SHIFTFORGE_DIR"

# Copy docker-compose.yml and backend files if they exist
# (In production, pull from your git repo)

# ── 6. Start Services ───────────────────────────────────
echo -e "\n🚀 Starting ShiftForge services..."
docker compose up -d

# ── 7. Pull AI Model ────────────────────────────────────
echo -e "\n🤖 Downloading AI model (this may take a few minutes)..."
sleep 10  # Wait for Ollama to start
docker exec shiftforge-ai ollama pull llama3.1:8b || \
docker exec shiftforge-ai ollama pull mistral:7b || \
echo "⚠️  Could not pull AI model. Pull manually: docker exec shiftforge-ai ollama pull llama3.1:8b"

# ── 8. Status Check ─────────────────────────────────────
echo -e "\n📊 Service Status:"
echo "──────────────────"

# Check PocketBase
if curl -sf http://localhost:8090/api/health > /dev/null 2>&1; then
  echo "✅ PocketBase: Running at http://localhost:8090"
  echo "   Admin UI:  http://localhost:8090/_/"
else
  echo "⏳ PocketBase: Starting... (check docker logs shiftforge-pb)"
fi

# Check Ollama
if curl -sf http://localhost:11434 > /dev/null 2>&1; then
  echo "✅ Ollama AI:  Running at http://localhost:11434"
else
  echo "⏳ Ollama AI:  Starting... (check docker logs shiftforge-ai)"
fi

echo ""
echo "============================================="
echo "🎉 ShiftForge Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Open PocketBase Admin: http://<YOUR-IP>:8090/_/"
echo "  2. Create your admin account"
echo "  3. Import schema:  backend/pocketbase/pb_schema.json"
echo "  4. Import seed:    backend/seed/seed_data.json"
echo "  5. Build Flutter:  flutter build web"
echo "  6. Deploy web to:  Cloudflare Pages / GitHub Pages (free)"
echo ""
echo "Server IP: $(curl -s ifconfig.me)"
echo "============================================="
