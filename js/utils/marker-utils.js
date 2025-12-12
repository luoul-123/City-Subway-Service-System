/**
 * 标记管理工具函数
 */

class MarkerManager {
    constructor(map) {
        this.map = map;
        this.markers = {
            startPOI: null,
            endPOI: null,
            startSubway: null,
            endSubway: null,
            userLocation: null
        };
        this.labels = new Map();
        this.debouncedUpdate = this.debounce(this.updateAllLabels.bind(this), 100);
    }

    /**
     * 创建POI标记
     */
    createPOIMarker(poi, type) {
        this.removeMarker(type + 'POI');

        const el = document.createElement('div');
        el.className = `poi-marker ${type}-marker`;
        el.innerHTML = '<i class="fas fa-map-marker-alt"></i>';

        const marker = new mapboxgl.Marker(el)
            .setLngLat([poi.wgsLon, poi.wgsLat])
            .addTo(this.map);

        // 添加弹窗
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(this.createPOIPopupContent(poi));
        marker.setPopup(popup);

        // 存储数据
        marker._data = { type: 'poi', poi, markerType: type };
        this.markers[type + 'POI'] = marker;

        // 添加标签
        this.addLabel(marker, poi.name, 'poi', type);

        return marker;
    }

    /**
     * 创建地铁站标记
     */
    createSubwayMarker(station, type) {
        this.removeMarker(type + 'Subway');

        const el = document.createElement('div');
        el.className = `subway-marker ${type}-subway-marker`;
        el.innerHTML = '<i class="fas fa-subway"></i>';

        const marker = new mapboxgl.Marker(el)
            .setLngLat([station.wgsLon, station.wgsLat])
            .addTo(this.map);

        // 添加弹窗
        const popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(this.createSubwayPopupContent(station));
        marker.setPopup(popup);

        // 存储数据
        marker._data = { type: 'subway', station, markerType: type };
        this.markers[type + 'Subway'] = marker;

        // 添加标签
        this.addLabel(marker, station.name, 'subway', type);

        return marker;
    }

    /**
     * 创建用户位置标记
     */
    createUserLocationMarker(lngLat) {
        this.removeMarker('userLocation');

        const el = document.createElement('div');
        el.className = 'user-location-marker';

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
        if (marker) {
            marker.remove();
            this.removeLabel(marker);
            this.markers[markerKey] = null;
        }
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
    swapStartEndMarkers() {
        // 交换POI标记
        [this.markers.startPOI, this.markers.endPOI] = 
            [this.markers.endPOI, this.markers.startPOI];
        
        // 交换地铁站标记
        [this.markers.startSubway, this.markers.endSubway] = 
            [this.markers.endSubway, this.markers.startSubway];

        this.updateMarkersStyle();
        this.updateAllLabels();
    }

    /**
     * 更新标记样式
     */
    updateMarkersStyle() {
        this.updateMarkerStyle('startPOI', 'start');
        this.updateMarkerStyle('endPOI', 'end');
        this.updateMarkerStyle('startSubway', 'start');
        this.updateMarkerStyle('endSubway', 'end');
    }

    updateMarkerStyle(markerKey, type) {
        const marker = this.markers[markerKey];
        if (marker && marker.getElement()) {
            const el = marker.getElement();
            if (markerKey.includes('POI')) {
                el.className = `poi-marker ${type}-marker`;
                el.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            } else {
                el.className = `subway-marker ${type}-subway-marker`;
                el.innerHTML = '<i class="fas fa-subway"></i>';
            }
        }
    }

    /**
     * 添加标签
     */
    addLabel(marker, text, labelType, markerType) {
        this.removeLabel(marker);

        const labelEl = document.createElement('div');
        labelEl.className = this.getLabelClass(labelType, markerType);
        labelEl.innerHTML = `<span>${text}</span>`;

        this.labels.set(marker, labelEl);
        this.updateLabelPosition(marker);

        // 监听地图移动事件（使用防抖）
        this.map.on('move', this.debouncedUpdate);
    }

    /**
     * 移除标签
     */
    removeLabel(marker) {
        const labelEl = this.labels.get(marker);
        if (labelEl && labelEl.parentNode) {
            labelEl.parentNode.removeChild(labelEl);
        }
        this.labels.delete(marker);
    }

    /**
     * 更新标签位置
     */
    updateLabelPosition(marker) {
        const labelEl = this.labels.get(marker);
        if (!labelEl || !marker._map) return;

        const lngLat = marker.getLngLat();
        const pos = this.map.project(lngLat);

        labelEl.style.position = 'absolute';
        labelEl.style.left = `${pos.x}px`;
        labelEl.style.top = `${pos.y - (marker._data.type === 'poi' ? 35 : 40)}px`;
        labelEl.style.transform = 'translateX(-50%)';
        labelEl.style.zIndex = '9';

        if (!labelEl.parentNode) {
            const mapContainer = this.map.getContainer();
            mapContainer.appendChild(labelEl);
        }
    }

    /**
     * 更新所有标签位置
     */
    updateAllLabels() {
        this.labels.forEach((labelEl, marker) => {
            this.updateLabelPosition(marker);
        });
    }

    /**
     * 获取标签类名
     */
    getLabelClass(labelType, markerType) {
        if (labelType === 'poi') {
            return `poi-name-label ${markerType}-poi-label`;
        } else {
            return 'subway-station-label';
        }
    }

    /**
     * 创建弹窗内容
     */
    createPOIPopupContent(poi) {
        return `
            <div class="poi-popup">
                <h3>${poi.name}</h3>
                <div class="poi-popup-type">${poi.type}</div>
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
     * 防抖函数
     */
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    /**
     * 获取所有标记数据
     */
    getAllMarkers() {
        return this.markers;
    }
}

// 导出到全局
window.MarkerManager = MarkerManager;