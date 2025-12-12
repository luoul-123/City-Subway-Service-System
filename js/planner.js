document.addEventListener('DOMContentLoaded', function () {
    // ========== 核心配置 ==========
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2JubWZ5aiIsImEiOiJjbTdhYTU4cjEwMXVlMnFwdzlvNHA2MWZyIn0.xM1rgUx9ZeG7h2boM1t_oQ';
    
    const cityConfig = {
        'nj': { name: '南京', center: [118.796877, 32.060255], zoom: 10 },
        'bj': { name: '北京', center: [116.4074, 39.9042], zoom: 10 },
        'sh': { name: '上海', center: [121.4737, 31.2304], zoom: 10 },
        'wh': { name: '武汉', center: [114.3055, 30.5928], zoom: 10 }
    };
    
    // 全局变量
    let currentCity = 'nj';
    let currentPOIData = [];
    let stopData = [];
    let uniqueStopData = [];
    let map;
    let markerManager;
    let autocompleteManager;
    let isInitializing = false;

    // ========== 地图初始化 ==========
    function initMap() {
        try {
            map = new mapboxgl.Map({
                container: 'planner-map',
                style: 'mapbox://styles/mapbox/light-v11',
                center: cityConfig[currentCity].center,
                zoom: cityConfig[currentCity].zoom,
                attributionControl: false
            });

            // 添加控件
            map.addControl(new MapboxLanguage({ defaultLanguage: 'zh-Hans' }));
            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

            // 地图加载完成后配置
            map.on('load', function() {
                console.log('地图加载完成');
                
                // 配置中文字体
                const layers = map.getStyle().layers;
                layers.forEach(layer => {
                    if (layer.type === 'symbol') {
                        map.setLayoutProperty(layer.id, 'text-font', ['Noto Sans CJK SC Regular']);
                    }
                });
                
                // 初始化精度圈图层
                if (typeof initAccuracyLayer === 'function') {
                    initAccuracyLayer(map);
                } else {
                    console.warn('initAccuracyLayer函数未定义');
                }
                
                // 初始化标记管理器
                if (typeof MarkerManager === 'function') {
                    markerManager = new MarkerManager(map);
                    console.log('标记管理器初始化成功');
                } else {
                    console.error('MarkerManager类未定义，请检查marker-utils.js是否正确加载');
                }
            });

            // 地图加载错误处理
            map.on('error', function(e) {
                console.error('地图加载错误:', e.error);
            });

            return true;
        } catch (error) {
            console.error('地图初始化失败:', error);
            return false;
        }
    }

    // ========== 城市切换功能 ==========
    function initCitySwitch() {
        const cityBtns = document.querySelectorAll('.city-btn');
        const currentCityEl = document.querySelector('.current-city');

        // 初始化激活状态
        cityBtns.forEach(btn => {
            if (btn.getAttribute('data-city') === currentCity) {
                btn.classList.add('active');
            }
        });

        // 绑定切换事件
        cityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const cityCode = btn.getAttribute('data-city');
                if (cityCode !== currentCity && !isInitializing) {
                    switchCity(cityCode, cityBtns, currentCityEl);
                }
            });
        });
    }

    async function switchCity(cityCode, cityBtns, currentCityEl) {
        isInitializing = true;
        
        try {
            // 更新按钮状态
            cityBtns.forEach(b => b.classList.remove('active'));
            cityBtns.forEach(b => {
                if (b.getAttribute('data-city') === cityCode) {
                    b.classList.add('active');
                }
            });
            
            // 更新显示
            currentCityEl.textContent = `当前城市：${cityConfig[cityCode].name}`;
            currentCity = cityCode;
            
            // 地图跳转
            map.flyTo({
                center: cityConfig[cityCode].center,
                zoom: cityConfig[cityCode].zoom,
                duration: 1000
            });
            
            // 清除所有标记和路线
            if (markerManager) {
                markerManager.clearAllMarkers();
            }
            
            if (typeof clearRoute === 'function') {
                clearRoute(map);
            }
            
            // 清空输入框
            document.getElementById('start-station').value = '';
            document.getElementById('end-station').value = '';
            document.getElementById('result-panel').style.display = 'none';
            
            // 加载新数据
            await loadCityData(cityCode);
            
            // 清理自动完成管理器
            if (autocompleteManager && typeof autocompleteManager.cleanup === 'function') {
                autocompleteManager.cleanup();
            }
            
            // 重新初始化自动完成
            initAutocomplete();
            
        } catch (error) {
            console.error('切换城市失败:', error);
            alert('城市切换失败，请刷新页面重试');
        } finally {
            isInitializing = false;
        }
    }

    // ========== 数据加载 ==========
    async function loadCityData(cityCode) {
        try {
            console.log(`开始加载${cityConfig[cityCode].name}数据...`);
            
            // 检查必要的函数是否可用
            if (typeof loadPOIData !== 'function') {
                throw new Error('loadPOIData函数未定义');
            }
            if (typeof loadStopData !== 'function') {
                throw new Error('loadStopData函数未定义');
            }
            
            const [poiData, stopDataResult] = await Promise.all([
                loadPOIData(cityCode),
                loadStopData(cityCode)
            ]);
            
            currentPOIData = poiData;
            stopData = stopDataResult;
            
            // 去重处理
            if (typeof uniqueStations === 'function') {
                uniqueStopData = uniqueStations(stopDataResult);
            } else {
                uniqueStopData = stopDataResult;
            }
            
            console.log(`数据加载完成: ${poiData.length}个POI, ${uniqueStopData.length}个去重站点`);
            
            // 更新自动完成管理器数据
            if (autocompleteManager && typeof autocompleteManager.updateData === 'function') {
                autocompleteManager.updateData(currentPOIData, stopData);
            }
            
            return true;
        } catch (error) {
            console.error('数据加载失败:', error);
            throw error;
        }
    }

    // ========== 定位功能 ==========
    function initLocationService() {
        const locateBtn = document.getElementById('locate-btn');
        if (locateBtn) {
            locateBtn.addEventListener('click', getUserLocation);
        } else {
            console.warn('定位按钮未找到');
        }
    }

    function getUserLocation() {
        const locateBtn = document.getElementById('locate-btn');
        const locationInfo = document.getElementById('location-info');
        
        if (!locateBtn || !locationInfo) {
            console.error('定位相关元素未找到');
            return;
        }
        
        locateBtn.classList.add('locating');
        locationInfo.style.display = 'block';
        locationInfo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 获取位置中...';
        locationInfo.className = 'location-info';
        
        if (!window.AMap) {
            showLocationError('地图服务加载失败，请刷新页面重试');
            return;
        }
        
        try {
            AMap.plugin('AMap.Geolocation', function() {
                const geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    zoomToAccuracy: true              
                });

                geolocation.getCurrentPosition(function(status, result) {
                    handleLocationResult(status, result, locateBtn, locationInfo);
                });
            });
        } catch (error) {
            console.error('定位功能调用失败:', error);
            showLocationError('定位功能异常，请检查浏览器权限');
        }
    }

    function handleLocationResult(status, result, locateBtn, locationInfo) {
        locateBtn.classList.remove('locating');
        
        if (status === 'complete') {
            const lng = result.position.lng;
            const lat = result.position.lat;
            const accuracy = result.accuracy || 0;
            
            // 坐标系转换
            let wgsLng = lng, wgsLat = lat;
            if (typeof gcj02ToWgs84 === 'function') {
                [wgsLng, wgsLat] = gcj02ToWgs84(lng, lat);
            }
            
            // 更新地图
            map.flyTo({ center: [lng, lat], zoom: 16, duration: 1000 });
            
            // 更新精度圈
            if (typeof updateAccuracyCircle === 'function') {
                updateAccuracyCircle(map, wgsLng, wgsLat, accuracy);
            }
            
            // 创建/更新用户位置标记
            if (markerManager && typeof markerManager.createUserLocationMarker === 'function') {
                markerManager.createUserLocationMarker([lng, lat]);
            }
            
            // 更新输入框
            document.getElementById('start-station').value = '当前位置';
            locationInfo.innerHTML = `<i class="fas fa-check-circle"></i> 定位成功 (精度: ${Math.round(accuracy)}m)`;
            locationInfo.className = 'location-info success';

            // 查找并标记最近的地铁站
            findAndMarkNearestSubway(wgsLat, wgsLng, 'start', locationInfo);
        } else {
            showLocationError(`定位失败: ${result.message}`);
        }
    }

    async function findAndMarkNearestSubway(lat, lng, type, locationInfo) {
        if (uniqueStopData.length && typeof findNearestStation === 'function') {
            const nearestSubway = findNearestStation(uniqueStopData, lat, lng);
            if (nearestSubway && markerManager && typeof markerManager.createSubwayMarker === 'function') {
                try {
                    await markerManager.createSubwayMarker(nearestSubway, type);
                    locationInfo.innerHTML += `<div style="margin-top: 4px;">最近地铁站: ${nearestSubway.name} (${(nearestSubway.distance / 1000).toFixed(2)}公里)</div>`;
                } catch (error) {
                    console.error('创建最近地铁站标记失败:', error);
                }
            }
        }
    }

    // ========== 自动完成功能 ==========
    function initAutocomplete() {
        const startInput = document.getElementById('start-station');
        const endInput = document.getElementById('end-station');
        
        if (!startInput || !endInput) {
            console.error('自动完成输入框未找到');
            return;
        }
        
        // 创建自动完成管理器
        if (typeof AutocompleteManager === 'function') {
            autocompleteManager = new AutocompleteManager(
                map, 
                currentPOIData, 
                stopData,
                handleLocationSelect
            );
            
            autocompleteManager.initForInput(startInput, 'start');
            autocompleteManager.initForInput(endInput, 'end');
            console.log('自动完成管理器初始化成功');
        } else {
            console.error('AutocompleteManager类未定义，请检查autocomplete-utils.js是否正确加载');
        }
    }

    async function handleLocationSelect(item, type) {
        console.log(`选择${type}:`, item.name);
        
        // 检查标记管理器是否已初始化
        if (!markerManager) {
            console.warn('标记管理器未初始化，正在尝试重新初始化');
            if (typeof MarkerManager === 'function') {
                markerManager = new MarkerManager(map);
            } else {
                console.error('无法初始化标记管理器');
                return;
            }
        }
        
        // 创建POI标记
        if (markerManager && typeof markerManager.createPOIMarker === 'function') {
            try {
                await markerManager.createPOIMarker(item, type);
                console.log(`${type} POI标记创建成功`);
            } catch (error) {
                console.error(`创建${type} POI标记失败:`, error);
            }
        }
        
        // 查找并标记最近地铁站
        if (uniqueStopData.length && typeof findNearestStation === 'function') {
            const nearestSubway = findNearestStation(uniqueStopData, item.wgsLat, item.wgsLon);
            if (nearestSubway && markerManager && typeof markerManager.createSubwayMarker === 'function') {
                try {
                    await markerManager.createSubwayMarker(nearestSubway, type);
                    console.log(`${type} 地铁站标记创建成功`);
                } catch (error) {
                    console.error(`创建${type} 地铁站标记失败:`, error);
                }
            }
        }
    }

    // ========== 路线规划功能 ==========
    function initRoutePlanning() {
        const planBtn = document.getElementById('plan-route-btn');
        const closeResultBtn = document.getElementById('close-result');
        const switchBtn = document.getElementById('switch-start-end-btn');
        const startInput = document.getElementById('start-station');
        const endInput = document.getElementById('end-station');

        if (!planBtn || !closeResultBtn || !switchBtn || !startInput || !endInput) {
            console.error('路线规划相关元素未找到');
            return;
        }

        switchBtn.addEventListener('click', async function() {
            // 交换输入框的值
            const startInput = document.getElementById('start-station');
            const endInput = document.getElementById('end-station');
            const temp = startInput.value.trim();
            startInput.value = endInput.value.trim();
            endInput.value = temp;
            
            // 获取当前的标记数据
            const markers = markerManager.getAllMarkers();
            
            // 如果有起点和终点标记，交换它们
            if (markers.startPOI && markers.endPOI) {
                // 获取标记的数据
                const startData = markers.startPOI.data;
                const endData = markers.endPOI.data;
                
                // 清除所有标记
                markerManager.clearAllMarkers();
                
                // 重新创建标记（交换类型）
                if (startData) {
                    await markerManager.createPOIMarker(startData, 'end'); // 原来的起点变成终点
                }
                
                if (endData) {
                    await markerManager.createPOIMarker(endData, 'start'); // 原来的终点变成起点
                }
            }
            
            // 同样处理地铁站标记
            if (markers.startSubway && markers.endSubway) {
                const startSubwayData = markers.startSubway.data;
                const endSubwayData = markers.endSubway.data;
                
                if (startSubwayData) {
                    await markerManager.createSubwayMarker(startSubwayData, 'end');
                }
                
                if (endSubwayData) {
                    await markerManager.createSubwayMarker(endSubwayData, 'start');
                }
            }
            
            this.classList.add('active');
            setTimeout(() => this.classList.remove('active'), 300);
        });

        // 关闭结果面板
        closeResultBtn.addEventListener('click', function() {
            document.getElementById('result-panel').style.display = 'none';
            if (typeof clearRoute === 'function') {
                clearRoute(map);
            }
        });

        // 规划路线
        planBtn.addEventListener('click', function() {
            const startStation = startInput.value.trim();
            const endStation = endInput.value.trim();
            const preference = getSelectedPreference();
            
            if (!startStation || !endStation) {
                alert('请输入起点和终点！');
                return;
            }
            
            if (!markerManager) {
                alert('地图功能未初始化，请刷新页面重试');
                return;
            }
            
            const markers = markerManager.getAllMarkers();
            if (!markers.startPOI || !markers.endPOI) {
                alert('请选择有效的起点和终点！');
                return;
            }
            
            planRoute(markers.startPOI, markers.endPOI, preference);
        });
    }

    function getSelectedPreference() {
        const radios = document.querySelectorAll('input[name="route-preference"]');
        for (const radio of radios) {
            if (radio.checked) return radio.value;
        }
        return 'shortest';
    }

    function planRoute(startMarker, endMarker, preference) {
        const loadingOverlay = document.getElementById('loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // 获取标记的实际数据
        let startData, endData;
        
        if (startMarker && startMarker.data) {
            startData = startMarker.data;
        } else if (startMarker && startMarker._data) {
            startData = startMarker._data.poi || startMarker._data.station;
        }
        
        if (endMarker && endMarker.data) {
            endData = endMarker.data;
        } else if (endMarker && endMarker._data) {
            endData = endMarker._data.poi || endMarker._data.station;
        }
        
        if (!startData || !endData) {
            alert('无法获取起点或终点数据，请重新选择位置');
            if (loadingOverlay) loadingOverlay.style.display = 'none';
            return;
        }
        
        // 生成模拟路线
        let routeCoordinates = [];
        if (typeof generateMockRouteCoordinates === 'function') {
            routeCoordinates = generateMockRouteCoordinates(startMarker, endMarker);
        }
        
        const routeData = generateRouteData(preference, startData, endData);
        
        // 模拟请求延迟
        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            if (typeof renderRouteResult === 'function') {
                renderRouteResult(routeData);
            }
            
            if (typeof drawRouteLine === 'function') {
                drawRouteLine(map, routeCoordinates);
            }
            
            // 显示结果面板
            document.getElementById('result-panel').style.display = 'block';
        }, 800);
    }

    function generateRouteData(preference, startData, endData) {
        const startName = startData.name || '起点';
        const endName = endData.name || '终点';
        
        if (preference === 'shortest') {
            return {
                duration: '40分钟',
                distance: '9.8公里',
                transfers: '1次',
                steps: [
                    { type: 'walk', title: '步行至地铁站', detail: `${startName} → 地铁1号线（约6分钟）` },
                    { type: 'subway', title: '乘坐地铁1号线', detail: '途经3站（约9分钟）' },
                    { type: 'transfer', title: '换乘', detail: '换乘2号线（约4分钟）' },
                    { type: 'subway', title: '乘坐地铁2号线', detail: '途经2站（约7分钟）' },
                    { type: 'walk', title: '步行至目的地', detail: `地铁2号线 → ${endName}（约5分钟）` }
                ]
            };
        } else {
            return {
                duration: '45分钟',
                distance: '12公里',
                transfers: '0次',
                steps: [
                    { type: 'walk', title: '步行至地铁站', detail: `${startName} → 地铁3号线（约8分钟）` },
                    { type: 'subway', title: '乘坐地铁3号线', detail: '途经7站（约20分钟）' },
                    { type: 'walk', title: '步行至目的地', detail: `地铁3号线 → ${endName}（约6分钟）` }
                ]
            };
        }
    }

    // ========== 错误处理 ==========
    function showLocationError(message) {
        const locateBtn = document.getElementById('locate-btn');
        const locationInfo = document.getElementById('location-info');
        
        if (locateBtn) {
            locateBtn.classList.remove('locating');
        }
        
        if (locationInfo) {
            locationInfo.innerHTML = `<div><i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i> ${message}</div>`;
            locationInfo.className = 'location-info error';
            locationInfo.style.display = 'block';
        }
    }

    // ========== 初始化所有功能 ==========
    async function init() {
        console.log('开始初始化路线规划页面...');
        
        try {
            // 1. 初始化地图
            console.log('步骤1: 初始化地图...');
            const mapInitialized = initMap();
            if (!mapInitialized) {
                throw new Error('地图初始化失败');
            }
            
            // 2. 初始化城市切换
            console.log('步骤2: 初始化城市切换...');
            initCitySwitch();
            
            // 3. 初始化定位服务
            console.log('步骤3: 初始化定位服务...');
            initLocationService();
            
            // 4. 加载初始数据
            console.log('步骤4: 加载初始城市数据...');
            await loadCityData(currentCity);
            
            // 5. 初始化自动完成
            console.log('步骤5: 初始化自动完成...');
            initAutocomplete();
            
            // 6. 初始化路线规划
            console.log('步骤6: 初始化路线规划...');
            initRoutePlanning();
            
            console.log('路线规划页面初始化完成');
            
        } catch (error) {
            console.error('页面初始化失败:', error);
            // 显示友好的错误提示
            const errorMessage = `页面初始化失败: ${error.message}。部分功能可能受限，请刷新页面重试。`;
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 10px; margin: 10px; border-radius: 4px; border: 1px solid #f5c6cb;">
                    <i class="fas fa-exclamation-triangle"></i> ${errorMessage}
                </div>
            `;
            
            const infoPanel = document.querySelector('.info-panel');
            if (infoPanel) {
                infoPanel.insertBefore(errorDiv, infoPanel.firstChild);
            }
        }
    }

    // ========== 检查依赖是否加载完成 ==========
    function checkDependencies() {
        const requiredFunctions = [
            'gcj02ToWgs84',
            'uniqueStations',
            'findNearestStation',
            'loadPOIData',
            'loadStopData'
        ];
        
        // 打印检查状态
        requiredFunctions.forEach(func => {
            if (typeof window[func] !== 'function') {
                console.warn(`依赖函数 "${func}" 未找到`);
            } else {
                console.log(`依赖函数 "${func}" 已加载`);
            }
        });
        
        const missingDeps = requiredFunctions.filter(func => typeof window[func] !== 'function');
        
        if (missingDeps.length > 0) {
            console.error('缺少必要的工具函数:', missingDeps);
            return false;
        }
        
        return true;
    }

    // ========== 等待所有依赖加载完成 ==========
    function waitForDependencies() {
        return new Promise((resolve) => {
            // 先检查一次，如果全部加载了就立即resolve
            if (checkDependencies()) {
                console.log('所有依赖已就绪');
                resolve(true);
                return;
            }
            
            // 如果还有未加载的，等200ms再检查
            let attempts = 0;
            const maxAttempts = 50; // 最多尝试50次（10秒）
            
            const intervalId = setInterval(() => {
                attempts++;
                
                if (checkDependencies()) {
                    clearInterval(intervalId);
                    console.log(`所有依赖在 ${attempts * 200}ms 后准备就绪`);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(intervalId);
                    console.error('依赖加载超时，但有部分功能可能仍可用');
                    resolve(true);
                }
            }, 200);
        });
    }

    // ========== 启动应用 ==========
    async function startApp() {
        console.log('开始启动应用...');
        
        // 显示加载提示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        
        // 等待依赖（使用宽松策略）
        console.log('等待依赖加载...');
        const depsReady = await waitForDependencies();
        
        if (depsReady) {
            console.log('依赖已就绪，开始初始化主功能');
            await init();
        } else {
            console.warn('部分依赖未加载，尝试继续运行');
            await init();
        }
        
        // 隐藏加载提示
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // 启动应用
    startApp();
});