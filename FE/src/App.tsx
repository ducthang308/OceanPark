import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { DatePicker } from 'antd';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header/header.tsx';
import Footer from './components/layout/Footer/footer.tsx';
import Navbar from "./components/layout/Navbar/navbar.tsx";
import LoginPage from './pages/Login/LoginPage.tsx';
import History from './pages/PayManagement/HistoryPay.tsx';
import Home from './pages/Home/Home.tsx';
import TopUpPage from './pages/TopUpPages/TopUpPage.tsx';
import AccountManagement from './pages/AccountManagement/AccountManagement.tsx';
import BlogAboutUs from './pages/Blog/AboutUsBlog.tsx';
import PostDetail from './pages/PostDetail/PostDetail.tsx';
import PaymentPage from './pages/Payment/PaymentPage.tsx';

import './assets/styles/Global.css'
import Listing from './pages/ManagementPage/components/ListingPage/listing.tsx';
import ListPost from './pages/ManagementPage/components/ListPostPage/listPost.tsx';
import FavoritePostsPage from './pages/FavoritePostsPage/FavoritePostsPage';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/history" element={<History />} />
        <Route path="/recharge/:method" element={<TopUpPage />} />
        <Route path="/AccountManagement" element={<AccountManagement />} />
        <Route path="/blog" element={<BlogAboutUs />} />

        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/listing" element={<Listing />} />
        <Route path="/list-post" element={<ListPost />} />
        <Route path="/payment/:id" element={<PaymentPage />} />
        <Route path="/favorite-posts" element={<FavoritePostsPage />} />
      </Routes>
    </Router>
  );
}

export default App
