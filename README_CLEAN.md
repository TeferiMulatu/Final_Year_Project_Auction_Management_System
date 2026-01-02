# MAU Auction Platform

A full-stack auction platform (React + Vite frontend, Express + MySQL backend) with real-time bidding via Socket.IO. This repository contains the frontend app in the frontend folder and the backend API in the server folder.

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

2. Configure the server environment: copy server/.env.example to server/.env and set DB credentials.

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

**Frontend** (from frontend/package.json)

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

**Backend / Server** (from server/package.json)

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
- frontend/package.json
- server/package.json

## Environment

Create server/.env (example values):

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

Open issues or PRs. See frontend and server folders for app-specific notes.

## License

MIT
