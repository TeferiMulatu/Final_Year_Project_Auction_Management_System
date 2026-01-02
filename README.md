# MAU Auction Platform

A full-stack auction platform (React + Vite frontend, Express + MySQL backend) with real-time bidding via Socket.IO. This repository contains the frontend app in the `frontend` folder and the backend API in the `server` folder.

## Project structure

```
finalproject/
├── frontend/    # React frontend (Vite)
├── server/      # Express backend API
├── uploads/     # uploaded files served by server
└── README.md
```

## Quick start

1. Install dependencies for both apps:

```bash
npm run install:all
```

2. Configure the server environment: copy `server/.env.example` to `server/.env` and set DB credentials.

3. (Optional) Seed the database:

```bash
npm run seed
```

4. Start both apps:

```bash
npm run dev
```

Or run them separately:

Backend:
```bash
npm run dev:backend
```

Frontend:
```bash
npm run dev:frontend
```

### Local URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Demo accounts (local/dev)

- Admin: admin@mau.edu.et / Admin@123
- Seller: seller@mau.edu.et / Seller@123
- Bidder: bidder@mau.edu.et / Bidder@123

## Features

- Role-based users: Admin, Seller, Bidder
- Real-time bidding (Socket.IO)
- Auction creation, image uploads, and bid history
- Admin moderation and reporting utilities

## Tools & Dependencies

**Frontend** (from `frontend/package.json`)

- Dependencies:
  - @tailwindcss/vite ^4.1.14
  - axios ^1.12.2
  - react ^19.1.1
  - react-dom ^19.1.1
  - react-router-dom ^7.9.4
  - socket.io-client ^4.8.1

- Dev dependencies / build tools:
  - vite ^7.1.7
  - @vitejs/plugin-react ^5.0.4
  - tailwindcss ^4.1.14
  - postcss ^8.5.6
  - autoprefixer ^10.4.21
  - eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh

**Backend / Server** (from `server/package.json`)

- Dependencies:
  - express ^4.19.2
  - mysql2 ^3.11.0
  - socket.io ^4.7.5
  - jsonwebtoken ^9.0.2
  - bcryptjs ^2.4.3
  - express-validator ^7.2.1
  - cors ^2.8.5
  - dotenv ^16.4.5
  - morgan ^1.10.0
  - nodemailer ^6.9.4
  - multer ^1.4.4
  - http-proxy-middleware ^3.0.5

If you need a machine-readable list, open:
- [frontend/package.json](frontend/package.json)
- [server/package.json](server/package.json)

## Environment

Create `server/.env` (example values):

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=maun_auction
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_ORIGIN=http://localhost:5173
```

## Contributing

Open issues or PRs. See `frontend` and `server` folders for app-specific notes.

## License

MIT
# MAU Auction Platform

A full-stack auction platform (React + Vite frontend, Express + MySQL backend) with real-time bidding via Socket.IO. This repository contains the frontend app in the `frontend` folder and the backend API in the `server` folder.

## Project structure

```
finalproject/
├── frontend/    # React frontend (Vite)
├── server/      # Express backend API
├── uploads/     # uploaded files served by server
└── README.md
```

## Quick start

1. Install dependencies for both apps:

```bash
npm run install:all
```

2. Configure the server environment: copy `server/.env.example` to `server/.env` and set DB credentials.

3. (Optional) Seed the database:

```bash
npm run seed
```

4. Start both apps:

```bash
npm run dev
```

Or run them separately:

Backend:
```bash
npm run dev:backend
```

Frontend:
```bash
npm run dev:frontend
```

### Local URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Demo accounts (local/dev)

- Admin: admin@mau.edu.et / Admin@123
- Seller: seller@mau.edu.et / Seller@123
- Bidder: bidder@mau.edu.et / Bidder@123

## Features

- Role-based users: Admin, Seller, Bidder
- Real-time bidding (Socket.IO)
- Auction creation, image uploads, and bid history
- Admin moderation and reporting utilities

## Tools & Dependencies

**Frontend** (from `frontend/package.json`)

- Dependencies:
  - @tailwindcss/vite ^4.1.14
  - axios ^1.12.2
  - react ^19.1.1
  - react-dom ^19.1.1
  - react-router-dom ^7.9.4
  - socket.io-client ^4.8.1

- Dev dependencies / build tools:
  - vite ^7.1.7
  - @vitejs/plugin-react ^5.0.4
  - tailwindcss ^4.1.14
  - postcss ^8.5.6
  - autoprefixer ^10.4.21
  - eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh

**Backend / Server** (from `server/package.json`)

- Dependencies:
  - express ^4.19.2
  - mysql2 ^3.11.0
  - socket.io ^4.7.5
  - jsonwebtoken ^9.0.2
  - bcryptjs ^2.4.3
  - express-validator ^7.2.1
  - cors ^2.8.5
  - dotenv ^16.4.5
  - morgan ^1.10.0
  - nodemailer ^6.9.4
  - multer ^1.4.4
  - http-proxy-middleware ^3.0.5

If you need a machine-readable list, open:
- [frontend/package.json](frontend/package.json)
- [server/package.json](server/package.json)

## Environment

Create `server/.env` (example values):

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=maun_auction
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_ORIGIN=http://localhost:5173
```

## Contributing

Open issues or PRs. See `frontend` and `server` folders for app-specific notes.

## License

MIT
# MAU Auction Platform

A full-stack auction platform built with React, Express.js, and MySQL.

![image alt](https://github.com/TeferiMulatu/Final_Year_Project_Auction_Management_System/blob/a816fb13851da07a15222bcedd3f64b76f750ba2/img2.png)
![image alt](https://github.com/TeferiMulatu/Final_Year_Project_Auction_Management_System/blob/922563b74081195088c65034393e7380c4284461/img1.png)
## Project Structure

```
finalproject/
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── server/            # Express.js backend API
│   ├── src/
│   ├── package.json
│   └── .env.example
├── package.json       # Root package.json for managing both apps
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Set up MySQL:**
   - Start MySQL service
   - Create database: `maun_auction`
   - Update `server/.env` with your MySQL credentials

3. **Seed the database:**
   ```bash
   npm run seed
   ```

4. **Start both frontend and backend:**
   ```bash
   npm run dev
   ```

   Or start them separately:
   ```bash
   # Terminal 1 - Backend
   npm run dev:backend
   
   # Terminal 2 - Frontend  
   npm run dev:frontend
   ```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

### Demo Accounts

- **Admin:** admin@mau.edu.et / Admin@123
- **Seller:** seller@mau.edu.et / Seller@123
- **Bidder:** bidder@mau.edu.et / Bidder@123

## Features

- 🔐 Role-based authentication (Admin, Seller, Bidder)
- 📦 Auction creation and management
- 💰 Real-time bidding with Socket.IO
- ⏰ Live countdown timers
- 🔍 Search and filtering
- 📊 Admin dashboard with approval workflow
- 📱 Responsive design

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd server
npm run dev
```

### Database Management
```bash
# Seed database with sample data
npm run seed

# Reset database (if needed)
cd server
npm run seed
```

## Environment Variables

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=maun_auction
# MAU Auction Platform

A full-stack auction platform built with React, Express.js, and MySQL. This repository contains a Vite-powered React frontend and an Express backend with real-time bidding powered by Socket.IO.

![MAU Auction screenshot](https://github.com/TeferiMulatu/Final_Year_Project_Auction_Management_System/blob/main/img2.png)

## Project Structure

```
finalproject/
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── server/            # Express.js backend API
│   ├── src/
│   ├── package.json
│   └── .env.example
├── package.json       # Root package.json for managing both apps
└── README.md
```

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)

### Installation

1. Install dependencies for both frontend and server:

```bash
npm run install:all
```

2. Configure MySQL and create the database `maun_auction`. Update `server/.env` with your DB credentials.

3. Seed the database (optional but useful for local testing):

```bash
npm run seed
```

4. Start both apps:

```bash
npm run dev
```

Or run them separately:

```bash
# Backend
npm run dev:backend

# Frontend
npm run dev:frontend
```

### Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

### Public Pages (frontend routes)

- About: `/about` — general project information and contact.
- FAQ: `/faq` — common questions about registering, bidding, and payments.

### Demo Accounts

- Admin: admin@mau.edu.et / Admin@123
- Seller: seller@mau.edu.et / Seller@123
- Bidder: bidder@mau.edu.et / Bidder@123

## Features

- Role-based authentication (Admin, Seller, Bidder)
- Auction creation and management
- Real-time bidding with Socket.IO
- Live countdown timers
- Search and filtering
- Admin dashboard with approval workflow
- Responsive design

## Development

### Frontend

```bash
cd frontend
npm run dev
```

### Backend

```bash
cd server
npm run dev
```

### Database Management

```bash
# Seed database with sample data
npm run seed
```

## Environment Variables

Create `server/.env` with the following values:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=maun_auction
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_ORIGIN=http://localhost:5173
```

## Technology Stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client

### Backend
- Express.js
- MySQL2
- Socket.IO
- JWT Authentication
- bcryptjs
- Express Validator

## Contributing

# MAU Auction Platform

A full-stack auction platform (React + Vite frontend, Express + MySQL backend) with real-time bidding via Socket.IO. This repository contains the frontend app in the `frontend` folder and the backend API in the `server` folder.

## Project structure

```
finalproject/
├── frontend/    # React frontend (Vite)
├── server/      # Express backend API
├── uploads/     # uploaded files served by server
└── README.md
```

## Quick start

1. Install dependencies for both apps:

```bash
npm run install:all
```

2. Configure the server environment: copy `server/.env.example` to `server/.env` and set DB credentials.

3. (Optional) Seed the database:

```bash
npm run seed
```

4. Start both apps:

```bash
npm run dev
```

Or run them separately:

Backend:
```bash
npm run dev:backend
```

Frontend:
```bash
npm run dev:frontend
```

### Local URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Demo accounts (local/dev)

- Admin: admin@mau.edu.et / Admin@123
- Seller: seller@mau.edu.et / Seller@123
- Bidder: bidder@mau.edu.et / Bidder@123

## Features

- Role-based users: Admin, Seller, Bidder
- Real-time bidding (Socket.IO)
- Auction creation, image uploads, and bid history
- Admin moderation and reporting utilities

## Tools & Dependencies

**Frontend** (from `frontend/package.json`)

- Dependencies:
   - @tailwindcss/vite ^4.1.14
   - axios ^1.12.2
   - react ^19.1.1
   - react-dom ^19.1.1
   - react-router-dom ^7.9.4
   - socket.io-client ^4.8.1

- Dev dependencies / build tools:
   - vite ^7.1.7
   - @vitejs/plugin-react ^5.0.4
   - tailwindcss ^4.1.14
   - postcss ^8.5.6
   - autoprefixer ^10.4.21
   - eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh

**Backend / Server** (from `server/package.json`)

- Dependencies:
   - express ^4.19.2
   - mysql2 ^3.11.0
   - socket.io ^4.7.5
   - jsonwebtoken ^9.0.2
   - bcryptjs ^2.4.3
   - express-validator ^7.2.1
   - cors ^2.8.5
   - dotenv ^16.4.5
   - morgan ^1.10.0
   - nodemailer ^6.9.4
   - multer ^1.4.4
   - http-proxy-middleware ^3.0.5

If you need a machine-readable list, open:
- [frontend/package.json](frontend/package.json)
- [server/package.json](server/package.json)

## Environment

Create `server/.env` (example values):

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=maun_auction
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_ORIGIN=http://localhost:5173
```

## Contributing

Open issues or PRs. See `frontend` and `server` folders for app-specific notes.

## License

MIT
