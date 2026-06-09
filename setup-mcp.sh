#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# 🔧 MCP Client Configuration Generator
# Generates configs for Claude Code, Cursor, VS Code Copilot, etc.
# ═══════════════════════════════════════════════════════════════════════

BOLD='\033[1m'
CYAN='\033[36m'
GREEN='\033[32m'
GRAY='\033[90m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${CYAN}${BOLD}🔧 Free AI MCP — Client Configuration${NC}"
echo ""

# ─── Claude Code ──────────────────────────────────────────────────────
CLAUDE_CODE_CONFIG="$HOME/.claude/mcp.json"
echo -e "${BOLD}1. Claude Code${NC}"
echo -e "   Config file: ${CYAN}$CLAUDE_CODE_CONFIG${NC}"
echo ""
echo '   Add this to your mcp.json:'
echo ''
cat << 'EOF'
   {
     "mcpServers": {
       "free-ai": {
         "command": "npx",
         "args": ["free-ai-cli", "serve"],
         "env": {
           "GOOGLE_AI_API_KEY": "...",
           "GROQ_API_KEY": "...",
           "MISTRAL_API_KEY": "..."
         }
       },
       "gemini-web": {
         "command": "npx",
         "args": ["-y", "@anthropic-ai/mcp-proxy"],
         "disabled": true,
         "_comment": "Use gemini-webapi-mcp for free Gemini web access via cookies"
       }
     }
   }
EOF
echo ""

# ─── Cursor ───────────────────────────────────────────────────────────
CURSOR_CONFIG="$HOME/.cursor/mcp.json"
echo -e "${BOLD}2. Cursor${NC}"
echo -e "   Config file: ${CYAN}$CURSOR_CONFIG${NC}"
echo ""
echo '   Same format as Claude Code above.'
echo ""

# ─── VS Code (Copilot MCP) ───────────────────────────────────────────
VSCODE_SETTINGS="$HOME/.vscode/settings.json"
echo -e "${BOLD}3. VS Code${NC}"
echo -e "   Config file: ${CYAN}$VSCODE_SETTINGS${NC}"
echo ""
echo '   Add to your settings.json:'
echo ''
cat << 'EOF'
   {
     "mcp": {
       "servers": {
         "free-ai": {
           "type": "stdio",
           "command": "npx",
           "args": ["free-ai-cli", "serve"]
         }
       }
     }
   }
EOF
echo ""

# ─── Gemini CLI with free API ────────────────────────────────────────
echo -e "${BOLD}4. Gemini CLI (Standalone)${NC}"
echo -e "   ${GRAY}Best for: Quick terminal chats with Gemini${NC}"
echo ""
echo '   # Install and configure'
echo '   npm install -g @google/gemini-cli'
echo '   export GEMINI_API_KEY="your-free-key-from-aistudio"'
echo ''
echo '   # Use latest models'
echo '   export GEMINI_MODEL="gemini-2.5-flash"   # Fast + free'
echo '   export GEMINI_MODEL="gemini-2.5-pro"     # Best quality + free'
echo ''
echo '   # Or switch inside the CLI'
echo '   gemini        # Start interactive session'
echo '   /model        # Switch models'
echo ""

# ─── OpenAI-compatible API Proxy (bonus) ──────────────────────────────
echo -e "${BOLD}5. OpenAI-Compatible Proxy (Bonus)${NC}"
echo -e "   ${GRAY}Use any OpenAI SDK with free providers${NC}"
echo ""
echo '   # Use Groq as drop-in OpenAI replacement'
echo '   from openai import OpenAI'
echo '   client = OpenAI('
echo '       base_url="https://api.groq.com/openai/v1",'
echo '       api_key=os.environ["GROQ_API_KEY"]'
echo '   )'
echo '   response = client.chat.completions.create('
echo '       model="llama-3.3-70b-versatile",'
echo '       messages=[{"role": "user", "content": "Hello!"}]'
echo '   )'
echo ""

# ─── Summary ──────────────────────────────────────────────────────────
echo -e "${GREEN}${BOLD}✅ All configs generated!${NC}"
echo ""
echo -e "${GRAY}MCP Tools available when connected:${NC}"
echo -e "  ${CYAN}chat${NC}        — Smart chat with auto-routing"
echo -e "  ${CYAN}code_review${NC} — Code review with coding-optimized model"
echo -e "  ${CYAN}reason${NC}      — Deep reasoning for complex problems"
echo -e "  ${CYAN}quick${NC}       — Fast response (Groq/Cerebras)"
echo -e "  ${CYAN}compare${NC}     — Compare responses across providers"
echo -e "  ${CYAN}consensus${NC}   — Multi-model consensus answer"
echo -e "  ${CYAN}list_models${NC} — Show available free models"
echo -e "  ${CYAN}generate_image${NC} — Image generation (Gemini free)"
echo ""
