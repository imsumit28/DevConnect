# DevConnect

**Bridging the gap between code and community.**

DevConnect is a high-performance, real-time ecosystem designed for the modern engineer. It transcends traditional social networking by providing a dedicated space where developers don't just "connect"—they **collaborate, innovate, and grow together.** 

Built with the MERN stack and real-time synchronization, DevConnect serves as a digital headquarters for engineering synergy, allowing developers to share complex logic, mentor peers, and discover their next big project or teammate.

[![Live Demo](https://img.shields.io/badge/Live-Demo-0b6bcb?style=for-the-badge)](https://devconnect2026.vercel.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socketdotio)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## The Collaborative Mission

DevConnect is built on the philosophy that the best software is born from collective intelligence. Our platform focuses on three pillars:
1.  **Code Transparency**: Share and discuss raw logic through specialized code-post types.
2.  **Engineering Synergy**: Real-time tools that turn passive following into active collaboration.
3.  **Developer Growth**: A curated environment free from general social noise, focused strictly on tech-driven progress.

---

## Core Features

### Collaborative Content
- **Specialized Code Snippets**: Share algorithms and logic with built-in syntax highlighting for instant peer review and collaboration.
- **Dynamic Articles & Events**: Publish deep-dives into tech stacks or organize collaborative hackathons and meetups.
- **Rich Media Support**: Demonstrate UI/UX or architectural flows through high-quality video and image sharing.

### Real-Time Interaction Ecosystem
- **Live Chatting**: Fully integrated messaging system for rapid one-on-one technical discussion and real-time collaboration.
- **Instant Feed Updates**: Powered by Socket.io, witness the pulse of the community with live likes, comments, and reposts.
- **Smart Notifications**: Never miss a collaboration request, follow, or a comment on your latest snippet.

### Professional Networking & Discovery
- **Real-Time Connections**: Dynamic follow and following system with instant updates and connection management.
- **Developer Profiles**: Show off your stack, pinned contributions, and recent activity.
- **Hashtag-Driven Exploration**: Navigate through specific technologies (e.g., #react, #rust) to find relevant collaborators.
- **Sticky Desktop UX**: Optimized layout with sticky sidebars ensures global navigation is always one click away during deep scrolls.

---

## Screenshots

### 1. Login Page
![Login Page](docs/screenshots/01-login-page.png)

### 2. Register Page
![Register Page](docs/screenshots/02-register-page.png)

### 3. Forgot Password
![Forgot Password](docs/screenshots/03-forgot-password.png)

### 4. Profile
![Profile Main](docs/screenshots/04-profile-main.png)

### 5. Profile
![Profile Details](docs/screenshots/05-profile-details.png)

### 6. Home Feed
![Home Feed Top](docs/screenshots/06-home-feed-top.png)

### 7. Home Feed
![Home Feed Feed](docs/screenshots/07-home-feed-feed.png)

---

## Technical Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS v4 (Glassmorphism & Micro-animations)
- **Networking**: Axios with global **401 handling** for secure session management.
- **Real-time**: Socket.io-client for bi-directional event handling.

### Backend
- **Core**: Node.js & Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Auth**: Secure JWT-based authentication with bcrypt hashing.
- **Media**: Cloudinary integration for scalable asset management.

---

## Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/imsumit28/DevConnect.git
cd DevConnect

# Setup Backend & Frontend
cd server && npm install
cd ../client && npm install
```

### 2. Configuration
Create a `.env` file in the `server` directory with your `MONGO_URI`, `JWT_SECRET`, and `CLOUDINARY` credentials.

### 3. Execution
```bash
# Terminal 1 (Server)
cd server && npm run dev

# Terminal 2 (Client)
cd client && npm run dev
```

---

## License
Distributed under the MIT License. Built for developers, by developers.

---
**DevConnect: Where Code Meets Community.**
