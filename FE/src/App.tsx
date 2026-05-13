import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

import ProtectedRoute from './components/auth/ProtectedRoute.tsx';
import Header from './components/layout/Header/header.tsx';
import Footer from './components/layout/Footer/footer.tsx';
// import Navbar from "./components/layout/Navbar/navbar.tsx";

import LoginPage from './pages/Login/LoginPage.tsx';
import History from './pages/PayManagement/HistoryPay.tsx';
import Home from './pages/Home/Home.tsx';
import TopUpPage from './pages/TopUpPages/TopUpPage.tsx';
import AccountManagement from './pages/AccountManagement/AccountManagement.tsx';
import BlogAboutUs from './pages/Blog/AboutUsBlog.tsx';
import PostDetail from './pages/PostDetail/PostDetail.tsx';
import PaymentPage from './pages/Payment/PaymentPage.tsx';
import Listing from './pages/ManagementPage/components/ListingPage/listing.tsx';
import ListPost from './pages/ManagementPage/components/ListPostPage/listPost.tsx';
import FavoritePostsPage from './pages/FavoritePostsPage/FavoritePostsPage';

import AdminLayout from './pages/AdminStaff/components/AdminLayout.tsx';
import AdminDashboard from './pages/AdminStaff/Dashboard/AdminDashboard.tsx';
import AdminPostApproval from './pages/AdminStaff/PostApproval/AdminPostApproval.tsx';
import AdminPaymentApproval from './pages/AdminStaff/PaymentApproval/AdminPaymentApproval.tsx';
import PostApprovalDetail from './pages/AdminStaff/PostApproval/PostApprovalDetail.tsx';
import PaymentDetailPanel from './pages/AdminStaff/PaymentApproval/PaymentDetailPanel.tsx';
// Redundant imports removed

import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from './pages/ForgotPassword/ResetPasswordPage';

import OAuth2RedirectPage from './pages/Auth/OAuth2RedirectPage.tsx';

import { AUTHENTICATED_ROLE_IDS, LANDLORD_ROLE_IDS, ROLE_ID } from './constants/roles.ts';
import './assets/styles/Global.css';
import SepayPaymentPage from './pages/Payment/SepayPaymentPage.tsx';

function UserLayout() {
  return (
    <>
      <Header />
      {/* <Navbar /> nếu muốn dùng chung cho user thì bật lên */}
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* User routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />
          <Route path="/oauth2/success" element={<OAuth2RedirectPage />} />
          <Route path="/blog" element={<BlogAboutUs />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute allowedRoles={AUTHENTICATED_ROLE_IDS} />}>
            <Route path="/AccountManagement" element={<AccountManagement />} />
            <Route path="/payment/:type" element={<PaymentPage />} />
            <Route path="/payment/sepay" element={<SepayPaymentPage />} />
            <Route path="/favorite-posts" element={<FavoritePostsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={LANDLORD_ROLE_IDS} />}>
            <Route path="/history" element={<History />} />
            <Route path="/recharge/:method" element={<TopUpPage />} />
            <Route path="/listing" element={<Listing />} />
            <Route path="/list-post" element={<ListPost />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_ID.ADMIN]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="posts" element={<AdminPostApproval />} />
            <Route path="post-approval/:id" element={<PostApprovalDetail />} />
            <Route path="payment-approval/:id" element={<PaymentDetailPanel />} />
            <Route path="payments" element={<AdminPaymentApproval />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
