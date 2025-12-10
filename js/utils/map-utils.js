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

// 创建POI标记
function createPOIMarker(map, poi, type) {
    // 移除旧标记
    if (type === 'start' && window.startMarker) window.startMarker.remove();
    if (type === 'end' && window.endMarker) window.endMarker.remove();
    
    // 创建新标记元素
    const el = document.createElement('div');
    el.className = `poi-marker ${type === 'start' ? 'start-marker' : 'end-marker'}`;
    el.innerHTML = `<i class="fas ${type === 'start' ? 'fa-location-arrow' : 'fa-map-marker-alt'}"></i>`;
    
    // 创建标记并添加到地图
    const marker = new mapboxgl.Marker(el)
        .setLngLat([poi.wgsLon, poi.wgsLat])
        .addTo(map);
    
    // 绑定弹窗
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
        .setHTML(`
            <div class="poi-popup">
                <h3>${poi.name}</h3>
                <p><span class="poi-popup-type">${poi.type}</span></p>
                <p class="poi-popup-address">${poi.address || '无详细地址'}</p>
                <p class="poi-popup-coords">坐标: ${poi.wgsLon.toFixed(6)}, ${poi.wgsLat.toFixed(6)}</p>
            </div>
        `);
    
    el.addEventListener('click', () => popup.addTo(map));
    
    // 保存标记引用
    marker.coordinates = [poi.wgsLon, poi.wgsLat];
    if (type === 'start') window.startMarker = marker;
    if (type === 'end') window.endMarker = marker;
    
    return marker;
}