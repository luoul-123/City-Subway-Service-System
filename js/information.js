// 等待页面DOM完全加载
document.addEventListener('DOMContentLoaded', function() {
    // 显示加载提示
    showLoading();
    
    // 城市配置
    const cityConfig = {
        'nj': { 
            name: '南京', 
            center: [118.796877, 32.060255], 
            zoom: 10,
            dataPath: './data/nj_line.geojson',
            stopDataPath: './data/nj_stop.json'
        },
        'bj': { 
            name: '北京', 
            center: [116.4074, 39.9042], 
            zoom: 10,
            dataPath: './data/bj_line.geojson',
            stopDataPath: './data/bj_stop.json'
        },
        'sh': { 
            name: '上海', 
            center: [121.4737, 31.2304], 
            zoom: 10,
            dataPath: './data/sh_line.geojson',
            stopDataPath: './data/sh_stop.json'
        },
        'wh': { 
            name: '武汉', 
            center: [114.3055, 30.5928], 
            zoom: 10,
            dataPath: './data/wh_line.geojson',
            stopDataPath: './data/wh_stop.json'
        }
    };

    // 获取URL参数（提前获取以确定初始城市）
    function getURLParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            city: params.get('city'),
            line: params.get('line')
        };
    }
    const urlParams = getURLParams();
    const initialCity = (urlParams.city && cityConfig[urlParams.city]) ? urlParams.city : 'nj';

    // 1. 初始化Mapbox地图
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2JubWZ5aiIsImEiOiJjbTdhYTU4cjEwMXVlMnFwdzlvNHA2MWZyIn0.xM1rgUx9ZeG7h2boM1t_oQ';
    const map = new mapboxgl.Map({
        container: 'nanjing-map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: cityConfig[initialCity].center,
        zoom: cityConfig[initialCity].zoom,
        attributionControl: false
    });

    // 2. 添加地图基础控件
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // 3. 存储数据
    let railwayData = null;
    let activeLines = new Set(); // 存储当前显示的线路
    let stopData = null; // 站点数据将存储在这里
    let stopLayers = new Set();  // 存储站点图层信息
    const MIN_ZOOM_FOR_STOPS = 12; // 显示站点的最小缩放级别
    let currentCity = initialCity; // 当前选中城市
    let currentDirection = 'normal'; // 'normal' 或 'reverse'
    let transferStations = []; // 存储换乘站信息
    let currentTransferPopup = null; // 换乘站弹窗信息
    let currentStationPopup = null; // 普通站点弹窗信息
    let currentPopupStationInfo = null; // 当前弹窗的站点信息

    // 4. 线路颜色配置
    const lineColors = {
        // 北京地铁
        '地铁1号线(八通线)': '#E53238', // 红色
        '地铁2号线': '#0068B7', // 蓝色
        '地铁3号线': '#FFD700', // 亮黄色
        '地铁4号线大兴线': '#009944', // 青绿色
        '地铁5号线': '#9932CC', // 紫色
        '地铁6号线': '#8B4513', // 土黄色
        '地铁7号线': '#FF7F50', // 橙黄色
        '地铁8号线': '#228B22', // 深绿色
        '地铁9号线': '#FFA500', // 淡橙色
        '地铁10号线': '#1E90FF', // 天蓝色
        '地铁13号线': '#F4A460', // 沙棕色
        '地铁14号线': '#FF69B4', // 淡粉色
        '地铁15号线': '#9400D3', // 紫罗兰色
        '地铁16号线': '#00CED1', // 青色
        '地铁17号线': '#20B2AA', // 蓝绿色
        '地铁17号线北段': '#20B2AA', // 蓝绿色
        '地铁19号线': '#4B0082', // 暗紫色
        'S1线': '#E53238', // 红色
        '地铁亦庄线': '#FF6347', // 桃红色
        '地铁房山线': '#FF8C00', // 橙色
        '地铁昌平线': '#FF69B4', // 粉红色
        '地铁燕房线': '#FF4500', // 橙红色
        '北京大兴国际机场线': '#00008B', // 深蓝色
        '首都机场线': '#00008B', // 深蓝色
        '西郊线': '#FF5733', // 橙红色

        // 上海地铁
        '地铁1号线': '#E53238', // 红色
        '地铁2号线': '#0068B7', // 绿色
        '地铁3号线': '#FFC000', // 黄色
        '地铁4号线': '#9932CC', // 紫色
        '地铁5号线': '#C71585', // 紫红色
        '地铁6号线': '#DA70D6', // 品红色
        '地铁7号线': '#FF7D00', // 橙色
        '地铁8号线': '#1E90FF', // 蓝色
        '地铁9号线': '#87CEFA', // 浅蓝色
        '地铁10号线': '#9370DB', // 淡紫色
        '地铁11号线': '#8B4513', // 棕色
        '地铁12号线': '#228B22', // 深绿色
        '地铁13号线': '#FF69B4', // 粉红色
        '地铁14号线': '#556B2F', // 橄榄绿
        '地铁15号线': '#9400D3', // 紫罗兰色
        '地铁16号线': '#00CED1', // 青色
        '地铁17号线': '#D2B48C', // 浅棕色
        '地铁18号线一期南段': '#8B4513', // 深棕色
        '轨道交通浦江线': '#808080', // 灰色
        '磁浮线': '#87CEFA', // 浅蓝色
        '市域机场线':'#00008B',

        // 南京地铁
        '地铁1号线': '#1A5FB4', // 蓝色
        '地铁2号线': '#FF0000', // 红色
        '地铁3号线': '#00B050', // 绿色
        '地铁4号线': '#9932CC', // 紫色
        '地铁5号线': '#FFC000', // 黄色
        '地铁6号线': '#00CED1', // 青色（建设中）
        '地铁7号线': '#FF7D00', // 橙色
        '地铁10号线': '#D2B48C', // 香槟色
        '地铁S1号线(机场线)': '#00B0F0', // 宝石蓝
        '地铁S3号线(宁和线)': '#9370DB', // 粉紫色
        '地铁S6号线(宁句线)': '#FF4500', // 朱红色
        '地铁S7号线(宁溧线)': '#8A2BE2', // 深紫色
        '地铁S8号线(宁天线)': '#FFD700', // 明黄色
        '地铁S9号线(宁高线)': '#2E8B57', // 深绿色

        // 武汉地铁
        '轨道交通1号线': '#1E90FF', // 蓝色
        '轨道交通2号线': '#E53238', // 红色
        '轨道交通3号线': '#FFC000', // 黄色
        '轨道交通4号线': '#00B050', // 绿色
        '轨道交通5号线': '#FF7D00', // 橙色
        '轨道交通6号线': '#9932CC', // 紫色
        '轨道交通7号线': '#20B2AA', // 青绿色
        '轨道交通8号线': '#00008B', // 深蓝色
        '轨道交通11号线': '#8B4513', // 棕色
        '轨道交通16号线': '#FF69B4', // 粉色
        '轨道交通19号线': '#00CED1', // 青色
        '轨道交通21号线(阳逻线)': '#FF7F50', // 橙红色
    };

    // 5. 初始化城市切换事件
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

    // 6. 切换城市核心函数
    function switchCity(cityCode) {
        showLoading();
        currentCity = cityCode;
        const config = cityConfig[cityCode];
        
        // 关闭弹窗
        closeAllPopups();
        
        map.flyTo({
            center: config.center,
            zoom: config.zoom,
            duration: 1000
        });
        
        // 同时加载线路和站点数据
        Promise.all([
            loadRailwayData(cityCode),
            loadStopData(cityCode)
        ]).then(([railData, stopDataResult]) => {
            railwayData = railData;
            stopData = formatStopData(stopDataResult);
            clearAllLines();
            clearAllStops();
            initializeLineButtons();
            hideLoading();
        }).catch(error => {
            console.error('城市数据加载错误:', error);
            hideLoading();
            alert(`切换至${cityConfig[cityCode].name}失败，请重试！`);
        });
    }

    // 7. 格式化站点数据
    function formatStopData(rawData) {
        const stops = [];
        const keys = Object.keys(rawData.name || {});
        
        keys.forEach(key => {
            // 提取原始线路名称并去除括号及内部内容
            const rawLineName = rawData.linename[key] || '';
            // 正则表达式：匹配所有括号及内部内容（非贪婪模式，全局匹配）
            const cleanedLineName = rawLineName.replace(/\(.*?\)/g, '').trim();
            
            stops.push({
                id: key,
                name: rawData.name[key] || '',
                linename: cleanedLineName, // 使用清洗后的线路名称
                lineNumber: rawData.x ? rawData.x[key] : '',
                lon: parseFloat(rawData.lon[key]) || 0, 
                lat: parseFloat(rawData.lat[key]) || 0, 
                num: parseInt(rawData.num[key]) || 0, 
                direction: parseInt(rawData.direction[key]) || 1
            });
        });
        
        return stops;
    }

    // 8. 加载地铁路线数据和站点数据
    function loadRailwayData(cityCode) {
        const config = cityConfig[cityCode];
        return fetch(config.dataPath)
            .then(response => {
                if (!response.ok) throw new Error(`加载失败：${response.statusText}`);
                return response.json();
            });
    }
    function loadStopData(cityCode) {
        const config = cityConfig[cityCode];
        return fetch(config.stopDataPath)
            .then(response => {
                if (!response.ok) throw new Error(`加载失败：${response.statusText}`);
                return response.json();
            });
    }

    // 9. 初始化线路按钮
    function initializeLineButtons() {
        const lineButtonsContainer = document.getElementById('line-buttons');
        lineButtonsContainer.innerHTML = '';
        
        if (!railwayData) return;
        
        railwayData.features.forEach(feature => {
            const lineName = feature.properties.name;
            const button = document.createElement('button');
            button.className = 'line-btn';
            button.textContent = lineName;
            button.style.borderLeftColor = lineColors[lineName] || '#cccccc';
            button.style.borderLeftWidth = '4px';
            button.style.borderLeftStyle = 'solid';
            
            button.addEventListener('click', () => {
                if (activeLines.has(lineName)) {
                    hideLine(lineName);
                    button.classList.remove('active');
                } else {
                    showLine(lineName);
                    button.classList.add('active');
                }
            });
            
            lineButtonsContainer.appendChild(button);
        });
    }

    // 10. 获取线路对应的站点
    function getStopsForLine(lineName) {
        if (!stopData) return [];
        return stopData.filter(stop => stop.linename === lineName);
    }

    // 根据当前方向获取站点的显示序号
    function getDisplayStationNum(lineName, stationNum) {
        const lineStops = getStopsForLine(lineName);
        const uniqueStops = new Set(lineStops.map(stop => stop.name));
        const totalStations = uniqueStops.size;
        
        if (currentDirection === 'normal') {
            return stationNum;
        } else {
            // 反向时，序号需要反转
            return totalStations - stationNum + 1;
        }
    }

    // 11. 显示单条线路
    function showLine(lineName) {
        const lineFeature = railwayData.features.find(f => f.properties.name === lineName);
        if (!lineFeature) return;

        const lineId = `line-${lineName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // 移除已存在的线路
        if (map.getLayer(lineId)) {
            map.removeLayer(lineId);
        }
        if (map.getSource(lineId)) {
            map.removeSource(lineId);
        }

        // 添加线路数据源和图层
        map.addSource(lineId, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [lineFeature]
            }
        });

        map.addLayer({
            id: lineId,
            type: 'line',
            source: lineId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': lineColors[lineName] || getRandomColor(lineName),
                'line-width': 2.5,
                'line-opacity': 0.7
            }
        });

        activeLines.add(lineName);
        showStopsForLine(lineName);
        updateLineInfo(lineName);
        adjustMapView();
    }

    // 12. 显示线路的站点
    function showStopsForLine(lineName) {
        if (!stopData || !railwayData) return;
        
        // 获取线路对应的站点
        const lineStops = getStopsForLine(lineName);
        if (!lineStops || lineStops.length === 0) return;
        
        const stopLayerId = `stops-${lineName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // 移除已存在的站点图层
        if (map.getLayer(stopLayerId)) {
            map.removeLayer(stopLayerId);
        }
        if (map.getSource(stopLayerId)) {
            map.removeSource(stopLayerId);
        }
        
        // 创建站点GeoJSON数据
        const stopFeatures = lineStops.map(stop => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [stop.lon, stop.lat]
            },
            properties: {
                name: stop.name,
                lineName: lineName,
                num: stop.num,
                direction: stop.direction === 1 ? '上行' : '下行'
            }
        }));
        
        // 添加站点数据源
        map.addSource(stopLayerId, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: stopFeatures
            }
        });
        
        // 添加站点图层
        map.addLayer({
            id: stopLayerId,
            type: 'circle',
            source: stopLayerId,
            layout: {
                visibility: map.getZoom() >= MIN_ZOOM_FOR_STOPS ? 'visible' : 'none'
            },
            paint: {
                'circle-radius': 6,
                'circle-color': lineColors[lineName] || getRandomColor(lineName),
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-opacity': 0.9
            }
        });
        
        // 添加站点标签
        const labelLayerId = `stop-labels-${lineName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        if (map.getLayer(labelLayerId)) {
            map.removeLayer(labelLayerId);
        }
        
        map.addLayer({
            id: labelLayerId,
            type: 'symbol',
            source: stopLayerId,
            layout: {
                visibility: map.getZoom() >= MIN_ZOOM_FOR_STOPS + 1 ? 'visible' : 'none',
                'text-field': ['get', 'name'],
                'text-font': ['Arial Unicode MS Bold'],
                'text-size': 12,
                'text-offset': [0, 1.5],
                'text-anchor': 'top'
            },
            paint: {
                'text-color': '#333333',
                'text-halo-color': '#ffffff',
                'text-halo-width': 2
            }
        });
        
        // 点击站点显示弹窗
        map.on('click', stopLayerId, (e) => {
            // 关闭之前的弹窗
            closeAllPopups();
            
            const properties = e.features[0].properties;
            const station = stopData.find(stop => 
                stop.name === properties.name && stop.linename === properties.lineName
            );
            
            if (!station) return;
            
            // 存储当前弹窗的站点信息
            currentPopupStationInfo = {
                name: station.name,
                lineName: station.linename,
                num: station.num,
                coordinates: [station.lon, station.lat]
            };
            
            // 创建弹窗内容，使用与换乘站相同的样式
            createStationPopup(currentPopupStationInfo, e.lngLat, false);
        });
        
        // 鼠标悬停效果
        map.on('mouseenter', stopLayerId, () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', stopLayerId, () => {
            map.getCanvas().style.cursor = '';
        });
        
        stopLayers.add({lineName, stopLayerId, labelLayerId});
    }

    // 创建站点弹窗（普通站点和换乘站共用）
    function createStationPopup(stationInfo, lngLat, isTransfer) {
        const displayNum = getDisplayStationNum(stationInfo.lineName, stationInfo.num);
        const stationLines = isTransfer ? 
            Array.from(new Set(stopData.filter(stop => stop.name === stationInfo.name).map(stop => stop.linename))) : 
            [stationInfo.lineName];
        
        const popupContent = `
            <div class="transfer-station-popup">
                <div class="popup-header">
                    <h4>${stationInfo.name}</h4>
                    <button class="popup-close-btn" id="station-popup-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="popup-content">
                    <div class="popup-section">
                        <div class="popup-label"><i class="fas fa-info-circle"></i> 站点类型</div>
                        <div class="popup-value">${isTransfer ? '换乘站' : '非换乘站'}</div>
                    </div>
                    <div class="popup-section">
                        <div class="popup-label"><i class="fas fa-subway"></i> ${isTransfer ? '可换乘线路' : '所属线路'}</div>
                        <div class="transfer-lines">
                            ${stationLines.map(line => 
                                `<span class="transfer-line-badge" style="border-left-color: ${lineColors[line] || getRandomColor(line)}">${line}</span>`
                            ).join('')}
                        </div>
                    </div>
                    ${isTransfer ? `
                    <div class="popup-section">
                        <div class="popup-label"><i class="fas fa-route"></i> 当前线路</div>
                        <div class="popup-value">${stationInfo.lineName}</div>
                    </div>
                    ` : ''}
                    <div class="popup-section">
                        <div class="popup-label"><i class="fas fa-list-ol"></i> 站点序号</div>
                        <div class="popup-value" id="station-order-display">第${displayNum}站</div>
                    </div>
                </div>
                <div class="popup-footer">
                    <button class="popup-action-btn" id="view-station-details">
                        <i class="fas fa-search-location"></i> 查看站点详情
                    </button>
                </div>
            </div>
        `;
        
        const popup = new mapboxgl.Popup({
            closeOnClick: false,
            closeButton: false,
            maxWidth: '300px',
            className: 'transfer-popup'
        })
            .setLngLat(lngLat)
            .setHTML(popupContent)
            .addTo(map);
        
        // 存储弹窗引用
        if (isTransfer) {
            currentTransferPopup = popup;
        } else {
            currentStationPopup = popup;
        }
        
        // 关闭按钮事件
        document.getElementById('station-popup-close').addEventListener('click', () => {
            closeAllPopups();
        });
        
        // 查看详情按钮事件
        document.getElementById('view-station-details').addEventListener('click', () => {
            closeAllPopups();
            // 直接跳转到explorer.html
            window.location.href = 'explorer.html';
        });
        
        return popup;
    }

    // 更新弹窗中的站点序号显示
    function updatePopupStationOrder() {
        if (!currentPopupStationInfo) return;
        
        const orderElement = document.getElementById('station-order-display');
        if (orderElement) {
            const displayNum = getDisplayStationNum(
                currentPopupStationInfo.lineName, 
                currentPopupStationInfo.num
            );
            orderElement.textContent = `第${displayNum}站`;
        }
    }

    // 关闭所有弹窗
    function closeAllPopups() {
        if (currentTransferPopup) {
            currentTransferPopup.remove();
            currentTransferPopup = null;
        }
        if (currentStationPopup) {
            currentStationPopup.remove();
            currentStationPopup = null;
        }
        currentPopupStationInfo = null;
    }

    // 13. 隐藏单条线路
    function hideLine(lineName) {
        const lineId = `line-${lineName.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // 移除线路图层
        if (map.getLayer(lineId)) {
            map.removeLayer(lineId);
        }
        if (map.getSource(lineId)) {
            map.removeSource(lineId);
        }
        
        // 移除对应的站点图层
        stopLayers.forEach(layer => {
            if (layer.lineName === lineName) {
                if (map.getLayer(layer.stopLayerId)) {
                    map.removeLayer(layer.stopLayerId);
                }
                if (map.getSource(layer.stopLayerId)) {
                    map.removeSource(layer.stopLayerId);
                }
                if (map.getLayer(layer.labelLayerId)) {
                    map.removeLayer(layer.labelLayerId);
                }
                stopLayers.delete(layer);
            }
        });
        
        activeLines.delete(lineName);
        
        // 如果隐藏的线路是当前弹窗显示的线路，关闭弹窗
        closeAllPopups();
        
        // 更新信息卡
        if (activeLines.size > 0) {
            const firstLine = Array.from(activeLines)[0];
            updateLineInfo(firstLine);
        } else {
            resetLineInfo();
        }
    }

    // 14. 更新线路信息卡片
    // 初始化信息面板事件
    function initInfoPanelEvents() {
        // 方向切换按钮事件
        document.getElementById('toggle-direction').addEventListener('click', toggleDirection);
    }
    
    // 切换方向
    function toggleDirection() {
        currentDirection = currentDirection === 'normal' ? 'reverse' : 'normal';
        
        // 如果当前有弹窗显示，直接更新弹窗内容
        if (currentPopupStationInfo) {
            updatePopupStationOrder();
        }
        
        if (activeLines.size > 0) {
            const currentLine = Array.from(activeLines)[0];
            updateLineInfo(currentLine);
        }
    }

    // 更新线路信息
    function updateLineInfo(lineName) {
        const lineFeature = railwayData.features.find(f => f.properties.name === lineName);
        if (!lineFeature) return;

        const lineColor = lineColors[lineName] || getRandomColor(lineName);
        const lineStops = getStopsForLine(lineName);
        
        // 去重统计站点数量
        const uniqueStops = new Set(lineStops.map(stop => stop.name));
        const uniqueStopCount = uniqueStops.size;
        
        // 更新标题和颜色
        document.getElementById('line-name').textContent = lineName;
        document.querySelector('.card-header').style.backgroundColor = lineColor;
        
        // 更新长度和站点数量
        document.getElementById('line-length').textContent = calculateLineLength(lineFeature);
        document.getElementById('station-count').textContent = uniqueStopCount;
        
        // 更新起点终点（考虑方向）
        updateStationDirections(lineStops);
        
        // 更新换乘站信息
        updateTransferStations(lineName, lineStops);
    }

    // 更新站点方向显示
    function updateStationDirections(lineStops) {
        if (lineStops.length === 0) {
            document.getElementById('start-station').textContent = '-';
            document.getElementById('end-station').textContent = '-';
            return;
        }
        
        // 按站点序号排序
        const sortedStops = [...lineStops].sort((a, b) => a.num - b.num);
        
        let startStop, endStop;
        
        if (currentDirection === 'normal') {
            startStop = sortedStops[0];
            endStop = sortedStops[sortedStops.length - 1];
        } else {
            startStop = sortedStops[sortedStops.length - 1];
            endStop = sortedStops[0];
        }
        
        document.getElementById('start-station').textContent = startStop.name;
        document.getElementById('end-station').textContent = endStop.name;
    }

    // 更新换乘站信息
    function updateTransferStations(lineName, lineStops) {
        const transferStationsContainer = document.getElementById('transfer-stations');
        const transferCountElement = document.getElementById('transfer-count');
        
        // 清空现有内容
        transferStationsContainer.innerHTML = '';
        transferStations = [];
        
        if (!stopData || lineStops.length === 0) {
            transferStationsContainer.innerHTML = '<div class="no-transfer">暂无换乘站信息</div>';
            transferCountElement.textContent = '0';
            return;
        }
        
        // 找出换乘站（该站点属于多条线路）
        const stationLineMap = new Map();
        
        // 建立站点-线路映射
        stopData.forEach(stop => {
            if (!stationLineMap.has(stop.name)) {
                stationLineMap.set(stop.name, new Set());
            }
            stationLineMap.get(stop.name).add(stop.linename);
        });
        
        // 筛选当前线路的换乘站
        const currentLineStations = new Set(lineStops.map(stop => stop.name));
        const transferStationsList = [];
        
        currentLineStations.forEach(stationName => {
            const lines = stationLineMap.get(stationName);
            if (lines && lines.size > 1) {
                transferStationsList.push({
                    name: stationName,
                    lineCount: lines.size,
                    lines: Array.from(lines).filter(l => l !== lineName)
                });
            }
        });
        
        // 更新计数
        transferCountElement.textContent = transferStationsList.length;
        
        if (transferStationsList.length === 0) {
            transferStationsContainer.innerHTML = '<div class="no-transfer">暂无换乘站信息</div>';
            return;
        }
        
        // 创建换乘站按钮
        transferStationsList.forEach(station => {
            const stationBtn = document.createElement('button');
            stationBtn.className = 'transfer-station-btn';
            stationBtn.innerHTML = `
                <i class="fas fa-subway"></i>
                <span class="transfer-station-name">${station.name}</span>
                <span class="transfer-line-count">${station.lineCount}线</span>
            `;
            
            stationBtn.addEventListener('click', () => {
                highlightTransferStation(station.name, lineName);
            });
            
            transferStationsContainer.appendChild(stationBtn);
        });
        
        transferStations = transferStationsList;
    }

    // 高亮显示换乘站
    function highlightTransferStation(stationName, currentLineName) {
        // 关闭之前可能存在的弹窗
        closeAllPopups();
        
        // 找到该站点的坐标
        const station = stopData.find(stop => 
            stop.name === stationName && stop.linename === currentLineName
        );
        
        if (!station) return;
        
        // 存储当前弹窗的站点信息
        currentPopupStationInfo = {
            name: station.name,
            lineName: station.linename,
            num: station.num,
            coordinates: [station.lon, station.lat]
        };
        
        // 飞向该站点
        map.flyTo({
            center: [station.lon-0.001, station.lat+0.001],
            zoom: 15,
            duration: 1000
        });
        
        // 显示站点信息弹窗
        setTimeout(() => {
            createStationPopup(currentPopupStationInfo, [station.lon, station.lat], true);
        }, 1000);
    }

    // 15. 重置线路信息
    function resetLineInfo() {
        document.getElementById('line-name').textContent = '请选择线路'; 
        document.getElementById('line-length').textContent = '-';
        document.getElementById('station-count').textContent = '-';
        document.getElementById('start-station').textContent = '-';
        document.getElementById('end-station').textContent = '-';
        document.getElementById('transfer-count').textContent = '0';
        document.getElementById('transfer-stations').innerHTML = '<div class="no-transfer">暂无换乘站信息</div>';
        document.querySelector('.card-header').style.backgroundColor = '#6c757d';
        currentDirection = 'normal'; // 重置方向
    }

    // 16. 清除所有线路
    function clearAllLines() {
        activeLines.forEach(lineName => {
            hideLine(lineName);
        });
        
        const buttons = document.querySelectorAll('.line-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        activeLines.clear();
        resetLineInfo();
    }

    // 17. 显示所有线路（保持原样）
    function showAllLines() {
        clearAllLines();
        
        railwayData.features.forEach(feature => {
            showLine(feature.properties.name);
            
            const buttons = document.querySelectorAll('.line-btn');
            buttons.forEach(btn => {
                if (btn.textContent === feature.properties.name) {
                    btn.classList.add('active');
                }
            });
        });
    }

    // 18. 搜索线路（保持原样）
    function searchAndShowLine(searchText) {
        if (!railwayData) {
            alert('数据尚未加载完成，请稍后重试');
            return;
        }

        const normalizedSearch = searchText.trim().toLowerCase();
        if (!normalizedSearch) {
            alert('请输入线路名称（如：地铁1号线）');
            return;
        }

        const matchedLines = railwayData.features.filter(feature => {
            const lineName = feature.properties.name.toLowerCase();
            return lineName.includes(normalizedSearch) || 
                   lineName.replace('地铁', '').includes(normalizedSearch);
        });

        if (matchedLines.length > 0) {
            clearAllLines();
            
            matchedLines.forEach(feature => {
                showLine(feature.properties.name);
                
                const buttons = document.querySelectorAll('.line-btn');
                buttons.forEach(btn => {
                    if (btn.textContent === feature.properties.name) {
                        btn.classList.add('active');
                    }
                });
            });
        } else {
            alert(`未找到线路：${searchText}\n请输入正确的线路名称`);
        }
    }

    // 19. 清除所有站点（新增函数）
    function clearAllStops() {
        stopLayers.forEach(layer => {
            if (map.getLayer(layer.stopLayerId)) {
                map.removeLayer(layer.stopLayerId);
            }
            if (map.getSource(layer.stopLayerId)) {
                map.removeSource(layer.stopLayerId);
            }
            if (map.getLayer(layer.labelLayerId)) {
                map.removeLayer(layer.labelLayerId);
            }
        });
        stopLayers.clear();
    }

    // 20. 绑定搜索事件和操作按钮（保持原样）
    function bindSearchEvent() {
        const searchInput = document.getElementById('line-search');
        const searchBtn = document.getElementById('search-btn');

        searchBtn.addEventListener('click', () => {
            searchAndShowLine(searchInput.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchAndShowLine(searchInput.value);
            }
        });
    }

    function bindActionButtons() {
        document.getElementById('reset-view').addEventListener('click', () => {
            map.flyTo({
                center: cityConfig[currentCity].center,
                zoom: cityConfig[currentCity].zoom,
                duration: 1000
            });
        });

        document.getElementById('show-all-lines').addEventListener('click', () => {
            showAllLines();
        });

        document.getElementById('clear-lines').addEventListener('click', () => {
            clearAllLines();
        });
    }

    // 21. 监听地图缩放事件，控制站点显示（新增）
    function bindZoomEvent() {
        map.on('zoom', () => {
            const currentZoom = map.getZoom();
            stopLayers.forEach(layer => {
                // 控制站点图标显示
                if (map.getLayer(layer.stopLayerId)) {
                    map.setLayoutProperty(
                        layer.stopLayerId, 
                        'visibility', 
                        currentZoom >= MIN_ZOOM_FOR_STOPS ? 'visible' : 'none'
                    );
                }
                // 控制站点标签显示（需要更高的缩放级别）
                if (map.getLayer(layer.labelLayerId)) {
                    map.setLayoutProperty(
                        layer.labelLayerId, 
                        'visibility', 
                        currentZoom >= MIN_ZOOM_FOR_STOPS + 1 ? 'visible' : 'none'
                    );
                }
            });
        });
    }

    // 22. 其他辅助函数（保持原样）
    function calculateLineLength(lineFeature) {
        const coordinates = lineFeature.geometry.coordinates;
        let totalLength = 0;
        
        for (let i = 1; i < coordinates.length; i++) {
            const [lon1, lat1] = coordinates[i-1];
            const [lon2, lat2] = coordinates[i];
            
            const dLat = (lat2 - lat1) * 111.32;
            const dLon = (lon2 - lon1) * 111.32 * Math.cos((lat1 + lat2) * Math.PI / 360);
            totalLength += Math.sqrt(dLat * dLat + dLon * dLon);
        }
        
        return Math.round(totalLength);
    }

    function adjustMapView() {
        if (activeLines.size === 0) return;
        
        const bounds = new mapboxgl.LngLatBounds();
        
        activeLines.forEach(lineName => {
            const lineFeature = railwayData.features.find(f => f.properties.name === lineName);
            if (lineFeature) {
                lineFeature.geometry.coordinates.forEach(coord => {
                    bounds.extend(coord);
                });
            }
        });
        
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
                padding: 50,
                duration: 1000
            });
        }
    }

    function getRandomColor(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    function showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    // 初始化流程
    function init() {
        initCitySwitchEvents();
        initInfoPanelEvents(); 
        
        // 如果URL中有city参数，更新城市按钮状态
        if (urlParams.city && cityConfig[urlParams.city]) {
            // 更新城市按钮状态
            const cityBtns = document.querySelectorAll('.city-btn');
            cityBtns.forEach(btn => {
                if (btn.getAttribute('data-city') === urlParams.city) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            const currentCityEl = document.querySelector('.current-city');
            if (currentCityEl) {
                currentCityEl.textContent = `当前城市：${cityConfig[urlParams.city].name}`;
            }
        }
        
        // 初始加载线路和站点数据
        Promise.all([
            loadRailwayData(currentCity),
            loadStopData(currentCity)
        ]).then(([railData, stopDataResult]) => {
            railwayData = railData;
            stopData = formatStopData(stopDataResult);
            hideLoading();
            
            map.on('load', () => {
                initializeLineButtons();
                bindSearchEvent();
                bindActionButtons();
                bindZoomEvent();
                resetLineInfo();
                
                // 如果URL中有line参数，自动显示该线路
                if (urlParams.line) {
                    setTimeout(() => {
                        const lineName = decodeURIComponent(urlParams.line);
                        // 检查线路是否存在
                        const lineExists = railwayData.features.some(f => f.properties.name === lineName);
                        if (lineExists) {
                            // 触发线路按钮点击
                            const lineButtons = document.querySelectorAll('.line-btn');
                            lineButtons.forEach(btn => {
                                if (btn.textContent === lineName) {
                                    btn.click();
                                }
                            });
                        }
                    }, 500);
                }
            });
        }).catch(error => {
            console.error('初始数据加载错误:', error);
            hideLoading();
            alert('地铁线路数据加载失败，请刷新页面重试！');
        });
    }

    // 启动初始化
    init();
});