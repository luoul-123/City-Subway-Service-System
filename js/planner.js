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
    let allRouteOptions = []; // 存储所有路线方案
    let currentSelectedRoute = null; // 当前选中的路线

    
    // 地铁网络数据
    let subwayNetwork = null;
    
    // 起点终点地铁站
    let startSubwayStation = null;
    let endSubwayStation = null;

    /**
     * 根据坐标查找最近的地铁站
     */
    function findNearestSubwayStation(lat, lng) {
        if (!uniqueStopData.length) return null;
        
        let nearest = uniqueStopData[0];
        let minDistance = calculateDistance(lat, lng, nearest.wgsLat, nearest.wgsLon);
        
        uniqueStopData.forEach(station => {
            const distance = calculateDistance(lat, lng, station.wgsLat, station.wgsLon);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = station;
            }
        });
        
        return {
            ...nearest,
            distance: minDistance
        };
    }

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
                                
                // 初始化标记管理器
                if (typeof MarkerManager === 'function') {
                    markerManager = new MarkerManager(map);
                    window.markerManager = markerManager;
                    console.log('标记管理器初始化成功，已挂载到 window');
                } else {
                    console.error('MarkerManager类未定义，请检查marker-utils.js是否正确加载');
                }
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
            
            // 清空起点终点
            startSubwayStation = null;
            endSubwayStation = null;
            
            // 清空输入框
            document.getElementById('start-station').value = '';
            document.getElementById('end-station').value = '';
            document.getElementById('result-panel').style.display = 'none';
            
            // 加载新数据
            await loadCityData(cityCode);
            
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
            
            // 加载POI数据
            let poiData = [];
            if (typeof loadPOIData === 'function') {
                poiData = await loadPOIData(cityCode);
                currentPOIData = poiData;
            }
            
            // 加载站点数据
            let stopDataResult = [];
            if (typeof loadStopData === 'function') {
                stopDataResult = await loadStopData(cityCode);
                stopData = stopDataResult;
            }
            
            // 去重处理（用于最近站点查找）
            if (typeof uniqueStations === 'function') {
                uniqueStopData = uniqueStations(stopDataResult);
            } else {
                uniqueStopData = stopDataResult;
            }
            
            console.log(`数据加载完成: ${poiData.length}个POI, 原始站点${stopData.length}条, 去重后${uniqueStopData.length}条`);
            
            // 关键修改：使用原始站点数据初始化地铁网络（不要用去重后的）
            // 确保地铁网络包含所有线路信息
            if (typeof window.initSubwayNetwork === 'function') {
                window.initSubwayNetwork(stopData);
                console.log('地铁网络初始化成功');
            } else {
                console.error('initSubwayNetwork函数未找到');
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
        }
    }

    function getUserLocation() {
        const locateBtn = document.getElementById('locate-btn');
        const locationInfo = document.getElementById('location-info');
        
        if (!locateBtn || !locationInfo) return;
        
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
            
            // 坐标系转换
            let wgsLng = lng, wgsLat = lat;
            if (typeof gcj02ToWgs84 === 'function') {
                [wgsLng, wgsLat] = gcj02ToWgs84(lng, lat);
            }
            
            // 更新地图
            map.flyTo({ center: [lng, lat], zoom: 16, duration: 1000 });
            
            // 创建用户位置标记
            if (markerManager && typeof markerManager.createUserLocationMarker === 'function') {
                markerManager.createUserLocationMarker([lng, lat]);
            }
            
            // 查找最近的地铁站并设置为起点
            const nearestSubway = findNearestSubwayStation(wgsLat, wgsLng);
            if (nearestSubway) {
                setStartSubwayStation(nearestSubway);
                locationInfo.innerHTML = `<i class="fas fa-check-circle"></i> 定位成功，已找到最近地铁站: ${nearestSubway.name}`;
                locationInfo.className = 'location-info success';
            } else {
                showLocationError('定位成功，但未找到附近地铁站');
            }
        } else {
            showLocationError(`定位失败: ${result.message}`);
        }
    }

    // ========== 设置起点终点地铁站 ==========
    /**
     * 设置起点地铁站
     */
    async function setStartSubwayStation(station) {
        startSubwayStation = station;
        
        // 更新输入框
        document.getElementById('start-station').value = station.name;
        
        // 清除之前的起点地铁站标记
        if (markerManager && typeof markerManager.removeMarker === 'function') {
            markerManager.removeMarker('startSubway');
        }
        
        // 创建新的地铁站标记
        if (markerManager && typeof markerManager.createSubwayMarker === 'function') {
            try {
                await markerManager.createSubwayMarker(station, 'start');
                console.log('起点地铁站标记创建成功:', station.name);
            } catch (error) {
                console.error('创建起点地铁站标记失败:', error);
            }
        }
    }

    /**
     * 设置终点地铁站
     */
    async function setEndSubwayStation(station) {
        endSubwayStation = station;
        
        // 更新输入框
        document.getElementById('end-station').value = station.name;
        
        // 清除之前的终点地铁站标记
        if (markerManager && typeof markerManager.removeMarker === 'function') {
            markerManager.removeMarker('endSubway');
        }
        
        // 创建新的地铁站标记
        if (markerManager && typeof markerManager.createSubwayMarker === 'function') {
            try {
                await markerManager.createSubwayMarker(station, 'end');
                console.log('终点地铁站标记创建成功:', station.name);
            } catch (error) {
                console.error('创建终点地铁站标记失败:', error);
            }
        }
    }

    // ========== 自动完成功能 ==========
    function initAutocomplete() {
        const startInput = document.getElementById('start-station');
        const endInput = document.getElementById('end-station');
        
        if (!startInput || !endInput) return;
        
        // 创建自动完成管理器
        if (typeof AutocompleteManager === 'function') {
            autocompleteManager = new AutocompleteManager(
                map, 
                currentPOIData, 
                uniqueStopData, // 使用去重后的站点数据
                handleLocationSelect
            );
            
            autocompleteManager.initForInput(startInput, 'start');
            autocompleteManager.initForInput(endInput, 'end');
            console.log('自动完成管理器初始化成功');
        }
    }

    async function handleLocationSelect(item, type) {
        console.log(`选择${type}:`, item.name);
        
        if (item.type === '地铁站') {
            // 直接选择地铁站
            if (type === 'start') {
                await setStartSubwayStation(item);
            } else {
                await setEndSubwayStation(item);
            }
        } else {
            // 选择的是POI，查找最近地铁站
            const nearestSubway = findNearestSubwayStation(item.wgsLat, item.wgsLon);
            if (nearestSubway) {
                if (type === 'start') {
                    await setStartSubwayStation(nearestSubway);
                } else {
                    await setEndSubwayStation(nearestSubway);
                }
                
                // 可选：在地图上显示POI标记
                if (markerManager && typeof markerManager.createPOIMarker === 'function') {
                    await markerManager.createPOIMarker(item, type);
                }
            } else {
                alert('未找到附近地铁站，请重新选择位置');
            }
        }
    }

    // ========== 路线规划功能 ==========
    /**
     * 清除路线相关标记，但保留起点终点选择
     */
    function clearRouteMarkers() {
        if (!markerManager) return;
        
        console.log('清除路线相关标记');
        
        // 只清除路线标记，不清除起点终点标记
        if (typeof markerManager.clearRouteMarkers === 'function') {
            markerManager.clearRouteMarkers();
        }
        
        // 清除当前选中的路线
        currentSelectedRoute = null;
    }

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

        // 交换起点终点
        switchBtn.addEventListener('click', async function() {
            console.log('切换起点终点');
            
            // 交换地铁站数据
            const tempStation = startSubwayStation;
            startSubwayStation = endSubwayStation;
            endSubwayStation = tempStation;
            
            // 清除路线标记
            clearRouteMarkers();
            
            // 隐藏结果面板
            document.getElementById('result-panel').style.display = 'none';
            
            // 交换输入框的值
            const temp = startInput.value;
            startInput.value = endInput.value;
            endInput.value = temp;
            
            // 重新创建起点终点标记（如果有数据）
            if (startSubwayStation) {
                await setStartSubwayStation(startSubwayStation);
            }
            if (endSubwayStation) {
                await setEndSubwayStation(endSubwayStation);
            }
            
            // 如果有两个站点，重新规划路线
            if (startSubwayStation && endSubwayStation) {
                // 延迟一点时间，确保标记创建完成
                setTimeout(() => {
                    planSubwayRoute();
                }, 300);
            }
            
            this.classList.add('active');
            setTimeout(() => this.classList.remove('active'), 300);
        });

        // 关闭结果面板
        closeResultBtn.addEventListener('click', function() {
            document.getElementById('result-panel').style.display = 'none';
            if (markerManager && typeof markerManager.clearRouteMarkers === 'function') {
                markerManager.clearRouteMarkers();
            }
        });

        // 手动规划按钮
        planBtn.addEventListener('click', function() {
            if (!startSubwayStation || !endSubwayStation) {
                alert('请先选择起点和终点');
                return;
            }
            
            // 清除路线标记
            clearRouteMarkers();
            
            // 延迟确保清除完成
            setTimeout(() => {
                planSubwayRoute();
            }, 100);
        });
    }

    /**
     * 规划地铁路线
     */
    function planSubwayRoute() {
        const loadingOverlay = document.getElementById('loading');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // 验证起点终点是否已选择
        if (!startSubwayStation || !endSubwayStation) {
            alert('请先选择起点和终点地铁站');
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            return;
        }
        
        console.log('开始规划地铁路线:', startSubwayStation.name, '->', endSubwayStation.name);
        
        // 清除之前的路线标记（但保留起点终点标记）
        clearRouteMarkers();
        
        // 使用 route-planner-utils.js 中的算法生成路线
        if (typeof window.generateAllRouteOptions === 'function') {
            allRouteOptions = window.generateAllRouteOptions(startSubwayStation.name, endSubwayStation.name);
            console.log('生成的路线方案:', allRouteOptions);
        } else {
            console.error('generateAllRouteOptions函数未找到');
            allRouteOptions = [];
        }
        
        // 模拟请求延迟
        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            if (!allRouteOptions || allRouteOptions.length === 0) {
                alert('未找到可行的地铁路线，请尝试其他起点或终点');
                return;
            }
            
            console.log(`生成了 ${allRouteOptions.length} 个路线方案`);
            
            // 渲染路线方案选择器
            renderRouteOptionsSelector(allRouteOptions);
            
            // 默认选中第一个方案
            if (allRouteOptions.length > 0) {
                selectRouteOption(allRouteOptions[0]);
            }
            
            // 显示结果面板
            document.getElementById('result-panel').style.display = 'block';
        }, 800);
    }

    // ========== 结果渲染 ==========
    /**
     * 渲染路线方案选择器
     */
    function renderRouteOptionsSelector(routes) {
        const resultContainer = document.getElementById('route-result');
        
        if (!resultContainer) return;
        
        // 清空现有内容
        resultContainer.innerHTML = '';
        
        if (!routes || routes.length === 0) {
            resultContainer.innerHTML = `
                <div class="no-result">
                    <i class="fas fa-route"></i>
                    <p>未找到可用路线，请尝试其他起点或终点</p>
                </div>
            `;
            return;
        }
        
        // 创建路线选项选择器
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'route-options-selector';
        
        // 添加标题
        const selectorTitle = document.createElement('div');
        selectorTitle.className = 'route-selector-title';
        selectorTitle.innerHTML = `<i class="fas fa-list"></i> 选择路线方案 (${routes.length}个)`;
        selectorContainer.appendChild(selectorTitle);
        
        // 添加路线选项列表
        const optionsList = document.createElement('div');
        optionsList.className = 'route-options-list';
        
        // 添加每个路线方案
        routes.forEach((route, index) => {
            const optionItem = document.createElement('div');
            optionItem.className = 'route-option-item';
            optionItem.dataset.routeId = route.id;
            
            // 提取方案编号：从 "方案1: 一次换乘" 中提取 "方案1"
            let schemeName = route.name;
            // 如果有冒号，取冒号前的部分
            if (route.name.includes(':')) {
                schemeName = route.name.split(':')[0].trim();
            }
            
            // 方案内容 - 只显示方案编号和类型标签
            optionItem.innerHTML = `
                <div class="option-header">
                    <div class="option-title">
                        <span class="option-name">${schemeName}</span>
                        <span class="option-type">${route.type}</span>
                    </div>
                    <div class="option-stats">
                        <span><i class="fas fa-clock"></i> ${route.duration}</span>
                        <span><i class="fas fa-subway"></i> ${route.transfers}</span>
                    </div>
                </div>
                <div class="option-desc">${route.description}</div>
            `;
            
            // 添加点击事件
            optionItem.addEventListener('click', function() {
                const selectedRoute = allRouteOptions.find(r => r.id === parseInt(this.dataset.routeId));
                if (selectedRoute) {
                    selectRouteOption(selectedRoute);
                }
            });
            
            optionsList.appendChild(optionItem);
        });
        
        selectorContainer.appendChild(optionsList);
        resultContainer.appendChild(selectorContainer);
    }

    /**
     * 选择并显示指定的路线方案
     */
    function selectRouteOption(route) {
        console.log('选择路线方案:', route.name);
        
        // 如果已经有当前选中的路线，先清除
        if (currentSelectedRoute && currentSelectedRoute.id !== route.id) {
            console.log('清除之前选中的路线:', currentSelectedRoute.name);
            
            // 清除之前的路线标记
            try {
                clearRouteMarkers();
            } catch (error) {
                console.error('清除路线标记时出错:', error);
                // 如果清除失败，尝试直接清除所有标记
                if (markerManager && typeof markerManager.clearAllMarkers === 'function') {
                    markerManager.clearAllMarkers();
                }
            }
        } else if (currentSelectedRoute && currentSelectedRoute.id === route.id) {
            // 如果点击的是当前已选中的路线，不需要重新绘制
            console.log('当前路线已选中，跳过重新绘制');
            return;
        }
        
        // 更新当前选中的路线
        currentSelectedRoute = route;
        
        // 更新界面上的选中状态
        document.querySelectorAll('.route-option-item').forEach(item => {
            item.classList.remove('selected');
            if (parseInt(item.dataset.routeId) === route.id) {
                item.classList.add('selected');
            }
        });
        
        // 更新统计信息
        updateRouteStats(route);
        
        // 显示路线详情
        showRouteDetails(route);
        
        // 在地图上显示路线
        if (typeof window.displayRouteOnMap === 'function') {
            // 优先使用路线方案中的站点，如果没有则使用用户选择的站点
            const actualStartStation = route.startStation || startSubwayStation;
            const actualEndStation = route.endStation || endSubwayStation;
            
            console.log('传递给displayRouteOnMap的站点:', {
                起点: actualStartStation ? actualStartStation.name : '无',
                终点: actualEndStation ? actualEndStation.name : '无'
            });
            
            // 确保清除完成后再显示新路线
            setTimeout(() => {
                try {
                    window.displayRouteOnMap(map, route, actualStartStation, actualEndStation);
                } catch (error) {
                    console.error('显示路线时出错:', error);
                    alert('无法显示路线，请稍后重试');
                }
            }, 100); // 缩短延迟时间
        }
    }

    /**
     * 显示路线详情
     */
    function showRouteDetails(route) {
        const resultContainer = document.getElementById('route-result');
        if (!resultContainer) return;
        
        // 查找或创建详情容器
        let detailsContainer = document.getElementById('route-details');
        if (!detailsContainer) {
            detailsContainer = document.createElement('div');
            detailsContainer.id = 'route-details';
            detailsContainer.className = 'route-details';
            resultContainer.appendChild(detailsContainer);
        }
        
        // 清空现有内容
        detailsContainer.innerHTML = '';
        
        // 创建详情标题
        const detailsTitle = document.createElement('div');
        detailsTitle.className = 'route-details-title';
        detailsTitle.innerHTML = `<i class="fas fa-info-circle"></i> 路线详情`;
        detailsContainer.appendChild(detailsTitle);
        
        // 创建步骤列表
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'route-steps';
        
        // 添加每个步骤
        if (route.steps && route.steps.length > 0) {
            route.steps.forEach((step, index) => {
                const stepEl = document.createElement('div');
                stepEl.className = 'route-step';
                stepEl.innerHTML = `
                    <div class="step-icon ${step.type}">
                        <i class="fas ${step.type === 'subway' ? 'fa-subway' : 
                                    step.type === 'walk' ? 'fa-walking' : 'fa-exchange-alt'}"></i>
                    </div>
                    <div class="step-content">
                        <div class="step-title">${step.title}</div>
                        <div class="step-detail">${step.detail}</div>
                    </div>
                `;
                stepsContainer.appendChild(stepEl);
            });
        } else {
            // 如果没有详细步骤，显示基本信息
            const infoEl = document.createElement('div');
            infoEl.className = 'route-step';
            infoEl.innerHTML = `
                <div class="step-icon info">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="step-content">
                    <div class="step-title">路线信息</div>
                    <div class="step-detail">${route.description || '暂无详细路线信息'}</div>
                </div>
            `;
            stepsContainer.appendChild(infoEl);
        }
        
        detailsContainer.appendChild(stepsContainer);
    }

    /**
     * 更新路线统计信息
     */
    function updateRouteStats(route) {
        document.getElementById('duration').textContent = route.duration;
        document.getElementById('distance').textContent = route.distance;
        document.getElementById('transfers').textContent = route.transfers;
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
        try {
            // 1. 初始化地图
            console.log('步骤1: 初始化地图...');
            const mapInitialized = initMap();
            if (!mapInitialized) {
                throw new Error('地图初始化失败');
            }
            
            // 2. 初始化城市切换
            initCitySwitch();           
            // 3. 初始化定位服务
            initLocationService();         
            // 4. 加载初始数据
            await loadCityData(currentCity);          
            // 5. 初始化自动完成
            initAutocomplete();            
            // 6. 初始化路线规划
            initRoutePlanning();            
        } catch (error) {
            console.error('页面初始化失败:', error);
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 10px; margin: 10px; border-radius: 4px; border: 1px solid #f5c6cb;">
                    <i class="fas fa-exclamation-triangle"></i> 页面初始化失败: ${error.message}
                </div>
            `;
            
            const infoPanel = document.querySelector('.info-panel');
            if (infoPanel) {
                infoPanel.insertBefore(errorDiv, infoPanel.firstChild);
            }
        }
    }

    // ========== 启动应用 ==========
    async function startApp() {
        console.log('开始启动应用...');
        
        // 显示加载提示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        
        // 检查必要依赖
        const requiredFunctions = ['gcj02ToWgs84', 'calculateDistance'];
        const missingDeps = requiredFunctions.filter(func => typeof window[func] !== 'function');
        
        if (missingDeps.length > 0) {
            console.warn('缺少必要的工具函数:', missingDeps);
        }
        
        // 等待地图加载
        await new Promise(resolve => {
            if (typeof mapboxgl !== 'undefined') {
                resolve();
            } else {
                setTimeout(resolve, 1000);
            }
        });
        
        // 初始化
        await init();
        
        // 隐藏加载提示
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    // 启动应用
    startApp();
});