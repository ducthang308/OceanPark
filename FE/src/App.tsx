import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from 'react-router-dom';

import ProtectedRoute from './components/auth/ProtectedRoute.tsx';
import Header from './components/layout/Header/header.tsx';
import Footer from './components/layout/Footer/footer.tsx';
import ChatBox from './components/common/ChatBox/ChatBox.tsx';
import { ChatNotificationProvider } from './contexts/ChatNotificationProvider.tsx';
// import Navbar from "./components/layout/Navbar/navbar.tsx";

import LoginPage from './pages/Login/LoginPage.tsx';
import History from './pages/PayManagement/HistoryPay.tsx';
import Home from './pages/Home/Home.tsx';
import RoomList from './pages/RoomList/RoomList.tsx';
import TopUpPage from './pages/TopUpPages/TopUpPage.tsx';
import AccountManagement from './pages/AccountManagement/AccountManagement.tsx';
import TenantTransactionsPage from './pages/TenantTransactions/TenantTransactionsPage.tsx';
import BlogAboutUs from './pages/Blog/AboutUsBlog.tsx';
import PostDetail from './pages/PostDetail/PostDetail.tsx';
import PaymentPage from './pages/Payment/PaymentPage.tsx';
import Listing from './pages/ManagementPage/components/ListingPage/listing.tsx';
import ListPost from './pages/ManagementPage/components/ListPostPage/listPost.tsx';
import FavoritePostsPage from './pages/FavoritePostsPage/FavoritePostsPage';
import ServicePrice from './components/sections/ServicePrice/servicePrice.tsx';
import LandlordDashboardPage from './pages/LandlordDashboard/LandlordDashboardPage.tsx';
import LandlordWalletPage from './pages/LandlordWallet/LandlordWalletPage.tsx';

import AdminLayout from './pages/AdminStaff/components/AdminLayout.tsx';
import AdminDashboard from './pages/AdminStaff/Dashboard/AdminDashboard.tsx';
import AdminPostApproval from './pages/AdminStaff/PostApproval/AdminPostApproval.tsx';
import AdminCategoryManagement from './pages/AdminStaff/CategoryManagement/AdminCategoryManagement.tsx';
import AdminPackageManagement from './pages/AdminStaff/PackageManagement/AdminPackageManagement.tsx';
import AdminAccountManagement from './pages/AdminStaff/AccountManagement/AdminAccountManagement.tsx';
import AdminPaymentApproval from './pages/AdminStaff/PaymentApproval/AdminPaymentApproval.tsx';
import PostApprovalDetail from './pages/AdminStaff/PostApproval/PostApprovalDetail.tsx';
import PaymentDetailPanel from './pages/AdminStaff/PaymentApproval/PaymentDetailPanel.tsx';
import AdminWithdrawManagement from './pages/AdminStaff/WithdrawManagement/AdminWithdrawManagement.tsx';
// Redundant imports removed

import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage from './pages/ForgotPassword/ResetPasswordPage';

import OAuth2RedirectPage from './pages/Auth/OAuth2RedirectPage.tsx';

import { AUTHENTICATED_ROLE_IDS, LANDLORD_ROLE_IDS, ROLE_ID } from './constants/roles.ts';
import './assets/styles/Global.css';
import SepayPaymentPage from './pages/SepayPayment/SepayPaymentPage.tsx';
import ChatPage from './pages/Chat/ChatPage.tsx';

function UserLayout() {
  return (
    <>
      <Header />
      {/* <Navbar /> nếu muốn dùng chung cho user thì bật lên */}
      <main>
        <Outlet />
      </main>
      <ChatBox />
      <Footer />
    </>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ChatNotificationProvider>
      <Router>
        <ScrollToTop />
        <Routes>
        {/* User routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/posts" element={<RoomList />} />
          <Route path="/danh-muc/:slug" element={<RoomList />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />
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
            <Route path="/chat" element={<ChatPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLE_ID.NGUOI_THUE]} />}>
            <Route path="/tenant-transactions" element={<TenantTransactionsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={LANDLORD_ROLE_IDS} />}>
            <Route path="/service-price" element={<ServicePrice />} />
            <Route path="/history" element={<History />} />
            <Route path="/recharge/:method" element={<TopUpPage />} />
            <Route path="/listing" element={<Listing />} />
            <Route path="/list-post" element={<ListPost />} />
            <Route path="/landlord-dashboard" element={<LandlordDashboardPage />} />
            <Route path="/landlord-wallet" element={<LandlordWalletPage />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={[ROLE_ID.ADMIN]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="posts" element={<AdminPostApproval />} />
            <Route path="categories" element={<AdminCategoryManagement />} />
            <Route path="packages" element={<AdminPackageManagement />} />
            <Route path="accounts" element={<AdminAccountManagement />} />
            <Route path="post-approval/:id" element={<PostApprovalDetail />} />
            <Route path="payment-approval/:id" element={<PaymentDetailPanel />} />
            <Route path="payments" element={<AdminPaymentApproval />} />
            <Route path="withdrawals" element={<AdminWithdrawManagement />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
        </Route>
      </Routes>
      </Router>
    </ChatNotificationProvider>
  );
}

export default App;
