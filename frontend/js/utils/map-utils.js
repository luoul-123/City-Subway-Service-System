/**
 * 地图工具函数
 */

// 绘制路线
window.drawRouteLine = function(map, coordinates) {
    // 移除现有路线，避免图层冲突
    if (map.getSource('route-source')) {
        if (map.getLayer('route-layer')) {
            map.removeLayer('route-layer');
        }
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
            'line-color': '#1a2a6c',  // 线路颜色，可根据线路调整
            'line-width': 4,
            'line-opacity': 0.7
        }
    });
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