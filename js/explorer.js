// ==================== 常量定义 ====================
const POI_BASE_PATH = './data';
const IMAGE_BASE_PATH = './images';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2JubWZ5aiIsImEiOiJjbTdhYTU4cjEwMXVlMnFwdzlvNHA2MWZyIn0.xM1rgUx9ZeG7h2boM1t_oQ';


//  地铁线路颜色配置
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


// 城市配置
const cityConfig = {
    'nj': { 
        name: '南京', 
        center: [118.796877, 32.060255], 
        zoom: 13
    },
    'bj': { 
        name: '北京', 
        center: [116.4074, 39.9042], 
        zoom: 13
    },
    'sh': { 
        name: '上海', 
        center: [121.4737, 31.2304], 
        zoom: 13
    },
    'wh': { 
        name: '武汉', 
        center: [114.3055, 30.5928], 
        zoom: 13
    }
};

// POI类型颜色配置
const poiColors = {
    '餐饮': '#4169E1',
    '教育': '#FF8C42',
    '交通': '#FFD700',
    '购物': '#90EE90',
    '医疗': '#87CEEB',
    '体育': '#FF6B6B',
    '其它': '#DDA0DD'
};

// POI类型图标配置
const poiIcons = {
    '餐饮': 'utensils',
    '教育': 'graduation-cap',
    '交通': 'bus',
    '购物': 'shopping-bag',
    '医疗': 'heartbeat',
    '体育': 'dumbbell',
    '其它': 'building'
};

// 热力图配色方案
const heatmapColorSchemes = {
    'heat': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(33,102,172,0)',
        0.2, 'rgb(103,169,207)',
        0.4, 'rgb(209,229,240)',
        0.6, 'rgb(253,219,199)',
        0.8, 'rgb(239,138,98)',
        1, 'rgb(178,24,43)'
    ],
    'rainbow': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0,0,255,0)',
        0.2, 'rgb(0,255,255)',
        0.4, 'rgb(0,255,0)',
        0.6, 'rgb(255,255,0)',
        0.8, 'rgb(255,128,0)',
        1, 'rgb(255,0,0)'
    ],
    'mono': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0, 'rgba(0,123,255,0)',
        0.3, 'rgba(0,123,255,0.3)',
        0.6, 'rgba(0,123,255,0.6)',
        1, 'rgba(0,123,255,1)'
    ]
};

// ==================== 全局变量 ====================
let map;
let currentCity = 'nj';
let currentStation = '';
let allPOIData = [];
let stopData = {};
let currentRadius = 300;
let poiMarkers = [];
let pulseAnimations = [];
let highlightMarker = null;
let isHeatmapVisible = false;
let linesData = null; // 存储线路数据


// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', async function() {
    initMap();
    initCitySwitchEvents();
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

// ==================== 城市切换事件 ====================
function initCitySwitchEvents() {
    const cityBtns = document.querySelectorAll('.city-btn');
    const currentCityEl = document.querySelector('.current-city');

    cityBtns.forEach(btn => {
        const cityCode = btn.getAttribute('data-city');
        if (cityCode === currentCity) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
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
    
    map.flyTo({
        center: config.center,
        zoom: config.zoom,
        duration: 1000
    });

    const timeoutId = setTimeout(() => {
        console.error('切换城市超时');
        hideLoading();
        alert(`切换至${cityConfig[cityCode].name}超时，请刷新页面重试！`);
    }, 10000);

    loadCityData(cityCode)
        .then(() => {
            clearTimeout(timeoutId);
            hideLoading();
        })
        .catch(error => {
            console.error('城市数据加载错误:', error);
            clearTimeout(timeoutId);
            hideLoading();
            if (error.message && error.message.includes('加载失败')) {
                alert(`切换至${cityConfig[cityCode].name}失败：${error.message}`);
            } else {
                alert(`切换至${cityConfig[cityCode].name}失败，请检查网络连接或刷新页面重试！`);
            }
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

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
}

// ==================== 事件绑定 ====================
function bindEvents() {
    // 缓冲区半径滑块
    document.getElementById('radius-slider').addEventListener('input', (e) => {
        currentRadius = parseInt(e.target.value);
        document.getElementById('radius-value').textContent = currentRadius;
        
        if (currentStation) {
            console.log(`🔄 半径调整为 ${currentRadius}m，重新筛选POI...`);
            
            let foundKey = null;
            for (const [key, name] of Object.entries(stopData.name || {})) {
                if (name === currentStation) {
                    foundKey = key;
                    break;
                }
            }
            
            if (foundKey) {
                const stationLat = stopData.lat?.[foundKey];
                const stationLon = stopData.lon?.[foundKey];
                const stationLine = stopData.linename?.[foundKey];
                
                if (stationLat && stationLon) {
                    const filteredPOIs = filterPOIsByDistance(
                        parseFloat(stationLat),
                        parseFloat(stationLon),
                        currentRadius
                    );
                    
                    console.log(`   ✅ 新POI数量: ${filteredPOIs.length}`);
                    
                    updateMapDisplay(currentStation, filteredPOIs, stationLat, stationLon, stationLine);
                    updateStatistics(filteredPOIs);
                    
                    // 如果热力图可见，也更新热力图
                    if (isHeatmapVisible) {
                        updateHeatmap(filteredPOIs);
                    }
                }
            }
        }
    });
    
    // 热力强度滑块
    document.getElementById('heat-slider').addEventListener('input', (e) => {
        document.getElementById('heat-value').textContent = e.target.value;
    });
    
    // 更新显示按钮
    document.getElementById('update-display').addEventListener('click', () => {
        updateVisualization();
    });
    
    // 搜索输入框回车搜索
    document.getElementById('station-search-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const searchValue = e.target.value.trim();
            searchStation(searchValue);
        }
    });
}

// ==================== 数据加载 ====================
async function loadCityData(cityCode) {
    showLoading();
    console.log(`始加载城市数据: ${cityCode}`);
    
    try {
        // 加载站点数据
        console.log(`   加载站点数据: ${POI_BASE_PATH}/${cityCode}_stop.json`);
        const stopResponse = await fetch(`${POI_BASE_PATH}/${cityCode}_stop.json`);
        if (!stopResponse.ok) throw new Error('站点数据加载失败');
        stopData = await stopResponse.json();
        console.log(` 站点数据加载成功: ${Object.keys(stopData.name || {}).length} 个站点`);
        
        // 加载POI数据
        console.log(`   加载POI数据: ${POI_BASE_PATH}/POI/${cityCode}_poi.json`);
        const poiResponse = await fetch(`${POI_BASE_PATH}/POI/${cityCode}_poi.json`);
        if (!poiResponse.ok) {
            console.error('POI数据加载失败，HTTP状态:', poiResponse.status);
            throw new Error('POI数据加载失败');
        }
        const poiDataObj = await poiResponse.json();
        console.log('   原始POI数据:', poiDataObj);
        
        allPOIData = poiDataObj.pois || [];
        console.log(` POI数据加载成功: ${allPOIData.length} 个POI`);
        
        // 🆕 加载线路数据
        console.log(`   加载线路数据: ${POI_BASE_PATH}/${cityCode}_line.geojson`);
        try {
            const linesResponse = await fetch(`${POI_BASE_PATH}/${cityCode}_line.geojson`);
            if (linesResponse.ok) {
                linesData = await linesResponse.json();
                console.log(`线路数据加载成功: ${linesData.features?.length || 0} 条线路`);
                
                // 为每条线路添加颜色属性
                if (linesData && linesData.features) {
                    linesData.features.forEach(feature => {
                        const lineName = feature.properties.name;
                        feature.properties.color = lineColors[lineName] || '#999999';
                    });
                }
                
                // 绘制线路
                drawMetroLines();
            } else {
                console.warn('线路数据文件不存在，跳过线路显示');
                linesData = null;
            }
        } catch (lineError) {
            console.warn(' 线路数据加载失败:', lineError.message);
            linesData = null;
        }
        
        if (allPOIData.length > 0) {
            console.log('   POI示例:', allPOIData[0]);
            console.log('   POI类型统计:', 
                allPOIData.reduce((acc, poi) => {
                    acc[poi.type] = (acc[poi.type] || 0) + 1;
                    return acc;
                }, {})
            );
        } else {
            console.warn(' POI数据为空！');
        }
        
        hideLoading();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert(`加载${cityConfig[cityCode].name}数据失败：${error.message}\n\n请检查：\n1. data/POI/${cityCode}_poi.json 文件是否存在\n2. 文件格式是否正确\n3. 浏览器控制台查看详细错误`);
        hideLoading();
    }
}

// ==================== 站点图片加载功能 ====================
/**
 * 检查并加载站点图片
 */
async function loadStationImage(stationName) {
    const imageArea = document.querySelector('.city-image');
    const imagePath = `${IMAGE_BASE_PATH}/${stationName}.png`;
    
    console.log(`🖼️ 尝试加载站点图片: ${imagePath}`);
    
    try {
        // 创建一个临时img元素来测试图片是否存在
        const testImg = new Image();
        
        return new Promise((resolve) => {
            testImg.onload = () => {
                console.log(`   ✅ 找到站点图片: ${stationName}.png`);
                imageArea.src = imagePath;
                imageArea.alt = stationName;
                imageArea.style.display = 'block';
                resolve(true);
            };
            
            testImg.onerror = () => {
                console.log(`   ℹ️ 未找到站点图片: ${stationName}.png，使用默认图片`);
                imageArea.src = `${IMAGE_BASE_PATH}/学则路.png`;
                imageArea.alt = '默认站点';
                imageArea.style.display = 'block';
                resolve(false);
            };
            
            testImg.src = imagePath;
        });
    } catch (error) {
        console.error('   ❌ 加载图片时出错:', error);
        imageArea.style.display = 'block';
        return false;
    }
}

// ==================== 搜索站点 ====================
function searchStation(searchText) {
    if (!searchText) {
        alert('请输入站点名称');
        return;
    }
    
    const normalizedSearch = searchText.toLowerCase().trim();
    
    let foundKey = null;
    let foundStation = null;
    
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
            console.error('站点数据:', { key: foundKey, lat: stationLat, lon: stationLon });
            return;
        }
        
        currentStation = foundStation;
        
        console.log(`✅ 找到站点: ${foundStation}`);
        console.log(`   索引: ${foundKey}`);
        console.log(`   位置: [${stationLon}, ${stationLat}]`);
        console.log(`   线路: ${stationLine}`);
        
        // 加载站点图片
        loadStationImage(foundStation);
        
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
    if (!stationName) {
        clearPOIDisplay();
        return;
    }
    
    console.log(`📍 开始加载站点POI: ${stationName}`);
    
    if (!stationLat || !stationLon) {
        console.log('   未提供坐标，从stopData查找...');
        
        let foundKey = null;
        for (const [key, name] of Object.entries(stopData.name || {})) {
            if (name === stationName) {
                foundKey = key;
                break;
            }
        }
        
        if (!foundKey) {
            alert(`无法找到站点 "${stationName}" 的位置信息`);
            console.error('❌ 未找到站点key');
            return;
        }
        
        stationLat = stopData.lat?.[foundKey];
        stationLon = stopData.lon?.[foundKey];
        stationLine = stopData.linename?.[foundKey] || '-';
        
        console.log(`   找到坐标: [${stationLon}, ${stationLat}]`);
        console.log(`   线路: ${stationLine}`);
    }
    
    // 加载站点图片
    loadStationImage(stationName);
    
    document.getElementById('station-info-card').style.display = 'flex';
    document.getElementById('current-station-name').textContent = stationName;
    document.getElementById('current-station-line').textContent = stationLine || '-';
    
    console.log(`   总POI数量: ${allPOIData.length}`);
    console.log(`   当前缓冲区半径: ${currentRadius}m`);
    
    const filteredPOIs = filterPOIsByDistance(
        parseFloat(stationLat), 
        parseFloat(stationLon), 
        currentRadius
    );
    
    console.log(`   ✅ 筛选后POI数量: ${filteredPOIs.length}`);
    
    if (filteredPOIs.length === 0) {
        console.warn('   ⚠️ 未找到POI，可能需要增大缓冲区半径');
    } else {
        console.log('   POI类型分布:', 
            filteredPOIs.reduce((acc, poi) => {
                acc[poi.type] = (acc[poi.type] || 0) + 1;
                return acc;
            }, {})
        );
    }
    
    updateMapDisplay(stationName, filteredPOIs, stationLat, stationLon, stationLine);
    updateStatistics(filteredPOIs);
}

function filterPOIsByDistance(stationLat, stationLon, radiusMeters) {
    return allPOIData.filter(poi => {
        const distance = calculateDistance(
            stationLat, stationLon,
            parseFloat(poi.lat), parseFloat(poi.lon)
        );
        return distance <= radiusMeters;
    }).map(poi => {
        const distance = calculateDistance(
            stationLat, stationLon,
            parseFloat(poi.lat), parseFloat(poi.lon)
        );
        return {
            ...poi,
            distance: Math.round(distance) + 'm'
        };
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ==================== 地图更新 ====================
function updateMapDisplay(stationName, pois, stationLat, stationLon, stationLine) {
    console.log(`🗺️ 更新地图显示: ${stationName}, ${pois.length} 个POI`);
    
    poiMarkers.forEach(marker => marker.remove());
    poiMarkers = [];
    
    if (!stationLat || !stationLon) {
        console.log('   未提供坐标，从stopData查找...');
        
        let foundKey = null;
        for (const [key, name] of Object.entries(stopData.name || {})) {
            if (name === stationName) {
                foundKey = key;
                break;
            }
        }
        
        if (!foundKey) {
            console.error('❌ 未找到站点key');
            return;
        }
        
        stationLat = stopData.lat?.[foundKey];
        stationLon = stopData.lon?.[foundKey];
        stationLine = stopData.linename?.[foundKey] || '未知线路';
        
        console.log(`   找到坐标: [${stationLon}, ${stationLat}]`);
    }
    
    const stationLatFloat = parseFloat(stationLat);
    const stationLonFloat = parseFloat(stationLon);
    
    console.log(`   站点标记位置: [${stationLonFloat}, ${stationLatFloat}]`);
    
    map.flyTo({
        center: [stationLonFloat, stationLatFloat],
        zoom: 15,
        duration: 1000
    });
    
    const stationMarker = new mapboxgl.Marker({
        color: '#FF6B6B',
        scale: 1.3
    })
        .setLngLat([stationLonFloat, stationLatFloat])
        .setPopup(new mapboxgl.Popup().setHTML(`
            <div style="padding: 10px;">
                <strong style="font-size: 16px; color: #FF6B6B;">${stationName}</strong><br>
                <span style="color: #666; font-size: 13px;">${stationLine}</span>
            </div>
        `))
        .addTo(map);
    
    poiMarkers.push(stationMarker);
    console.log('   ✅ 站点标记已添加');
    
    updateRadiusCircle(stationLonFloat, stationLatFloat);
    
    console.log(`   开始添加 ${pois.length} 个POI标记...`);
    pois.forEach((poi, index) => {
        const color = poiColors[poi.type] || '#999';
        
        try {
            const marker = new mapboxgl.Marker({
                color: color,
                scale: 0.8
            })
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
        } catch (error) {
            console.error(`   ❌ 添加POI标记失败 [${index}]:`, poi.name, error);
        }
    });
    
    console.log(`   ✅ 成功添加 ${pois.length} 个POI标记`);
}

function updateRadiusCircle(stationLon, stationLat) {
    if (map.getLayer('radius-circle')) {
        map.removeLayer('radius-circle');
    }
    if (map.getLayer('radius-circle-outline')) {
        map.removeLayer('radius-circle-outline');
    }
    if (map.getSource('radius-circle')) {
        map.removeSource('radius-circle');
    }
    
    if (!stationLon || !stationLat) {
        if (!currentStation) {
            console.log('   无当前站点，跳过圆圈绘制');
            return;
        }
        
        let foundKey = null;
        for (const [key, name] of Object.entries(stopData.name || {})) {
            if (name === currentStation) {
                foundKey = key;
                break;
            }
        }
        
        if (!foundKey) {
            console.error('   ❌ 未找到站点key，无法绘制圆圈');
            return;
        }
        
        stationLon = parseFloat(stopData.lon?.[foundKey]);
        stationLat = parseFloat(stopData.lat?.[foundKey]);
        
        if (!stationLon || !stationLat) {
            console.error('   ❌ 站点坐标无效');
            return;
        }
    }
    
    const center = [stationLon, stationLat];
    
    console.log(`   绘制缓冲区圆圈: 中心[${stationLon}, ${stationLat}], 半径${currentRadius}m`);
    
    const circle = createGeoJSONCircle(center, currentRadius);
    
    map.addSource('radius-circle', {
        type: 'geojson',
        data: circle
    });
    
    map.addLayer({
        id: 'radius-circle',
        type: 'fill',
        source: 'radius-circle',
        paint: {
            'fill-color': '#FF6B6B',
            'fill-opacity': 0.1
        }
    });
    
    map.addLayer({
        id: 'radius-circle-outline',
        type: 'line',
        source: 'radius-circle',
        paint: {
            'line-color': '#FF6B6B',
            'line-width': 2,
            'line-dasharray': [2, 2]
        }
    });
}

function createGeoJSONCircle(center, radiusInMeters, points = 64) {
    const coords = {
        latitude: center[1],
        longitude: center[0]
    };
    
    const km = radiusInMeters / 1000;
    const ret = [];
    const distanceX = km / (111.32 * Math.cos(coords.latitude * Math.PI / 180));
    const distanceY = km / 111.32;
    
    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
    }
    ret.push(ret[0]);
    
    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [ret]
        }
    };
}

// ==================== POI热力图功能 ====================
/**
 * 更新热力图显示
 */
function updateHeatmap(pois) {
    console.log('🔥 更新热力图...');
    
    // 移除旧的热力图图层
    if (map.getLayer('poi-heatmap')) {
        map.removeLayer('poi-heatmap');
    }
    if (map.getSource('poi-heatmap')) {
        map.removeSource('poi-heatmap');
    }
    
    if (!pois || pois.length === 0) {
        console.log('   没有POI数据，跳过热力图生成');
        isHeatmapVisible = false;
        return;
    }
    
    // 获取热力强度和配色方案
    const heatIntensity = parseInt(document.getElementById('heat-slider').value) / 100;
    const colorScheme = document.getElementById('color-scheme').value;
    
    console.log(`   热力强度: ${heatIntensity}, 配色: ${colorScheme}, POI数量: ${pois.length}`);
    
    // 将POI数据转换为GeoJSON格式
    const geojsonData = {
        type: 'FeatureCollection',
        features: pois.map(poi => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [parseFloat(poi.lon), parseFloat(poi.lat)]
            },
            properties: {
                type: poi.type,
                name: poi.name
            }
        }))
    };
    
    // 添加热力图数据源
    map.addSource('poi-heatmap', {
        type: 'geojson',
        data: geojsonData
    });
    
    // 添加热力图图层
    map.addLayer({
        id: 'poi-heatmap',
        type: 'heatmap',
        source: 'poi-heatmap',
        maxzoom: 18,
        paint: {
            // 热力图权重
            'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                18, 1
            ],
            // 热力图强度
            'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, heatIntensity,
                18, heatIntensity * 1.5
            ],
            // 热力图颜色
            'heatmap-color': heatmapColorSchemes[colorScheme] || heatmapColorSchemes['heat'],
            // 热力图半径
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 2,
                9, 20,
                15, 40,
                18, 60
            ],
            // 热力图透明度
            'heatmap-opacity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                7, 0.8,
                18, 0.6
            ]
        }
    }, 'radius-circle'); // 将热力图放在缓冲区圆圈下方
    
    isHeatmapVisible = true;
    console.log('   ✅ 热力图已生成');
}

/**
 * 移除热力图
 */
function removeHeatmap() {
    if (map.getLayer('poi-heatmap')) {
        map.removeLayer('poi-heatmap');
    }
    if (map.getSource('poi-heatmap')) {
        map.removeSource('poi-heatmap');
    }
    isHeatmapVisible = false;
    console.log('   ✅ 热力图已移除');
}

/**
 * 更新可视化显示（热力图等）
 */
function updateVisualization() {
    if (!currentStation) {
        alert('请先选择站点');
        return;
    }
    
    const heatIntensity = parseInt(document.getElementById('heat-slider').value);
    const colorScheme = document.getElementById('color-scheme').value;
    
    console.log('更新可视化:', { 
        heatIntensity, 
        colorScheme, 
        radius: currentRadius 
    });
    
    // 获取当前站点的POI数据
    let foundKey = null;
    for (const [key, name] of Object.entries(stopData.name || {})) {
        if (name === currentStation) {
            foundKey = key;
            break;
        }
    }
    
    if (foundKey) {
        const stationLat = stopData.lat?.[foundKey];
        const stationLon = stopData.lon?.[foundKey];
        
        if (stationLat && stationLon) {
            const filteredPOIs = filterPOIsByDistance(
                parseFloat(stationLat),
                parseFloat(stationLon),
                currentRadius
            );
            
            // 切换热力图显示
            if (isHeatmapVisible) {
                removeHeatmap();
                alert('热力图已关闭');
            } else {
                updateHeatmap(filteredPOIs);
                alert(`热力图已开启！\n\n热力强度: ${heatIntensity}%\n配色方案: ${colorScheme}\n缓冲半径: ${currentRadius}m\nPOI数量: ${filteredPOIs.length}`);
            }
        }
    }
}

// ==================== 统计分析 ====================
function updateStatistics(pois) {
    const statistics = {};
    let total = 0;
    
    pois.forEach(poi => {
        const type = poi.type || '其它';
        statistics[type] = (statistics[type] || 0) + 1;
        total++;
    });
    
    const percentages = {};
    Object.keys(statistics).forEach(type => {
        percentages[type] = Math.round((statistics[type] / total) * 100);
    });
    
    drawPieChart(percentages);
    updateLegend(percentages);
    document.getElementById('total-poi').textContent = total;
}

function drawPieChart(percentages) {
    const canvas = document.getElementById('pie-chart');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let startAngle = -Math.PI / 2;
    
    Object.entries(percentages).forEach(([type, percentage]) => {
        const sliceAngle = (percentage / 100) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = poiColors[type] || '#999';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        if (percentage >= 5) {
            const labelAngle = startAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.65);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.65);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${percentage}%`, labelX, labelY);
        }
        
        startAngle += sliceAngle;
    });
}

function updateLegend(percentages) {
    const legendContainer = document.getElementById('chart-legend');
    let html = '';
    
    Object.entries(percentages).forEach(([type, percentage]) => {
        const color = poiColors[type] || '#999';
        html += `
            <div class="legend-item">
                <div class="legend-color" style="background: ${color}"></div>
                <span class="legend-label">${type}</span>
                <span class="legend-value">${percentage}%</span>
            </div>
        `;
    });
    
    legendContainer.innerHTML = html;
}

// ==================== 辅助函数 ====================
function clearPOIDisplay() {
    document.getElementById('station-info-card').style.display = 'none';
    document.getElementById('total-poi').textContent = '0';
    document.getElementById('chart-legend').innerHTML = '';
    
    const canvas = document.getElementById('pie-chart');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    poiMarkers.forEach(marker => marker.remove());
    poiMarkers = [];
    
    if (map.getLayer('radius-circle')) {
        map.removeLayer('radius-circle');
        map.removeLayer('radius-circle-outline');
    }
    if (map.getSource('radius-circle')) {
        map.removeSource('radius-circle');
    }
    
    removeHeatmap();
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function clearMapMarkers() {
    poiMarkers.forEach(marker => marker.remove());
    poiMarkers = [];
}

// ==================== 站点高亮动画 ====================
function addStationHighlight(lon, lat) {
    removeStationHighlight();
    
    const point = map.project([lon, lat]);
    const mapContainer = document.getElementById('surroundings-map');
    
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const pulse = document.createElement('div');
            pulse.className = 'station-pulse';
            pulse.style.left = point.x + 'px';
            pulse.style.top = point.y + 'px';
            mapContainer.appendChild(pulse);
            pulseAnimations.push(pulse);
            
            setTimeout(() => {
                if (pulse.parentNode) {
                    pulse.parentNode.removeChild(pulse);
                }
            }, 2000);
        }, i * 600);
    }
    
    setTimeout(() => {
        removeStationHighlight();
    }, 5000);
}

function removeStationHighlight() {
    pulseAnimations.forEach(pulse => {
        if (pulse.parentNode) {
            pulse.parentNode.removeChild(pulse);
        }
    });
    pulseAnimations = [];
    
    if (highlightMarker) {
        highlightMarker.remove();
        highlightMarker = null;
    }
}

map.on('move', function() {
    if (currentStation && pulseAnimations.length > 0) {
        const stationKeys = Object.keys(stopData.name || {});
        const stationValues = Object.values(stopData.name || {});
        const stationIndex = stationValues.indexOf(currentStation);
        
        if (stationIndex !== -1) {
            const key = stationKeys[stationIndex];
            const stationLon = parseFloat(stopData.lon[key]);
            const stationLat = parseFloat(stopData.lat[key]);
            const point = map.project([stationLon, stationLat]);
            
            pulseAnimations.forEach(pulse => {
                pulse.style.left = point.x + 'px';
                pulse.style.top = point.y + 'px';
            });
        }
    }
});