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

    // 系统公告功能
    const announcementLink = document.getElementById('announcement-link');
    const announcementModal = document.getElementById('announcement-modal');
    const closeAnnouncementModal = document.getElementById('close-announcement-modal');
    const announcementList = document.getElementById('announcement-list');
    const announcementLoading = document.getElementById('announcement-loading');
    const announcementError = document.getElementById('announcement-error');

    // GitHub API 地址（获取commit记录）
    const GITHUB_API = 'https://api.github.com/repos/luoul-123/City-Subway-Service-System/commits';

    if (announcementLink) {
        announcementLink.addEventListener('click', (e) => {
            e.preventDefault();
            openAnnouncementModal();
        });
    }

    if (closeAnnouncementModal) {
        closeAnnouncementModal.addEventListener('click', () => {
            announcementModal.style.display = 'none';
        });
    }

    if (announcementModal) {
        announcementModal.addEventListener('click', (e) => {
            if (e.target === announcementModal) {
                announcementModal.style.display = 'none';
            }
        });
    }

    // 打开公告弹窗并加载数据
    async function openAnnouncementModal() {
        if (!announcementModal || !announcementList || !announcementLoading) return;

        // 显示弹窗和加载状态
        announcementModal.style.display = 'flex';
        announcementLoading.style.display = 'block';
        announcementList.style.display = 'none';
        announcementError.style.display = 'none';

        try {
            // 调用GitHub API获取最近10条commit记录
            const response = await fetch(GITHUB_API, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'CitySubwayServiceSystem' // GitHub API要求必须有User-Agent
                }
            });

            if (!response.ok) {
                throw new Error('获取更新记录失败，请稍后重试');
            }

            const commits = await response.json();
            renderAnnouncements(commits.slice(0, 5)); // 只显示最近10条
        } catch (err) {
            announcementError.textContent = err.message;
            announcementError.style.display = 'block';
        } finally {
            announcementLoading.style.display = 'none';
        }
    }

    // 渲染公告列表
    function renderAnnouncements(commits) {
        if (!announcementList) return;

        if (!commits || commits.length === 0) {
            announcementList.innerHTML = `
                <div class="announcement-empty">
                    <i class="fas fa-file-alt"></i>
                    <p>暂无更新记录</p>
                </div>
            `;
            announcementList.style.display = 'block';
            return;
        }

        // 格式化提交时间
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        // 生成公告HTML
        const html = commits.map(commit => `
            <div class="announcement-item">
                <div class="announcement-date">
                    <span>${formatDate(commit.commit.committer.date)}</span>
                    <span class="announcement-author">${commit.commit.committer.name}</span>
                </div>
                <div class="announcement-message">${commit.commit.message}</div>
            </div>
        `).join('');

        announcementList.innerHTML = html;
        announcementList.style.display = 'block';
    }

    // 联系我们功能
    const contactLink = document.getElementById('contact-link');
    const contactModal = document.getElementById('contact-modal');
    const closeContactModal = document.getElementById('close-contact-modal');

    // 打开联系我们弹窗
    if (contactLink) {
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            contactModal.style.display = 'flex';
        });
    }

    // 关闭弹窗
    if (closeContactModal) {
        closeContactModal.addEventListener('click', () => {
            contactModal.style.display = 'none';
        });
    }

    if (contactModal) {
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                contactModal.style.display = 'none';
            }
        });
    }

    // 复制邮箱功能
    const copyEmailBtn = document.getElementById('copy-first-email');
    const copySuccess = document.getElementById('copy-success');

    if (copyEmailBtn) {
        copyEmailBtn.addEventListener('click', async () => {
            const email = '3216527594@qq.com'; // 固定邮箱地址
            
            // 保存原始按钮状态
            const originalHTML = copyEmailBtn.innerHTML;
            
            try {
                // 使用Clipboard API复制文本
                await navigator.clipboard.writeText(email);
                
                // 复制成功，更新按钮状态
                copyEmailBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                copyEmailBtn.style.background = 'rgba(76, 175, 80, 0.2)';
                copyEmailBtn.style.color = '#2e7d32';
                copyEmailBtn.style.borderColor = 'rgba(76, 175, 80, 0.3)';
                
                // 显示成功提示
                if (copySuccess) {
                    copySuccess.style.display = 'flex';
                    
                    // 3秒后自动隐藏提示
                    setTimeout(() => {
                        copySuccess.style.display = 'none';
                    }, 3000);
                }
                
                // 1.5秒后恢复按钮原状
                setTimeout(() => {
                    copyEmailBtn.innerHTML = originalHTML;
                    copyEmailBtn.style.background = '';
                    copyEmailBtn.style.color = '';
                    copyEmailBtn.style.borderColor = '';
                }, 1500);
                
            } catch (err) {
                console.error('复制失败:', err);
                
                // 降级方案：使用传统方法
                const textArea = document.createElement('textarea');
                textArea.value = email;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '0';
                document.body.appendChild(textArea);
                
                try {
                    textArea.focus();
                    textArea.select();
                    const successful = document.execCommand('copy');
                    
                    if (successful) {
                        // 复制成功
                        copyEmailBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
                        copyEmailBtn.style.background = 'rgba(76, 175, 80, 0.2)';
                        copyEmailBtn.style.color = '#2e7d32';
                        copyEmailBtn.style.borderColor = 'rgba(76, 175, 80, 0.3)';
                        
                        // 显示成功提示
                        if (copySuccess) {
                            copySuccess.style.display = 'flex';
                            
                            // 3秒后自动隐藏提示
                            setTimeout(() => {
                                copySuccess.style.display = 'none';
                            }, 3000);
                        }
                        
                        // 1.5秒后恢复按钮原状
                        setTimeout(() => {
                            copyEmailBtn.innerHTML = originalHTML;
                            copyEmailBtn.style.background = '';
                            copyEmailBtn.style.color = '';
                            copyEmailBtn.style.borderColor = '';
                        }, 1500);
                    } else {
                        alert('复制失败，请手动复制邮箱地址：' + email);
                    }
                } catch (err2) {
                    alert('复制失败，请手动复制邮箱地址：' + email);
                } finally {
                    document.body.removeChild(textArea);
                }
            }
        });
    }
}); 