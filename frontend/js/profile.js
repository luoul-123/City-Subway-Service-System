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

    // 收藏站点
    const favoriteStationsItem = document.getElementById('favorite-stations-item');
    if (favoriteStationsItem) {
        favoriteStationsItem.addEventListener('click', () => {
            openFavoriteModal();
        });
    }
    
    // 关闭收藏弹窗按钮
    const closeFavoriteModal = document.getElementById('close-favorite-modal');
    if (closeFavoriteModal) {
        closeFavoriteModal.addEventListener('click', () => {
            closeFavoriteModalFn();
        });
    }
    
    // 点击弹窗外部关闭
    const favoriteModal = document.getElementById('favorite-modal');
    if (favoriteModal) {
        favoriteModal.addEventListener('click', (e) => {
            if (e.target === favoriteModal) {
                closeFavoriteModalFn();
            }
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

// ========== 收藏站点相关功能 ==========

// 关闭收藏弹窗
function closeFavoriteModalFn() {
    const modal = document.getElementById('favorite-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    // 恢复body滚动
    document.body.style.overflow = '';
}

// 城市代码到名称的映射
const cityCodeToName = {
    'nj': '南京',
    'bj': '北京',
    'sh': '上海',
    'wh': '武汉'
};

// 打开收藏弹窗
async function openFavoriteModal() {
    const modal = document.getElementById('favorite-modal');
    const listContainer = document.getElementById('favorite-list');
    
    if (!modal || !listContainer) return;
    
    // 禁止body滚动，防止遮罩层出现缝隙
    document.body.style.overflow = 'hidden';
    
    // 显示弹窗
    modal.style.display = 'flex';
    listContainer.innerHTML = '<div class="loading-hint"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
    
    // 获取收藏列表
    await loadFavoriteStations();
}

// 加载收藏站点列表
async function loadFavoriteStations() {
    const userId = localStorage.getItem('userId');
    const listContainer = document.getElementById('favorite-list');
    
    if (!userId) {
        listContainer.innerHTML = '<div class="empty-hint"><i class="fas fa-exclamation-circle"></i> 请先登录</div>';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/favorite/list?user_id=${userId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '获取收藏列表失败');
        }
        
        if (!data.favorites || data.favorites.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-hint">
                    <i class="fas fa-star"></i>
                    <p>暂无收藏站点</p>
                    <span>在线路详情页点击站点可添加收藏</span>
                </div>
            `;
            return;
        }
        
        // 渲染收藏列表
        renderFavoriteList(data.favorites);
        
    } catch (error) {
        console.error('加载收藏列表失败:', error);
        listContainer.innerHTML = `
            <div class="empty-hint error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>加载失败</p>
                <span>${error.message}</span>
            </div>
        `;
    }
}

// 渲染收藏列表
function renderFavoriteList(favorites) {
    const listContainer = document.getElementById('favorite-list');
    
    const html = favorites.map(fav => `
        <div class="favorite-item" data-fav-id="${fav.fav_id}" data-city="${fav.city_code}" data-station="${fav.station_name || fav.station_id}">
            <div class="favorite-info">
                <div class="favorite-station-name">
                    <i class="fas fa-subway"></i>
                    ${fav.station_name || fav.station_id}
                </div>
                <div class="favorite-meta">
                    <span class="city-tag">${cityCodeToName[fav.city_code] || fav.city_code}</span>
                    <span class="line-tag">${fav.line_name || '未知线路'}</span>
                </div>
                <div class="favorite-time">
                    <i class="fas fa-clock"></i> ${fav.created_at || '未知时间'}
                </div>
            </div>
            <div class="favorite-actions">
                <button class="goto-btn" title="查看站点" 
                        onclick="gotoStation('${fav.city_code}', '${fav.station_name || fav.station_id}', '${fav.line_name || ''}')">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                <button class="remove-btn" title="取消收藏" 
                        onclick="removeFavorite('${fav.city_code}', '${fav.station_name || fav.station_id}', this)">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    listContainer.innerHTML = html;
}

// 跳转到站点
function gotoStation(cityCode, stationName, lineName) {
    // 关闭弹窗并恢复body滚动
    closeFavoriteModalFn();
    
    // 构建跳转URL，携带城市和站点参数
    const url = `information.html?city=${encodeURIComponent(cityCode)}&station=${encodeURIComponent(stationName)}&line=${encodeURIComponent(lineName)}`;
    window.location.href = url;
}

// 取消收藏
async function removeFavorite(cityCode, stationId, btnElement) {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
        alert('请先登录');
        return;
    }
    
    if (!confirm(`确定要取消收藏"${stationId}"站吗？`)) {
        return;
    }
    
    try {
        // 禁用按钮
        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        const response = await fetch(`${API_BASE}/api/favorite/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                city_code: cityCode,
                station_id: stationId
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // 从列表中移除该项
            const item = btnElement.closest('.favorite-item');
            if (item) {
                item.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    item.remove();
                    // 检查是否还有收藏项
                    const listContainer = document.getElementById('favorite-list');
                    if (listContainer && listContainer.children.length === 0) {
                        listContainer.innerHTML = `
                            <div class="empty-hint">
                                <i class="fas fa-star"></i>
                                <p>暂无收藏站点</p>
                                <span>在线路详情页点击站点可添加收藏</span>
                            </div>
                        `;
                    }
                }, 300);
            }
        } else {
            alert(data.message || '取消收藏失败');
            btnElement.disabled = false;
            btnElement.innerHTML = '<i class="fas fa-trash-alt"></i>';
        }
        
    } catch (error) {
        console.error('取消收藏失败:', error);
        alert('网络错误，请稍后重试');
        btnElement.disabled = false;
        btnElement.innerHTML = '<i class="fas fa-trash-alt"></i>';
    }
}
