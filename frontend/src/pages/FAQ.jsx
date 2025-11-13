import React from 'react'

const FAQ = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Frequently Asked Questions</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">How do I register?</h2>
        <p className="text-gray-700">Click the <strong>Register</strong> button in the top-right, provide your details, and follow any verification prompts. Some workflows may require admin approval depending on the deployment configuration.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">How do I place a bid?</h2>
        <p className="text-gray-700">Open an auction, enter an amount greater than the current highest bid, and submit. Bids are validated on the server and broadcast in real-time to all connected users.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">Who can list items for auction?</h2>
        <p className="text-gray-700">Users with the <em>Seller</em> role can create and manage listings. Admins can also create listings and moderate content.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">What happens if I win an auction?</h2>
        <p className="text-gray-700">If you are the highest bidder when the auction closes, the listing will appear in your dashboard (My Bids) and you will be prompted to complete payment. Note: payment integration in this project may be simulated — verify the payment flow before using in production.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">Can I edit or cancel a listing?</h2>
        <p className="text-gray-700">Sellers can edit or cancel their listings before any finalization rules are enforced. Once bids are placed or an auction is in progress, some restrictions may apply to ensure fairness.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">Are payments handled by the app?</h2>
        <p className="text-gray-700">This project includes a payments route, but production-ready payment handling (PCI compliance, payment gateway integration) should be implemented before accepting real payments.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">What file types and sizes are supported?</h2>
        <p className="text-gray-700">Images for listings are accepted (JPEG/PNG). The server controls upload size limits — check `server` configuration or README for the exact limits.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">How do I report bugs or request features?</h2>
        <p className="text-gray-700">Open an issue in the project repository and include steps to reproduce, screenshots, and any relevant logs. Contributions are welcome via pull requests.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold">How do I contact support?</h2>
        <p className="text-gray-700">Use the contact information on the About page or open an issue in the repository for fastest response.</p>
      </section>
    </div>
  )
}

export default FAQ
