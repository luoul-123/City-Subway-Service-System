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
    // 添加语言控制
    map.addControl(new MapboxLanguage({
        defaultLanguage: 'zh-Hans'  // 简体中文
    }));

    // 加载后刷新标签
    map.on('load', function() {
        // 设置中文字体以确保正确显示
        const layers = map.getStyle().layers;
        layers.forEach(layer => {
            if (layer.type === 'symbol') {
                map.setLayoutProperty(layer.id, 'text-font', [
                    'Noto Sans CJK SC Regular'
                ]);
            }
        });
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

    // POI数据（存储转换后的WGS84坐标）
    let currentPOIData = [];
    let startMarker = null;
    let endMarker = null;

    // 初始化城市切换事件
    function initCitySwitchEvents() {
        const cityBtns = document.querySelectorAll('.city-btn');
        const currentCityEl = document.querySelector('.current-city');

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
        
        map.flyTo({
            center: config.center,
            zoom: config.zoom,
            duration: 1000
        });
        
        // 清除现有POI标记
        if (startMarker) startMarker.remove();
        if (endMarker) endMarker.remove();
        startMarker = null;
        endMarker = null;
        
        loadPOIData();
    }

    // 加载POI数据（GCJ02转WGS84）
    function loadPOIData() {
        fetch(`./data/POI/${currentCity}_poi.json`)
            .then(response => {
                if (!response.ok) throw new Error('网络响应不正常');
                return response.json();
            })
            .then(data => {
                currentPOIData = data.pois.map(poi => {
                    const [wgsLng, wgsLat] = gcj02ToWgs84(
                        parseFloat(poi.lon), 
                        parseFloat(poi.lat)
                    );
                    return { ...poi, wgsLon: wgsLng, wgsLat: wgsLat };
                });
                console.log('POI数据加载成功:', currentPOIData.length, '条');
            })
            .catch(error => console.error('加载POI失败:', error));
    }

    // 坐标系转换函数 (GCJ02 -> WGS84)
    function gcj02ToWgs84(lng, lat) {
        const a = 6378245.0;
        const ee = 0.00669342162296594323;
        let dLat = transformLat(lng - 105.0, lat - 35.0);
        let dLng = transformLng(lng - 105.0, lat - 35.0);
        const radLat = lat / 180.0 * Math.PI;
        let magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        const sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
        dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
        const mgLat = lat + dLat;
        const mgLng = lng + dLng;
        return [lng * 2 - mgLng, lat * 2 - mgLat];
    }

    function transformLat(x, y) {
        let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    }

    function transformLng(x, y) {
        let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
        return ret;
    }

    // 定位功能
    let userLocationMarker = null;
    let accuracySourceId = 'user-accuracy-source';
    let accuracyLayerId = 'user-accuracy-layer';

    function initLocationService() {
        const locateBtn = document.getElementById('locate-btn');
        const locationInfo = document.getElementById('location-info');
        
        locateBtn.addEventListener('click', getUserLocation);
        
        // 初始化精度圈图层
        map.on('load', function() {
            if (!map.getSource(accuracySourceId)) {
                map.addSource(accuracySourceId, {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });
                
                map.addLayer({
                    id: accuracyLayerId,
                    type: 'circle',
                    source: accuracySourceId,
                    paint: {
                        'circle-radius': ['get', 'accuracy'],
                        'circle-color': 'rgba(0, 123, 255, 0.2)',
                        'circle-stroke-color': '#007bff',
                        'circle-stroke-width': 1,
                        'circle-stroke-dasharray': [2, 2]
                    }
                });
            }
        });
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
                buttonPosition: 'RB',
                buttonOffset: new AMap.Pixel(10, 20),
                zoomToAccuracy: true              
            });

            map.addControl(geolocation);
            
            geolocation.getCurrentPosition(function(status, result) {
                locateBtn.classList.remove('locating');
                status === 'complete' ? onLocationSuccess(result) : onLocationError(result);
            });
        });
    }

    // 定位成功处理
    function onLocationSuccess(result) {
        const locationInfo = document.getElementById('location-info');
        const lng = result.position.lng;
        const lat = result.position.lat;
        const accuracy = result.accuracy || 0;
        
        const [wgsLng, wgsLat] = gcj02ToWgs84(lng, lat);
        
        // 地图跳转
        map.flyTo({ center: [wgsLng, wgsLat], zoom: 16, duration: 1000 });
        
        // 更新精度圈
        const accuracySource = map.getSource(accuracySourceId);
        if (accuracySource) {
            accuracySource.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [wgsLng, wgsLat] },
                    properties: { accuracy: accuracy }
                }]
            });
        }
        
        // 更新用户位置标记
        if (userLocationMarker) {
            userLocationMarker.setLngLat([wgsLng, wgsLat]);
        } else {
            const el = document.createElement('div');
            el.className = 'user-location-marker';
            userLocationMarker = new mapboxgl.Marker(el)
                .setLngLat([wgsLng, wgsLat])
                .addTo(map);
        }
        
        locationInfo.innerHTML = `<i class="fas fa-check-circle"></i> 定位成功 (精度: ${Math.round(accuracy)}m)`;
        locationInfo.className = 'location-info success';
    }

    // 定位错误处理
    function onLocationError(result) {
        const locationInfo = document.getElementById('location-info');
        let errorMessage = '定位失败';
        if (result?.message) errorMessage += `: ${result.message}`;
        
        let solutions = '';
        if (result?.message.includes('HTTPS')) solutions = '<div style="margin-top: 4px; font-size: 11px;">请在HTTPS环境下使用定位功能</div>';
        else if (result?.message.includes('权限')) solutions = '<div style="margin-top: 4px; font-size: 11px;">请开启位置权限后重试</div>';
        
        locationInfo.innerHTML = `<div><i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i> ${errorMessage}</div>${solutions}`;
        locationInfo.className = 'location-info error';
        
        setTimeout(() => locationInfo.style.display = 'none', 5000);
    }

    function showLocationError(message) {
        const locationInfo = document.getElementById('location-info');
        const locateBtn = document.getElementById('locate-btn');
        
        locateBtn.classList.remove('locating');
        locationInfo.innerHTML = `<div><i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i> ${message}</div>`;
        locationInfo.className = 'location-info error';
        locationInfo.style.display = 'block';
    }

    // 初始化自动完成功能
    function initAutocomplete() {
        const startInput = document.getElementById('start-station');
        const endInput = document.getElementById('end-station');
        
        initAutocompleteForInput(startInput, 'start');
        initAutocompleteForInput(endInput, 'end');
    }

    // 输入框自动完成逻辑
    function initAutocompleteForInput(inputElement, type) {
        let autocompleteItems = [];
        let selectedIndex = -1;
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        inputElement.parentNode.appendChild(dropdown);
        
        // 输入过滤POI
        inputElement.addEventListener('input', function(e) {
            const value = e.target.value.trim();
            if (value.length < 1) {
                dropdown.style.display = 'none';
                return;
            }
            
            const filteredPOIs = currentPOIData.filter(poi => 
                poi.name.includes(value) || (poi.address && poi.address.includes(value))
            ).slice(0, 8);
            
            showDropdown(filteredPOIs, value);
        });
        
        // 键盘导航
        inputElement.addEventListener('keydown', function(e) {
            if (!dropdown.style.display) return;
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, autocompleteItems.length - 1);
                    updateSelection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, -1);
                    updateSelection();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0) selectPOI(autocompleteItems[selectedIndex], type);
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
        
        // 显示下拉选项
        function showDropdown(pois, searchText) {
            autocompleteItems = pois;
            selectedIndex = -1;
            
            if (pois.length === 0) {
                dropdown.innerHTML = `<div class="autocomplete-item no-results">未找到相关地点</div>`;
                dropdown.style.display = 'block';
                return;
            }
            
            const html = pois.map((poi, index) => {
                const name = highlightText(poi.name, searchText);
                const address = poi.address ? `<div class="poi-address">${poi.address}</div>` : '';
                const type = `<div class="poi-type">${poi.type}</div>`;
                
                return `
                    <div class="autocomplete-item" data-index="${index}">
                        <div class="poi-name">${name}</div>
                        <div class="poi-info">${type}${address}</div>
                    </div>
                `;
            }).join('');
            
            dropdown.innerHTML = html;
            dropdown.style.display = 'block';
            
            // 绑定选项点击事件
            dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
                item.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    selectPOI(pois[index], type);
                });
            });
        }
        
        function updateSelection() {
            dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
                item.classList.toggle('selected', index === selectedIndex);
            });
        }
        
        // 选择POI后的操作
        function selectPOI(poi, inputType) {
            inputElement.value = poi.name;
            dropdown.style.display = 'none';           
            
            // 1. 地图跳转至POI位置
            map.flyTo({
                center: [poi.wgsLon, poi.wgsLat],
                zoom: 15,
                duration: 1000
            });

            // 2. 移除旧标记（根据起点/终点类型分别处理）
            if (inputType === 'start' && startMarker) {
                startMarker.remove(); // 移除旧起点标记
            } else if (inputType === 'end' && endMarker) {
                endMarker.remove(); // 移除旧终点标记
            }

            // 3. 创建新POI标记（使用专属样式）
            const el = document.createElement('div');
            // 根据类型添加不同样式（起点绿色/终点红色）
            el.className = `poi-marker poi-marker-${inputType}`;
            
            // 4. 创建标记并添加到地图
            const marker = new mapboxgl.Marker(el)
                .setLngLat([poi.wgsLon, poi.wgsLat])
                .addTo(map);

            // 5. 绑定弹窗（点击标记显示详情）
            const popup = new mapboxgl.Popup({
                offset: 25, // 弹窗偏移量（避免遮挡标记）
                closeButton: true
            }).setHTML(`
                <div class="poi-popup">
                    <h3>${poi.name}</h3>
                    <p><span class="type-tag">${poi.type}</span></p>
                    <p>${poi.address || '无详细地址'}</p>
                    <p style="color:#999; font-size:12px;">
                        坐标: ${poi.wgsLon.toFixed(6)}, ${poi.wgsLat.toFixed(6)}
                    </p>
                </div>
            `);

            // 点击标记显示弹窗
            el.addEventListener('click', () => {
                popup.addTo(map);
            });

            // 6. 保存新标记引用（区分起点/终点）
            if (inputType === 'start') {
                startMarker = marker;
            } else {
                endMarker = marker;
            }
        }
        
        // 关键词高亮
        function highlightText(text, search) {
            if (!search) return text;
            const regex = new RegExp(`(${search})`, 'gi');
            return text.replace(regex, '<span class="highlight">$1</span>');
        }
    }

    // 初始化路线规划功能
    function initRoutePlanning() {
        const planBtn = document.getElementById('plan-route-btn');
        const closeResultBtn = document.getElementById('close-result');
        const resultPanel = document.getElementById('result-panel');
        const switchBtn = document.getElementById('switch-start-end-btn');
        const startInput = document.getElementById('start-station');
        const endInput = document.getElementById('end-station');

        // 切换起点终点
        switchBtn.addEventListener('click', function() {
            const temp = startInput.value.trim();
            startInput.value = endInput.value.trim();
            endInput.value = temp;
            this.classList.add('active');
            setTimeout(() => this.classList.remove('active'), 300);
        });

        function getSelectedPreference() {
            const radios = document.querySelectorAll('input[name="route-preference"]');
            for (const radio of radios) {
                if (radio.checked) return radio.value;
            }
            return 'shortest'; // 默认最短路径
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
        
        // 根据偏好生成不同路线数据
        let routeData;
        if (preference === 'shortest') {
            // 最短路径：距离最短，可能换乘稍多
            routeData = {
                duration: '40分钟',
                distance: '9.8公里',
                transfers: '1次',
                steps: [
                    { type: 'walk', title: '步行至地铁站', detail: `${startStation} → 地铁1号线（约6分钟）` },
                    { type: 'subway', title: '乘坐地铁1号线', detail: '途经3站（约9分钟）' },
                    { type: 'transfer', title: '换乘', detail: '换乘2号线（约4分钟）' },
                    { type: 'subway', title: '乘坐地铁2号线', detail: '途经2站（约7分钟）' },
                    { type: 'walk', title: '步行至目的地', detail: '地铁2号线 → 终点（约5分钟）' }
                ]
            };
        } else {
            // 最少换乘：换乘少，可能距离稍长
            routeData = {
                duration: '45分钟',
                distance: '12公里',
                transfers: '0次',
                steps: [
                    { type: 'walk', title: '步行至地铁站', detail: `${startStation} → 地铁3号线（约8分钟）` },
                    { type: 'subway', title: '乘坐地铁3号线', detail: '直达，途经8站（约30分钟）' },
                    { type: 'walk', title: '步行至目的地', detail: '地铁3号线 → 终点（约7分钟）' }
                ]
            };
        }

        // 显示路线结果
        setTimeout(() => {
            resultPanel.style.display = 'block';
            document.getElementById('duration').textContent = routeData.duration;
            document.getElementById('distance').textContent = routeData.distance;
            document.getElementById('transfers').textContent = routeData.transfers;
            
            const routeResult = document.getElementById('route-result');
            const stepsHtml = routeData.steps.map(step => `
                <div class="route-step">
                    <div class="step-icon ${step.type}">
                        <i class="fas ${step.type === 'walk' ? 'fa-walking' : step.type === 'subway' ? 'fa-subway' : 'fa-exchange-alt'}"></i>
                    </div>
                    <div class="step-content">
                        <div class="step-title">${step.title}</div>
                        <div class="step-detail">${step.detail}</div>
                    </div>
                </div>
            `).join('');
            
            routeResult.innerHTML = stepsHtml;
            document.getElementById('loading').style.display = 'none';
        }, 800);
    });

        closeResultBtn.addEventListener('click', () => resultPanel.style.display = 'none');
    }

    // 初始化所有功能
    function init() {
        initCitySwitchEvents();
        initRoutePlanning();
        initLocationService();
        loadPOIData();
        initAutocomplete();
    }

    // 启动初始化
    init();
});