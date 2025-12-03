import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../utils/api';

const AdminPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }

        const response = await api.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          const userData = response.data.data;
          if (userData.userType !== 'admin') {
            alert('관리자만 접근할 수 있습니다.');
            navigate('/');
            return;
          }
          setUser(userData);
        }
      } catch (error) {
        console.error('관리자 확인 오류:', error);
        alert('관리자 인증에 실패했습니다.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="App">
        <Header />
        <div className="admin-loading">로딩 중...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <div className="admin-page">
        <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">관리자 페이지</h1>
            <p className="admin-welcome">환영합니다, {user?.name || user?.userId}님</p>
          </div>
          <button 
            className="admin-home-button"
            onClick={() => navigate('/')}
          >
            홈으로 가기
          </button>
        </div>
        
        <div className="admin-menu">
          <button 
            className="admin-menu-button"
            onClick={() => navigate('/admin/users')}
          >
            유저 관리
          </button>
          <button 
            className="admin-menu-button"
            onClick={() => navigate('/admin/videos')}
          >
            영상 관리
          </button>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPage;

