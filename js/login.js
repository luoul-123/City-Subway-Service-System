// 简单的表单验证和交互效果
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.querySelector('.login button');
    const inputs = document.querySelectorAll('.login input');
    const loginForm = document.querySelector('.login form');
    
    // 输入框聚焦效果
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (this.value === '') {
                this.parentElement.classList.remove('focused');
            }
        });
    });
    
    // 登录按钮点击事件
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault(); // 阻止默认行为
        handleLogin();
    });
    
    // 添加表单提交事件（支持回车键提交）
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault(); // 阻止表单默认提交行为
        handleLogin();
    });
    
    function handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            alert('请输入账号和密码！');
            return;
        }
        
        // 测试账号验证（写死在代码中）
        const TEST_USERNAME = 'tester';
        const TEST_PASSWORD = '123456';
        
        if (username === TEST_USERNAME && password === TEST_PASSWORD) {
            // 登录中
            loginBtn.textContent = '登录中...';
            loginBtn.disabled = true;
            
            setTimeout(() => {
                // 登录成功后跳转到首页
                window.location.href = 'index.html';
            }, 500);
        } else {
            alert('用户名或密码错误！\n测试账号：tester\n密码：123456');
            return;
        }
    }
});