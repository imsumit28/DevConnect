# DevConnect

DevConnect is a modern developer social network inspired by LinkedIn, built for engineers to share work, connect with peers, and grow careers.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?logo=socketdotio)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss)

## Demo

- Live App: [https://your-demo-link-here.com](https://your-demo-link-here.com)
- API Base: `http://localhost:5000/api`

## Features

- JWT auth with secure login/register flow
- Rich post system (text, image, video, event, article)
- Real-time likes, comments, reposts, and notifications (Socket.io)
- Follow/unfollow with live social updates
- Profile system with cover/profile image upload and crop editor
- Pinned posts and profile activity tabs
- Direct messaging with real-time delivery
- Search users by username
- Trending topic filters for feed exploration
- Responsive, modern UI with polished micro-interactions

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

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS v4
- React Router
- Axios
- Socket.io Client

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.io
- JWT + bcrypt
- Multer + Cloudinary

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account

### 1. Clone
```bash
git clone https://github.com/yourusername/devconnect.git
cd devconnect
```

### 2. Setup backend
```bash
cd server
npm install
```

Create `server/.env`:
```env
MONGO_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

### 3. Setup frontend
```bash
cd ../client
npm install
```

### 4. Run app
```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd client
npm run dev
```

Open `http://localhost:5173`.

## Project Structure

```text
devconnect/
  client/
    src/
      components/
      context/
      pages/
      services/
      utils/
  server/
    controllers/
    middleware/
    models/
    routes/
```

## License

MIT
