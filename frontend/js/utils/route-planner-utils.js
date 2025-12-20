
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
 * 使用BFS算法查找所有可能的路线（支持多次换乘）
 */
function findAllRoutesWithBFS(startStationName, endStationName, maxTransfers = 5) {
    if (!subwayNetwork) {
        console.error('BFS: 地铁网络未初始化');
        return [];
    }

    console.log(`BFS开始: ${startStationName} -> ${endStationName}, 最多${maxTransfers}次换乘`);

    const startStations = findStationsByName(startStationName);
    const endStations = findStationsByName(endStationName);

    console.log(`找到起点站${startStations.length}个:`, startStations.map(s => `${s.name}(${s.lineName})`));
    console.log(`找到终点站${endStations.length}个:`, endStations.map(s => `${s.name}(${s.lineName})`));

    if (startStations.length === 0) {
        console.error(`BFS: 未找到起点站"${startStationName}"`);
        return [];
    }

    if (endStations.length === 0) {
        console.error(`BFS: 未找到终点站"${endStationName}"`);
        return [];
    }

    const allPaths = [];
    const normalizedEndName = normalizeStationName(endStationName);

    // 对每个起点站执行BFS
    startStations.forEach(startStation => {
        console.log(`从起点站开始BFS: ${startStation.name} (${startStation.lineName})`);
        const queue = [{
            station: startStation,
            path: [startStation],
            visitedStations: new Set([normalizeStationName(startStation.name)]),
            currentLine: `${startStation.lineId}-${startStation.direction}`,
            transfers: 0
        }];

        const visited = new Set();

        let iterationCount = 0;
        const maxIterations = 10000; // 防止无限循环

        while (queue.length > 0 && iterationCount < maxIterations) {
            iterationCount++;
            const current = queue.shift();

            // 创建状态键用于去重
            const stateKey = `${normalizeStationName(current.station.name)}-${current.currentLine}-${current.transfers}`;
            if (visited.has(stateKey)) continue;
            visited.add(stateKey);

            // 检查是否到达终点
            if (normalizeStationName(current.station.name) === normalizedEndName) {
                console.log(`找到一条路径！换乘${current.transfers}次，共${current.path.length}站`);
                allPaths.push({
                    path: current.path,
                    transfers: current.transfers
                });
                continue; // 继续搜索其他路径
            }

            // 如果换乘次数已达上限，停止扩展
            if (current.transfers >= maxTransfers) continue;

            // 1. 沿着当前线路继续前进
            const currentLineStations = getLineStations(current.currentLine);
            // 使用站点名称查找，而不是ID（因为换乘后ID可能不同）
            const currentIndex = currentLineStations.findIndex(s =>
                normalizeStationName(s.name) === normalizeStationName(current.station.name)
            );

            if (currentIndex !== -1) {
                // 获取同一线路上的相邻站点
                const neighbors = [];
                if (currentIndex > 0) neighbors.push(currentLineStations[currentIndex - 1]);
                if (currentIndex < currentLineStations.length - 1) neighbors.push(currentLineStations[currentIndex + 1]);

                neighbors.forEach(neighbor => {
                    const normalizedName = normalizeStationName(neighbor.name);
                    if (!current.visitedStations.has(normalizedName)) {
                        const newVisited = new Set(current.visitedStations);
                        newVisited.add(normalizedName);

                        queue.push({
                            station: neighbor,
                            path: [...current.path, neighbor],
                            visitedStations: newVisited,
                            currentLine: current.currentLine,
                            transfers: current.transfers
                        });
                    }
                });
            } else {
                console.warn(`警告：在线路${current.currentLine}中找不到站点${current.station.name}(id:${current.station.id})`);
            }

            // 2. 在当前站换乘到其他线路
            const stationLines = getStationLines(current.station.name);
            if (stationLines.length > 1) {
                // 只在有换乘可能时输出日志
                // console.log(`站点${current.station.name}可换乘到${stationLines.length}条线路`);
            }

            stationLines.forEach(lineKey => {
                if (lineKey !== current.currentLine) {
                    const lineStations = getLineStations(lineKey);
                    const transferStation = lineStations.find(s =>
                        normalizeStationName(s.name) === normalizeStationName(current.station.name)
                    );

                    if (transferStation) {
                        // 换乘时不重复添加当前站点到路径
                        // 只是切换到新线路，继续使用当前路径
                        queue.push({
                            station: transferStation,
                            path: current.path,  // 不添加换乘站，因为已经在路径中
                            visitedStations: current.visitedStations,  // 保持已访问站点集合
                            currentLine: lineKey,
                            transfers: current.transfers + 1
                        });
                    }
                }
            });
        }

        if (iterationCount >= maxIterations) {
            console.warn(`BFS达到最大迭代次数${maxIterations}，停止搜索`);
        }
    });

    console.log(`BFS搜索完成，找到${allPaths.length}条路径`);
    return allPaths;
}

/**
 * 生成所有可能的路线方案（支持多次换乘）
 */
function generateAllRouteOptions(startStationName, endStationName) {
    if (!subwayNetwork) {
        console.error('地铁网络未初始化');
        return [];
    }

    console.log(`规划路线: ${startStationName} -> ${endStationName}`);

    // 使用BFS查找所有可能的路径
    const allPaths = findAllRoutesWithBFS(startStationName, endStationName, 5);

    if (allPaths.length === 0) {
        console.warn('未找到任何路径');
        return [];
    }

    console.log(`找到${allPaths.length}条可能的路径`);

    // 转换路径为路线方案
    const routeOptions = [];
    const routeKeys = new Set(); // 用于去重

    allPaths.forEach(pathData => {
        const path = pathData.path;
        const transfers = pathData.transfers;

        if (path.length < 2) return;

        const startStation = path[0];
        const endStation = path[path.length - 1];

        // 分析路径，提取线路段和换乘站
        // 注意：用线路名称（lineName）判断是否同一线路，而不是lineId+direction
        // 因为同一条线路的不同方向不应该算作换乘
        const segments = [];
        let currentSegment = {
            line: startStation.lineName,  // 使用线路名称
            lineName: startStation.lineName,
            stations: [startStation]
        };

        for (let i = 1; i < path.length; i++) {
            const station = path[i];
            const stationLineName = station.lineName;  // 使用线路名称判断

            if (stationLineName === currentSegment.lineName) {
                // 同一线路（不管方向），添加到当前段
                currentSegment.stations.push(station);
            } else {
                // 换乘到不同线路，结束当前段，开始新段
                segments.push(currentSegment);
                currentSegment = {
                    line: stationLineName,
                    lineName: stationLineName,
                    stations: [path[i - 1], station], // 包含换乘站
                    transferStation: path[i - 1].name
                };
            }
        }
        segments.push(currentSegment);

        // 计算实际换乘次数（换乘次数 = 线路段数 - 1）
        const actualTransfers = segments.length - 1;

        // 计算总站数和时间
        const totalStations = path.length;
        const duration = totalStations * 2 + actualTransfers * 5; // 每站2分钟，每次换乘5分钟
        const distance = totalStations * 1.5; // 每站约1.5公里

        // 生成路线描述（去除重复的站点）
        const transferStations = segments.slice(0, -1).map(seg =>
            seg.stations[seg.stations.length - 1].name
        );

        // 构建路线描述，过滤掉与起点或终点重复的换乘站
        const routePoints = [startStation.name];
        transferStations.forEach(station => {
            // 只添加不与前一个站点重复的换乘站
            if (station !== routePoints[routePoints.length - 1]) {
                routePoints.push(station);
            }
        });
        // 添加终点（如果不与最后一个站点重复）
        if (endStation.name !== routePoints[routePoints.length - 1]) {
            routePoints.push(endStation.name);
        }

        const description = routePoints.join(' → ');

        // 去重检查
        if (routeKeys.has(description)) return;
        routeKeys.add(description);

        // 生成路线类型
        let routeType;
        if (actualTransfers <= 0) {
            routeType = '无需换乘';
        } else {
            routeType = `${actualTransfers}次换乘`;
        }

        // 提取途经的线路名称（去重）
        const lineNames = [];
        segments.forEach(segment => {
            if (segment.lineName && !lineNames.includes(segment.lineName)) {
                lineNames.push(segment.lineName);
            }
        });

        // 生成步骤（修复：正确处理起点站和换乘站）
        const steps = [];
        const actualStartName = startStation.name;  // 实际起点站名称

        segments.forEach((segment, index) => {
            const segmentStations = segment.stations.length;
            const fromStation = segment.stations[0].name;
            const toStation = segment.stations[segmentStations - 1].name;
            const isFirstSegment = (index === 0);
            const isLastSegment = (index === segments.length - 1);

            // 判断是否需要添加乘坐步骤
            if (fromStation !== toStation && segmentStations > 1) {
                // 正常的乘坐步骤
                steps.push({
                    type: 'subway',
                    title: `乘坐${segment.lineName}`,
                    detail: `从${fromStation}站到${toStation}站，途经${segmentStations}站`
                });
            } else if (isFirstSegment && segmentStations === 1 && segments.length > 1) {
                // 第一个segment只有起点站一个站，说明需要在起点换乘
                // 此时不添加乘坐步骤，但需要在后面添加"上车"提示
            }

            // 添加换乘步骤（不是最后一个segment时）
            if (!isLastSegment) {
                const nextSegment = segments[index + 1];
                const transferStationName = toStation || nextSegment.stations[0].name;

                // 如果是第一个segment且只有一个站，这是起点站，应该显示"上车"而不是"换乘"
                if (isFirstSegment && segmentStations === 1) {
                    steps.push({
                        type: 'start',
                        title: `在${transferStationName}站上车`,
                        detail: `乘坐${nextSegment.lineName}`
                    });
                } else {
                    steps.push({
                        type: 'transfer',
                        title: `换乘${nextSegment.lineName}`,
                        detail: `在${transferStationName}站换乘`
                    });
                }
            }
        });

        routeOptions.push({
            id: routeOptions.length + 1,
            name: `方案${routeOptions.length + 1}: ${routeType}`,
            description: description,
            type: routeType,
            duration: `${duration}分钟`,
            distance: `${distance.toFixed(1)}公里`,
            transfers: actualTransfers <= 0 ? '无需换乘' : `${actualTransfers}次`,
            transferCount: actualTransfers,
            steps: steps,
            startLine: `${startStation.lineId}-${startStation.direction}`,
            endLine: `${endStation.lineId}-${endStation.direction}`,
            stationCount: totalStations,
            startStation: startStation,
            endStation: endStation,
            segments: segments,
            fullPath: path,
            transferStations: transferStations.map(name =>
                path.find(s => s.name === name)
            ).filter(s => s),
            lineNames: lineNames  // 新增：途经的线路名称列表
        });
    });

    // 排序：优先级为 换乘次数 > 总站数
    routeOptions.sort((a, b) => {
        if (a.transferCount !== b.transferCount) {
            return a.transferCount - b.transferCount;
        }
        return a.stationCount - b.stationCount;
    });

    // 重新分配ID和名称
    routeOptions.forEach((route, index) => {
        route.id = index + 1;
        route.name = `方案${route.id}: ${route.type}`;
    });

    // 限制返回的路线数量（最多10个）
    const limitedRoutes = routeOptions.slice(0, 10);

    console.log(`生成了${limitedRoutes.length}个路线方案（换乘0-${Math.max(...limitedRoutes.map(r => r.transferCount))}次）`);
    return limitedRoutes;
}

/**
 * 在地图上显示路线方案（支持多次换乘）
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
            换乘次数: routeOption.transferCount || 0,
            总站数: routeOption.stationCount
        });

        let routeStations = [];
        let transferStationsInfo = [];

        // 如果路线包含完整路径信息（新算法生成的），直接使用
        if (routeOption.fullPath && routeOption.fullPath.length > 0) {
            console.log('使用完整路径信息显示路线');
            routeStations = routeOption.fullPath;

            // 提取换乘站信息
            if (routeOption.transferStations && routeOption.transferStations.length > 0) {
                transferStationsInfo = routeOption.transferStations.map(ts => ts.name);
            }

            console.log(`路线包含${routeStations.length}个站点，${transferStationsInfo.length}个换乘站`);
        }
        // 兼容旧的路线格式（无需换乘和1次换乘）
        else {
            console.log('使用传统方式构建路线');
            const startLineStations = getLineStations(routeOption.startLine);
            const endLineStations = routeOption.endLine ? getLineStations(routeOption.endLine) : [];

            if ((routeOption.type === '1次换乘' || routeOption.type === '一次换乘') && routeOption.intersection) {
                // 1次换乘路线
                const intersectionIndex = startLineStations.findIndex(station =>
                    normalizeStationName(station.name) === normalizeStationName(routeOption.intersection)
                );
                const intersectionIndex2 = endLineStations.findIndex(station =>
                    normalizeStationName(station.name) === normalizeStationName(routeOption.intersection)
                );
                const startIndex = startLineStations.findIndex(station =>
                    normalizeStationName(station.name) === normalizeStationName(startStation.name)
                );
                const endIndex = endLineStations.findIndex(station =>
                    normalizeStationName(station.name) === normalizeStationName(endStation.name)
                );

                if (startIndex !== -1 && intersectionIndex !== -1) {
                    const startSegment = startIndex < intersectionIndex ?
                        startLineStations.slice(startIndex, intersectionIndex + 1) :
                        startLineStations.slice(intersectionIndex, startIndex + 1).reverse();
                    routeStations.push(...startSegment);
                }

                if (intersectionIndex2 !== -1 && endIndex !== -1) {
                    const endSegment = intersectionIndex2 < endIndex ?
                        endLineStations.slice(intersectionIndex2 + 1, endIndex + 1) :
                        endLineStations.slice(endIndex, intersectionIndex2).reverse();
                    routeStations.push(...endSegment);
                }

                transferStationsInfo = [routeOption.intersection];
            } else {
                // 无需换乘路线
                const startIndex = startLineStations.findIndex(station =>
                    normalizeStationName(station.name) === normalizeStationName(startStation.name)
                );
                const endIndex = startLineStations.findIndex(station =>
                    normalizeStationName(station.name) === normalizeStationName(endStation.name)
                );

                if (startIndex !== -1 && endIndex !== -1) {
                    const segment = startIndex < endIndex ?
                        startLineStations.slice(startIndex, endIndex + 1) :
                        startLineStations.slice(endIndex, startIndex + 1).reverse();
                    routeStations.push(...segment);
                }
            }
        }

        console.log(`总共收集到 ${routeStations.length} 个站点显示`);

        // 在地图上标记这些站点
        if (window.markerManager && typeof window.markerManager.createRouteMarkers === 'function') {
            console.log('调用markerManager.createRouteMarkers:', {
                起点: startStation?.name,
                终点: endStation?.name,
                换乘站: transferStationsInfo.join(', '),
                站点数: routeStations.length
            });

            // 对于多次换乘，传递换乘站列表
            window.markerManager.createRouteMarkers(
                routeStations,
                startStation,
                endStation,
                transferStationsInfo.length === 1 ? transferStationsInfo[0] : transferStationsInfo
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