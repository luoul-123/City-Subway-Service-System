// nav.js（修改版）：默认“开”，若被浏览器拦截则在首次用户手势后自动恢复播放
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

            initMusicControl();     // 初始化音乐控制（默认开 + 手势解锁）
            highlightCurrentPage();  // 高亮当前导航项
            initShareModal(); //分享弹窗
        })
        .catch(error => {
            console.error('导航加载失败:', error);
            navContainer.innerHTML = '<div style="padding: 20px; background: #f00; color: white;">导航加载失败</div>';
        });
}

function initShareModal() {
    const shareBtn = document.querySelector('.icon-item[title="分享"]');
    const modal = document.getElementById('shareModal');
    const closeBtn = document.getElementById('closeShareModal');
    const overlay = modal.querySelector('.modal-overlay');

    if (!shareBtn || !modal || !closeBtn || !overlay) return;

    // 显示弹窗
    shareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 禁止背景滚动
    });

    // 关闭弹窗
    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // 恢复背景滚动
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // 按ESC键关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
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

    // ---- 默认策略：认为应播放（默认开）----
    let isPlaying = true;

    // 提示资源：保持与项目一致
    const musicOnSrc = './images/btn_music.png';
    const musicOffSrc = './images/btn_nomusic.png';

    // 尽量提升自动播放成功率（无侵入，若 nav.html 已设置这些属性也不冲突）
    music.autoplay = true;
    music.preload = 'auto';
    // iOS/Safari 内联播放
    // 一些浏览器使用 playsInline，一些使用 webkit-playsinline（后者通常在 HTML 中写更稳）
    music.playsInline = true;

    /**
     * 仅更新 UI 或同时驱动音频播放
     * @param {boolean} uiOnly - 为 true 时只更新图标/提示，不主动调用 play()
     */
    function updateMusicState(uiOnly = false) {
        if (isPlaying) {
            if (!uiOnly) {
                music.play().catch(() => { /* 忽略：可能仍被策略拦截 */ });
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
    }

    // 首次用户手势（点击/按键）到来时再尝试播放，以“兑现默认开”的意图
    function unlockOnFirstGesture() {
        const tryPlay = () => {
            music.play().then(() => {
                isPlaying = true;
                updateMusicState();
                document.removeEventListener('pointerdown', tryPlay);
                document.removeEventListener('keydown', tryPlay);
            }).catch(() => {
                // 仍被拦截则静默失败，保持按钮可手动控制
            });
        };
        document.addEventListener('pointerdown', tryPlay, { once: true });
        document.addEventListener('keydown', tryPlay, { once: true });
    }

    // 初始化：先尝试自动播放；若被拦截，不改变“默认开”的 UI，只等待首次手势后自动恢复
    function initMusic() {
        // 可选：重新从头开始，避免跨页残留进度
        // music.currentTime = 0;

        music.play().then(() => {
            isPlaying = true;
            updateMusicState();
        }).catch(err => {
            console.log('自动播放受限，等待首次用户手势后自动开启:', err);
            isPlaying = true;       // 维持“默认开”的语义
            updateMusicState(true); // 仅更新图标与提示，不强行触发 play()
            unlockOnFirstGesture(); // 首次手势后自动恢复播放
        });
    }

    // 切换按钮：显式控制开关
    musicToggle.addEventListener('click', function (e) {
        e.preventDefault();
        isPlaying = !isPlaying;
        updateMusicState();
    });

    initMusic(); // 初始化音乐
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
