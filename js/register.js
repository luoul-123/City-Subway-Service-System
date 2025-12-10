// 注册页：调用 /api/register
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-form');
    const btn = form.querySelector('button');
    const errBox = document.getElementById('register-error');
    const API_BASE = 'http://127.0.0.1:5000';
    const usernameHint = document.getElementById('username-hint');
    const emailHint = document.getElementById('email-hint');
    const pwdHint = document.getElementById('pwd-hint');

    // 状态标记
    const state = {
        usernameOK: false,
        emailOK: true, // 邮箱可空
        pwdOK: false,
        confirmOK: false
    };

    btn.disabled = true;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleRegister();
    });

    // 输入实时校验：用户名、邮箱
    const usernameInput = document.getElementById('reg-username');
    const emailInput = document.getElementById('reg-email');
    const pwdInput = document.getElementById('reg-password');
    const pwd2Input = document.getElementById('reg-password2');

    let debounceTimer = null;
    function debounce(fn, delay = 500) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fn, delay);
    }

    usernameInput.addEventListener('input', () => {
        debounce(() => checkAvailability(), 400);
    });
    emailInput.addEventListener('input', () => {
        debounce(() => checkAvailability(), 400);
    });

    pwdInput.addEventListener('input', validatePasswords);
    pwd2Input.addEventListener('input', validatePasswords);

    async function handleRegister() {
        const username = document.getElementById('reg-username').value.trim();
        const displayName = document.getElementById('reg-display-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pwd = document.getElementById('reg-password').value;
        const pwd2 = document.getElementById('reg-password2').value;
        const safeQuestion = document.getElementById('reg-safe-question').value.trim();

        if (!username || !pwd || !pwd2 || !safeQuestion || !state.usernameOK || !state.emailOK || !state.pwdOK || !state.confirmOK) {
            updateButtonState();
            return showError('请先修正表单校验错误');
        }

        showError('');
        btn.textContent = '提交中...';
        btn.disabled = true;

        try {
            const resp = await fetch(`${API_BASE}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password: pwd,
                    display_name: displayName || undefined,
                    email: email || undefined,
                    safe_question: safeQuestion
                })
            });
            const data = await resp.json();
            if (!resp.ok) {
                // 显示后端明确的重复信息/错误信息
                throw new Error(data.message || '注册失败，请稍后再试');
            }

            alert('注册成功，可前往登录');
            window.location.href = 'login.html';
        } catch (err) {
            showError(err.message);
        } finally {
            btn.textContent = '注册';
            btn.disabled = false;
        }
    }

    async function checkAvailability() {
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();

        // 基础非空 & 邮箱格式（简单校验）
        if (!username) {
            setHint(usernameHint, '用户名不能为空');
            state.usernameOK = false;
            updateButtonState();
            return;
        } else {
            setHint(usernameHint, '');
            state.usernameOK = true; // 先假设可用，等后端校验
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setHint(emailHint, '邮箱格式不正确');
            state.emailOK = false;
            updateButtonState();
            return;
        } else {
            setHint(emailHint, '');
            state.emailOK = true;
        }

        try {
            const resp = await fetch(`${API_BASE}/api/check_user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email })
            });
            const data = await resp.json();
            if (!resp.ok) {
                throw new Error(data.message || '校验失败');
            }
            if (data.username_taken) {
                setHint(usernameHint, '已存在相同用户名');
                state.usernameOK = false;
            } else {
                setHint(usernameHint, '');
                state.usernameOK = true;
            }
            if (email) {
                if (data.email_taken) {
                    setHint(emailHint, '已存在相同邮箱');
                    state.emailOK = false;
                } else {
                    setHint(emailHint, '');
                    state.emailOK = true;
                }
            } else {
                setHint(emailHint, '');
                state.emailOK = true;
            }
        } catch (err) {
            // 校验接口异常，不放行
            setHint(usernameHint, '校验失败，请稍后重试');
            state.usernameOK = false;
        }
        updateButtonState();
    }

    function validatePasswords() {
        const pwd = pwdInput.value;
        const pwd2 = pwd2Input.value;
        state.pwdOK = !!pwd;
        if (pwd2 && pwd !== pwd2) {
            setHint(pwdHint, '两次输入的密码不一致');
            state.confirmOK = false;
        } else if (pwd2 && pwd === pwd2) {
            setHint(pwdHint, '');
            state.confirmOK = true;
        } else {
            setHint(pwdHint, '');
            state.confirmOK = false;
        }
        updateButtonState();
    }

    function updateButtonState() {
        btn.disabled = !(state.usernameOK && state.emailOK && state.pwdOK && state.confirmOK);
    }

    function showError(msg) {
        if (!errBox) return;
        if (!msg) {
            errBox.style.display = 'none';
            errBox.textContent = '';
        } else {
            errBox.style.display = 'block';
            errBox.textContent = msg;
        }
    }

    function setHint(el, msg) {
        if (!el) return;
        if (!msg) {
            el.textContent = '';
        } else {
            el.textContent = msg;
        }
    }
});

