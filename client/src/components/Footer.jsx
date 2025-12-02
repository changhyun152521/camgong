import './Footer.css';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-logo">
            <img 
              src="/캠핑공작소 로고_흰 (1).png" 
              alt="캠핑공작소 로고" 
              className="footer-logo-image"
            />
          </div>
        </div>
        <div className="footer-center">
          <div className="footer-info">
            <p>상호명: 캠핑공작소</p>
            <p>주소: 충청남도 논산시 상월면 득안대로 3039 나동 캠핑공작소</p>
            <p>전화번호: 070-4408-5500</p>
            <p>Copyright(c)2025 이창현 All Rights Reserved</p>
          </div>
        </div>
        <div className="footer-right">
          <a 
            href="https://blog.naver.com/camgong5500" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-icon"
            aria-label="블로그"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </a>
          <a 
            href="https://youtube.com/channel/UCtZLTdzi3pPN4zRaIMRhQZw?si=V5lzXEDWooewhGUr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-icon"
            aria-label="유튜브"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

