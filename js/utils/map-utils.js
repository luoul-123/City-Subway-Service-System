/**
 * 地图工具函数
 */

// 绘制路线
window.drawRouteLine = function(map, coordinates) {
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
};

// 生成模拟路线坐标
window.generateMockRouteCoordinates = function(startMarker, endMarker) {
    if (!startMarker || !endMarker) return [];
    
    const start = startMarker._data?.poi || startMarker._data?.station;
    const end = endMarker._data?.poi || endMarker._data?.station;
    
    if (!start || !end) return [];
    
    const startLngLat = [start.wgsLon, start.wgsLat];
    const endLngLat = [end.wgsLon, end.wgsLat];
    
    const coordinates = [startLngLat];
    
    // 生成中间点
    const steps = 5;
    for (let i = 1; i < steps; i++) {
        const ratio = i / steps;
        const randomOffset = (Math.random() - 0.5) * 0.05;
        coordinates.push([
            startLngLat[0] + (endLngLat[0] - startLngLat[0]) * ratio + randomOffset,
            startLngLat[1] + (endLngLat[1] - startLngLat[1]) * ratio + randomOffset * 0.5
        ]);
    }
    
    coordinates.push(endLngLat);
    return coordinates;
};

// 清除路线
window.clearRoute = function(map) {
    if (map.getSource('route-source')) {
        map.removeLayer('route-layer');
        map.removeSource('route-source');
    }
};

// 初始化精度圈图层
window.initAccuracyLayer = function(map) {
    if (!map.getSource('user-accuracy-source')) {
        map.addSource('user-accuracy-source', { 
            type: 'geojson', 
            data: { 
                type: 'FeatureCollection', 
                features: [] 
            } 
        });
        
        map.addLayer({
            id: 'user-accuracy-layer',
            type: 'circle',
            source: 'user-accuracy-source',
            paint: {
                'circle-radius': ['get', 'accuracy'],
                'circle-color': 'rgba(0, 123, 255, 0.2)',
                'circle-stroke-color': '#007bff',
                'circle-stroke-width': 1,
                'circle-stroke-dasharray': [2, 2]
            }
        });
    }
};

// 更新精度圈
window.updateAccuracyCircle = function(map, lng, lat, accuracy) {
    if (map.getSource('user-accuracy-source')) {
        map.getSource('user-accuracy-source').setData({
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: { 
                    type: 'Point', 
                    coordinates: [lng, lat] 
                },
                properties: { 
                    accuracy: accuracy 
                }
            }]
        });
    }
};