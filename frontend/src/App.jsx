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

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auction/:id" element={<AuctionDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/seller" element={<Seller />} />
          <Route path="/bidder" element={<Bidder />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App