# 🌌 CodeOrbit — Mobile Subject & Code Vault

A personal, mobile-first code and subject repository designed to store algorithms, design patterns, and programming notes with dual viewing modes: **Serial-Wise Ordered List** and an interactive **Neural Orb Network Diagram**.

---

## ✨ Features

- 📱 **Mobile-First & PWA Ready**: Install directly to your phone's home screen as a fullscreen app with offline persistence.
- 📚 **Custom Subjects**: Create and manage subjects (DSA, OOPs, Java, Python, System Design, etc.) with custom descriptions and glowing color themes.
- 🏷️ **Manual Heading & Code Copy-Paste**: Store code with your own heading, select programming language, add notes, and paste snippets with one tap.
- 🔢 **Serial-Wise List**: Sequential ordered list (`#01`, `#02`, `#03`...) preserving your study curriculum order with search, reorder, and quick copy.
- 🪐 **Interactive Neural Orb Diagram**: HTML5 Canvas force-directed graph with glowing synaptic filaments and pulsing subject hub. **Tap any orb to jump straight into the full code page**.
- 💻 **Full Access Code Page**:
  - Real-time syntax highlighting with line numbers (Java, C++, Python, JavaScript, SQL, C, etc.).
  - 1-tap Copy to Clipboard.
  - In-place full editing of title heading, code, and language.
  - Export/download snippet file (`.java`, `.cpp`, `.py`, etc.).
  - Fullscreen code view for focused study.
- 💾 **Local Persistence & Backup**: Automatic `localStorage` sync plus JSON export/import for cross-device transfer.
- 📶 **Phone Connect HUD**: Built-in QR code & local network IP for fast phone access.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev -- --host
```

Access the app on:
- **Local**: `http://localhost:5173/`
- **Phone (on same Wi-Fi)**: `http://<your-computer-ip>:5173/`

### 3. Build for Production
```bash
npm run build
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Styling**: Vanilla CSS (Cosmic Dark Glassmorphism Design System)
- **Visualization**: HTML5 2D Canvas Physics Engine with touch gesture support
- **Syntax Highlighting**: Prism.js
- **Icons**: Lucide Icons
