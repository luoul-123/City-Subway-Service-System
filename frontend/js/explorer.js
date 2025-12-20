// ==================== 常量定义 ====================
const POI_BASE_PATH = './data';
const STATION_MARKER_ICON = './images/markers/end-subway.png'; // 自定义站点图标
const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2JubWZ5aiIsImEiOiJjbTdhYTU4cjEwMXVlMnFwdzlvNHA2MWZyIn0.xM1rgUx9ZeG7h2boM1t_oQ';

// 地铁线路颜色配置
const lineColors = {
    '地铁1号线(八通线)': '#E53238', '地铁2号线': '#0068B7', '地铁3号线': '#FFD700',
    '地铁4号线大兴线': '#009944', '地铁5号线': '#9932CC', '地铁6号线': '#8B4513',
    '地铁7号线': '#FF7F50', '地铁8号线': '#228B22', '地铁9号线': '#FFA500',
    '地铁10号线': '#1E90FF', '地铁13号线': '#F4A460', '地铁14号线': '#FF69B4',
    '地铁15号线': '#9400D3', '地铁16号线': '#00CED1', '地铁17号线': '#20B2AA',
    '地铁17号线北段': '#20B2AA', '地铁19号线': '#4B0082', 'S1线': '#E53238',
    '地铁亦庄线': '#FF6347', '地铁房山线': '#FF8C00', '地铁昌平线': '#FF69B4',
    '地铁燕房线': '#FF4500', '北京大兴国际机场线': '#00008B', '首都机场线': '#00008B',
    '西郊线': '#FF5733', '地铁1号线': '#E53238', '轨道交通浦江线': '#808080',
    '磁浮线': '#87CEFA', '市域机场线': '#00008B',
    '地铁S1号线(机场线)': '#00B0F0', '地铁S3号线(宁和线)': '#9370DB',
    '地铁S6号线(宁句线)': '#FF4500', '地铁S7号线(宁溧线)': '#8A2BE2',
    '地铁S8号线(宁天线)': '#FFD700', '地铁S9号线(宁高线)': '#2E8B57',
    '轨道交通1号线': '#1E90FF', '轨道交通2号线': '#E53238', '轨道交通3号线': '#FFC000',
    '轨道交通4号线': '#00B050', '轨道交通5号线': '#FF7D00', '轨道交通6号线': '#9932CC',
    '轨道交通7号线': '#20B2AA', '轨道交通8号线': '#00008B', '轨道交通11号线': '#8B4513',
    '轨道交通16号线': '#FF69B4', '轨道交通19号线': '#00CED1', '轨道交通21号线(阳逻线)': '#FF7F50'
};

// 城市配置
const cityConfig = {
    'nj': { name: '南京', center: [118.796877, 32.060255], zoom: 13 },
    'bj': { name: '北京', center: [116.4074, 39.9042], zoom: 13 },
    'sh': { name: '上海', center: [121.4737, 31.2304], zoom: 13 },
    'wh': { name: '武汉', center: [114.3055, 30.5928], zoom: 13 }
};

// POI类型颜色配置
const poiColors = {
    '购物服务': '#90EE90', '交通设施服务': '#FFD700', '金融保险服务': '#FFA500',
    '科教文化服务': '#FF8C42', '摩托车服务': '#708090', '汽车服务': '#696969',
    '汽车维修': '#808080', '汽车销售': '#778899', '商务住宅': '#9370DB',
    '生活服务': '#20B2AA', '体育休闲服务': '#FF6B6B', '医疗保健服务': '#87CEEB',
    '政府机构及社会团体': '#4682B4', '住宿服务': '#FF69B4',
    '购物': '#90EE90', '交通': '#FFD700', '金融': '#FFA500', '教育': '#FF8C42',
    '汽车': '#708090', '住宅': '#9370DB', '生活': '#20B2AA', '体育': '#FF6B6B',
    '医疗': '#87CEEB', '政府': '#4682B4', '住宿': '#FF69B4', '其它': '#DDA0DD'
};

// 热力图配色方案
const heatmapColorSchemes = {
    'heat': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)', 0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)'],
    'rainbow': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,255,0)', 0.2, 'rgb(0,255,255)', 0.4, 'rgb(0,255,0)', 0.6, 'rgb(255,255,0)', 0.8, 'rgb(255,128,0)', 1, 'rgb(255,0,0)'],
    'mono': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,123,255,0)', 0.3, 'rgba(0,123,255,0.3)', 0.6, 'rgba(0,123,255,0.6)', 1, 'rgba(0,123,255,1)']
};

// POI类型标准化
function normalizePOIType(type) {
    if (!type) return '其它';
    const typeStr = String(type).trim();
    const exactMapping = {
        '购物服务': '购物', '交通设施服务': '交通', '金融保险服务': '金融',
        '科教文化服务': '教育', '摩托车服务': '汽车', '汽车服务': '汽车',
        '汽车维修': '汽车', '汽车销售': '汽车', '商务住宅': '住宅',
        '生活服务': '生活', '体育休闲服务': '体育', '医疗保健服务': '医疗',
        '政府机构及社会团体': '政府', '住宿服务': '住宿'
    };
    if (exactMapping[typeStr]) return exactMapping[typeStr];
    if (poiColors[typeStr]) return typeStr;
    return '其它';
}

// ==================== 全局变量 ====================
let map;
let currentCity = 'nj';
let currentStation = '';
let allPOIData = [];
let stopData = {};
let currentRadius = 300;
let poiMarkers = [];
let pulseAnimations = [];
let isHeatmapVisible = false;
let linesData = null;
let stationMarker = null;
let currentStationCoords = null; // 用于水波纹跟随

let currentStationMeta = null;          // {lat, lon, line}
let currentPOIsInRadius = [];           // 当前站点+半径范围内的“底数据”
let currentPOITypeFilter = null;        // 当前选中的类型过滤（null=不过滤）
let pieSlices = [];                     // 饼图每个扇形的角度信息，用于点击命中


// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async function() {
    initMap();
    initCitySwitchEvents();
    initSearchSuggestions();
    bindEvents();
    
    const urlParams = new URLSearchParams(window.location.search);
    const cityParam = urlParams.get('city') || 'nj';
    const stationParam = urlParams.get('station');
    
    await loadCityData(cityParam);
    
    if (stationParam) {
        setTimeout(() => {
            currentStation = stationParam;
            loadStationPOI(stationParam);
        }, 500);
    }
});

// ==================== 搜索建议功能 ====================
function initSearchSuggestions() {
    const searchInput = document.getElementById('station-search-input');
    const suggestionsBox = document.getElementById('search-suggestions');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length === 0) {
            hideSuggestions();
            return;
        }
        showSuggestions(query);
    });
    
    searchInput.addEventListener('focus', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) showSuggestions(query);
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-section')) hideSuggestions();
    });
    
    searchInput.addEventListener('keydown', (e) => {
        const items = suggestionsBox.querySelectorAll('.suggestion-item');
        const activeItem = suggestionsBox.querySelector('.suggestion-item.active');
        let currentIndex = Array.from(items).indexOf(activeItem);
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentIndex < items.length - 1) {
                items[currentIndex]?.classList.remove('active');
                items[currentIndex + 1]?.classList.add('active');
                items[currentIndex + 1]?.scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentIndex > 0) {
                items[currentIndex]?.classList.remove('active');
                items[currentIndex - 1]?.classList.add('active');
                items[currentIndex - 1]?.scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter') {
            if (activeItem) {
                e.preventDefault();
                activeItem.click();
            } else {
                searchStation(searchInput.value.trim());
            }
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    });
}

function showSuggestions(query) {
    const suggestionsBox = document.getElementById('search-suggestions');
    const normalizedQuery = query.toLowerCase();
    
    const matches = [];
    const seenStations = new Set(); // 用于去重
    
    for (const [key, stationName] of Object.entries(stopData.name || {})) {
        if (stationName.toLowerCase().includes(normalizedQuery) && !seenStations.has(stationName)) {
            seenStations.add(stationName);
            matches.push({
                key: key,
                name: stationName,
                line: stopData.linename?.[key] || '未知线路'
            });
        }
        if (matches.length >= 10) break;
    }
    
    if (matches.length === 0) {
        suggestionsBox.innerHTML = '<div class="no-suggestion">未找到匹配的站点</div>';
    } else {
        suggestionsBox.innerHTML = matches.map(station => {
            const highlightedName = station.name.replace(
                new RegExp(`(${query})`, 'gi'),
                '<span class="highlight">$1</span>'
            );
            return `
                <div class="suggestion-item" data-station="${station.name}" data-key="${station.key}">
                    <i class="fas fa-subway"></i>
                    <div class="suggestion-text">
                        <div class="suggestion-name">${highlightedName}</div>
                        <div class="suggestion-line">${station.line}</div>
                    </div>
                </div>
`;

        }).join('');
        
        suggestionsBox.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const stationName = item.dataset.station;
                document.getElementById('station-search-input').value = stationName;
                hideSuggestions();
                searchStation(stationName);
            });
        });
    }
    
    suggestionsBox.classList.add('active');
}

function hideSuggestions() {
    document.getElementById('search-suggestions').classList.remove('active');
}

// ==================== 城市切换事件 ====================
function initCitySwitchEvents() {
    const cityBtns = document.querySelectorAll('.city-btn');
    const currentCityEl = document.querySelector('.current-city');

    cityBtns.forEach(btn => {
        const cityCode = btn.getAttribute('data-city');
        btn.classList.toggle('active', cityCode === currentCity);
    });

    if (currentCityEl) {
        currentCityEl.textContent = `当前城市：${cityConfig[currentCity].name}`;
    }

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
    showLoading();
    currentCity = cityCode;
    const config = cityConfig[cityCode];
    clearPOIDisplay();
    
    map.flyTo({ center: config.center, zoom: config.zoom, duration: 1000 });

    const timeoutId = setTimeout(() => {
        hideLoading();
        alert(`切换至${cityConfig[cityCode].name}超时，请刷新页面重试！`);
    }, 10000);

    loadCityData(cityCode)
        .then(() => { clearTimeout(timeoutId); hideLoading(); })
        .catch(error => {
            clearTimeout(timeoutId);
            hideLoading();
            alert(`切换至${cityConfig[cityCode].name}失败，请检查网络连接！`);
        });
}

// ==================== 地图初始化 ====================
function initMap() {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map = new mapboxgl.Map({
        container: 'surroundings-map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: cityConfig['nj'].center,
        zoom: cityConfig['nj'].zoom,
        attributionControl: false
    });

    map.addControl(new MapboxLanguage({ defaultLanguage: 'zh-Hans' }));
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
    
    // 地图移动时更新水波纹位置
    map.on('move', updatePulsePositions);
}

// ==================== 水波纹位置更新（修复版）====================
function updatePulsePositions() {
    if (!currentStationCoords || pulseAnimations.length === 0) return;
    
    const mapContainer = document.getElementById('surroundings-map');
    const rect = mapContainer.getBoundingClientRect();
    const point = map.project([currentStationCoords.lon, currentStationCoords.lat]);
    
    pulseAnimations.forEach(pulse => {
        pulse.style.left = (rect.left + point.x) + 'px';
        pulse.style.top = (rect.top + point.y) + 'px';
    });
}

function addStationHighlight(lon, lat) {
    removeStationHighlight();
    currentStationCoords = { lon, lat };
    
    const mapContainer = document.getElementById('surroundings-map');
    const rect = mapContainer.getBoundingClientRect();
    const point = map.project([lon, lat]);
    
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const pulse = document.createElement('div');
            pulse.className = 'station-pulse';
            pulse.style.left = (rect.left + point.x) + 'px';
            pulse.style.top = (rect.top + point.y) + 'px';
            document.body.appendChild(pulse);
            pulseAnimations.push(pulse);
            
            setTimeout(() => {
                if (pulse.parentNode) pulse.parentNode.removeChild(pulse);
                const idx = pulseAnimations.indexOf(pulse);
                if (idx > -1) pulseAnimations.splice(idx, 1);
            }, 2000);
        }, i * 600);
    }
    
    setTimeout(() => removeStationHighlight(), 5000);
}

function removeStationHighlight() {
    pulseAnimations.forEach(pulse => {
        if (pulse.parentNode) pulse.parentNode.removeChild(pulse);
    });
    pulseAnimations = [];
    currentStationCoords = null;
}

// ==================== 事件绑定 ====================
function bindEvents() {
    document.getElementById('radius-slider').addEventListener('input', (e) => {
        currentRadius = parseInt(e.target.value);
        document.getElementById('radius-value').textContent = currentRadius;
        if (currentStation) refreshCurrentStationPOI();
    });
    
    document.getElementById('heat-slider').addEventListener('input', (e) => {
        document.getElementById('heat-value').textContent = e.target.value;
    });
    
    document.getElementById('update-display').addEventListener('click', updateVisualization);
    document.getElementById('pie-chart').addEventListener('click', onPieChartClick);

    const pie = document.getElementById('pie-chart');
    pie.addEventListener('contextmenu', (e) => e.preventDefault());
    pie.addEventListener('mousedown', onPieChartClick); // 用 mousedown 才能拿到 e.button   
}

function refreshCurrentStationPOI() {
    let foundKey = null;
    for (const [key, name] of Object.entries(stopData.name || {})) {
        if (name === currentStation) { foundKey = key; break; }
    }
    
    if (foundKey) {
        const lat = stopData.lat?.[foundKey];
        const lon = stopData.lon?.[foundKey];
        const line = stopData.linename?.[foundKey];
        
        if (lat && lon) {
            const filteredPOIs = filterPOIsByDistance(parseFloat(lat), parseFloat(lon), currentRadius);
            currentStationMeta = { lat, lon, line };
            currentPOIsInRadius = filteredPOIs;
            applyPOIFilterAndRefresh();

        }
    }
}

// ==================== 数据加载 ====================
async function loadCityData(cityCode) {
    showLoading();
    try {
        try {
            stopData = await loadMetroStations(cityCode);
        } catch (error) {
            const stopResponse = await fetch(`${POI_BASE_PATH}/${cityCode}_stop.json`);
            if (!stopResponse.ok) throw new Error('站点数据加载失败');
            stopData = await stopResponse.json();
        }

        try {
            allPOIData = await loadPOIFromAPI(cityCode);
        } catch (error) {
            try {
                allPOIData = await loadPOIFromLocal(cityCode);
            } catch (localError) {
                allPOIData = [];
            }
        }

        try {
            linesData = await loadMetroLines(cityCode);
            if (linesData?.features) {
                linesData.features.forEach(f => {
                    f.properties.color = lineColors[f.properties.name] || '#007bff';
                });
            }
            if (map.loaded()) drawMetroLines();
            else map.on('load', drawMetroLines);
        } catch (err) {
            linesData = null;
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        throw error;
    }
}

// ==================== 搜索站点 ====================
function searchStation(searchText) {
    if (!searchText) { alert('请输入站点名称'); return; }
    
    const normalizedSearch = searchText.toLowerCase().trim();
    let foundKey = null, foundStation = null;
    
    for (const [key, stationName] of Object.entries(stopData.name || {})) {
        if (stationName.toLowerCase().includes(normalizedSearch)) {
            foundKey = key;
            foundStation = stationName;
            break;
        }
    }
    
    if (foundStation && foundKey) {
        const stationLat = stopData.lat?.[foundKey];
        const stationLon = stopData.lon?.[foundKey];
        const stationLine = stopData.linename?.[foundKey] || '未知线路';
        
        if (!stationLat || !stationLon) {
            alert(`站点 "${foundStation}" 缺少位置信息`);
            return;
        }
        
        currentStation = foundStation;
        
        map.flyTo({
            center: [parseFloat(stationLon), parseFloat(stationLat)],
            zoom: 15,
            duration: 1500
        });
        
        document.getElementById('station-info-card').style.display = 'flex';
        document.getElementById('current-station-name').textContent = foundStation;
        document.getElementById('current-station-line').textContent = stationLine;
        
        setTimeout(() => {
            addStationHighlight(parseFloat(stationLon), parseFloat(stationLat));
            loadStationPOI(foundStation, stationLat, stationLon, stationLine);
        }, 1600);
    } else {
        alert(`未找到站点："${searchText}"\n请检查站点名称是否正确`);
    }
}

// ==================== POI显示 ====================
function loadStationPOI(stationName, stationLat, stationLon, stationLine) {
    if (!stationName) { clearPOIDisplay(); return; }
    
    if (!stationLat || !stationLon) {
        let foundKey = null;
        for (const [key, name] of Object.entries(stopData.name || {})) {
            if (name === stationName) { foundKey = key; break; }
        }
        if (!foundKey) { alert(`无法找到站点 "${stationName}" 的位置信息`); return; }
        stationLat = stopData.lat?.[foundKey];
        stationLon = stopData.lon?.[foundKey];
        stationLine = stopData.linename?.[foundKey] || '-';
    }
    
    document.getElementById('station-info-card').style.display = 'flex';
    document.getElementById('current-station-name').textContent = stationName;
    document.getElementById('current-station-line').textContent = stationLine || '-';
    
    const filteredPOIs = filterPOIsByDistance(parseFloat(stationLat), parseFloat(stationLon), currentRadius);

    // ✅ 缓存“底数据” + 站点元信息
    currentStationMeta = { lat: stationLat, lon: stationLon, line: stationLine };
    currentPOIsInRadius = filteredPOIs;

    // ✅ 每次切换站点时清空类型过滤
    currentPOITypeFilter = null;

    // ✅ 统一走“应用过滤并刷新”（此时不过滤=全量显示）
    applyPOIFilterAndRefresh();

}

function filterPOIsByDistance(stationLat, stationLon, radiusMeters) {
    return allPOIData.filter(poi => {
        const distance = calculateDistance(stationLat, stationLon, parseFloat(poi.lat), parseFloat(poi.lon));
        return distance <= radiusMeters;
    }).map(poi => ({
        ...poi,
        distance: Math.round(calculateDistance(stationLat, stationLon, parseFloat(poi.lat), parseFloat(poi.lon))) + 'm'
    }));
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ==================== 地图更新（使用自定义图标）====================
function updateMapDisplay(stationName, pois, stationLat, stationLon, stationLine) {
    poiMarkers.forEach(marker => marker.remove());
    poiMarkers = [];
    
    if (!stationLat || !stationLon) {
        let foundKey = null;
        for (const [key, name] of Object.entries(stopData.name || {})) {
            if (name === stationName) { foundKey = key; break; }
        }
        if (!foundKey) return;
        stationLat = stopData.lat?.[foundKey];
        stationLon = stopData.lon?.[foundKey];
        stationLine = stopData.linename?.[foundKey] || '未知线路';
    }
    
    const stationLatFloat = parseFloat(stationLat);
    const stationLonFloat = parseFloat(stationLon);
    
    map.flyTo({ center: [stationLonFloat, stationLatFloat], zoom: 15, duration: 1000 });
    
    // 使用自定义图标创建站点标记
    const el = document.createElement('div');
    el.className = 'custom-station-marker';
    el.innerHTML = `<img src="${STATION_MARKER_ICON}" alt="站点">`;
    
    if (stationMarker) stationMarker.remove();
    
    stationMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([stationLonFloat, stationLatFloat])
        .setPopup(new mapboxgl.Popup().setHTML(`
            <div style="padding: 10px;">
                <strong style="font-size: 16px; color: #FF6B6B;">${stationName}</strong><br>
                <span style="color: #666; font-size: 13px;">${stationLine}</span>
            </div>
        `))
        .addTo(map);
    
    poiMarkers.push(stationMarker);
    updateRadiusCircle(stationLonFloat, stationLatFloat);
    
    // 添加POI标记
    pois.forEach(poi => {
        const color = poiColors[poi.type] || '#999';
        const marker = new mapboxgl.Marker({ color: color, scale: 0.8 })
            .setLngLat([parseFloat(poi.lon), parseFloat(poi.lat)])
            .setPopup(new mapboxgl.Popup().setHTML(`
                <div style="padding: 10px; min-width: 200px;">
                    <strong style="font-size: 14px; color: ${color};">${poi.name}</strong><br>
                    <span style="color: #666; font-size: 12px;">${poi.description || ''}</span><br>
                    <span style="color: #FF6B6B; font-size: 12px; font-weight: bold;">
                        <i class="fas fa-location-arrow"></i> ${poi.distance}
                    </span>
                </div>
            `))
            .addTo(map);
        poiMarkers.push(marker);
    });
}

function updateRadiusCircle(stationLon, stationLat) {
    ['radius-circle', 'radius-circle-outline'].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource('radius-circle')) map.removeSource('radius-circle');
    
    if (!stationLon || !stationLat) return;
    
    const circle = createGeoJSONCircle([stationLon, stationLat], currentRadius);
    
    map.addSource('radius-circle', { type: 'geojson', data: circle });
    map.addLayer({ id: 'radius-circle', type: 'fill', source: 'radius-circle', paint: { 'fill-color': '#FF6B6B', 'fill-opacity': 0.1 } });
    map.addLayer({ id: 'radius-circle-outline', type: 'line', source: 'radius-circle', paint: { 'line-color': '#FF6B6B', 'line-width': 2, 'line-dasharray': [2, 2] } });
}

function createGeoJSONCircle(center, radiusInMeters, points = 64) {
    const km = radiusInMeters / 1000;
    const ret = [];
    const distanceX = km / (111.32 * Math.cos(center[1] * Math.PI / 180));
    const distanceY = km / 111.32;
    
    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        ret.push([center[0] + distanceX * Math.cos(theta), center[1] + distanceY * Math.sin(theta)]);
    }
    ret.push(ret[0]);
    return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ret] } };
}

// ==================== 热力图功能 ====================
function updateHeatmap(pois) {
    if (!pois || pois.length === 0) { 
        isHeatmapVisible = false; 
        return; 
    }

    const heatIntensity = parseInt(document.getElementById('heat-slider').value) / 100;
    const colorScheme = document.getElementById('color-scheme').value;

    const geojsonData = {
        type: 'FeatureCollection',
        features: pois.map(poi => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [parseFloat(poi.lon), parseFloat(poi.lat)] },
            properties: { type: poi.type, name: poi.name }
        }))
    };

    // ✅ 已存在：只更新数据 + 样式（不再 remove/add）
    if (map.getSource('poi-heatmap') && map.getLayer('poi-heatmap')) {
        map.getSource('poi-heatmap').setData(geojsonData);
        map.setPaintProperty('poi-heatmap', 'heatmap-color', heatmapColorSchemes[colorScheme] || heatmapColorSchemes['heat']);
        map.setPaintProperty('poi-heatmap', 'heatmap-intensity', ['interpolate', ['linear'], ['zoom'], 0, heatIntensity, 18, heatIntensity * 1.5]);
        isHeatmapVisible = true;
        return;
    }

    // ✅ 不存在：正常创建
    map.addSource('poi-heatmap', { type: 'geojson', data: geojsonData });
    map.addLayer({
        id: 'poi-heatmap', type: 'heatmap', source: 'poi-heatmap', maxzoom: 18,
        paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['zoom'], 0, 1, 18, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, heatIntensity, 18, heatIntensity * 1.5],
            'heatmap-color': heatmapColorSchemes[colorScheme] || heatmapColorSchemes['heat'],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20, 15, 40, 18, 60],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.8, 18, 0.6]
        }
    }, 'radius-circle');

    isHeatmapVisible = true;
}


function removeHeatmap() {
    if (map.getLayer('poi-heatmap')) map.removeLayer('poi-heatmap');
    if (map.getSource('poi-heatmap')) map.removeSource('poi-heatmap');
    isHeatmapVisible = false;
}

function updateVisualization() {
    if (!currentStation) { alert('请先选择站点'); return; }

    let foundKey = null;
    for (const [key, name] of Object.entries(stopData.name || {})) {
        if (name === currentStation) { foundKey = key; break; }
    }

    if (foundKey) {
        const lat = stopData.lat?.[foundKey], lon = stopData.lon?.[foundKey];
        if (lat && lon) {
            const filteredPOIs = filterPOIsByDistance(parseFloat(lat), parseFloat(lon), currentRadius);

            // ✅ 关键1：先缓存“当前范围内全量 POI”，作为底数据
            currentStationMeta = {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                line: stopData.linename?.[foundKey] || '未知线路'
            };
            currentPOIsInRadius = filteredPOIs;

            // ✅ 关键2：用“当前显示的 POI”（可能被饼图选中过滤）
            updateHeatmap(getDisplayedPOIs());

            alert(isHeatmapVisible ? '热力图已更新' : '热力图已开启');
        }
    }
}


// ==================== 统计分析 ====================
function updateStatistics(pois) {
    const statistics = {};
    pois.forEach(poi => { const type = poi.type || '其它'; statistics[type] = (statistics[type] || 0) + 1; });
    const total = pois.length;
    const percentages = {};
    Object.keys(statistics).forEach(type => { percentages[type] = Math.round((statistics[type] / total) * 100); });
    drawPieChart(percentages);
    updateLegend(percentages);
    document.getElementById('total-poi').textContent = total;
}

function drawPieChart(percentages) {
    const canvas = document.getElementById('pie-chart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2, centerY = canvas.height / 2, radius = 80;
    let startAngle = -Math.PI / 2;

    // ✅ 每次重画都重置 slices（供点击命中）
    pieSlices = [];

    Object.entries(percentages).forEach(([type, percentage]) => {
        const sliceAngle = (percentage / 100) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        // ✅ 记录扇形角度范围
        pieSlices.push({ type, startAngle, endAngle,fullCircle: sliceAngle >= (2 * Math.PI - 1e-6) });

        // ✅ 选中类型时做轻微“突出/高亮”
        const isSelected = (currentPOITypeFilter === type);
        const offset = isSelected ? 6 : 0;
        const mid = startAngle + sliceAngle / 2;
        const ox = Math.cos(mid) * offset;
        const oy = Math.sin(mid) * offset;

        ctx.beginPath();
        ctx.moveTo(centerX + ox, centerY + oy);
        ctx.arc(centerX + ox, centerY + oy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = poiColors[type] || '#999';
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.stroke();

        if (percentage >= 5) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                `${percentage}%`,
                centerX + ox + Math.cos(mid) * radius * 0.65,
                centerY + oy + Math.sin(mid) * radius * 0.65
            );
        }

        startAngle = endAngle;
    });
}


function updateLegend(percentages) {
    document.getElementById('chart-legend').innerHTML = Object.entries(percentages).map(([type, percentage]) => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${poiColors[type] || '#999'}"></div>
            <span class="legend-label">${type}</span>
            <span class="legend-value">${percentage}%</span>
        </div>
    `).join('');
}


function getDisplayedPOIs() {
    if (!currentPOITypeFilter) return currentPOIsInRadius;
    return currentPOIsInRadius.filter(p => (p.type || '其它') === currentPOITypeFilter);
}

function applyPOIFilterAndRefresh() {
    if (!currentStation || !currentStationMeta) return;

    const shown = getDisplayedPOIs();
    updateMapDisplay(currentStation, shown, currentStationMeta.lat, currentStationMeta.lon, currentStationMeta.line);
    updateStatistics(shown); // ✅ 统计跟随“当前显示”的点

    // ✅ 支持“单类核密度分析”：热力图存在时，用过滤后的点更新
    if (isHeatmapVisible) updateHeatmap(shown);
}

function onPieChartClick(e) {
    const canvas = document.getElementById('pie-chart');

    // ✅ 右键：清除筛选
    if (e.button === 2) {
        currentPOITypeFilter = null;
        applyPOIFilterAndRefresh();
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // radius=80（和你 drawPieChart 一致）
    if (dist > 80) return;

    // 规范到 [0, 2π)
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;

    const hit = pieSlices.find(s => {
        // ✅ 100% 扇形：无脑命中
        if (s.fullCircle) return true;

        let a1 = s.startAngle % (2 * Math.PI);
        let a2 = s.endAngle % (2 * Math.PI);
        if (a1 < 0) a1 += 2 * Math.PI;
        if (a2 < 0) a2 += 2 * Math.PI;

        // 扇形跨 0 点
        if (a2 < a1) return (angle >= a1 || angle <= a2);
        return (angle >= a1 && angle <= a2);
    });

    if (!hit) return;

    // ✅ 点击同一类：取消；否则切换到该类
    currentPOITypeFilter = (currentPOITypeFilter === hit.type) ? null : hit.type;

    applyPOIFilterAndRefresh();
}

function getDisplayedPOIs() {
    if (!currentPOITypeFilter) return currentPOIsInRadius;
    return currentPOIsInRadius.filter(p => (p.type || '其它') === currentPOITypeFilter);
}


// ==================== 辅助函数 ====================
function clearPOIDisplay() {
    document.getElementById('station-info-card').style.display = 'none';
    document.getElementById('total-poi').textContent = '0';
    document.getElementById('chart-legend').innerHTML = '';
    
    const canvas = document.getElementById('pie-chart');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    
    poiMarkers.forEach(marker => marker.remove());
    poiMarkers = [];
    
    ['radius-circle', 'radius-circle-outline'].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    if (map.getSource('radius-circle')) map.removeSource('radius-circle');
    
    removeHeatmap();
    removeStationHighlight();
}

function showLoading() { document.getElementById('loading').style.display = 'flex'; }
function hideLoading() { document.getElementById('loading').style.display = 'none'; }

function drawMetroLines() {
    if (!linesData?.features?.length) return;
    if (map.getLayer('metro-lines')) map.removeLayer('metro-lines');
    if (map.getSource('metro-lines')) map.removeSource('metro-lines');
    
    map.addSource('metro-lines', { type: 'geojson', data: linesData });
    map.addLayer({ id: 'metro-lines', type: 'line', source: 'metro-lines', paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-opacity': 0.8 } });
}

// ==================== API加载函数 ====================
async function loadPOIFromAPI(cityCode) {
    const response = await fetch(`${API_BASE_URL}/poi?city=${cityCode}`);
    if (!response.ok) throw new Error(`API响应错误: ${response.status}`);
    const data = await response.json();
    return (data.pois || []).map(poi => ({
        id: poi.id || poi.external_id, name: poi.name, type: poi.type,
        lon: parseFloat(poi.lon), lat: parseFloat(poi.lat),
        description: poi.address || poi.business_area || '', address: poi.address || '', tel: poi.tel || ''
    }));
}

async function loadPOIFromLocal(cityCode) {
    const response = await fetch(`${POI_BASE_PATH}/POI/$poi_all.json`);
    if (!response.ok) throw new Error('本地文件加载失败');
    const data = await response.json();
    return (data.pois || []).map(poi => ({
        id: poi.id, name: poi.name, type: poi.type,
        normalizedType: normalizePOIType(poi.type),
        lon: parseFloat(poi.lon), lat: parseFloat(poi.lat),
        description: poi.description || poi.address || '', address: poi.address || '', tel: poi.tel || ''
    }));
}