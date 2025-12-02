import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Header.css';
import SignupModal from './SignupModal';
import LoginModal from './LoginModal';

const Header = () => {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownTimeoutRef = useRef(null);

  // localStorage에서 사용자 정보 가져오기
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
      }
    }

    // storage 이벤트 리스너 (다른 탭에서 로그인/로그아웃 시 동기화)
    const handleStorageChange = () => {
      const updatedUserData = localStorage.getItem('user');
      if (updatedUserData) {
        try {
          setUser(JSON.parse(updatedUserData));
        } catch (error) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const navigate = useNavigate();

  // 드롭다운 메뉴 닫기 함수
  const closeDropdown = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(null);
  };

  // 로그아웃 함수
  const handleLogout = () => {
    const confirmLogout = window.confirm('정말 로그아웃 하시겠습니까?');
    if (confirmLogout) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      window.location.reload();
    }
  };

  return (
    <>
      <header className="main-header">
        <div className="header-container">
          <a href="/" className="header-logo">
            <img 
              src="/캠핑공작소 로고_흰 (1).png" 
              alt="캠핑공작소 로고" 
              className="logo-image"
            />
          </a>
          <nav className="header-nav">
            <Link to="/about" className="nav-link">회사소개</Link>
            <div 
              className="nav-dropdown"
              onMouseEnter={() => {
                if (dropdownTimeoutRef.current) {
                  clearTimeout(dropdownTimeoutRef.current);
                }
                setActiveDropdown('자작솜씨');
              }}
              onMouseLeave={() => {
                dropdownTimeoutRef.current = setTimeout(() => {
                  setActiveDropdown(null);
                }, 200);
              }}
              onClick={(e) => {
                // 모바일에서 클릭 시 토글
                if (window.innerWidth <= 768) {
                  e.stopPropagation();
                  if (activeDropdown === '자작솜씨') {
                    closeDropdown();
                  } else {
                    if (dropdownTimeoutRef.current) {
                      clearTimeout(dropdownTimeoutRef.current);
                    }
                    setActiveDropdown('자작솜씨');
                  }
                }
              }}
            >
              <span className="nav-link">
                자작솜씨
                <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"></path>
                </svg>
              </span>
              {activeDropdown === '자작솜씨' && (
                <div 
                  className="dropdown-menu"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) {
                      clearTimeout(dropdownTimeoutRef.current);
                    }
                  }}
                  onMouseLeave={() => {
                    dropdownTimeoutRef.current = setTimeout(() => {
                      setActiveDropdown(null);
                    }, 200);
                  }}
                  onClick={(e) => {
                    // 모바일에서 드롭다운 메뉴 클릭 시 이벤트 전파 방지
                    if (window.innerWidth <= 768) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <Link 
                    to="/videos/자작솜씨/list" 
                    className="dropdown-item"
                    onClick={closeDropdown}
                  >
                    솜씨영상
                  </Link>
                  <Link 
                    to="/videos/자작솜씨/shorts" 
                    className="dropdown-item"
                    onClick={closeDropdown}
                  >
                    솜씨쇼츠
                  </Link>
                </div>
              )}
            </div>
            <div 
              className="nav-dropdown"
              onMouseEnter={() => {
                if (dropdownTimeoutRef.current) {
                  clearTimeout(dropdownTimeoutRef.current);
                }
                setActiveDropdown('자작강의');
              }}
              onMouseLeave={() => {
                dropdownTimeoutRef.current = setTimeout(() => {
                  setActiveDropdown(null);
                }, 200);
              }}
              onClick={(e) => {
                // 모바일에서 클릭 시 토글
                if (window.innerWidth <= 768) {
                  e.stopPropagation();
                  if (activeDropdown === '자작강의') {
                    closeDropdown();
                  } else {
                    if (dropdownTimeoutRef.current) {
                      clearTimeout(dropdownTimeoutRef.current);
                    }
                    setActiveDropdown('자작강의');
                  }
                }
              }}
            >
              <span className="nav-link">
                자작강의
                <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"></path>
                </svg>
              </span>
              {activeDropdown === '자작강의' && (
                <div 
                  className="dropdown-menu"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) {
                      clearTimeout(dropdownTimeoutRef.current);
                    }
                  }}
                  onMouseLeave={() => {
                    dropdownTimeoutRef.current = setTimeout(() => {
                      setActiveDropdown(null);
                    }, 200);
                  }}
                  onClick={(e) => {
                    // 모바일에서 드롭다운 메뉴 클릭 시 이벤트 전파 방지
                    if (window.innerWidth <= 768) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <Link 
                    to="/videos/자작강의/list" 
                    className="dropdown-item"
                    onClick={closeDropdown}
                  >
                    강의영상
                  </Link>
                  <Link 
                    to="/videos/자작강의/shorts" 
                    className="dropdown-item"
                    onClick={closeDropdown}
                  >
                    강의쇼츠
                  </Link>
                </div>
              )}
            </div>
            <Link to="/contact" className="nav-link">문의사항</Link>
          </nav>
          <div className="header-auth">
            {user ? (
              <>
                <span className="user-welcome">
                  {user.name || user.userId}님 환영합니다
                </span>
                {user.userType === 'admin' && (
                  <button 
                    className="auth-btn admin-btn"
                    onClick={() => navigate('/admin')}
                  >
                    관리자
                  </button>
                )}
                <button 
                  className="auth-btn logout-btn"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button 
                  className="auth-btn login-btn"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  로그인
                </button>
                <button 
                  className="auth-btn signup-btn"
                  onClick={() => setIsSignupModalOpen(true)}
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      <SignupModal 
        isOpen={isSignupModalOpen} 
        onClose={() => setIsSignupModalOpen(false)} 
      />
    </>
  );
};

export default Header;

