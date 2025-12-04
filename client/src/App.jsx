import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import UserManagement from './pages/UserManagement';
import VideoManagement from './pages/VideoManagement';
import VideoPage from './pages/VideoPage';
import VideoListPage from './pages/VideoListPage';
import ShortsPage from './pages/ShortsPage';
import ContactPage from './pages/ContactPage';

function App() {
  return (
    <Router
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true
      }}
    >
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/videos/:type" element={<VideoPage />} />
        <Route path="/videos/:type/list" element={<VideoListPage />} />
        <Route path="/videos/:type/shorts" element={<ShortsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/videos" element={<VideoManagement />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Router>
  );
}

export default App;
