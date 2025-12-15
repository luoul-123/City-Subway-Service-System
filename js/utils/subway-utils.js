/**
 * 寻找最近地铁站工具函数
 */


/**
 * 处理站点数据去重
 * @param {Object} rawStops
 * @returns {Array} 
 */
window.uniqueStations = function(rawStops) {
    // 容错：如果传入的是数组，直接处理；如果是对象，先转换为数组
    let stationsArray = [];

    // 步骤1：将 xx_stop.json 的对象格式转换为站点数组
    if (typeof rawStops === 'object' && rawStops.name && !Array.isArray(rawStops)) {
        // 获取所有索引（如 0,1,2...）
        const indices = Object.keys(rawStops.name);
        
        // 遍历索引，组装每个站点的完整信息
        stationsArray = indices.map(index => ({
            id: parseInt(index),
            name: rawStops.name[index] || '',
            lineName: rawStops.linename[index] || '',
            lineId: rawStops.x[index] || '',
            direction: rawStops.direction[index] || '',
            lon: parseFloat(rawStops.lon[index]) || 0,
            lat: parseFloat(rawStops.lat[index]) || 0,
            num: parseInt(rawStops.num[index]) || 0
        }));
    } else if (Array.isArray(rawStops)) {
        // 如果已经是数组，直接使用
        stationsArray = rawStops;
    } else {
        console.error('站点数据格式错误，无法转换:', rawStops);
        return [];
    }

    // 步骤2：按「站名+线路编号+方向」去重
    const uniqueMap = new Map();
    stationsArray.forEach(station => {
        // 生成唯一标识：站名 + 线路编号 + 方向（避免同一站点不同索引重复）
        const uniqueKey = `${station.name}-${station.lineId}-${station.direction}`;
        if (!uniqueMap.has(uniqueKey)) {
            uniqueMap.set(uniqueKey, station);
        }
    });

    // 转换为数组返回
    const uniqueStations = Array.from(uniqueMap.values());
    console.log(`站点数据去重完成：原始${stationsArray.length}个 → 去重后${uniqueStations.length}个`);
    return uniqueStations;
};

/**
 * 计算两点经纬度之间的直线距离（米）
 * @param {number} lat1 - 起点纬度
 * @param {number} lon1 - 起点经度
 * @param {number} lat2 - 终点纬度
 * @param {number} lon2 - 终点经度
 * @returns {number} 距离（米）
 */
window.calculateDistance = function(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球半径（米）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

/**
 * 查找距离目标点最近的地铁站
 * @param {Array} stations - 去重后的地铁站数组
 * @param {number} targetLat - 目标点纬度（WGS84）
 * @param {number} targetLon - 目标点经度（WGS84）
 * @returns {Object|null} 最近的地铁站信息（含距离）
 */
window.findNearestStation = function(stations, targetLat, targetLon) {
    if (!stations.length) return null;

    let nearest = stations[0];
    let minDistance = calculateDistance(
        targetLat, targetLon,
        nearest.wgsLat, nearest.wgsLon
    );

    stations.forEach(station => {
        const distance = calculateDistance(
            targetLat, targetLon,
            station.wgsLat, station.wgsLon
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearest = station;
        }
    });

    return { ...nearest, distance: minDistance };
};

/**
 * 在地图上标记最近的地铁站
 * @param {Object} map - Mapbox地图实例
 * @param {Object} station - 地铁站信息
 * @param {string} type - 类型（start/end）
 * @returns {Object} 标记实例
 */
window.markNearestStation = function(map, station, type) {
    // 创建自定义标记元素
    const el = document.createElement('div');
    el.className = `subway-marker ${type}-subway-marker`;
    el.innerHTML = `<i class="fas fa-subway"></i>`;
    
    // 创建标记
    const marker = new mapboxgl.Marker(el)
        .setLngLat([station.wgsLon, station.wgsLat])
        .addTo(map);
    
    // 为标记添加自定义数据
    marker._stationInfo = station;
    marker._type = type;
    
    // 添加弹窗
    const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
            <div class="subway-popup">
                <h3>${station.name}</h3>
                <p>线路：${station.linename}</p>
                <p>距离：${(station.distance / 1000).toFixed(2)}公里</p>
            </div>
        `);
    
    marker.setPopup(popup);
    
    // 添加站名标签（使用自定义overlay）
    addStationLabel(map, marker, station, type);
    
    return marker;
};

/**
 * 为地铁站标记添加名称标签
 */
function addStationLabel(map, marker, station, type) {
    // 创建标签元素
    const labelEl = document.createElement('div');
    labelEl.className = 'subway-station-label';
    labelEl.innerHTML = `
        <span style="color: ${type === 'start' ? '#28a745' : '#dc3545'}; font-weight: bold;">
            ${station.name}
        </span>
    `;
    
    // 存储标签元素引用
    marker._labelElement = labelEl;
    
    // 更新标签位置
    updateLabelPosition(marker);
    
    // 监听地图移动事件更新标签位置
    map.on('move', () => updateLabelPosition(marker));
}

/**
 * 更新标签位置
 */
function updateLabelPosition(marker) {
    if (!marker._labelElement) return;
    
    const map = marker._map;
    const lngLat = marker.getLngLat();
    const pos = map.project(lngLat);
    
    const labelEl = marker._labelElement;
    labelEl.style.position = 'absolute';
    labelEl.style.left = `${pos.x}px`;
    labelEl.style.top = `${pos.y - 40}px`; // 在标记上方显示
    labelEl.style.transform = 'translateX(-50%)';
    
    // 如果标签不在DOM中，添加到地图容器
    if (!labelEl.parentNode) {
        const mapContainer = map.getContainer();
        mapContainer.appendChild(labelEl);
    }
}

/**
 * 移除标记和标签
 */
window.removeSubwayMarker = function(marker) {
    if (!marker) return;
    
    // 移除标记
    marker.remove();
    
    // 移除标签
    if (marker._labelElement && marker._labelElement.parentNode) {
        marker._labelElement.parentNode.removeChild(marker._labelElement);
    }
    
    // 移除地图移动事件的监听
    if (marker._map) {
        // 在实际项目中，需要管理事件监听器的引用
    }
};