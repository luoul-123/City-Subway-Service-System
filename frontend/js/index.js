// 页面加载完成后隐藏加载动画
window.addEventListener('load', function() {
    setTimeout(function() {
        document.getElementById('loading').style.opacity = '0';
        setTimeout(function() {
            document.getElementById('loading').style.display = 'none';
        }, 500);
    }, 800);
});

// 导航指示器交互
const sections = document.querySelectorAll('.city-section');
const navDots = document.querySelectorAll('.nav-dot');

// 监听滚动事件更新导航指示器
window.addEventListener('scroll', function() {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - sectionHeight / 3) {
            current = section.getAttribute('id');
        }
    });
    
    navDots.forEach(dot => {
        dot.classList.remove('active');
        if (dot.getAttribute('href').substring(1) === current) {
            dot.classList.add('active');
        }
    });
});

// 平滑滚动到对应区块
navDots.forEach(dot => {
    dot.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        window.scrollTo({
            top: targetSection.offsetTop,
            behavior: 'smooth'
        });
    });
});

// 响应式字体大小调整
function adjustFontSize() {
    const cityTitles = document.querySelectorAll('.city-title');
    const windowWidth = window.innerWidth;
    
    cityTitles.forEach(title => {
        if (windowWidth < 480) {
            title.style.fontSize = '3rem';
        } else if (windowWidth < 768) {
            title.style.fontSize = '4rem';
        } else if (windowWidth < 1200) {
            title.style.fontSize = '6rem';
        } else {
            title.style.fontSize = '8rem';
        }
    });
}

// 初始调整和监听窗口大小变化
adjustFontSize();
window.addEventListener('resize', adjustFontSize);