// 个人中心页面逻辑：调用后端 /api/profile 与 /api/logout
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    loadUserInfo();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // 修改密码
    const changePasswordItem = document.getElementById('change-password-item');
    if (changePasswordItem) {
        changePasswordItem.addEventListener('click', () => {
            window.location.href = 'change-password.html';
        });
    }

    // 修改安全问题答案
    const changeSecurityQuestionItem = document.getElementById('change-security-question-item');
    if (changeSecurityQuestionItem) {
        changeSecurityQuestionItem.addEventListener('click', () => {
            window.location.href = 'change-security-question.html';
        });
    }

    // 收藏站点（暂时不实现）
    const favoriteStationsItem = document.getElementById('favorite-stations-item');
    if (favoriteStationsItem) {
        favoriteStationsItem.addEventListener('click', () => {
            alert('收藏站点功能暂未开放，敬请期待');
        });
    }
});

const API_BASE = 'http://127.0.0.1:5000';

// 检查登录状态（本地简单校验）
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userId = localStorage.getItem('userId');
    if (!isLoggedIn || !userId) {
        alert('请先登录！');
        window.location.href = 'login.html';
    }
}

// 加载用户信息（从后端拉取）
async function loadUserInfo() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const resp = await fetch(`${API_BASE}/api/profile?user_id=${encodeURIComponent(userId)}`);
        const data = await resp.json();
        if (!resp.ok) {
            throw new Error(data.message || '获取用户信息失败');
        }

        const usernameEls = document.querySelectorAll('#username, #display-username');
        usernameEls.forEach(el => el && (el.textContent = data.display_name || data.username || '用户'));

        const regEl = document.getElementById('register-time');
        if (regEl) regEl.textContent = formatTime(data.created_at);

        const lastLoginEl = document.getElementById('last-login-time');
        if (lastLoginEl) lastLoginEl.textContent = formatTime(data.last_login_at, '暂无记录');

        const emailEl = document.getElementById('email-value');
        if (emailEl) emailEl.textContent = data.email || '未绑定';

        // 额外保存显示名，便于导航栏使用
        localStorage.setItem('displayName', data.display_name || data.username || '');
        localStorage.setItem('email', data.email || '');
    } catch (err) {
        alert(err.message || '获取用户信息失败');
        window.location.href = 'login.html';
    }
}

// 处理退出登录
async function handleLogout() {
    try {
        await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
    } catch (e) {
        // 忽略退出异常，直接清理本地
    }
    clearLoginState();
    window.location.href = 'login.html';
}

function clearLoginState() {
    ['isLoggedIn', 'userId', 'username', 'displayName', 'email', 'registerTime'].forEach(k => {
        localStorage.removeItem(k);
    });
}

// 友好时间格式
function formatTime(val, fallback = '-') {
    if (!val) return fallback;
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString();
}
