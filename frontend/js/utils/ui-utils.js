// 关键词高亮
function highlightText(text, search) {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// 显示定位错误提示
function showLocationError(message) {
    const locationInfo = document.getElementById('location-info');
    const locateBtn = document.getElementById('locate-btn');
    
    locateBtn.classList.remove('locating');
    locationInfo.innerHTML = `<div><i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i> ${message}</div>`;
    locationInfo.className = 'location-info error';
    locationInfo.style.display = 'block';
}

// 渲染路线结果面板
function renderRouteResult(routeData) {
    const resultContent = document.getElementById('route-result');
    const durationEl = document.getElementById('duration');
    const distanceEl = document.getElementById('distance');
    const transfersEl = document.getElementById('transfers');
    
    // 清空现有内容
    resultContent.innerHTML = '';
    
    // 添加路线步骤
    routeData.steps.forEach(step => {
        const stepEl = document.createElement('div');
        stepEl.className = 'route-step';
        stepEl.innerHTML = `
            <div class="step-icon ${step.type}">
                <i class="fas ${
                    step.type === 'subway' ? 'fa-subway' : 
                    step.type === 'walk' ? 'fa-walking' : 'fa-exchange-alt'
                }"></i>
            </div>
            <div class="step-content">
                <div class="step-title">${step.title}</div>
                <div class="step-detail">${step.detail}</div>
            </div>
        `;
        resultContent.appendChild(stepEl);
    });
    
    // 更新统计信息
    durationEl.textContent = routeData.duration;
    distanceEl.textContent = routeData.distance;
    transfersEl.textContent = routeData.transfers;
    
    // 显示结果面板
    document.getElementById('result-panel').style.display = 'block';
}