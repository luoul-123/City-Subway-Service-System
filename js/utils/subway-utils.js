/**
 * 寻找最近地铁站工具函数
 */

/**
 * 对地铁站数据进行去重（同一站点可能因不同方向重复）
 * @param {Array} rawStops - 原始站点数据
 * @returns {Array} 去重后的站点数据
 */
window.uniqueStations = function(rawStops) {
    const seen = new Set();
    return rawStops.filter(stop => {
        // 基于经纬度和名称组合去重（同一站点核心信息唯一）
        const key = `${stop.wgsLon.toFixed(6)},${stop.wgsLat.toFixed(6)},${stop.name}`;
        if (!seen.has(key)) {
            seen.add(key);
            return true;
        }
        return false;
    });
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