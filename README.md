# Bodyan Downloader 🚀

A premium, strictly monochrome, ultra-minimalist TikTok video and MP3 audio downloader made personally for my girlfriend.

---

## 🎨 Preview & UI Design


- **Dark Mode**: 
<img width="231" height="444" alt="Screenshot Dark 1" src="https://github.com/user-attachments/assets/fe9e5736-39f3-44e7-867f-3628eeac6754" /> <img width="231" height="444" alt="Screenshot Dark 2" src="https://github.com/user-attachments/assets/37571317-52b2-4d99-9a1d-16286dda7998" />

- **Light Mode**: 
<img width="231" height="444" alt="Screenshot Light 1" src="https://github.com/user-attachments/assets/b8bdfebb-ddc4-4e22-b69d-f0b499c32eef" /> <img width="231" height="444" alt="Screenshot Light 2" src="https://github.com/user-attachments/assets/4232484c-d050-4555-ae37-20cb48a2efad" />

---

## 🔥 Key Features

- **TikTok Media Parsing**: Downloads high-definition videos without watermarks and extracts pure MP3 audio tracks instantly.
- **Strictly Monochrome Theme**: An ultra-clean black-and-white visual layout.
- **Monochrome Theme Switcher**: Easily toggle between a **Pure Black** theme and a **Pure White** theme. Choice is persisted in `localStorage`.
- **Invitation-Only Stealth Firewall**: 
  - Prevents public access to the downloader interface.
  - Unauthorized visitors see a realistic **"Доступ ограничен"** fake lock screen.
  - Visiting the secret invite link binds the client browser to the database (configured for exactly **2 activations**).
  - If a third device visits the invite link, they receive a **"Лимит активаций исчерпан"** lock screen.
- **Localhost Developer Bypass**: Skips authorization checks on `localhost:3000` to allow offline testing.
- **Persisted History**: Saves recent downloads directly to the browser's `localStorage` for fast re-access.

---

## 🛠️ Tech Stack

- **Core**: [Next.js App Router](https://nextjs.org/) & [TypeScript](https://www.typescriptlang.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS
- **Media Engine**: TikTok No-Watermark API (RapidAPI)

---

## ⚙️ Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
# RapidAPI Credentials (tiktok-video-no-watermark2)
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_HOST=tiktok-video-no-watermark2.p.rapidapi.com

# Stealth Firewall Invite Parameter
STEALTH_SECRET_TRIGGER=beta-testing
```

### 3. Initialize Activation Database
Create a JSON file at `src/data/activation.json` if it does not exist:
```json
{
  "deviceTokens": []
}
```

---

## 🚀 Running the App

### Development Server
```bash
npm run dev
```
Open `http://localhost:3000` inside your browser to start local testing. (Bypasses firewall automatically on localhost).

### Build for Production
```bash
npm run build
npm start
```

---

## 🔒 Stealth Firewall Management

- **Invite Link Format**: `http://<your-domain>/?utm_campaign=beta-testing`
- **Resetting Activations**:
  If you or your friend needs to log in from a new device, open `src/data/activation.json` and reset the registered token list:
  ```json
  {
    "deviceTokens": []
  }
  ```
