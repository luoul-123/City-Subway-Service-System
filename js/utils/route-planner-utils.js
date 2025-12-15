
/**
 * 路径规划工具
 */

// 全局变量，存储地铁网络数据
let subwayNetwork = null;

/**
 * 初始化地铁网络
 * @param {Array} stopDataArray - 站点数据数组
 */
function initSubwayNetwork(stopDataArray) {
    // 清空现有网络
    subwayNetwork = {
        stations: {},
        lines: {},
        stationToLines: {},
        lineStations: {}
    };

    if (!stopDataArray || !Array.isArray(stopDataArray)) {
        console.error('站点数据格式错误，应为数组');
        return;
    }

    console.log(`开始初始化地铁网络，共${stopDataArray.length}个站点记录`);

    // 处理每个站点
    stopDataArray.forEach(station => {
        // 生成唯一ID
        const stationId = station.id || `${station.lineId}-${station.name}-${station.direction}`;
        
        // 标准化数据
        const processedStation = {
            id: stationId,
            name: station.name || '',
            lineName: station.linename || station.lineName || '',
            lineId: station.lineId || station.lineNumber || station.x || '',
            direction: station.direction || 1,
            lon: parseFloat(station.lon) || parseFloat(station.wgsLon) || 0,
            lat: parseFloat(station.lat) || parseFloat(station.wgsLat) || 0,
            num: station.num || 0
        };

        // 存储站点
        subwayNetwork.stations[stationId] = processedStation;

        // 按线路分组
        const lineKey = `${processedStation.lineId}-${processedStation.direction}`;
        if (!subwayNetwork.lineStations[lineKey]) {
            subwayNetwork.lineStations[lineKey] = [];
        }
        
        // 添加到线路，按 num 排序
        subwayNetwork.lineStations[lineKey].push(processedStation);
        
        // 按站点序号排序
        subwayNetwork.lineStations[lineKey].sort((a, b) => a.num - b.num);

        // 站点到线路的映射
        if (!subwayNetwork.stationToLines[processedStation.name]) {
            subwayNetwork.stationToLines[processedStation.name] = new Set();
        }
        subwayNetwork.stationToLines[processedStation.name].add(lineKey);
    });

    console.log('地铁网络初始化完成');
    console.log(`站点数: ${Object.keys(subwayNetwork.stations).length}`);
    console.log(`线路数: ${Object.keys(subwayNetwork.lineStations).length}`);
    
    // 统计换乘站
    let transferStations = 0;
    Object.keys(subwayNetwork.stationToLines).forEach(stationName => {
        if (subwayNetwork.stationToLines[stationName].size > 1) {
            transferStations++;
        }
    });
    console.log(`换乘站数: ${transferStations}`);
}

/**
 * 标准化站名
 */
function normalizeStationName(name) {
    if (!name) return '';
    return name.replace(/[\s·•·]/g, '').toLowerCase();
}

/**
 * 查找站点信息
 */
function findStationsByName(stationName) {
    if (!subwayNetwork || !stationName) return [];
    
    const normalizedName = normalizeStationName(stationName);
    const result = [];
    
    for (const stationId in subwayNetwork.stations) {
        const station = subwayNetwork.stations[stationId];
        if (normalizeStationName(station.name) === normalizedName) {
            result.push(station);
        }
    }
    
    return result;
}

/**
 * 获取站点所在的所有线路
 */
function getStationLines(stationName) {
    if (!subwayNetwork || !stationName) return [];
    
    const normalizedName = normalizeStationName(stationName);
    const lines = new Set();
    
    for (const name in subwayNetwork.stationToLines) {
        if (normalizeStationName(name) === normalizedName) {
            const stationLines = subwayNetwork.stationToLines[name];
            stationLines.forEach(line => lines.add(line));
        }
    }
    
    return Array.from(lines);
}

/**
 * 获取线路上的所有站点
 */
function getLineStations(lineKey) {
    if (!subwayNetwork || !subwayNetwork.lineStations[lineKey]) {
        return [];
    }
    
    return subwayNetwork.lineStations[lineKey];
}

/**
 * 找到两条线路的交汇站
 */
function findIntersectionStations(line1, line2) {
    if (!subwayNetwork) return [];
    
    const stations1 = getLineStations(line1);
    const stations2 = getLineStations(line2);
    const intersections = [];
    
    // 简单的双重循环查找交汇站
    for (const station1 of stations1) {
        for (const station2 of stations2) {
            if (normalizeStationName(station1.name) === normalizeStationName(station2.name)) {
                intersections.push({
                    name: station1.name,
                    station1: station1,
                    station2: station2
                });
            }
        }
    }
    
    return intersections;
}

function addRouteStationsToMap(route) {
    if (!markerManager) return;
    
    // 添加起点站标记
    markerManager.createSubwayMarker(route.startStation, 'start');
    
    // 添加终点站标记
    markerManager.createSubwayMarker(route.endStation, 'end');
    
    // 添加换乘站标记
    route.transfers.forEach(transfer => {
        const marker = markerManager.createTransferMarker(transfer);
        if (marker) {
            markerManager.intersectionMarkers.push(marker);
        }
    });
}

/**
 * 生成所有可能的路线方案
 */
function generateAllRouteOptions(startStationName, endStationName) {
    if (!subwayNetwork) {
        console.error('地铁网络未初始化');
        return [];
    }

    console.log(`规划路线: ${startStationName} -> ${endStationName}`);
    
    // 查找起点站和终点站
    const startStations = findStationsByName(startStationName);
    const endStations = findStationsByName(endStationName);
    
    if (startStations.length === 0) {
        console.error(`未找到起点站: ${startStationName}`);
        return [];
    }
    
    if (endStations.length === 0) {
        console.error(`未找到终点站: ${endStationName}`);
        return [];
    }
    
    console.log(`找到${startStations.length}个起点站，${endStations.length}个终点站`);
    
    // 获取所有可能的线路组合
    const startLines = new Set();
    const endLines = new Set();
    
    startStations.forEach(station => {
        const lineKey = `${station.lineId}-${station.direction}`;
        startLines.add(lineKey);
    });
    
    endStations.forEach(station => {
        const lineKey = `${station.lineId}-${station.direction}`;
        endLines.add(lineKey);
    });
    
    console.log(`起点线路: ${Array.from(startLines).join(', ')}`);
    console.log(`终点线路: ${Array.from(endLines).join(', ')}`);
    
    const routeOptions = [];
    let routeId = 1;
    const routeKeys = new Set(); // 用于去重的键集合
    
    // 1. 直达路线（起点和终点在同一线路）
    for (const startLine of startLines) {
        for (const endLine of endLines) {
            if (startLine === endLine) {
                // 同一线路，直达
                const lineStations = getLineStations(startLine);
                const startStation = startStations.find(s => `${s.lineId}-${s.direction}` === startLine);
                const endStation = endStations.find(s => `${s.lineId}-${s.direction}` === endLine);
                
                if (startStation && endStation) {
                    // 估算站点数量
                    const startIndex = lineStations.findIndex(s => s.id === startStation.id);
                    const endIndex = lineStations.findIndex(s => s.id === endStation.id);
                    
                    if (startIndex >= 0 && endIndex >= 0) {
                        const stationCount = Math.abs(endIndex - startIndex) + 1;
                        const duration = stationCount * 2; // 每站2分钟
                        const distance = stationCount * 1.5; // 每站1.5公里
                        
                        // 创建唯一键用于去重
                        const routeKey = `直达_${startStation.name}_${endStation.name}_${startLine}_${startIndex}_${endIndex}`;
                        
                        if (!routeKeys.has(routeKey)) {
                            routeKeys.add(routeKey);
                            
                            routeOptions.push({
                                id: routeId++,
                                name: `方案${routeId-1}: 直达`,
                                description: `${startStation.name} 直达 ${endStation.name}`,
                                type: '直达',
                                duration: `${duration}分钟`,
                                distance: `${distance.toFixed(1)}公里`,
                                transfers: '0次',
                                steps: [
                                    {
                                        type: 'subway',
                                        title: `乘坐${startStation.lineName}`,
                                        detail: `从${startStation.name}站到${endStation.name}站，途经${stationCount}站`
                                    }
                                ],
                                startLine: startLine,
                                endLine: endLine,
                                intersection: null,
                                stationCount: stationCount,
                                startStation: startStation,
                                endStation: endStation
                            });
                        }
                    }
                }
            }
        }
    }
    
    // 2. 一次换乘路线
    if (routeOptions.length === 0) {
        const processedIntersections = new Set(); // 记录已处理的换乘组合
        
        for (const startLine of startLines) {
            for (const endLine of endLines) {
                if (startLine !== endLine) {
                    const intersections = findIntersectionStations(startLine, endLine);
                    
                    if (intersections.length > 0) {
                        // 对每个交汇站生成路线
                        intersections.forEach(intersection => {
                            const startStation = startStations.find(s => `${s.lineId}-${s.direction}` === startLine);
                            const endStation = endStations.find(s => `${s.lineId}-${s.direction}` === endLine);
                            
                            if (startStation && endStation) {
                                // 计算各段站点数
                                const startLineStations = getLineStations(startLine);
                                const endLineStations = getLineStations(endLine);
                                
                                const startIndex = startLineStations.findIndex(s => s.id === startStation.id);
                                const transferStartIndex = startLineStations.findIndex(s => s.id === intersection.station1.id);
                                const transferEndIndex = endLineStations.findIndex(s => s.id === intersection.station2.id);
                                const endIndex = endLineStations.findIndex(s => s.id === endStation.id);
                                
                                if (startIndex >= 0 && transferStartIndex >= 0 && 
                                    transferEndIndex >= 0 && endIndex >= 0) {
                                    
                                    const segment1Count = Math.abs(transferStartIndex - startIndex) + 1;
                                    const segment2Count = Math.abs(endIndex - transferEndIndex) + 1;
                                    const totalStations = segment1Count + segment2Count;
                                    
                                    const duration = totalStations * 2 + 5; // 每站2分钟 + 5分钟换乘
                                    const distance = totalStations * 1.5;
                                    
                                    // 创建唯一键用于去重
                                    const routeKey = `换乘_${startStation.name}_${intersection.name}_${endStation.name}_${startLine}_${endLine}`;
                                    
                                    // 检查是否已经处理过这个换乘组合
                                    if (!processedIntersections.has(routeKey)) {
                                        processedIntersections.add(routeKey);
                                        
                                        routeOptions.push({
                                            id: routeId++,
                                            name: `方案${routeId-1}: 一次换乘`,
                                            description: `${startStation.name} → ${intersection.name} → ${endStation.name}`,
                                            type: '一次换乘',
                                            duration: `${duration}分钟`,
                                            distance: `${distance.toFixed(1)}公里`,
                                            transfers: '1次',
                                            steps: [
                                                {
                                                    type: 'subway',
                                                    title: `乘坐${startStation.lineName}`,
                                                    detail: `从${startStation.name}站到${intersection.name}站，途经${segment1Count}站`
                                                },
                                                {
                                                    type: 'transfer',
                                                    title: `换乘${endStation.lineName}`,
                                                    detail: `在${intersection.name}站换乘`
                                                },
                                                {
                                                    type: 'subway',
                                                    title: `乘坐${endStation.lineName}`,
                                                    detail: `从${intersection.name}站到${endStation.name}站，途经${segment2Count}站`
                                                }
                                            ],
                                            startLine: startLine,
                                            endLine: endLine,
                                            intersection: intersection.name,
                                            stationCount: totalStations,
                                            startStation: startStation,
                                            endStation: endStation,
                                            transferStations: [intersection.station1]
                                        });
                                    }
                                }
                            }
                        });
                    }
                }
            }
        }
    }
    
    // 3. 如果还没有路线，提供通用建议
    if (routeOptions.length === 0 && startLines.size > 0 && endLines.size > 0) {
        const startLinesArray = Array.from(startLines);
        const endLinesArray = Array.from(endLines);
        
        routeOptions.push({
            id: routeId++,
            name: `方案${routeId-1}: 多线换乘`,
            description: `通过多条线路换乘`,
            type: '建议路线',
            duration: '约40-60分钟',
            distance: '视换乘情况而定',
            transfers: '建议查看地铁图',
            steps: [
                {
                    type: 'info',
                    title: '多条线路可选',
                    detail: '起点和终点涉及多条地铁线路，建议查看地铁线路图选择合适换乘方案'
                }
            ],
            startLine: startLinesArray[0],
            endLine: endLinesArray[0],
            intersection: null,
            stationCount: 0
        });
    }
    
    const uniqueRoutes = [];
    const seenDescriptions = new Set();
    
    routeOptions.forEach(route => {
        if (!seenDescriptions.has(route.description)) {
            seenDescriptions.add(route.description);
            uniqueRoutes.push(route);
        }
    });
    
    // 重新分配ID
    uniqueRoutes.forEach((route, index) => {
        route.id = index + 1;
        route.name = `方案${route.id}: ${route.type}`;
    });
    
    console.log(`生成了${uniqueRoutes.length}个唯一路线方案`);
    return uniqueRoutes;
}

/**
 * 在地图上显示路线方案
 */
function displayRouteOnMap(map, routeOption, startStation, endStation) {
    if (!map || !routeOption) return;
    
    console.log('开始显示路线到地图，先清除旧标记');
    
    // 彻底清除之前的路线标记
    clearRouteFromMap(map);
    
    // 确保地图上没有残留的路线相关元素
    setTimeout(() => {
        console.log('清除完成，开始显示新路线:', {
            路线名称: routeOption.name,
            起点站: routeOption.startStation ? routeOption.startStation.name : '无',
            终点站: routeOption.endStation ? routeOption.endStation.name : '无'
        });
        
        // 获取线路信息
        const startLineStations = getLineStations(routeOption.startLine);
        const endLineStations = routeOption.endLine ? getLineStations(routeOption.endLine) : [];
        
        console.log('线路站点数量:', {
            起点线路: startLineStations.length,
            终点线路: endLineStations.length
        });
        
        // 收集所有要显示的站点
        const routeStations = [];
        
        // 如果是一次换乘路线，需要正确处理两个线路
        if (routeOption.type === '一次换乘' && routeOption.intersection) {
            // 找到换乘站在起点线路中的位置
            const intersectionIndex = startLineStations.findIndex(station => 
                normalizeStationName(station.name) === normalizeStationName(routeOption.intersection)
            );
            
            // 找到换乘站在终点线路中的位置
            const intersectionIndex2 = endLineStations.findIndex(station =>
                normalizeStationName(station.name) === normalizeStationName(routeOption.intersection)
            );
            
            // 找到起点站在起点线路中的位置
            const startIndex = startLineStations.findIndex(station =>
                normalizeStationName(station.name) === normalizeStationName(startStation.name)
            );
            
            // 找到终点站在终点线路中的位置
            const endIndex = endLineStations.findIndex(station =>
                normalizeStationName(station.name) === normalizeStationName(endStation.name)
            );
            
            console.log('换乘路线索引信息:', {
                起点站索引: startIndex,
                换乘站索引1: intersectionIndex,
                换乘站索引2: intersectionIndex2,
                终点站索引: endIndex
            });
            
            if (startIndex !== -1 && intersectionIndex !== -1) {
                // 确定起点线路的方向
                const startSegment = startIndex < intersectionIndex ? 
                    startLineStations.slice(startIndex, intersectionIndex + 1) :
                    startLineStations.slice(intersectionIndex, startIndex + 1).reverse();
                
                routeStations.push(...startSegment);
            }
            
            if (intersectionIndex2 !== -1 && endIndex !== -1) {
                // 确定终点线路的方向
                const endSegment = intersectionIndex2 < endIndex ?
                    endLineStations.slice(intersectionIndex2, endIndex + 1) :
                    endLineStations.slice(endIndex, intersectionIndex2 + 1).reverse();
                
                routeStations.push(...endSegment);
            }
        } else {
            // 直达路线，直接使用起点线路
            // 找到起点站和终点站在线路中的位置
            const startIndex = startLineStations.findIndex(station =>
                normalizeStationName(station.name) === normalizeStationName(startStation.name)
            );
            
            const endIndex = startLineStations.findIndex(station =>
                normalizeStationName(station.name) === normalizeStationName(endStation.name)
            );
            
            console.log('直达路线索引信息:', {
                起点站索引: startIndex,
                终点站索引: endIndex
            });
            
            if (startIndex !== -1 && endIndex !== -1) {
                // 确定方向
                const segment = startIndex < endIndex ?
                    startLineStations.slice(startIndex, endIndex + 1) :
                    startLineStations.slice(endIndex, startIndex + 1).reverse();
                
                routeStations.push(...segment);
            }
        }
        
        console.log(`总共收集到 ${routeStations.length} 个站点显示`);
        
        // 在地图上标记这些站点
        if (window.markerManager && typeof window.markerManager.createRouteMarkers === 'function') {
            console.log('调用markerManager.createRouteMarkers:', {
                起点: startStation?.name,
                终点: endStation?.name,
                换乘站: routeOption.intersection,
                站点数: routeStations.length
            });
            
            window.markerManager.createRouteMarkers(
                routeStations, 
                startStation, 
                endStation, 
                routeOption.intersection
            );
        } else {
            console.error('markerManager或createRouteMarkers方法不存在');
        }
        
        // 调整地图视图以显示所有相关站点
        if (routeStations.length > 0) {
            const coordinates = routeStations.map(station => {
                const lon = station.wgsLon !== undefined ? station.wgsLon : station.lon;
                const lat = station.wgsLat !== undefined ? station.wgsLat : station.lat;
                return [lon, lat];
            }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]) && coord[0] !== 0 && coord[1] !== 0);
            
            if (coordinates.length > 0) {
                const bounds = coordinates.reduce((bounds, coord) => {
                    return bounds.extend(coord);
                }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
                
                map.fitBounds(bounds, {
                    padding: 80,
                    duration: 1000,
                    maxZoom: 14
                });
            }
        }
        
        console.log('新路线显示完成');
    }, 100); // 延迟100ms确保清除操作完成
}

/**
 * 清除地图上的路线标记
 */
function clearRouteFromMap(map) {
    if (!map) return;
    
    if (window.markerManager && typeof window.markerManager.clearRouteMarkers === 'function') {
        window.markerManager.clearRouteMarkers();
    }
}

// 导出函数
window.initSubwayNetwork = initSubwayNetwork;
window.generateAllRouteOptions = generateAllRouteOptions;
window.displayRouteOnMap = displayRouteOnMap;
window.clearRouteFromMap = clearRouteFromMap;
window.findStationsByName = findStationsByName;