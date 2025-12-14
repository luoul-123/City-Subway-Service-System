/**
 * 路径规划工具
 */

// 全局变量，存储地铁网络数据
let subwayNetwork = null;

/**
 * 初始化地铁网络
 * @param {Object} stopData - 站点数据
 */
function initSubwayNetwork(stopData) {
    subwayNetwork = {
        stations: {},
        lines: {},
        stationToLines: {},
        lineStations: {}
    };

    // 处理每个站点
    for (const key in stopData.name) {
        const stationId = parseInt(key);
        const station = {
            id: stationId,
            name: stopData.name[key],
            lineName: stopData.linename[key],
            lineId: stopData.x[key],
            direction: stopData.direction[key],
            lon: stopData.lon[key],
            lat: stopData.lat[key]
        };

        // 存储站点
        subwayNetwork.stations[stationId] = station;

        // 按线路分组
        const lineKey = `${station.lineId}-${station.direction}`;
        if (!subwayNetwork.lineStations[lineKey]) {
            subwayNetwork.lineStations[lineKey] = [];
        }
        subwayNetwork.lineStations[lineKey].push(station);

        // 站点到线路的映射
        if (!subwayNetwork.stationToLines[station.name]) {
            subwayNetwork.stationToLines[station.name] = new Set();
        }
        subwayNetwork.stationToLines[station.name].add(lineKey);
    }

    console.log('地铁网络初始化完成');
    console.log(`站点数: ${Object.keys(subwayNetwork.stations).length}`);
    console.log(`线路数: ${Object.keys(subwayNetwork.lineStations).length}`);
}

/**
 * 标准化站名
 */
function normalizeStationName(name) {
    return name.replace(/[\s·•·]/g, '').toLowerCase();
}

/**
 * 查找站点信息
 */
function findStationsByName(stationName) {
    if (!subwayNetwork) return [];
    
    const normalizedName = normalizeStationName(stationName);
    const result = [];
    
    for (const stationId in subwayNetwork.stations) {
        const station = subwayNetwork.stations[stationId];
        if (normalizeStationName(station.name).includes(normalizedName)) {
            result.push(station);
        }
    }
    
    return result;
}

/**
 * 获取站点所在的所有线路
 */
function getStationLines(stationName) {
    if (!subwayNetwork) return [];
    
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
    
    // 按站点顺序排序（如果有num信息的话）
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
    
    // 1. 直达路线（起点和终点在同一线路）
    for (const startLine of startLines) {
        for (const endLine of endLines) {
            if (startLine === endLine) {
                // 同一线路，直达
                const lineStations = getLineStations(startLine);
                const startStation = startStations.find(s => `${s.lineId}-${s.direction}` === startLine);
                const endStation = endStations.find(s => `${s.lineId}-${s.direction}` === endLine);
                
                if (startStation && endStation) {
                    // 估算站点数量（简单算法）
                    const stationCount = Math.abs(
                        lineStations.findIndex(s => s.id === startStation.id) -
                        lineStations.findIndex(s => s.id === endStation.id)
                    ) + 1;
                    
                    const duration = stationCount * 2; // 每站2分钟
                    const distance = stationCount * 1.5; // 每站1.5公里
                    
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
                        stationCount: stationCount
                    });
                }
            }
        }
    }
    
    // 2. 一次换乘路线
    for (const startLine of startLines) {
        for (const endLine of endLines) {
            if (startLine !== endLine) {
                const intersections = findIntersectionStations(startLine, endLine);
                
                if (intersections.length > 0) {
                    // 使用第一个交汇站
                    const intersection = intersections[0];
                    
                    // 估算站点数量
                    const startLineStations = getLineStations(startLine);
                    const endLineStations = getLineStations(endLine);
                    
                    const startStation = startStations.find(s => `${s.lineId}-${s.direction}` === startLine);
                    const endStation = endStations.find(s => `${s.lineId}-${s.direction}` === endLine);
                    
                    if (startStation && endStation) {
                        const startToIntersection = Math.abs(
                            startLineStations.findIndex(s => s.id === startStation.id) -
                            startLineStations.findIndex(s => s.id === intersection.station1.id)
                        ) + 1;
                        
                        const intersectionToEnd = Math.abs(
                            endLineStations.findIndex(s => s.id === intersection.station2.id) -
                            endLineStations.findIndex(s => s.id === endStation.id)
                        ) + 1;
                        
                        const totalStations = startToIntersection + intersectionToEnd;
                        const duration = totalStations * 2 + 5; // 每站2分钟 + 5分钟换乘
                        const distance = totalStations * 1.5; // 每站1.5公里
                        
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
                                    detail: `从${startStation.name}站到${intersection.name}站，途经${startToIntersection}站`
                                },
                                {
                                    type: 'transfer',
                                    title: `换乘${endStation.lineName}`,
                                    detail: `在${intersection.name}站换乘`
                                },
                                {
                                    type: 'subway',
                                    title: `乘坐${endStation.lineName}`,
                                    detail: `从${intersection.name}站到${endStation.name}站，途经${intersectionToEnd}站`
                                }
                            ],
                            startLine: startLine,
                            endLine: endLine,
                            intersection: intersection.name,
                            stationCount: totalStations
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
    
    console.log(`生成了${routeOptions.length}个路线方案`);
    return routeOptions;
}

/**
 * 在地图上显示路线方案
 */
function displayRouteOnMap(map, routeOption, startStation, endStation) {
    if (!map || !routeOption) return;
    
    // 清除之前的路线
    clearRouteFromMap(map);
    
    // 获取线路信息
    const startLineStations = getLineStations(routeOption.startLine);
    const endLineStations = getLineStations(routeOption.endLine);
    
    // 收集所有要显示的站点
    const routeStations = [];
    
    // 添加起点线路的站点
    if (startLineStations.length > 0) {
        routeStations.push(...startLineStations);
    }
    
    // 添加终点线路的站点
    if (routeOption.endLine && routeOption.endLine !== routeOption.startLine) {
        routeStations.push(...endLineStations);
    }
    
    // 在地图上标记这些站点
    if (window.markerManager && typeof window.markerManager.createRouteMarkers === 'function') {
        window.markerManager.createRouteMarkers(routeStations, startStation, endStation, routeOption.intersection);
    }
    
    // 调整地图视图以显示所有相关站点
    if (routeStations.length > 0) {
        const coordinates = routeStations.map(station => [station.lon, station.lat]);
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        
        map.fitBounds(bounds, {
            padding: 100,
            duration: 1000,
            maxZoom: 15
        });
    }
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