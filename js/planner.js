document.addEventListener('DOMContentLoaded', function () {
            // 初始化Mapbox地图
            mapboxgl.accessToken = 'pk.eyJ1IjoiY2JubWZ5aiIsImEiOiJjbTdhYTU4cjEwMXVlMnFwdzlvNHA2MWZyIn0.xM1rgUx9ZeG7h2boM1t_oQ';
            const map = new mapboxgl.Map({
                container: 'planner-map',
                style: 'mapbox://styles/mapbox/light-v11',
                center: [118.796877, 32.060255], // 南京中心
                zoom: 10,
                attributionControl: false
            });

            // 添加地图基础控件
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

            // 城市配置
            const cityConfig = {
                'nj': { name: '南京', center: [118.796877, 32.060255], zoom: 10 },
                'bj': { name: '北京', center: [116.4074, 39.9042], zoom: 10 },
                'sh': { name: '上海', center: [121.4737, 31.2304], zoom: 10 },
                'wh': { name: '武汉', center: [114.3055, 30.5928], zoom: 10 }
            };

            // 当前城市
            let currentCity = 'nj';

            // 初始化城市切换事件
            function initCitySwitchEvents() {
                const cityBtns = document.querySelectorAll('.city-btn');
                const currentCityEl = document.querySelector('.current-city');

                // 绑定城市切换事件
                cityBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const cityCode = btn.getAttribute('data-city');
                        if (cityCode !== currentCity) {
                            cityBtns.forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            currentCityEl.textContent = `当前城市：${cityConfig[cityCode].name}`;
                            switchCity(cityCode);
                        }
                    });
                });
            }

            // 切换城市
            function switchCity(cityCode) {
                currentCity = cityCode;
                const config = cityConfig[cityCode];
                
                // 飞向新城市
                map.flyTo({
                    center: config.center,
                    zoom: config.zoom,
                    duration: 1000
                });
            }

            // 初始化路线规划功能
            function initRoutePlanning() {
                const planBtn = document.getElementById('plan-route-btn');
                const closeResultBtn = document.getElementById('close-result');
                const resultPanel = document.getElementById('result-panel');

                // 绑定规划按钮点击事件
                planBtn.addEventListener('click', function() {
                    const startStation = document.getElementById('start-station').value.trim();
                    const endStation = document.getElementById('end-station').value.trim();
                    
                    if (!startStation || !endStation) {
                        alert('请输入起点和终点！');
                        return;
                    }
                    
                    // 显示结果面板
                    resultPanel.style.display = 'block';
                    
                    // 模拟规划结果
                    document.getElementById('duration').textContent = '35分钟';
                    document.getElementById('distance').textContent = '12.5公里';
                    document.getElementById('transfers').textContent = '1次';
                    
                    // 显示模拟路线
                    const routeResult = document.getElementById('route-result');
                    routeResult.innerHTML = `
                        <div class="route-step">
                            <div style="display:flex; align-items:flex-start; margin-bottom:15px;">
                                <div style="width:24px;height:24px;border-radius:50%;background:#1a2a6c;color:white;display:flex;align-items:center;justify-content:center;margin-right:12px;font-size:12px;">
                                    <i class="fas fa-subway"></i>
                                </div>
                                <div>
                                    <div style="font-weight:500;color:#333;margin-bottom:4px;">乘坐地铁1号线</div>
                                    <div style="color:#666;font-size:13px;">${startStation} → 新街口站 (约15分钟)</div>
                                </div>
                            </div>
                        </div>
                        <div class="route-step">
                            <div style="display:flex; align-items:flex-start; margin-bottom:15px;">
                                <div style="width:24px;height:24px;border-radius:50%;background:#ffc107;color:#333;display:flex;align-items:center;justify-content:center;margin-right:12px;font-size:12px;">
                                    <i class="fas fa-exchange-alt"></i>
                                </div>
                                <div>
                                    <div style="font-weight:500;color:#333;margin-bottom:4px;">换乘</div>
                                    <div style="color:#666;font-size:13px;">在新街口站换乘 (约5分钟)</div>
                                </div>
                            </div>
                        </div>
                        <div class="route-step">
                            <div style="display:flex; align-items:flex-start;">
                                <div style="width:24px;height:24px;border-radius:50%;background:#1a2a6c;color:white;display:flex;align-items:center;justify-content:center;margin-right:12px;font-size:12px;">
                                    <i class="fas fa-subway"></i>
                                </div>
                                <div>
                                    <div style="font-weight:500;color:#333;margin-bottom:4px;">乘坐地铁2号线</div>
                                    <div style="color:#666;font-size:13px;">新街口站 → ${endStation} (约15分钟)</div>
                                </div>
                            </div>
                        </div>
                    `;
                });

                // 绑定关闭结果面板事件
                closeResultBtn.addEventListener('click', () => {
                    resultPanel.style.display = 'none';
                });
            }

            // 初始化所有功能
            function init() {
                initCitySwitchEvents();
                initRoutePlanning();
            }

            // 启动初始化
            init();
});