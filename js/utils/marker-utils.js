/**
 * 标记管理工具函数
 */

class MarkerManager {
    constructor(map, iconConfig = {}) {
        this.map = map;
        this.markers = {
            startPOI: null,
            endPOI: null,
            startSubway: null,
            endSubway: null,
            userLocation: null
        };
        this.labelSources = new Map();
        this.labelLayers = new Map();
        this.markerSources = new Map();
        this.markerLayers = new Map();
        
        // 存储标记的原始数据
        this.markerData = {
            startPOI: null,
            endPOI: null,
            startSubway: null,
            endSubway: null
        };

        // 添加路线标记存储
        this.routeMarkers = []; // 存储路线标记
        this.intersectionMarkers = []; // 存储换乘站标记
        
        // 存储路线数据
        this.routeData = null;
        
        // 图标配置 - 使用自定义图片路径
        this.iconConfig = {
            startPin: iconConfig.startPin || 'images/markers/start-pin.png',
            endPin: iconConfig.endPin || 'images/markers/end-pin.png',
            startSubway: iconConfig.startSubway || 'images/markers/start-subway.png',
            endSubway: iconConfig.endSubway || 'images/markers/end-subway.png'
        };
        
        // 图标加载状态
        this.iconsLoaded = false;
        
        // 如果地图已加载，直接加载图标
        if (map.loaded()) {
            this.loadIcons();
        } else {
            // 否则在地图加载后加载图标
            map.once('load', () => this.loadIcons());
        }
    }

    /**
     * 加载所有图标
     */
    loadIcons() {
        try {
            console.log('开始加载自定义图标...');
            
            // 定义需要加载的图标
            const icons = [
                { name: 'start-pin', url: this.iconConfig.startPin },
                { name: 'end-pin', url: this.iconConfig.endPin },
                { name: 'start-subway', url: this.iconConfig.startSubway },
                { name: 'end-subway', url: this.iconConfig.endSubway }
            ];

            // 加载所有图标
            const loadPromises = icons.map(icon => this.loadIcon(icon.name, icon.url));
            
            Promise.all(loadPromises)
                .then(() => {
                    this.iconsLoaded = true;
                    console.log('所有自定义图标加载完成');
                })
                .catch(error => {
                    console.error('图标加载失败:', error);
                    this.iconsLoaded = true; // 即使失败也继续
                });
            
        } catch (error) {
            console.error('加载图标失败:', error);
            this.iconsLoaded = true;
        }
    }

    /**
     * 加载单个图标
     */
    async loadIcon(iconName, iconUrl) {
        // 如果图标已存在，直接返回
        if (this.map.hasImage(iconName)) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            console.log(`加载图标: ${iconName} from ${iconUrl}`);
            
            const img = new Image();
            
            img.onload = () => {
                try {
                    if (!this.map.hasImage(iconName)) {
                        this.map.addImage(iconName, img);
                        console.log(`图标 ${iconName} 加载成功`);
                    }
                    resolve();
                } catch (error) {
                    console.error(`添加图标 ${iconName} 失败:`, error);
                    reject(error);
                }
            };
            
            img.onerror = (error) => {
                console.error(`加载图标 ${iconName} 失败:`, error);
                reject(error);
            };
            
            // 设置跨域属性
            img.crossOrigin = 'anonymous';
            img.src = iconUrl;
        });
    }

    /**
     * 等待图标加载完成
     */
    async waitForIcons() {
        if (this.iconsLoaded) return;
        
        return new Promise((resolve) => {
            const maxWaitTime = 5000;
            const startTime = Date.now();
            
            const checkInterval = setInterval(() => {
                if (this.iconsLoaded || Date.now() - startTime > maxWaitTime) {
                    clearInterval(checkInterval);
                    if (!this.iconsLoaded) {
                        console.warn('图标加载超时，继续执行');
                    }
                    resolve();
                }
            }, 100);
        });
    }

    /**
     * 创建POI标记
     */
    async createPOIMarker(poi, type) {
        await this.waitForIcons();
        
        this.removeMarker(type + 'POI');

        const sourceId = `poi-${type}-source`;
        const layerId = `poi-${type}-layer`;
        const labelSourceId = `poi-${type}-label-source`;
        const labelLayerId = `poi-${type}-label-layer`;

        // 存储标记数据
        this.markerData[type + 'POI'] = {
            poi: poi,
            coordinates: [poi.wgsLon, poi.wgsLat],
            type: type
        };

        try {
            if (!this.map.getSource(sourceId)) {
                this.map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [poi.wgsLon, poi.wgsLat]
                            },
                            properties: {
                                id: poi.id || poi.name,
                                name: poi.name,
                                type: 'poi',
                                markerType: type,
                                poiData: poi
                            }
                        }]
                    }
                });
            }

            // 选择图标
            const iconImage = type === 'start' ? 'start-pin' : 'end-pin';

            // 创建标记图层
            if (!this.map.getLayer(layerId)) {
                this.map.addLayer({
                    id: layerId,
                    type: 'symbol',
                    source: sourceId,
                    layout: {
                        'icon-image': iconImage,
                        'icon-size': 1.0,
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                    }
                });
            }

            // 创建标签数据源
            if (!this.map.getSource(labelSourceId)) {
                this.map.addSource(labelSourceId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [poi.wgsLon, poi.wgsLat]
                            },
                            properties: {
                                name: poi.name,
                                type: type
                            }
                        }]
                    }
                });
            }

            // 创建标签图层 - 使用与地铁站相同的样式
            if (!this.map.getLayer(labelLayerId)) {
                this.map.addLayer({
                    id: labelLayerId,
                    type: 'symbol',
                    source: labelSourceId,
                    layout: {
                        'text-field': ['get', 'name'],
                        'text-font': ['Noto Sans CJK SC Regular'],
                        'text-size': 11,          // 从12改为11，与地铁站统一
                        'text-offset': [0, 1.5],  // 从[0, 1.8]改为[0, 1.5]，与地铁站统一
                        'text-anchor': 'top',
                        'text-max-width': 8,      // 从10改为8，与地铁站统一
                        'text-allow-overlap': false
                    },
                    paint: {
                        'text-color': type === 'start' ? '#007bff' : '#dc3545', // 起点蓝色，终点红色
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 2
                    }
                });
            }

            // 添加弹窗交互
            this.map.off('click', layerId);
            this.map.on('click', layerId, (e) => {
                const feature = e.features[0];
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(this.createPOIPopupContent(feature.properties.poiData))
                    .setLngLat(e.lngLat)
                    .addTo(this.map);
            });

            // 鼠标悬停效果
            this.map.off('mouseenter', layerId);
            this.map.on('mouseenter', layerId, () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });
            
            this.map.off('mouseleave', layerId);
            this.map.on('mouseleave', layerId, () => {
                this.map.getCanvas().style.cursor = '';
            });

            // 存储引用
            this.markerSources.set(type + 'POI', sourceId);
            this.markerLayers.set(type + 'POI', layerId);
            this.labelSources.set(type + 'POI', labelSourceId);
            this.labelLayers.set(type + 'POI', labelLayerId);
            
            this.markers[type + 'POI'] = {
                type: 'poi',
                data: poi,
                sourceId: sourceId,
                layerId: layerId,
                labelSourceId: labelSourceId,
                labelLayerId: labelLayerId
            };

            console.log(`创建${type} POI标记成功: ${poi.name}`);
            return this.markers[type + 'POI'];
            
        } catch (error) {
            console.error(`创建${type} POI标记失败:`, error);
            throw error;
        }
    }

    /**
     * 创建地铁站标记
     */
    async createSubwayMarker(station, type) {
        await this.waitForIcons();
        
        this.removeMarker(type + 'Subway');

        const sourceId = `subway-${type}-source`;
        const layerId = `subway-${type}-layer`;
        const labelSourceId = `subway-${type}-label-source`;
        const labelLayerId = `subway-${type}-label-layer`;

        // 存储标记数据
        this.markerData[type + 'Subway'] = {
            station: station,
            coordinates: [station.wgsLon, station.wgsLat],
            type: type
        };

        try {
            // 创建标记数据源
            if (!this.map.getSource(sourceId)) {
                this.map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [station.wgsLon, station.wgsLat]
                            },
                            properties: {
                                id: station.id,
                                name: station.name,
                                type: 'subway',
                                markerType: type,
                                stationData: station
                            }
                        }]
                    }
                });
            }

            // 选择图标
            const iconImage = type === 'start' ? 'start-subway' : 'end-subway';

            // 创建标记图层
            if (!this.map.getLayer(layerId)) {
                this.map.addLayer({
                    id: layerId,
                    type: 'symbol',
                    source: sourceId,
                    layout: {
                        'icon-image': iconImage,
                        'icon-size': 1.0,
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true
                    }
                });
            }

            // 创建标签数据源
            if (!this.map.getSource(labelSourceId)) {
                this.map.addSource(labelSourceId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [station.wgsLon, station.wgsLat]
                            },
                            properties: {
                                name: station.name,
                                type: type,
                                distance: station.distance ? `${(station.distance / 1000).toFixed(2)}km` : ''
                            }
                        }]
                    }
                });
            }

            // 创建标签图层
            if (!this.map.getLayer(labelLayerId)) {
                this.map.addLayer({
                    id: labelLayerId,
                    type: 'symbol',
                    source: labelSourceId,
                    layout: {
                        'text-field': ['get', 'name'],
                        'text-font': ['Noto Sans CJK SC Regular'],
                        'text-size': 11,
                        'text-offset': [0, 1.5],
                        'text-anchor': 'top',
                        'text-max-width': 8,
                        'text-allow-overlap': false
                    },
                    paint: {
                        'text-color': type === 'start' ? '#007bff' : '#dc3545',
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 2
                    }
                });
            }

            // 添加弹窗交互
            this.map.off('click', layerId);
            this.map.on('click', layerId, (e) => {
                const feature = e.features[0];
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML(this.createSubwayPopupContent(feature.properties.stationData))
                    .setLngLat(e.lngLat)
                    .addTo(this.map);
            });

            // 鼠标悬停效果
            this.map.off('mouseenter', layerId);
            this.map.on('mouseenter', layerId, () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });
            
            this.map.off('mouseleave', layerId);
            this.map.on('mouseleave', layerId, () => {
                this.map.getCanvas().style.cursor = '';
            });

            // 存储引用
            this.markerSources.set(type + 'Subway', sourceId);
            this.markerLayers.set(type + 'Subway', layerId);
            this.labelSources.set(type + 'Subway', labelSourceId);
            this.labelLayers.set(type + 'Subway', labelLayerId);
            
            this.markers[type + 'Subway'] = {
                type: 'subway',
                data: station,
                sourceId: sourceId,
                layerId: layerId,
                labelSourceId: labelSourceId,
                labelLayerId: labelLayerId
            };

            console.log(`创建${type} 地铁站标记成功: ${station.name}`);
            return this.markers[type + 'Subway'];
            
        } catch (error) {
            console.error(`创建${type} 地铁站标记失败:`, error);
            throw error;
        }
    }

    /**
     * 创建用户位置标记
     */
    createUserLocationMarker(lngLat) {
        this.removeMarker('userLocation');

        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.innerHTML = '<i class="fas fa-location-dot"></i>';
        el.style.color = '#007bff';
        el.style.fontSize = '24px';
        el.style.textShadow = '0 0 3px white';

        const marker = new mapboxgl.Marker(el)
            .setLngLat(lngLat)
            .addTo(this.map);

        this.markers.userLocation = marker;
        return marker;
    }

    /**
     * 移除标记
     */
    removeMarker(markerKey) {
        const marker = this.markers[markerKey];
        if (!marker) return;

        if (marker.type) {
            // 对于Mapbox图层标记
            const layerId = this.markerLayers.get(markerKey);
            const sourceId = this.markerSources.get(markerKey);
            const labelLayerId = this.labelLayers.get(markerKey);
            const labelSourceId = this.labelSources.get(markerKey);

            if (layerId && this.map.getLayer(layerId)) {
                // 移除事件监听器
                this.map.off('click', layerId);
                this.map.off('mouseenter', layerId);
                this.map.off('mouseleave', layerId);
                
                // 移除图层
                this.map.removeLayer(layerId);
                this.markerLayers.delete(markerKey);
            }

            if (sourceId && this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
                this.markerSources.delete(markerKey);
            }

            if (labelLayerId && this.map.getLayer(labelLayerId)) {
                this.map.removeLayer(labelLayerId);
                this.labelLayers.delete(markerKey);
            }

            if (labelSourceId && this.map.getSource(labelSourceId)) {
                this.map.removeSource(labelSourceId);
                this.labelSources.delete(markerKey);
            }
        } else {
            // 对于传统标记（用户位置）
            if (marker.remove) {
                marker.remove();
            }
        }

        this.markers[markerKey] = null;
        this.markerData[markerKey] = null;
    }

    /**
     * 清除所有标记
     */
    clearAllMarkers() {
        Object.keys(this.markers).forEach(key => {
            this.removeMarker(key);
        });
    }

    /**
     * 交换起点终点标记
     */
    async swapStartEndMarkers() {
        console.log('交换起点终点标记...');
        
        // 交换POI标记
        const startPOIData = this.markerData.startPOI;
        const endPOIData = this.markerData.endPOI;
        
        if (startPOIData && endPOIData) {
            console.log('交换POI标记位置');
            
            // 交换数据
            [this.markerData.startPOI, this.markerData.endPOI] = 
                [this.markerData.endPOI, this.markerData.startPOI];
            
            // 更新起点标记位置
            if (this.markers.startPOI && this.markers.startPOI.sourceId) {
                const sourceId = this.markers.startPOI.sourceId;
                const source = this.map.getSource(sourceId);
                if (source) {
                    source.setData({
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: endPOIData.coordinates
                            },
                            properties: {
                                ...this.markers.startPOI.data,
                                markerType: 'start'
                            }
                        }]
                    });
                }
            }
            
            // 更新终点标记位置
            if (this.markers.endPOI && this.markers.endPOI.sourceId) {
                const sourceId = this.markers.endPOI.sourceId;
                const source = this.map.getSource(sourceId);
                if (source) {
                    source.setData({
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: startPOIData.coordinates
                            },
                            properties: {
                                ...this.markers.endPOI.data,
                                markerType: 'end'
                            }
                        }]
                    });
                }
            }
            
            // 交换标签位置
            this.updateLabelPositions('startPOI', endPOIData.coordinates);
            this.updateLabelPositions('endPOI', startPOIData.coordinates);
        }
        
        // 交换地铁站标记
        const startSubwayData = this.markerData.startSubway;
        const endSubwayData = this.markerData.endSubway;
        
        if (startSubwayData && endSubwayData) {
            console.log('交换地铁站标记位置');
            
            // 交换数据
            [this.markerData.startSubway, this.markerData.endSubway] = 
                [this.markerData.endSubway, this.markerData.startSubway];
            
            // 更新起点地铁站标记位置
            if (this.markers.startSubway && this.markers.startSubway.sourceId) {
                const sourceId = this.markers.startSubway.sourceId;
                const source = this.map.getSource(sourceId);
                if (source) {
                    source.setData({
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: endSubwayData.coordinates
                            },
                            properties: {
                                ...this.markers.startSubway.data,
                                markerType: 'start'
                            }
                        }]
                    });
                }
            }
            
            // 更新终点地铁站标记位置
            if (this.markers.endSubway && this.markers.endSubway.sourceId) {
                const sourceId = this.markers.endSubway.sourceId;
                const source = this.map.getSource(sourceId);
                if (source) {
                    source.setData({
                        type: 'FeatureCollection',
                        features: [{
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: startSubwayData.coordinates
                            },
                            properties: {
                                ...this.markers.endSubway.data,
                                markerType: 'end'
                            }
                        }]
                    });
                }
            }
            
            // 交换标签位置
            this.updateLabelPositions('startSubway', endSubwayData.coordinates);
            this.updateLabelPositions('endSubway', startSubwayData.coordinates);
        }
    }

    /**
     * 更新标签位置
     */
    updateLabelPositions(markerKey, coordinates) {
        const marker = this.markers[markerKey];
        if (!marker || !marker.labelSourceId) return;

        const sourceId = marker.labelSourceId;
        const source = this.map.getSource(sourceId);
        
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: coordinates
                    },
                    properties: {
                        name: marker.data.name,
                        type: markerKey.includes('start') ? 'start' : 'end'
                    }
                }]
            });
        }
    }

     /**
     * 创建路线标记（显示所有相关站点）
     */
    async createRouteMarkers(stations, startStation, endStation, intersection) {
        // 清除之前的路线标记
        this.clearRouteMarkers();
        
        console.log(`开始创建路线标记，共${stations.length}个站点`);
        
        // 存储路线数据
        this.routeData = {
            stations: stations,
            startStation: startStation,
            endStation: endStation,
            intersection: intersection
        };
        
        // 标准化站名函数
        const normalizeStationName = (name) => {
            return name.replace(/[\s·•·]/g, '').toLowerCase();
        };
        
        const normalizedStartName = startStation ? normalizeStationName(startStation.name) : '';
        const normalizedEndName = endStation ? normalizeStationName(endStation.name) : '';
        const normalizedIntersection = intersection ? normalizeStationName(intersection) : '';
        
        // 统计不同类型站点数量
        let regularStationCount = 0;
        let intersectionStationCount = 0;
        
        // 遍历所有站点
        for (const station of stations) {
            const normalizedStationName = normalizeStationName(station.name);
            
            // 跳过起点和终点（它们已经有特殊标记了）
            if (normalizedStationName === normalizedStartName || 
                normalizedStationName === normalizedEndName) {
                continue;
            }
            
            // 判断是否是换乘站
            const isIntersection = normalizedStationName === normalizedIntersection;
            
            // 创建标记元素
            const el = document.createElement('div');
            el.className = 'route-marker';
            el.style.width = isIntersection ? '14px' : '10px';
            el.style.height = isIntersection ? '14px' : '10px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = isIntersection ? '#ffc107' : '#6c757d'; // 换乘站黄色，普通站灰色
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';
            el.style.transition = 'all 0.2s ease';
            el.title = `${station.name}${isIntersection ? ' (换乘站)' : ''}`;
            
            // 添加悬停效果
            el.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.3)';
                this.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)';
            });
            
            el.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
            });
            
            // 创建标记
            const marker = new mapboxgl.Marker(el)
                .setLngLat([station.lon, station.lat])
                .addTo(this.map);
            
            // 添加点击事件显示弹窗
            el.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                this.showRouteStationPopup(station, isIntersection);
            });
            
            // 存储标记
            if (isIntersection) {
                this.intersectionMarkers.push({
                    marker: marker,
                    station: station,
                    element: el
                });
                intersectionStationCount++;
            } else {
                this.routeMarkers.push({
                    marker: marker,
                    station: station,
                    element: el
                });
                regularStationCount++;
            }
        }
        
        console.log(`路线标记创建完成: ${regularStationCount}个普通站, ${intersectionStationCount}个换乘站`);
        
        // 如果有换乘站，稍微调整起点和终点标记的z-index，让它们显示在最前面
        if (intersectionStationCount > 0) {
            this.adjustMarkerZIndex();
        }
        
        // 创建连接线（可选）
        this.createRouteLine(stations, startStation, endStation);
    }
    
    /**
     * 创建路线连接线
     */
    createRouteLine(stations, startStation, endStation) {
        // 先清除旧的路线线
        this.clearRouteLine();
        
        // 标准化站名函数
        const normalizeStationName = (name) => {
            return name.replace(/[\s·•·]/g, '').toLowerCase();
        };
        
        const normalizedStartName = startStation ? normalizeStationName(startStation.name) : '';
        const normalizedEndName = endStation ? normalizeStationName(endStation.name) : '';
        
        // 收集所有要连线的站点坐标（包括起点和终点）
        const lineCoordinates = [];
        
        // 添加起点
        if (startStation && startStation.lon && startStation.lat) {
            lineCoordinates.push([startStation.lon, startStation.lat]);
        }
        
        // 添加中间站点
        for (const station of stations) {
            const normalizedStationName = normalizeStationName(station.name);
            
            // 如果站点不是起点或终点，且坐标有效
            if (normalizedStationName !== normalizedStartName && 
                normalizedStationName !== normalizedEndName &&
                station.lon && station.lat) {
                lineCoordinates.push([station.lon, station.lat]);
            }
        }
        
        // 添加终点
        if (endStation && endStation.lon && endStation.lat) {
            lineCoordinates.push([endStation.lon, endStation.lat]);
        }
        
        // 如果坐标点太少，不创建线
        if (lineCoordinates.length < 2) {
            console.log('站点坐标不足，不创建路线连接线');
            return;
        }
        
        try {
            // 创建路线线数据源
            this.map.addSource('route-line-source', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: lineCoordinates
                    },
                    properties: {
                        name: '地铁路线'
                    }
                }
            });
            
            // 创建路线线图层
            this.map.addLayer({
                id: 'route-line-layer',
                type: 'line',
                source: 'route-line-source',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#1a2a6c',
                    'line-width': 3,
                    'line-opacity': 0.6,
                    'line-dasharray': [2, 1] // 虚线样式
                }
            });
            
            console.log('路线连接线创建完成');
        } catch (error) {
            console.error('创建路线连接线失败:', error);
        }
    }
    
    /**
     * 清除路线连接线
     */
    clearRouteLine() {
        try {
            if (this.map.getLayer('route-line-layer')) {
                this.map.removeLayer('route-line-layer');
            }
            
            if (this.map.getSource('route-line-source')) {
                this.map.removeSource('route-line-source');
            }
        } catch (error) {
            console.error('清除路线连接线失败:', error);
        }
    }
    
    /**
     * 显示路线站点弹窗
     */
    showRouteStationPopup(station, isIntersection) {
        // 移除现有的弹窗
        const popups = document.getElementsByClassName('mapboxgl-popup');
        for (const popup of popups) {
            popup.remove();
        }
        
        // 创建弹窗内容
        const popupContent = `
            <div class="subway-popup" style="min-width: 200px;">
                <h3>${station.name}</h3>
                <p>线路：${station.lineName}</p>
                ${isIntersection ? '<p><strong>换乘站</strong></p>' : ''}
                <p>坐标：${station.lon.toFixed(6)}, ${station.lat.toFixed(6)}</p>
            </div>
        `;
        
        // 创建弹窗
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(popupContent)
            .setLngLat([station.lon, station.lat])
            .addTo(this.map);
        
        // 3秒后自动关闭弹窗
        setTimeout(() => {
            if (popup.isOpen()) {
                popup.remove();
            }
        }, 3000);
    }
    
    /**
     * 调整标记的z-index
     */
    adjustMarkerZIndex() {
        // 让起点和终点标记显示在最前面
        const markerTypes = ['startPOI', 'endPOI', 'startSubway', 'endSubway'];
        
        markerTypes.forEach(type => {
            const marker = this.markers[type];
            if (marker && marker.layerId && this.map.getLayer(marker.layerId)) {
                // 将图层移到最前面
                this.map.moveLayer(marker.layerId);
            }
        });
    }
    
    /**
     * 清除路线标记
     */
    clearRouteMarkers() {
        // 清除路线标记
        this.routeMarkers.forEach(item => {
            if (item.marker && item.marker.remove) {
                item.marker.remove();
            }
        });
        this.routeMarkers = [];
        
        // 清除换乘站标记
        this.intersectionMarkers.forEach(item => {
            if (item.marker && item.marker.remove) {
                item.marker.remove();
            }
        });
        this.intersectionMarkers = [];
        
        // 清除路线连接线
        this.clearRouteLine();
        
        // 清除路线数据
        this.routeData = null;
        
        console.log('路线标记已清除');
    }
    
    /**
     * 获取路线数据
     */
    getRouteData() {
        return this.routeData;
    }
    
    /**
     * 高亮显示特定的站点
     */
    highlightStation(stationName) {
        // 标准化站名
        const normalizeStationName = (name) => {
            return name.replace(/[\s·•·]/g, '').toLowerCase();
        };
        
        const normalizedTargetName = normalizeStationName(stationName);
        
        // 重置所有标记样式
        this.resetAllMarkerStyles();
        
        // 高亮匹配的站点
        let highlightedCount = 0;
        
        // 检查路线标记
        this.routeMarkers.forEach(item => {
            const normalizedCurrentName = normalizeStationName(item.station.name);
            if (normalizedCurrentName === normalizedTargetName) {
                item.element.style.backgroundColor = '#28a745'; // 绿色高亮
                item.element.style.width = '14px';
                item.element.style.height = '14px';
                highlightedCount++;
            }
        });
        
        // 检查换乘站标记
        this.intersectionMarkers.forEach(item => {
            const normalizedCurrentName = normalizeStationName(item.station.name);
            if (normalizedCurrentName === normalizedTargetName) {
                item.element.style.backgroundColor = '#28a745'; // 绿色高亮
                item.element.style.width = '16px';
                item.element.style.height = '16px';
                highlightedCount++;
            }
        });
        
        return highlightedCount;
    }
    
    /**
     * 重置所有标记样式
     */
    resetAllMarkerStyles() {
        // 重置路线标记
        this.routeMarkers.forEach(item => {
            item.element.style.backgroundColor = '#6c757d';
            item.element.style.width = '10px';
            item.element.style.height = '10px';
        });
        
        // 重置换乘站标记
        this.intersectionMarkers.forEach(item => {
            item.element.style.backgroundColor = '#ffc107';
            item.element.style.width = '14px';
            item.element.style.height = '14px';
        });
    }
    
    /**
     * 清除所有标记（包括路线标记）
     */
    clearAllMarkers() {
        // 调用原有的清除方法
        Object.keys(this.markers).forEach(key => {
            this.removeMarker(key);
        });
        
        // 清除路线标记
        this.clearRouteMarkers();
        
        // 清除用户位置标记
        if (this.markers.userLocation) {
            this.markers.userLocation.remove();
            this.markers.userLocation = null;
        }
    }

    /**
     * 获取所有标记数据
     */
    getAllMarkers() {
        const result = {};
        Object.keys(this.markers).forEach(key => {
            if (this.markers[key]) {
                result[key] = this.markers[key];
            }
        });
        return result;
    }

    /**
     * 创建弹窗内容
     */
    createPOIPopupContent(poi) {
        return `
            <div class="poi-popup">
                <h3>${poi.name}</h3>
                <div class="poi-popup-type">${poi.type || '地点'}</div>
                ${poi.address ? `<div class="poi-popup-address">${poi.address}</div>` : ''}
                <div class="poi-popup-coords">${poi.wgsLon.toFixed(6)}, ${poi.wgsLat.toFixed(6)}</div>
            </div>
        `;
    }

    createSubwayPopupContent(station) {
        return `
            <div class="subway-popup">
                <h3>${station.name}</h3>
                <p>线路：${station.linename}</p>
                ${station.distance ? `<p>距离：${(station.distance / 1000).toFixed(2)}公里</p>` : ''}
            </div>
        `;
    }

    /**
     * 更新图标配置
     */
    updateIconConfig(newConfig) {
        this.iconConfig = { ...this.iconConfig, ...newConfig };
        
        // 重新加载图标
        this.iconsLoaded = false;
        this.loadIcons();
    }

    /**
     * 清理所有资源
     */
    cleanup() {
        this.clearAllMarkers();
    }
}

// 导出到全局
window.MarkerManager = MarkerManager;