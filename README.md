# DevConnect

DevConnect is a modern developer social network inspired by LinkedIn, built for engineers to share work, connect with peers, and grow careers.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?logo=socketdotio)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss)

## Demo

- Live App: https://devconnect2026.vercel.app/
- API Base: `http://localhost:5000/api`

## Features

### Authentication & Security
- JWT-based authentication with secure login and registration
- Protected API routes and user-scoped actions

### Posts & Engagement
- Create rich posts: text, image, video, article, event, and code snippet
- Owner-only post controls: edit, delete, and pin
- Inline post editing directly within the post card
- Real-time likes, comments, reposts, updates, and deletes via Socket.io
- Threaded comments with comment likes and replies
- Save/unsave posts with a dedicated Saved tab

### Networking & Profile
- LinkedIn-style follow requests and connection management
- Connections modal for followers, following, and pending requests
- Privacy-first networking: users must be connected to view each other's connections
- Profile and cover image upload with interactive cropper (Cloudinary)
- Pinned posts and activity-based profile tabs

### Messaging & Notifications
- Real-time direct messaging
- Real-time notification delivery for social interactions

### Discovery & UX
- Username search
- Hashtag suggestions while typing and hashtag-based feed filtering
- Trending topic filters for feed exploration
- Responsive UI with polished transitions and interaction states

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
