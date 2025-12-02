import { useEffect, useRef, useState } from 'react';
import '../App.css';
import './AboutPage.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

function AboutPage() {
  const profileLeftRef = useRef(null);
  const profileRightRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const adjustImageHeights = () => {
      if (profileRightRef.current && profileLeftRef.current) {
        const rightImg = profileRightRef.current;
        const leftImg = profileLeftRef.current;
        
        if (rightImg.complete && rightImg.naturalHeight > 0) {
          requestAnimationFrame(() => {
            const rightHeight = rightImg.offsetHeight || rightImg.clientHeight || rightImg.getBoundingClientRect().height;
            
            if (rightHeight > 0) {
              if (leftImg.complete && leftImg.naturalWidth > 0 && leftImg.naturalHeight > 0) {
                const leftAspectRatio = leftImg.naturalWidth / leftImg.naturalHeight;
                const leftHeight = rightHeight * 0.95;
                leftImg.style.height = `${leftHeight}px`;
                leftImg.style.width = `${leftHeight * leftAspectRatio}px`;
              } else {
                const leftHeight = rightHeight * 0.95;
                leftImg.style.height = `${leftHeight}px`;
                leftImg.style.width = 'auto';
              }
            }
          });
        }
      }
    };

    const handleImageLoad = () => {
      requestAnimationFrame(() => {
        setTimeout(adjustImageHeights, 50);
      });
    };

    const rightImg = profileRightRef.current;
    const leftImg = profileLeftRef.current;

    if (rightImg && leftImg) {
      if (rightImg.complete && leftImg.complete) {
        handleImageLoad();
      } else {
        rightImg.addEventListener('load', handleImageLoad);
        leftImg.addEventListener('load', handleImageLoad);
      }
    }

    let resizeObserver;
    if (rightImg && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          setTimeout(adjustImageHeights, 50);
        });
      });
      resizeObserver.observe(rightImg);
    }

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(adjustImageHeights);
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    const initialTimeout = setTimeout(() => {
      requestAnimationFrame(adjustImageHeights);
    }, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
      clearTimeout(initialTimeout);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (rightImg) rightImg.removeEventListener('load', handleImageLoad);
      if (leftImg) leftImg.removeEventListener('load', handleImageLoad);
    };
  }, []);

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        {/* About Section - 회사소개 (메인페이지와 동일) */}
        <section className="about-section" id="about">
          <div className="about-container">
            <div className="about-header">
              <img 
                src="/제목을 입력해주세요_-003.png" 
                alt="회사소개" 
                className="about-title-image"
              />
            </div>
            
            <div className="about-content">
              <div className="about-main-text">
                <p className="about-description">
                  캠핑공작소는 DIY공방을 운영하며 자작회원들과<br />
                  함께하는 전문 캠핑카 커스터마이징 공간입니다.
                </p>
                <p className="about-description">
                  전문 장비와 도구를 갖춘 공방에서 나만의 캠핑카를<br />
                  직접 만들고 개조할 수 있는 환경을 제공합니다.
                </p>
              </div>
            </div>
          </div>
          
          {/* 프로필 이미지 */}
          <div className="about-profiles-container">
            <img 
              ref={profileLeftRef}
              src="/야인형 프로.png" 
              alt="프로필" 
              className="about-profile-left"
            />
            <img 
              ref={profileRightRef}
              src="/Gemini_Generated_Image_4y4r44y4r44y4r44_-_복사본-removebg-preview.png" 
              alt="프로필" 
              className="about-profile-right"
            />
          </div>
        </section>

        {/* 추가 섹션들 */}
        <section className="about-detail-section">
          <div className="about-detail-container">
            <div className="about-detail-card">
              <div className="detail-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h3 className="detail-card-title">전문 공방</h3>
              <p className="detail-card-description">
                최신 장비와 전문 도구를 갖춘 공방에서<br />
                안전하고 효율적으로 작업할 수 있습니다.
              </p>
            </div>

            <div className="about-detail-card">
              <div className="detail-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="detail-card-title">자작 회원 커뮤니티</h3>
              <p className="detail-card-description">
                다양한 경험과 노하우를 공유하는<br />
                활발한 커뮤니티를 운영하고 있습니다.
              </p>
            </div>

            <div className="about-detail-card">
              <div className="detail-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <h3 className="detail-card-title">맞춤형 솔루션</h3>
              <p className="detail-card-description">
                개인의 니즈와 스타일에 맞춘<br />
                맞춤형 커스터마이징 서비스를 제공합니다.
              </p>
            </div>
          </div>
        </section>

        <section className="about-mission-section">
          <div className="about-mission-container">
            <h2 className="mission-title">우리의 미션</h2>
            <div className="mission-content">
              <div className="mission-text">
                {isMobile ? (
                  <p>
                    캠핑공작소는 단순한 공방을 넘어서,<br />
                    캠핑카를 사랑하는 모든 분들이<br />
                    자신만의 공간을 만들 수 있도록<br />
                    돕는 것이 우리의 목표입니다.
                  </p>
                ) : (
                  <p>
                    캠핑공작소는 단순한 공방을 넘어서, 캠핑카를 사랑하는 모든 분들이<br />
                    자신만의 공간을 만들 수 있도록 돕는 것이 우리의 목표입니다.
                  </p>
                )}
                <p>
                  전문적인 장비와 도구, 그리고 풍부한 경험을 바탕으로<br />
                  고객 여러분의 아이디어를 현실로 만들어드립니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="about-values-section">
          <div className="about-values-container">
            <h2 className="values-title">핵심 가치</h2>
            <div className="values-grid">
              <div className="value-item">
                <div className="value-number">01</div>
                <h3 className="value-title">안전</h3>
                <p className="value-description">모든 작업은 안전을 최우선으로 진행됩니다.</p>
              </div>
              <div className="value-item">
                <div className="value-number">02</div>
                <h3 className="value-title">품질</h3>
                <p className="value-description">최고의 재료와 장비로 품질을 보장합니다.</p>
              </div>
              <div className="value-item">
                <div className="value-number">03</div>
                <h3 className="value-title">혁신</h3>
                <p className="value-description">창의적인 아이디어를 실현합니다.</p>
              </div>
              <div className="value-item">
                <div className="value-number">04</div>
                <h3 className="value-title">신뢰</h3>
                <p className="value-description">고객과의 신뢰를 최우선으로 생각합니다.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default AboutPage;

