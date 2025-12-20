// 登录页逻辑：调用后端 /api/login
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.querySelector('.login button');
    const inputs = document.querySelectorAll('.login input');
    const loginForm = document.querySelector('#login-form');
    const errorBox = document.getElementById('login-error');
    const API_BASE = 'http://127.0.0.1:5000';
    
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
    
    async function handleLogin() {
        const username = document.getElementById('username').value.trim(); // 可输入用户名或邮箱
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            showError('请输入账号和密码！');
            return;
        }

        loginBtn.textContent = '登录中...';
        loginBtn.disabled = true;
        showError(''); // 清空
        
        try {
            const resp = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.message || '登录失败，请稍后重试');
            }

            // 保存登录状态到 localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userId', data.user_id);
            localStorage.setItem('username', data.username);
            localStorage.setItem('displayName', data.display_name || data.username);
            localStorage.setItem('email', data.email || '');

            // 跳转到首页
            window.location.href = 'index.html';
        } catch (err) {
            showError(err.message);
        } finally {
            loginBtn.textContent = '登录';
            loginBtn.disabled = false;
        }
    }

    function showError(msg) {
        if (!errorBox) return;
        if (!msg) {
            errorBox.style.display = 'none';
            errorBox.textContent = '';
        } else {
            errorBox.style.display = 'block';
            errorBox.textContent = msg;
        }
    }

    // 忘记密码功能
    const forgotLink = document.getElementById('forgot-password-link');
    const forgotModal = document.getElementById('forgot-password-modal');
    const closeForgotModal = document.getElementById('close-forgot-modal');
    const getQuestionBtn = document.getElementById('get-question-btn');
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    const forgotStep1 = document.getElementById('forgot-step1');
    const forgotStep2 = document.getElementById('forgot-step2');
    const forgotError = document.getElementById('forgot-error');
    let forgotUserId = null;

    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotModal.style.display = 'flex';
            // 重置状态
            forgotStep1.style.display = 'block';
            forgotStep2.style.display = 'none';
            document.getElementById('forgot-identifier').value = '';
            document.getElementById('forgot-answer').value = '';
            document.getElementById('forgot-new-password').value = '';
            document.getElementById('forgot-confirm-password').value = '';
            forgotError.style.display = 'none';
            forgotUserId = null;
        });
    }

    if (closeForgotModal) {
        closeForgotModal.addEventListener('click', () => {
            forgotModal.style.display = 'none';
        });
    }

    if (forgotModal) {
        forgotModal.addEventListener('click', (e) => {
            if (e.target === forgotModal) {
                forgotModal.style.display = 'none';
            }
        });
    }

    if (getQuestionBtn) {
        getQuestionBtn.addEventListener('click', async () => {
            const identifier = document.getElementById('forgot-identifier').value.trim();
            if (!identifier) {
                showForgotError('请输入用户名或邮箱');
                return;
            }

            getQuestionBtn.disabled = true;
            getQuestionBtn.textContent = '查询中...';
            showForgotError('');

            try {
                const resp = await fetch(`${API_BASE}/api/get_security_question?identifier=${encodeURIComponent(identifier)}`);
                const data = await resp.json();
                if (!resp.ok) {
                    throw new Error(data.message || '查询失败');
                }

                forgotUserId = data.user_id;
                document.getElementById('security-question-text').textContent = data.question;
                forgotStep1.style.display = 'none';
                forgotStep2.style.display = 'block';
                // 重置验证状态和按钮
                forgotAnswerValid = false;
                if (resetPasswordBtn) {
                    resetPasswordBtn.disabled = true;
                }
                if (forgotAnswerInput) {
                    forgotAnswerInput.value = '';
                }
            } catch (err) {
                showForgotError(err.message);
            } finally {
                getQuestionBtn.disabled = false;
                getQuestionBtn.textContent = '下一步';
            }
        });
    }

    // 忘记密码：实时验证安全问题答案
    const forgotAnswerInput = document.getElementById('forgot-answer');
    let forgotAnswerValid = false;
    let forgotVerifyTimer = null;

    // 防抖验证函数（忘记密码）
    async function verifyForgotAnswerRealTime() {
        if (!forgotAnswerInput || !forgotUserId) return;
        
        const answer = forgotAnswerInput.value.trim();
        if (!answer) {
            showForgotError('');
            if (resetPasswordBtn) resetPasswordBtn.disabled = true;
            forgotAnswerValid = false;
            return;
        }

        try {
            // 先获取用户信息验证答案
            const resp = await fetch(`${API_BASE}/api/verify_security_answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: forgotUserId,
                    answer: answer
                })
            });

            const data = await resp.json();
            if (!resp.ok) {
                showForgotError(data.message || '安全问题答案错误');
                if (resetPasswordBtn) resetPasswordBtn.disabled = true;
                forgotAnswerValid = false;
            } else {
                showForgotError('');
                if (resetPasswordBtn) resetPasswordBtn.disabled = false;
                forgotAnswerValid = true;
            }
        } catch (err) {
            showForgotError('验证失败，请稍后重试');
            if (resetPasswordBtn) resetPasswordBtn.disabled = true;
            forgotAnswerValid = false;
        }
    }

    // 输入时实时验证（防抖）
    if (forgotAnswerInput) {
        forgotAnswerInput.addEventListener('input', () => {
            if (!forgotUserId) return;
            clearTimeout(forgotVerifyTimer);
            forgotVerifyTimer = setTimeout(verifyForgotAnswerRealTime, 500);
        });

        forgotAnswerInput.addEventListener('blur', () => {
            if (!forgotUserId) return;
            clearTimeout(forgotVerifyTimer);
            verifyForgotAnswerRealTime();
        });
    }

    if (resetPasswordBtn) {
        resetPasswordBtn.disabled = true; // 初始状态禁用
    }

    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', async () => {
            const answer = forgotAnswerInput ? forgotAnswerInput.value.trim() : '';
            const newPassword = document.getElementById('forgot-new-password').value;
            const confirmPassword = document.getElementById('forgot-confirm-password').value;

            if (!answer || !newPassword || !confirmPassword) {
                showForgotError('请填写完整信息');
                return;
            }

            if (!forgotAnswerValid) {
                showForgotError('请先输入正确的安全问题答案');
                return;
            }

            if (newPassword !== confirmPassword) {
                showForgotError('两次输入的密码不一致');
                return;
            }

            resetPasswordBtn.disabled = true;
            resetPasswordBtn.textContent = '重置中...';
            showForgotError('');

            try {
                const identifier = document.getElementById('forgot-identifier').value.trim();
                const resp = await fetch(`${API_BASE}/api/reset_password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        identifier,
                        answer,
                        new_password: newPassword
                    })
                });

                const data = await resp.json();
                if (!resp.ok) {
                    throw new Error(data.message || '重置失败');
                }

                alert('密码重置成功，请使用新密码登录');
                forgotModal.style.display = 'none';
            } catch (err) {
                showForgotError(err.message);
                forgotAnswerValid = false;
            } finally {
                resetPasswordBtn.disabled = !forgotAnswerValid;
                resetPasswordBtn.textContent = '重置密码';
            }
        });
    }

    function showForgotError(msg) {
        if (!forgotError) return;
        if (!msg) {
            forgotError.style.display = 'none';
            forgotError.textContent = '';
        } else {
            forgotError.style.display = 'block';
            forgotError.textContent = msg;
        }
    }
});