import React from 'react'

const About = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">About MAU Auction Management System</h1>

      <p className="text-gray-700 mb-4">
        MAU is a full-stack Auction Management System developed as a final-year project to
        demonstrate practical web development concepts: user authentication, role-based
        access, real-time bidding, file uploads, and administration workflows.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Key features</h2>
      <ul className="list-disc list-inside text-gray-700 space-y-2">
        <li>Real-time bidding with WebSockets so bids update instantly for all users.</li>
        <li>Role-based access: Admin, Seller and Bidder with tailored dashboards.</li>
        <li>Secure authentication and session handling with protected routes.</li>
        <li>Item uploads (images) and management for sellers.</li>
        <li>Admin tools to manage users, listings and notifications.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-6 mb-2">How it works</h2>
      <p className="text-gray-700 mb-4">
        Sellers create auction listings with a starting price and optional reserve. Bidders
        place bids through the auction page — the highest valid bid at auction close wins.
        The system uses sockets to broadcast bid events and updates a persistent backend
        for auditability.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Technology stack</h2>
      <p className="text-gray-700 mb-4">
        This project uses a React + Vite frontend and a Node/Express backend. Real-time
        features are implemented with WebSocket (Socket.io) and data is stored on the
        server side. Static uploads are served from the `uploads/` folder on the server.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Security & data</h2>
      <p className="text-gray-700 mb-4">
        Authentication protects routes and actions. Sensitive operations (like marking a
        winner or processing payments) require appropriate roles. This is a demo/final-year
        project — review and adapt security and payment flows before using in production.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Run locally</h2>
      <p className="text-gray-700 mb-4">
        To run the project locally, start the server and the frontend dev server in their
        respective folders. See the README for full setup instructions.
      </p>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Contributing & contact</h2>
      <p className="text-gray-700">
        Contributions, issues and questions are welcome. Open an issue in the repository
        or contact the maintainers listed in the project README.
      </p>
    </div>
  )
}

export default About
