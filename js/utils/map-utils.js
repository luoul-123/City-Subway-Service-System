// 清除地图标记和路线
function clearMarkersAndRoutes(map, startMarker, endMarker, userLocationMarker) {
    if (startMarker) startMarker.remove();
    if (endMarker) endMarker.remove();
    if (userLocationMarker) userLocationMarker.remove();
    
    if (map.getSource('route-source')) {
        map.removeLayer('route-layer');
        map.removeSource('route-source');
    }
    
    // 清空输入框和结果面板
    document.getElementById('start-station').value = '';
    document.getElementById('end-station').value = '';
    document.getElementById('result-panel').style.display = 'none';
    
    return { startMarker: null, endMarker: null, userLocationMarker: null };
}

// 绘制路线
function drawRouteLine(map, coordinates) {
    // 移除现有路线
    if (map.getSource('route-source')) {
        map.removeLayer('route-layer');
        map.removeSource('route-source');
    }
    
    // 添加新路线
    map.addSource('route-source', {
        'type': 'geojson',
        'data': {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'LineString',
                'coordinates': coordinates
            }
        }
    });
    
    map.addLayer({
        'id': 'route-layer',
        'type': 'line',
        'source': 'route-source',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#1a2a6c',
            'line-width': 4,
            'line-opacity': 0.7
        }
    });
    
    // 调整地图视野
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds, { padding: 50, duration: 1000 });
}

// 生成模拟路线坐标
function generateMockRouteCoordinates(startMarker, endMarker) {
    if (!startMarker || !endMarker) return [];
    
    const start = startMarker.coordinates;
    const end = endMarker.coordinates;
    const coordinates = [start];
    
    // 生成中间点
    const steps = 5;
    for (let i = 1; i < steps; i++) {
        const ratio = i / steps;
        const randomOffset = (Math.random() - 0.5) * 0.05;
        coordinates.push([
            start[0] + (end[0] - start[0]) * ratio + randomOffset,
            start[1] + (end[1] - start[1]) * ratio + randomOffset * 0.5
        ]);
    }
    
    coordinates.push(end);
    return coordinates;
}

function createPOIMarker(map, poi, type) {
    // 移除旧标记
    if (type === 'start' && window.startMarker) {
        window.startMarker.remove();
        // 同时移除POI名称标签
        removePOILabel(window.startMarker);
    } else if (type === 'end' && window.endMarker) {
        window.endMarker.remove();
        removePOILabel(window.endMarker);
    }
    
    // 创建标记
    const el = document.createElement('div');
    el.className = `poi-marker ${type}-marker`;
    el.innerHTML = `<i class="fas fa-map-marker-alt"></i>`;
    
    const marker = new mapboxgl.Marker(el)
        .setLngLat([poi.wgsLon, poi.wgsLat])
        .addTo(map);
    
    // 存储POI信息
    marker._poiInfo = poi;
    marker._type = type;
    
    // 添加弹窗
    const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
            <div class="poi-popup">
                <h3>${poi.name}</h3>
                <div class="poi-popup-type">${poi.type}</div>
                ${poi.address ? `<div class="poi-popup-address">${poi.address}</div>` : ''}
                <div class="poi-popup-coords">${poi.wgsLon.toFixed(6)}, ${poi.wgsLat.toFixed(6)}</div>
            </div>
        `);
    
    marker.setPopup(popup);
    
    // 添加POI名称标签
    addPOILabel(map, marker, poi, type);
    
    // 更新全局引用
    if (type === 'start') {
        window.startMarker = marker;
    } else {
        window.endMarker = marker;
    }
    
    return marker;
}

/**
 * 为POI添加名称标签
 */
function addPOILabel(map, marker, poi, type) {
    const labelEl = document.createElement('div');
    labelEl.className = `poi-name-label ${type}-poi-label`;
    labelEl.innerHTML = `
        <span>${poi.name}</span>
    `;
    
    marker._labelElement = labelEl;
    updatePOILabelPosition(marker);
    
    map.on('move', () => updatePOILabelPosition(marker));
}

/**
 * 更新POI标签位置
 */
function updatePOILabelPosition(marker) {
    if (!marker._labelElement) return;
    
    const map = marker._map;
    const lngLat = marker.getLngLat();
    const pos = map.project(lngLat);
    
    const labelEl = marker._labelElement;
    labelEl.style.position = 'absolute';
    labelEl.style.left = `${pos.x}px`;
    labelEl.style.top = `${pos.y - 35}px`;
    labelEl.style.transform = 'translateX(-50%)';
    labelEl.style.padding = '3px 8px';
    labelEl.style.fontSize = '11px';
    labelEl.style.zIndex = '9';
    
    if (!labelEl.parentNode) {
        const mapContainer = map.getContainer();
        mapContainer.appendChild(labelEl);
    }
}

/**
 * 移除POI标签
 */
function removePOILabel(marker) {
    if (marker && marker._labelElement && marker._labelElement.parentNode) {
        marker._labelElement.parentNode.removeChild(marker._labelElement);
    }
}