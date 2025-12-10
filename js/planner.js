document.addEventListener('DOMContentLoaded', function () {
    // ========== 核心配置 ==========
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2JubWZ5aiIsImEiOiJjbTdhYTU4cjEwMXVlMnFwdzlvNHA2MWZyIn0.xM1rgUx9ZeG7h2boM1t_oQ';
    const cityConfig = {
        'nj': { name: '南京', center: [118.796877, 32.060255], zoom: 10 },
        'bj': { name: '北京', center: [116.4074, 39.9042], zoom: 10 },
        'sh': { name: '上海', center: [121.4737, 31.2304], zoom: 10 },
        'wh': { name: '武汉', center: [114.3055, 30.5928], zoom: 10 }
    };
    let currentCity = 'nj';
    let currentPOIData = [];
    let stopData = [];
    window.startMarker = null;
    window.endMarker = null;
    window.userLocationMarker = null;

    // ========== 地图初始化 ==========
    const map = new mapboxgl.Map({
        container: 'planner-map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: cityConfig[currentCity].center,
        zoom: cityConfig[currentCity].zoom,
        attributionControl: false
    });

    // 添加控件和语言配置
    map.addControl(new MapboxLanguage({ defaultLanguage: 'zh-Hans' }));
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // 地图加载完成后配置中文字体
    map.on('load', function() {
        map.getStyle().layers.forEach(layer => {
            if (layer.type === 'symbol') {
                map.setLayoutProperty(layer.id, 'text-font', ['Noto Sans CJK SC Regular']);
            }
        });
        // 初始化精度圈图层（定位功能）
        initAccuracyLayer();
    });

    // ========== 城市切换功能 ==========
    function initCitySwitchEvents() {
        const cityBtns = document.querySelectorAll('.city-btn');
        const currentCityEl = document.querySelector('.current-city');

        // 初始化激活状态
        cityBtns.forEach(btn => {
            if (btn.getAttribute('data-city') === currentCity) btn.classList.add('active');
        });

        // 绑定切换事件
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

    function switchCity(cityCode) {
        currentCity = cityCode;
        map.flyTo({ center: cityConfig[cityCode].center, zoom: cityConfig[cityCode].zoom, duration: 1000 });
        
        // 清除标记和路线
        const cleared = clearMarkersAndRoutes(map, window.startMarker, window.endMarker, window.userLocationMarker);
        window.startMarker = cleared.startMarker;
        window.endMarker = cleared.endMarker;
        window.userLocationMarker = cleared.userLocationMarker;
        
        // 加载数据
        Promise.all([
            loadPOIData(currentCity).then(data => currentPOIData = data),
            loadStopData(currentCity).then(data => stopData = data)
        ]).catch(error => console.error('数据加载失败:', error));
    }

    // ========== 定位功能 ==========
    function initAccuracyLayer() {
        if (!map.getSource('user-accuracy-source')) {
            map.addSource('user-accuracy-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
            map.addLayer({
                id: 'user-accuracy-layer',
                type: 'circle',
                source: 'user-accuracy-source',
                paint: {
                    'circle-radius': ['get', 'accuracy'],
                    'circle-color': 'rgba(0, 123, 255, 0.2)',
                    'circle-stroke-color': '#007bff',
                    'circle-stroke-width': 1,
                    'circle-stroke-dasharray': [2, 2]
                }
            });
        }
    }

    function initLocationService() {
        const locateBtn = document.getElementById('locate-btn');
        locateBtn.addEventListener('click', getUserLocation);
    }

    function getUserLocation() {
        const locateBtn = document.getElementById('locate-btn');
        const locationInfo = document.getElementById('location-info');
        
        locateBtn.classList.add('locating');
        locationInfo.style.display = 'block';
        locationInfo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 获取位置中...';
        locationInfo.className = 'location-info';
        
        if (!window.AMap) {
            showLocationError('地图服务加载失败，请刷新页面重试');
            return;
        }
        
        AMap.plugin('AMap.Geolocation', function() {
            const geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,
                timeout: 10000,
                zoomToAccuracy: true              
            });

            geolocation.getCurrentPosition(function(status, result) {
                locateBtn.classList.remove('locating');
                if (status === 'complete') {
                    const lng = result.position.lng;
                    const lat = result.position.lat;
                    const accuracy = result.accuracy || 0;
                    const [wgsLng, wgsLat] = gcj02ToWgs84(lng, lat);
                    
                    // 地图跳转
                    map.flyTo({ center: [lng, lat], zoom: 16, duration: 1000 });
                    
                    // 更新精度圈
                    map.getSource('user-accuracy-source').setData({
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: { type: 'Point', coordinates: [wgsLng, wgsLat] },
                            properties: { accuracy: accuracy }
                        }]
                    });
                    
                    // 更新用户位置标记
                    if (window.userLocationMarker) {
                        window.userLocationMarker.setLngLat([wgsLng, wgsLat]);
                    } else {
                        const el = document.createElement('div');
                        el.className = 'user-location-marker';
                        window.userLocationMarker = new mapboxgl.Marker(el)
                            .setLngLat([lng, lat])
                            .addTo(map);
                    }
                    
                    // 设置起点
                    document.getElementById('start-station').value = '当前位置';
                    locationInfo.innerHTML = `<i class="fas fa-check-circle"></i> 定位成功 (精度: ${Math.round(accuracy)}m)`;
                    locationInfo.className = 'location-info success';
                } else {
                    const errorMessage = `定位失败: ${result.message}`;
                    let solutions = '';
                    if (result.message.includes('HTTPS')) solutions = '<div style="margin-top: 4px; font-size: 11px;">请在HTTPS环境下使用定位功能</div>';
                    else if (result.message.includes('权限')) solutions = '<div style="margin-top: 4px; font-size: 11px;">请开启位置权限后重试</div>';
                    
                    locationInfo.innerHTML = `<div><i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i> ${errorMessage}</div>${solutions}`;
                    locationInfo.className = 'location-info error';
                    setTimeout(() => locationInfo.style.display = 'none', 5000);
                }
            });
        });
    }

    // ========== 自动完成功能 ==========
    function initAutocomplete() {
        const startInput = document.getElementById('start-station');
        const endInput = document.getElementById('end-station');
        
        initAutocompleteForInput(startInput, 'start');
        initAutocompleteForInput(endInput, 'end');
    }

    function initAutocompleteForInput(inputElement, type) {
        let autocompleteItems = [];
        let selectedIndex = -1;
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        inputElement.parentNode.appendChild(dropdown);
        
        // 输入过滤逻辑
        inputElement.addEventListener('input', function(e) {
            const value = e.target.value.trim();
            if (value.length < 1) {
                dropdown.style.display = 'none';
                return;
            }
            
            // 合并POI和地铁站数据
            const filteredPOIs = currentPOIData.filter(poi => 
                poi.name.includes(value) || (poi.address && poi.address.includes(value))
            );
            const filteredStops = stopData.filter(stop => 
                stop.name.includes(value) || stop.linename.includes(value)
            );
            const combinedResults = [...filteredStops, ...filteredPOIs]
                .filter((item, index, self) => self.findIndex(i => i.name === item.name) === index)
                .slice(0, 8);
            
            // 显示下拉框
            if (combinedResults.length === 0) {
                dropdown.innerHTML = `<div class="autocomplete-item no-results">未找到相关地点</div>`;
                dropdown.style.display = 'block';
                return;
            }
            
            dropdown.innerHTML = combinedResults.map((poi, index) => `
                <div class="autocomplete-item" data-index="${index}">
                    <div class="poi-name">${highlightText(poi.name, value)}</div>
                    <div class="poi-info">
                        <div class="poi-type">${poi.type}</div>
                        ${poi.address ? `<div class="poi-address">${poi.address}</div>` : ''}
                    </div>
                </div>
            `).join('');
            dropdown.style.display = 'block';
            
            // 绑定点击事件
            dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    const poi = combinedResults[index];
                    inputElement.value = poi.name;
                    dropdown.style.display = 'none';
                    map.flyTo({ center: [poi.wgsLon, poi.wgsLat], zoom: 15, duration: 1000 });
                    createPOIMarker(map, poi, type);
                });
            });
        });
        
        // 键盘导航
        inputElement.addEventListener('keydown', function(e) {
            if (!dropdown.style.display) return;
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, autocompleteItems.length - 1);
                    dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
                        item.classList.toggle('selected', index === selectedIndex);
                    });
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, -1);
                    dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
                        item.classList.toggle('selected', index === selectedIndex);
                    });
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0) {
                        const poi = autocompleteItems[selectedIndex];
                        inputElement.value = poi.name;
                        dropdown.style.display = 'none';
                        map.flyTo({ center: [poi.wgsLon, poi.wgsLat], zoom: 15, duration: 1000 });
                        createPOIMarker(map, poi, type);
                    }
                    break;
                case 'Escape':
                    dropdown.style.display = 'none';
                    break;
            }
        });
        
        // 点击外部隐藏下拉框
        document.addEventListener('click', e => {
            if (!inputElement.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // ========== 路线规划功能 ==========
    function initRoutePlanning() {
        const planBtn = document.getElementById('plan-route-btn');
        const closeResultBtn = document.getElementById('close-result');
        const switchBtn = document.getElementById('switch-start-end-btn');
        const startInput = document.getElementById('start-station');
        const endInput = document.getElementById('end-station');

        // 切换起点终点
        switchBtn.addEventListener('click', function() {
            const temp = startInput.value.trim();
            startInput.value = endInput.value.trim();
            endInput.value = temp;
            
            // 切换标记
            const tempMarker = window.startMarker;
            window.startMarker = window.endMarker;
            window.endMarker = tempMarker;
            
            this.classList.add('active');
            setTimeout(() => this.classList.remove('active'), 300);
        });

        // 关闭结果面板
        closeResultBtn.addEventListener('click', function() {
            document.getElementById('result-panel').style.display = 'none';
            if (map.getSource('route-source')) {
                map.removeLayer('route-layer');
                map.removeSource('route-source');
            }
        });

        // 获取路线偏好
        function getSelectedPreference() {
            const radios = document.querySelectorAll('input[name="route-preference"]');
            for (const radio of radios) {
                if (radio.checked) return radio.value;
            }
            return 'shortest';
        }

        // 规划路线
        planBtn.addEventListener('click', function() {
            const startStation = startInput.value.trim();
            const endStation = endInput.value.trim();
            const preference = getSelectedPreference();
            
            if (!startStation || !endStation) {
                alert('请输入起点和终点！');
                return;
            }
            
            document.getElementById('loading').style.display = 'flex';
            
            // 生成模拟路线
            const routeCoordinates = generateMockRouteCoordinates(window.startMarker, window.endMarker);
            let routeData;
            
            if (preference === 'shortest') {
                routeData = {
                    duration: '40分钟',
                    distance: '9.8公里',
                    transfers: '1次',
                    polyline: routeCoordinates,
                    steps: [
                        { type: 'walk', title: '步行至地铁站', detail: `${startStation} → 地铁1号线（约6分钟）` },
                        { type: 'subway', title: '乘坐地铁1号线', detail: '途经3站（约9分钟）' },
                        { type: 'transfer', title: '换乘', detail: '换乘2号线（约4分钟）' },
                        { type: 'subway', title: '乘坐地铁2号线', detail: '途经2站（约7分钟）' },
                        { type: 'walk', title: '步行至目的地', detail: '地铁2号线 → 终点（约5分钟）' }
                    ]
                };
            } else {
                routeData = {
                    duration: '45分钟',
                    distance: '12公里',
                    transfers: '0次',
                    polyline: routeCoordinates,
                    steps: [
                        { type: 'walk', title: '步行至地铁站', detail: `${startStation} → 地铁3号线（约8分钟）` },
                        { type: 'subway', title: '乘坐地铁3号线', detail: '途经7站（约20分钟）' },
                        { type: 'walk', title: '步行至目的地', detail: '地铁3号线 → 终点（约6分钟）' }
                    ]
                };
            }
            
            // 模拟请求延迟
            setTimeout(() => {
                document.getElementById('loading').style.display = 'none';
                renderRouteResult(routeData);
                drawRouteLine(map, routeData.polyline);
            }, 800);
        });
    }

    // ========== 初始化所有功能 ==========
    function init() {
        initCitySwitchEvents();
        initLocationService();
        initAutocomplete();
        initRoutePlanning();
        
        // 初始加载数据
        Promise.all([
            loadPOIData(currentCity).then(data => currentPOIData = data),
            loadStopData(currentCity).then(data => stopData = data)
        ]).catch(error => console.error('初始数据加载失败:', error));
    }

    init();
});