# MAU Auction Platform

A full-stack auction platform built with React, Express.js, and MySQL.

![image alt](https://github.com/TeferiMulatu/Final_Year_Project_Auction_Management_System/blob/a816fb13851da07a15222bcedd3f64b76f750ba2/img2.png)
![image alt](https://github.com/TeferiMulatu/Final_Year_Project_Auction_Management_System/blob/922563b74081195088c65034393e7380c4284461/img1.png)
## Project Structure

```
finalproject/
├── frontend/          # React frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── server/            # Express.js backend API
│   ├── src/
│   ├── package.json
│   └── .env.example
├── package.json       # Root package.json for managing both apps
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


