import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import AuctionDetail from './pages/AuctionDetail.jsx'
import Admin from './pages/Admin.jsx'
import Seller from './pages/Seller.jsx'
import Bidder from './pages/Bidder.jsx'
import NotFound from './pages/NotFound.jsx'
import About from './pages/About.jsx'
import FAQ from './pages/FAQ.jsx'
import Wallet from './pages/Wallet.jsx'
import TopUp from './pages/TopUp.jsx'
import AdminTopups from './pages/AdminTopups.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auction/:id" element={<AuctionDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/seller" element={<Seller />} />
          <Route path="/bidder" element={<Bidder />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/topup" element={<TopUp />} />
          <Route path="/admin/topups" element={<AdminTopups />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App