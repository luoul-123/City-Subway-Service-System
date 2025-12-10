// 修改安全问题答案页面逻辑
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'http://127.0.0.1:5000';
    const userId = localStorage.getItem('userId');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const verifyBtn = document.getElementById('verify-old-answer-btn');
    const changeBtn = document.getElementById('change-answer-btn');
    const step1Error = document.getElementById('step1-error');
    const step2Error = document.getElementById('step2-error');

    // 检查登录状态
    if (!userId || localStorage.getItem('isLoggedIn') !== 'true') {
        alert('请先登录！');
        window.location.href = 'login.html';
        return;
    }

    // 实时验证当前安全问题答案
    const oldAnswerInput = document.getElementById('old-answer');
    let answerValid = false;
    let verifyTimer = null;

    // 防抖验证函数
    async function verifyAnswerRealTime() {
        const oldAnswer = oldAnswerInput.value.trim();
        if (!oldAnswer) {
            showError(step1Error, '');
            verifyBtn.disabled = true;
            answerValid = false;
            return;
        }

        try {
            const resp = await fetch(`${API_BASE}/api/verify_security_answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: parseInt(userId),
                    answer: oldAnswer
                })
            });

            const data = await resp.json();
            if (!resp.ok) {
                showError(step1Error, data.message || '验证失败');
                verifyBtn.disabled = true;
                answerValid = false;
            } else {
                showError(step1Error, '');
                verifyBtn.disabled = false;
                answerValid = true;
            }
        } catch (err) {
            showError(step1Error, '验证失败，请稍后重试');
            verifyBtn.disabled = true;
            answerValid = false;
        }
    }

    // 输入时实时验证（防抖）
    if (oldAnswerInput) {
        oldAnswerInput.addEventListener('input', () => {
            clearTimeout(verifyTimer);
            verifyTimer = setTimeout(verifyAnswerRealTime, 500);
        });

        oldAnswerInput.addEventListener('blur', () => {
            clearTimeout(verifyTimer);
            verifyAnswerRealTime();
        });
    }

    // 初始状态：按钮禁用
    if (verifyBtn) {
        verifyBtn.disabled = true;
    }

    // 验证当前安全问题答案（点击按钮时）
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const oldAnswer = oldAnswerInput.value.trim();
            if (!oldAnswer) {
                showError(step1Error, '请输入当前安全问题答案');
                return;
            }

            if (!answerValid) {
                showError(step1Error, '请先输入正确的安全问题答案');
                return;
            }

            verifyBtn.disabled = true;
            verifyBtn.textContent = '验证中...';
            showError(step1Error, '');

            try {
                const resp = await fetch(`${API_BASE}/api/verify_security_answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: parseInt(userId),
                        answer: oldAnswer
                    })
                });

                const data = await resp.json();
                if (!resp.ok) {
                    throw new Error(data.message || '验证失败');
                }

                // 验证成功，进入第二步
                step1.style.display = 'none';
                step2.style.display = 'block';
            } catch (err) {
                showError(step1Error, err.message);
                verifyBtn.disabled = true;
                answerValid = false;
            } finally {
                verifyBtn.disabled = !answerValid;
                verifyBtn.textContent = '验证答案';
            }
        });
    }

    // 修改安全问题答案
    if (changeBtn) {
        changeBtn.addEventListener('click', async () => {
            const newAnswer = document.getElementById('new-answer').value.trim();
            const confirmNewAnswer = document.getElementById('confirm-new-answer').value.trim();
            const oldAnswer = document.getElementById('old-answer').value.trim();

            if (!newAnswer || !confirmNewAnswer) {
                showError(step2Error, '请填写完整信息');
                return;
            }

            if (newAnswer !== confirmNewAnswer) {
                showError(step2Error, '两次输入的答案不一致');
                return;
            }

            changeBtn.disabled = true;
            changeBtn.textContent = '修改中...';
            showError(step2Error, '');

            try {
                const resp = await fetch(`${API_BASE}/api/change_security_answer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: parseInt(userId),
                        old_answer: oldAnswer,
                        new_answer: newAnswer
                    })
                });

                const data = await resp.json();
                if (!resp.ok) {
                    throw new Error(data.message || '修改失败');
                }

                alert('安全问题答案修改成功');
                window.location.href = 'profile.html';
            } catch (err) {
                showError(step2Error, err.message);
            } finally {
                changeBtn.disabled = false;
                changeBtn.textContent = '修改答案';
            }
        });
    }

    function showError(el, msg) {
        if (!el) return;
        if (!msg) {
            el.style.display = 'none';
            el.textContent = '';
        } else {
            el.style.display = 'block';
            el.textContent = msg;
        }
    }
});

