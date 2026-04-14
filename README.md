# 🚀 ShareFile

**ShareFile** is a secure, real-time peer-to-peer sharing platform designed for instant collaboration. Live at [sharefile.click](https://sharefile.click), it allows users to discover nearby devices, transfer files, and collaborate on code snippets across devices without creating an account or logging in.

Built with **React**, **Node.js**, **Express**, and **Socket.io**, ShareFile operates entirely in-memory (RAM), ensuring that no data is permanently stored on the server—making it privacy-focused and lightning-fast.

## ✨ Key Features

* **📍 GPS Radar:** Automatically discover and connect with other users within 100 meters using browser geolocation.
* **⚡ Real-Time Transfer:** Instant peer-to-peer file sharing using WebSockets.
* **💻 Live Code Collaboration:** A real-time code editor for pair programming or sharing snippets.
* **🔒 Zero-Persistence:** No database. Files, radar locations, and code are wiped from RAM instantly when the connection drops.
* **🚫 No Logins:** Anonymous, hassle-free usage with custom display names or unique 6-digit room codes.
* **🎨 Modern UI:** A sleek "Deep Space" neon aesthetic with glassmorphism effects built with Tailwind CSS.
* **📱 Responsive:** Works seamlessly on mobile, tablet, and desktop.

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, Tailwind CSS, Lucide Icons
* **Backend:** Node.js, Express.js
* **Real-time Engine:** Socket.io

## 🚀 How to Run Locally

1.  Clone the repository:
    ```bash
    git clone [https://github.com/Madhav7871/dropsync.git](https://github.com/Madhav7871/dropsync.git)
    ```
2.  Install backend dependencies:
    ```bash
    npm install
    ```
3.  Start the Node server:
    ```bash
    node server.js
    ```
4.  Open a new terminal for the frontend, install dependencies, and start Vite:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
5.  Open `http://localhost:5173` in your browser.

---
Made with ❤️ by Madhav Kalra
