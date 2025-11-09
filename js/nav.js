document.addEventListener('DOMContentLoaded', function () {
    loadNavigation();
});

function loadNavigation() {
    // 获取导航容器
    const navContainer = document.getElementById('nav-container');
    if (!navContainer) {
        console.error('导航容器不存在！请在页面中添加 <div id="nav-container"></div>');
        return;
    }

    fetch('nav.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`加载导航失败：${response.statusText}`);
            }
            return response.text();
        })
        .then(navHtml => {
            navContainer.innerHTML = navHtml;

            initMusicControl();     // 初始化音乐控制（支持状态保持）
            highlightCurrentPage();  // 高亮当前导航项
        })
        .catch(error => {
            console.error('导航加载失败:', error);
            navContainer.innerHTML = '<div style="padding: 20px; background: #f00; color: white;">导航加载失败</div>';
        });
}

function initMusicControl() {
    const music = document.getElementById('backgroundMusic');
    const musicToggle = document.getElementById('musicToggle');
    const musicIcon = document.getElementById('musicIcon');

    if (!music || !musicToggle || !musicIcon) {
        console.error('音乐控制元素缺失！请检查 nav.html 中的 id 是否正确');
        return;
    }

    // 本地存储键名（唯一标识音乐状态）
    const STORAGE_KEY = 'subwayMusicState';
    
    // 从本地存储读取状态（默认初始状态）
    let savedState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        currentTime: 0,
        isPlaying: true
    };
    let isPlaying = savedState.isPlaying;

    // 音乐图标路径
    const musicOnSrc = './images/btn_music.png';
    const musicOffSrc = './images/btn_nomusic.png';

    // 音频基础配置
    music.autoplay = false; // 关闭自动播放，改为手动恢复状态
    music.preload = 'auto';
    music.playsInline = true;
    music.loop = true; // 确保循环播放

    // 保存当前音乐状态到本地存储
    function saveMusicState() {
        const state = {
            currentTime: music.currentTime, // 记录当前播放进度
            isPlaying: isPlaying            // 记录播放状态
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    /**
     * 更新音乐状态（播放/暂停）和UI
     * @param {boolean} uiOnly - 为true时只更新UI，不触发播放/暂停
     */
    function updateMusicState(uiOnly = false) {
        if (isPlaying) {
            if (!uiOnly) {
                music.play().catch(() => { /* 忽略浏览器拦截错误 */ });
            }
            musicIcon.src = musicOnSrc;
            musicIcon.alt = '关闭背景音乐';
            musicIcon.classList.remove('music-off');
            musicToggle.setAttribute('title', '关闭音乐');
        } else {
            music.pause();
            musicIcon.src = musicOffSrc;
            musicIcon.alt = '开启背景音乐';
            musicIcon.classList.add('music-off');
            musicToggle.setAttribute('title', '开启音乐');
        }
        saveMusicState(); // 状态变更后立即保存
    }

    // 首次用户手势解锁播放（应对浏览器自动播放限制）
    function unlockOnFirstGesture() {
        const tryPlay = () => {
            music.play().then(() => {
                isPlaying = true;
                updateMusicState();
                // 解锁后移除事件监听
                document.removeEventListener('pointerdown', tryPlay);
                document.removeEventListener('keydown', tryPlay);
            }).catch(() => {
                // 仍被拦截则保持静默，允许用户手动点击
            });
        };
        // 监听首次点击或按键事件
        document.addEventListener('pointerdown', tryPlay, { once: true });
        document.addEventListener('keydown', tryPlay, { once: true });
    }

    // 初始化音乐（恢复保存的状态）
    function initMusic() {
        // 音频元数据加载完成后恢复进度
        music.addEventListener('loadedmetadata', () => {
            if (savedState.currentTime > 0) {
                music.currentTime = savedState.currentTime;
            }
        });

        // 尝试恢复播放状态
        music.play().then(() => {
            updateMusicState();
        }).catch(err => {
            console.log('自动播放受限，等待用户交互后恢复:', err);
            updateMusicState(true); // 先更新UI
            unlockOnFirstGesture(); // 等待首次手势后恢复播放
        });

        // 监听页面关闭/跳转，保存最终状态
        window.addEventListener('beforeunload', saveMusicState);
    }

    // 切换播放/暂停按钮事件
    musicToggle.addEventListener('click', function (e) {
        e.preventDefault();
        isPlaying = !isPlaying;
        updateMusicState();
    });

    initMusic(); // 启动初始化
}

function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    let pageId;

    switch (currentPage) {
        case 'index.html': pageId = 'home'; break;
        case 'overview.html': pageId = 'overview'; break;
        case 'information.html': pageId = 'information'; break;
        case 'explorer.html': pageId = 'explorer'; break;
        case 'planner.html': pageId = 'planner'; break;
        default: pageId = 'home';
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-page') === pageId);
    });
}