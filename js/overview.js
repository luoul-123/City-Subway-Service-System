// 等待页面DOM完全加载
document.addEventListener('DOMContentLoaded', function () {
    // 显示加载提示
    showLoading();

    // 获取URL参数（提前获取以确定初始城市）
    function getURLParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            city: params.get('city')
        };
    }
    const urlParams = getURLParams();
    // 验证城市代码是否有效
    const validCityCodes = ['bj', 'nj', 'sh', 'wh'];
    const initialCity = (urlParams.city && validCityCodes.includes(urlParams.city))
        ? urlParams.city
        : 'nj'; // 默认南京

    // 城市配置
    const cityConfig = {
        'nj': {
            name: '南京',
            center: [118.796877, 32.060255],
            zoom: 10,
            dataPath: './data/nj_line.geojson'
        },
        'bj': {
            name: '北京',
            center: [116.4074, 39.9042],
            zoom: 10,
            dataPath: './data/bj_line.geojson'
        },
        'sh': {
            name: '上海',
            center: [121.4737, 31.2304],
            zoom: 10,
            dataPath: './data/sh_line.geojson'
        },
        'wh': {
            name: '武汉',
            center: [114.3055, 30.5928],
            zoom: 10,
            dataPath: './data/wh_line.geojson'
        }
    };

    // 1. 初始化Mapbox地图
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2JubWZ5aiIsImEiOiJjbTdhYTU4cjEwMXVlMnFwdzlvNHA2MWZyIn0.xM1rgUx9ZeG7h2boM1t_oQ';
    const map = new mapboxgl.Map({
        container: 'overview-map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: cityConfig[initialCity].center,
        zoom: cityConfig[initialCity].zoom,
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

    // 2. 添加地图基础控件
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // 3. 存储数据
    let railwayData = null;
    let currentCity = initialCity; // 当前选中城市（从URL参数或默认值）
    let lineLayers = []; // 存储所有线路图层ID
    let eventHandlers = new Map(); // 存储事件处理器引用，用于移除
    let highlightedLineId = null; // 当前高亮的线路ID
    let lineColorsMap = new Map(); // 存储每个线路图层的原始颜色

    // 4. 线路颜色配置（与information.js保持一致）
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
        '市域机场线': '#00008B',

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

    // 5. 初始化城市切换事件
    function initCitySwitchEvents() {
        const cityBtns = document.querySelectorAll('.city-btn');
        const currentCityEl = document.querySelector('.current-city');

        // 根据URL参数设置初始城市按钮状态
        cityBtns.forEach(btn => {
            const cityCode = btn.getAttribute('data-city');
            if (cityCode === currentCity) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 更新当前城市显示文本
        if (currentCityEl) {
            currentCityEl.textContent = `当前城市：${cityConfig[currentCity].name}`;
        }

        // 绑定城市切换事件
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

    // 6. 切换城市核心函数
    function switchCity(cityCode) {
        showLoading();
        currentCity = cityCode;
        const config = cityConfig[cityCode];

        // 先清除所有线路和事件监听器
        clearAllLines();

        // 飞向新城市
        map.flyTo({
            center: config.center,
            zoom: config.zoom,
            duration: 1000
        });

        // 设置超时保护，防止无限等待
        const timeoutId = setTimeout(() => {
            console.error('切换城市超时');
            hideLoading();
            alert(`切换至${cityConfig[cityCode].name}超时，请刷新页面重试！`);
        }, 10000); // 10秒超时

        // 加载线路数据
        loadRailwayData(cityCode)
            .then(railData => {
                // 验证数据格式
                if (!railData || !railData.features || !Array.isArray(railData.features)) {
                    throw new Error('数据格式错误：缺少features数组');
                }

                railwayData = railData;
                console.log(`已加载${cityConfig[cityCode].name}的地铁数据，共${railData.features.length}条线路`);

                // 确保地图已加载后再添加图层
                const displayLines = () => {
                    try {
                        console.log('开始显示线路，地图状态:', {
                            loaded: map.loaded(),
                            styleLoaded: map.isStyleLoaded()
                        });

                        displayAllLines();
                        updateLegend();
                        updateStats();
                        clearTimeout(timeoutId);
                        hideLoading();
                        console.log('线路显示完成');
                    } catch (error) {
                        console.error('显示线路时出错:', error);
                        clearTimeout(timeoutId);
                        hideLoading();
                        alert(`显示${cityConfig[cityCode].name}地铁线路时出错：${error.message}`);
                    }
                };

                // 等待地图完全准备好（地图已经初始化，但需要确保样式已加载）
                const ensureMapReady = () => {
                    if (map.loaded() && map.isStyleLoaded()) {
                        // 地图已准备好，直接显示
                        displayLines();
                    } else {
                        // 地图未准备好，等待
                        console.log('等待地图加载...');
                        let resolved = false;
                        const checkAndDisplay = () => {
                            if (!resolved && map.loaded() && map.isStyleLoaded()) {
                                resolved = true;
                                displayLines();
                            }
                        };

                        // 监听多个事件，确保能触发
                        map.once('load', checkAndDisplay);
                        map.once('style.load', checkAndDisplay);
                        map.once('idle', checkAndDisplay);

                        // 如果500ms后还没触发，强制尝试
                        setTimeout(() => {
                            if (!resolved) {
                                console.log('超时强制尝试显示');
                                checkAndDisplay();
                            }
                        }, 500);
                    }
                };

                // 等待flyTo动画完成后或延迟一下再添加图层
                setTimeout(ensureMapReady, 200);
            })
            .catch(error => {
                console.error('城市数据加载错误:', error);
                clearTimeout(timeoutId);
                hideLoading();
                // 只有在真正的错误时才显示alert
                if (error.message && error.message.includes('加载失败')) {
                    alert(`切换至${cityConfig[cityCode].name}失败：${error.message}`);
                } else {
                    alert(`切换至${cityConfig[cityCode].name}失败，请检查网络连接或刷新页面重试！`);
                }
            });
    }

    // 7. 加载地铁路线数据
    function loadRailwayData(cityCode) {
        const config = cityConfig[cityCode];
        return fetch(config.dataPath)
            .then(response => {
                if (!response.ok) throw new Error(`加载失败：${response.statusText}`);
                return response.json();
            });
    }

    // 8. 清除所有线路
    function clearAllLines() {
        // 清除高亮
        clearHighlight();
        
        // 清空颜色映射
        lineColorsMap.clear();

        // 移除所有事件监听器
        lineLayers.forEach(layerId => {
            // 移除事件监听器
            const handlers = eventHandlers.get(layerId);
            if (handlers) {
                if (handlers.click) {
                    map.off('click', layerId, handlers.click);
                }
                if (handlers.mouseenter) {
                    map.off('mouseenter', layerId, handlers.mouseenter);
                }
                if (handlers.mouseleave) {
                    map.off('mouseleave', layerId, handlers.mouseleave);
                }
                eventHandlers.delete(layerId);
            }

            // 移除图层
            if (map.getLayer(layerId)) {
                try {
                    map.removeLayer(layerId);
                } catch (e) {
                    console.warn(`移除图层失败: ${layerId}`, e);
                }
            }
            // 移除数据源
            if (map.getSource(layerId)) {
                try {
                    map.removeSource(layerId);
                } catch (e) {
                    console.warn(`移除数据源失败: ${layerId}`, e);
                }
            }
            // 移除标签数据源
            if (map.getSource(`${layerId}-label-source`)) {
                try {
                    map.removeSource(`${layerId}-label-source`);
                } catch (e) {
                    console.warn(`移除标签数据源失败: ${layerId}-label-source`, e);
                }
            }
        });
        lineLayers = [];
    }

    // 高亮指定线路
    function highlightLine(lineId, lineColor) {
        // 清除之前的高亮
        clearHighlight();

        // 设置高亮
        highlightedLineId = lineId;
        if (map.getLayer(lineId)) {
            // 增加线宽和透明度
            map.setPaintProperty(lineId, 'line-width', 8);
            map.setPaintProperty(lineId, 'line-opacity', 1);
            // 添加光晕效果（通过增加线宽和调整颜色实现）
            map.setPaintProperty(lineId, 'line-color', lineColor);
        }
    }

    // 清除高亮
    function clearHighlight() {
        if (highlightedLineId && map.getLayer(highlightedLineId)) {
            // 恢复原始样式
            const originalColor = lineColorsMap.get(highlightedLineId);
            if (originalColor) {
                map.setPaintProperty(highlightedLineId, 'line-color', originalColor);
            }
            map.setPaintProperty(highlightedLineId, 'line-width', 4);
            map.setPaintProperty(highlightedLineId, 'line-opacity', 0.8);
        }
        highlightedLineId = null;
    }

    // 9. 显示所有线路
    function displayAllLines() {
        if (!railwayData || !railwayData.features) {
            console.warn('线路数据不存在，无法显示');
            throw new Error('线路数据不存在');
        }

        // 直接调用 addAllLinesToMap，它内部会检查地图状态
        // 如果地图未准备好，会抛出错误，由调用者处理
        addAllLinesToMap();
    }

    // 10. 将所有线路添加到地图
    function addAllLinesToMap() {
        if (!railwayData || !railwayData.features) {
            console.warn('线路数据不存在，无法添加线路');
            throw new Error('线路数据不存在');
        }

        // 尝试等待地图准备好，最多等待1秒
        let attempts = 0;
        const maxAttempts = 10;
        const checkAndAdd = () => {
            attempts++;
            if (!map.loaded() || !map.isStyleLoaded()) {
                if (attempts < maxAttempts) {
                    console.log(`地图未准备好，等待中... (${attempts}/${maxAttempts})`);
                    setTimeout(checkAndAdd, 100);
                    return;
                } else {
                    console.warn('地图等待超时，强制尝试添加线路');
                }
            }

            // 开始添加线路
            let successCount = 0;
            let errorCount = 0;

            railwayData.features.forEach(feature => {
                const lineName = feature.properties.name;
                const lineId = `line-${lineName.replace(/[^a-zA-Z0-9]/g, '-')}`;

                // 检查是否已存在，如果存在则先移除
                if (map.getLayer(lineId)) {
                    try {
                        map.removeLayer(lineId);
                    } catch (e) {
                        console.warn(`移除已存在的图层失败: ${lineId}`, e);
                    }
                }
                if (map.getSource(lineId)) {
                    try {
                        map.removeSource(lineId);
                    } catch (e) {
                        console.warn(`移除已存在的数据源失败: ${lineId}`, e);
                    }
                }

                try {
                    // 添加线路数据源
                    map.addSource(lineId, {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [feature]
                        }
                    });

                    // 获取线路颜色
                    const lineColor = lineColors[lineName] || getRandomColor(lineName);
                    
                    // 添加线路图层
                    map.addLayer({
                        id: lineId,
                        type: 'line',
                        source: lineId,
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': lineColor,
                            'line-width': 4,
                            'line-opacity': 0.8
                        }
                    });

                    // 保存原始颜色
                    lineColorsMap.set(lineId, lineColor);

                    // 添加线路注记文字图层
                    const labelId = `${lineId}-label`;
                    try {
                        // 为线路名称创建点要素（使用线路中点位置）
                        const coordinates = feature.geometry.coordinates;
                        let labelPosition;
                        if (coordinates.length > 0) {
                            // 取线路中点位置作为标签位置
                            const midIndex = Math.floor(coordinates.length / 2);
                            labelPosition = coordinates[midIndex];
                        } else {
                            labelPosition = coordinates[0];
                        }

                        // 创建标签数据源
                        map.addSource(`${lineId}-label-source`, {
                            type: 'geojson',
                            data: {
                                type: 'FeatureCollection',
                                features: [{
                                    type: 'Feature',
                                    geometry: {
                                        type: 'Point',
                                        coordinates: labelPosition
                                    },
                                    properties: {
                                        name: lineName
                                    }
                                }]
                            }
                        });

                        // 添加文字标签图层
                        map.addLayer({
                            id: labelId,
                            type: 'symbol',
                            source: `${lineId}-label-source`,
                            layout: {
                                'text-field': lineName,
                                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
                                'text-size': 12,
                                'text-anchor': 'center',
                                'text-offset': [0, 0],
                                'text-allow-overlap': false,
                                'text-ignore-placement': false
                            },
                            paint: {
                                'text-color': '#333',
                                'text-halo-color': '#fff',
                                'text-halo-width': 2,
                                'text-halo-blur': 1
                            }
                        });

                        lineLayers.push(labelId);
                    } catch (error) {
                        console.warn(`添加线路标签失败: ${lineName}`, error);
                    }

                    lineLayers.push(lineId);

                    // 创建事件处理器函数并保存引用
                    const clickHandler = (e) => {
                        if (!e.features || e.features.length === 0) return;
                        const properties = e.features[0].properties;
                        const clickedLineName = properties.name;

                        // 高亮显示被点击的线路
                        highlightLine(lineId, lineColors[clickedLineName] || getRandomColor(clickedLineName));

                        // 延迟跳转，让用户看到高亮效果
                        setTimeout(() => {
                            const cityParam = encodeURIComponent(currentCity);
                            const lineParam = encodeURIComponent(clickedLineName);
                            window.location.href = `information.html?city=${cityParam}&line=${lineParam}`;
                        }, 300);
                    };

                    const mouseenterHandler = () => {
                        map.getCanvas().style.cursor = 'pointer';
                        // 鼠标悬停时高亮显示当前线路（如果不是已点击高亮的线路）
                        if (map.getLayer(lineId) && highlightedLineId !== lineId) {
                            map.setPaintProperty(lineId, 'line-width', 6);
                        }
                    };

                    const mouseleaveHandler = () => {
                        map.getCanvas().style.cursor = '';
                        // 恢复原宽度（如果不是已点击高亮的线路）
                        if (map.getLayer(lineId) && highlightedLineId !== lineId) {
                            map.setPaintProperty(lineId, 'line-width', 4);
                        }
                    };

                    // 绑定事件并保存引用
                    map.on('click', lineId, clickHandler);
                    map.on('mouseenter', lineId, mouseenterHandler);
                    map.on('mouseleave', lineId, mouseleaveHandler);

                    // 保存事件处理器引用以便后续移除
                    eventHandlers.set(lineId, {
                        click: clickHandler,
                        mouseenter: mouseenterHandler,
                        mouseleave: mouseleaveHandler
                    });

                    successCount++;
                } catch (error) {
                    errorCount++;
                    console.error(`添加线路失败: ${lineName}`, error);
                }
            });

            if (successCount === 0) {
                throw new Error(`所有线路添加失败 (共${railwayData.features.length}条)`);
            }

            console.log(`成功添加 ${successCount}/${railwayData.features.length} 条线路${errorCount > 0 ? `，失败${errorCount}条` : ''}`);

            // 调整地图视野以适应所有线路
            adjustMapView();
        };

        // 开始检查并添加
        checkAndAdd();
    }

    // 11. 调整地图视野
    function adjustMapView() {
        if (!railwayData || !railwayData.features) return;

        const bounds = new mapboxgl.LngLatBounds();

        railwayData.features.forEach(feature => {
            if (feature.geometry.type === 'LineString') {
                feature.geometry.coordinates.forEach(coord => {
                    bounds.extend(coord);
                });
            }
        });

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, {
                padding: 80,
                duration: 1500
            });
        }
    }

    // 12. 更新图例
    function updateLegend() {
        const legendContainer = document.getElementById('legend-container');
        legendContainer.innerHTML = '';

        if (!railwayData || !railwayData.features) return;

        railwayData.features.forEach(feature => {
            const lineName = feature.properties.name;
            const lineColor = lineColors[lineName] || getRandomColor(lineName);

            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            legendItem.innerHTML = `
                <div class="legend-color" style="background-color: ${lineColor}"></div>
                <div class="legend-name">${lineName}</div>
            `;

            // 点击图例项可高亮对应线路
            legendItem.addEventListener('click', () => {
                const lineId = `line-${lineName.replace(/[^a-zA-Z0-9]/g, '-')}`;
                if (map.getLayer(lineId)) {
                    // 飞向该线路
                    const lineFeature = railwayData.features.find(f => f.properties.name === lineName);
                    if (lineFeature && lineFeature.geometry.type === 'LineString') {
                        const bounds = new mapboxgl.LngLatBounds();
                        lineFeature.geometry.coordinates.forEach(coord => {
                            bounds.extend(coord);
                        });
                        map.fitBounds(bounds, {
                            padding: 100,
                            duration: 1000
                        });
                    }
                }
            });

            legendContainer.appendChild(legendItem);
        });
    }

    // 13. 更新统计信息
    function updateStats() {
        if (!railwayData || !railwayData.features) return;

        const totalLines = railwayData.features.length;
        document.getElementById('total-lines').textContent = totalLines;

        // 计算总里程
        let totalLength = 0;
        railwayData.features.forEach(feature => {
            if (feature.geometry.type === 'LineString') {
                const coordinates = feature.geometry.coordinates;
                for (let i = 1; i < coordinates.length; i++) {
                    const [lon1, lat1] = coordinates[i - 1];
                    const [lon2, lat2] = coordinates[i];

                    const dLat = (lat2 - lat1) * 111.32;
                    const dLon = (lon2 - lon1) * 111.32 * Math.cos((lat1 + lat2) * Math.PI / 360);
                    totalLength += Math.sqrt(dLat * dLat + dLon * dLon);
                }
            }
        });

        document.getElementById('total-length').textContent = Math.round(totalLength);
    }

    // 14. 辅助函数
    function getRandomColor(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }

        const hue = hash % 360;
        return `hsl(${hue}, 70%, 50%)`;
    }

    function showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    // 初始化流程
    function init() {
        initCitySwitchEvents();

        // 初始加载线路数据
        loadRailwayData(currentCity)
            .then(railData => {
                // 验证数据格式
                if (!railData || !railData.features || !Array.isArray(railData.features)) {
                    throw new Error('数据格式错误：缺少features数组');
                }

                railwayData = railData;

                // 等待地图加载完成
                if (map.loaded()) {
                    // 地图已加载，直接显示
                    displayAllLines();
                    updateLegend();
                    updateStats();
                    hideLoading();
                } else {
                    // 地图未加载，等待加载完成
                    map.once('load', () => {
                        displayAllLines();
                        updateLegend();
                        updateStats();
                        hideLoading();
                    });
                }
            })
            .catch(error => {
                console.error('初始数据加载错误:', error);
                hideLoading();
                alert('地铁线路数据加载失败，请刷新页面重试！');
            });
    }

    // 启动初始化
    init();
});

