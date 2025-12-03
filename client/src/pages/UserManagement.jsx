import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    name: '',
    phoneNumber: '',
    userType: 'customer'
  });
  const navigate = useNavigate();
  const usersPerPage = 10; // 한 페이지에 10명씩 표시

  useEffect(() => {
    checkAdminAndLoadUsers();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadUsers();
    }
  }, [currentPage]);

  const checkAdminAndLoadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      // 관리자 확인
      const userResponse = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (userResponse.data.success && userResponse.data.data.userType !== 'admin') {
        alert('관리자만 접근할 수 있습니다.');
        navigate('/');
        return;
      }

      // 유저 목록 로드
      await loadUsers();
    } catch (error) {
      console.error('오류:', error);
      alert('데이터를 불러오는데 실패했습니다.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/users/admin/all?page=${currentPage}&limit=${usersPerPage}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || 0);
      }
    } catch (error) {
      console.error('유저 목록 로드 오류:', error);
      alert('유저 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/users/admin', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('유저가 추가되었습니다.');
        setShowAddModal(false);
        setFormData({
          userId: '',
          password: '',
          name: '',
          phoneNumber: '',
          userType: 'customer'
        });
        setCurrentPage(1); // 새 유저 추가 시 첫 페이지로 이동
        loadUsers();
      }
    } catch (error) {
      console.error('유저 추가 오류:', error);
      alert(error.response?.data?.message || '유저 추가에 실패했습니다.');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      userId: user.userId,
      password: '',
      name: user.name,
      phoneNumber: user.phoneNumber,
      userType: user.userType
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await api.put(`/users/admin/${editingUser._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('유저 정보가 수정되었습니다.');
        setEditingUser(null);
        setFormData({
          userId: '',
          password: '',
          name: '',
          phoneNumber: '',
          userType: 'customer'
        });
        loadUsers();
      }
    } catch (error) {
      console.error('유저 수정 오류:', error);
      alert(error.response?.data?.message || '유저 수정에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('정말 이 유저를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await api.delete(`/users/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('유저가 삭제되었습니다.');
        loadUsers();
      }
    } catch (error) {
      console.error('유저 삭제 오류:', error);
      alert(error.response?.data?.message || '유저 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="App">
        <Header />
        <div className="user-management-loading">로딩 중...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="App">
      <Header />
      <div className="user-management">
      <div className="user-management-container">
        <div className="user-management-header">
          <h1 className="user-management-title">유저 관리</h1>
          <button 
            className="add-user-button"
            onClick={() => setShowAddModal(true)}
          >
            + 유저 추가
          </button>
        </div>

        <div className="user-table-wrapper">
          <div className="user-count-info">
            전체 {totalCount}명의 유저
          </div>
          <table className="user-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>아이디</th>
                <th>이름</th>
                <th>전화번호</th>
                <th>유저 타입</th>
                <th>생성일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-users">등록된 유저가 없습니다.</td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user._id}>
                    <td>{(currentPage - 1) * usersPerPage + index + 1}</td>
                    <td>{user.userId}</td>
                    <td>{user.name}</td>
                    <td>{user.phoneNumber || '-'}</td>
                    <td>
                      <span className={`user-type-badge ${user.userType}`}>
                        {user.userType === 'admin' ? '관리자' : '고객'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="edit-button"
                          onClick={() => handleEditUser(user)}
                        >
                          수정
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="user-pagination">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              다음
            </button>
          </div>
        )}

        <button 
          className="back-button"
          onClick={() => navigate('/admin')}
        >
          관리자 페이지로 돌아가기
        </button>
      </div>

      {/* 유저 추가 모달 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>유저 추가</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>아이디 *</label>
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>비밀번호 *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>이름 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>전화번호 *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>유저 타입 *</label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="customer">고객</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="submit-button">추가</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowAddModal(false)}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 유저 수정 모달 */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>유저 수정</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>아이디 *</label>
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>비밀번호 (변경 시에만 입력)</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="변경하지 않으려면 비워두세요"
                />
              </div>
              <div className="form-group">
                <label>이름 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>전화번호 *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>유저 타입 *</label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="customer">고객</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="submit-button">수정</button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setEditingUser(null)}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
      <Footer />
    </div>
  );
};

export default UserManagement;

