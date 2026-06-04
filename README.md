MAU Auction PlatformA full-stack auction platform featuring real-time bidding, role-based workflows, and automated countdown timers. Built using React (Vite) on the frontend, and Express.js and MySQL on the backend.Project Structurefinalproject/
├── frontend/          # React frontend application (Vite)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── server/            # Express.js backend API
│   ├── src/
│   ├── package.json
│   └── .env.example
├── uploads/           # Uploaded assets and media files
├── package.json       # Workspace/Root package for running mono-commands
└── README.md
Features🔐 Role-Based Authentication: Dedicated dashboards and workflows for Admin, Seller, and Bidder.⚡ Real-Time Bidding: Instantaneous bid updates and events powered by Socket.IO.⏰ Live Countdown Timers: Dynamic countdown indicators tracking upcoming and expiring auctions.📦 Auction Lifecycle Management: Simple item creation, media uploads, filtering, and deep search tools.📊 Admin Moderation: Reporting utilities, user activity logs, and listing approval workflows.📱 Responsive Layout: Clean, fully adaptive design styled with Tailwind CSS.Quick StartPrerequisitesNode.js: v18 or higherMySQL: v8.0 or higherInstallationInstall all dependencies:Run from the project root directory to configure both workspaces:Bashnpm run install:all
Configure Environment Variables:Copy the sample environment file in the server directory:Bashcp server/.env.example server/.env
Open server/.env and update your database credentials (see Environment Variables).Initialize Database & Seed (Optional):Ensure your local MySQL instance is running, create a database named maun_auction, and run:Bashnpm run seed
Run the Application:Start both the frontend client and backend server concurrently:Bashnpm run dev
Alternatively, run them independently via separate terminal tabs:Bash# Start the backend server
npm run dev:backend

# Start the frontend client
npm run dev:frontend
Accessing Local DeploymentsFrontend Client: http://localhost:5173Backend API Base: http://localhost:5000/apiPublic Pages:/about — General project description and metadata./faq — Common registry, bidding, and payout mechanics.Demo AccountsUse these local credentials to test out specific role dynamics:RoleEmailPasswordAdminadmin@mau.edu.etAdmin@123Sellerseller@mau.edu.etSeller@123Bidderbidder@mau.edu.etBidder@123Environment VariablesCreate or adjust your server/.env file using the configuration schema below:Code snippetPORT=5000
NODE_ENV=development

# Database Settings
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=maun_auction

# Security & CORS
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_ORIGIN=http://localhost:5173
Technology StackFrontend ComponentsFramework & Bundling: React 19, Vite 7Styling: Tailwind CSS 4, PostCSS, AutoprefixerNetworking & WebSockets: Axios, Socket.IO ClientRouting: React Router 7Backend CoreRuntime Framework: Express.js 4, Node.jsDatabase Integration: MySQL2, Drivers, Connection PoolingSecurity & Validation: JSON Web Tokens (JWT), bcryptjs, Express ValidatorFile Uploads & Services: Multer, Nodemailer, CORS, Morgan[!TIP]For exact package versions, review the machine-readable manifest files at frontend/package.json and server/package.json.ContributingContributions are welcome! Please open an issue or submit a pull request for improvements. For directory-specific notes, consult individual README files inside frontend and server.LicenseThis project is licensed under the MIT License.
