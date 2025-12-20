/**
 * API数据加载工具
 * 用于从后端API加载地铁线路、站点和POI数据
 */

// API基础URL
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// 是否启用API模式（可通过环境变量或配置切换）
const USE_API = true;  // 设置为 true 启用API，false 使用本地文件

/**
 * 加载地铁线路数据
 * @param {string} cityCode - 城市代码（bj, nj, sh, wh）
 * @returns {Promise<Object>} GeoJSON格式的线路数据
 */
async function loadMetroLines(cityCode) {
    if (USE_API) {
        // 从API加载
        const response = await fetch(`${API_BASE_URL}/metro/lines?city=${cityCode}`);
        if (!response.ok) {
            throw new Error(`加载线路数据失败: ${response.statusText}`);
        }
        return await response.json();
    } else {
        // 从本地文件加载（保持兼容）
        const response = await fetch(`./data/${cityCode}_line.geojson`);
        if (!response.ok) {
            throw new Error(`加载线路数据失败: ${response.statusText}`);
        }
        return await response.json();
    }
}

/**
 * 加载地铁站点数据
 * @param {string} cityCode - 城市代码（bj, nj, sh, wh）
 * @returns {Promise<Object>} 站点数据
 */
async function loadMetroStations(cityCode) {
    if (USE_API) {
        // 从API加载
        const response = await fetch(`${API_BASE_URL}/metro/stations?city=${cityCode}`);
        if (!response.ok) {
            throw new Error(`加载站点数据失败: ${response.statusText}`);
        }
        return await response.json();
    } else {
        // 从本地文件加载（保持兼容）
        const response = await fetch(`./data/${cityCode}_stop.json`);
        if (!response.ok) {
            throw new Error(`加载站点数据失败: ${response.statusText}`);
        }
        return await response.json();
    }
}

/**
 * 加载POI数据
 * @param {string} cityCode - 城市代码（bj, nj, sh, wh）
 * @param {string} poiType - POI类型（可选）
 * @returns {Promise<Object>} POI数据
 */
async function loadPOIData_API(cityCode, poiType = null) {
    if (USE_API) {
        // 从API加载
        let url = `${API_BASE_URL}/poi?city=${cityCode}`;
        if (poiType) {
            url += `&type=${encodeURIComponent(poiType)}`;
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`加载POI数据失败: ${response.statusText}`);
        }
        return await response.json();
    } else {
        // 从本地文件加载（保持兼容）
        const response = await fetch(`./data/POI/${cityCode}_poi.json`);
        if (!response.ok) {
            throw new Error(`加载POI数据失败: ${response.statusText}`);
        }
        return await response.json();
    }
}

/**
 * 加载附近的POI数据（仅API模式支持）
 * @param {string} cityCode - 城市代码
 * @param {number} lon - 经度
 * @param {number} lat - 纬度
 * @param {number} radius - 半径（米），默认300
 * @returns {Promise<Object>} 附近的POI数据
 */
async function loadNearbyPOI(cityCode, lon, lat, radius = 300) {
    if (!USE_API) {
        console.warn('附近POI查询需要启用API模式');
        // 降级到加载全部POI，由前端过滤
        const allPOI = await loadPOIData(cityCode);
        // 简单的距离过滤
        const filteredPOIs = allPOI.pois.filter(poi => {
            const distance = calculateDistance(lat, lon, poi.lat, poi.lon) * 1000; // 转为米
            return distance <= radius;
        });
        return { pois: filteredPOIs, total: filteredPOIs.length };
    }

    // 从API加载
    const url = `${API_BASE_URL}/poi/nearby?city=${cityCode}&lon=${lon}&lat=${lat}&radius=${radius}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`加载附近POI数据失败: ${response.statusText}`);
    }
    return await response.json();
}

/**
 * 计算两点间的距离（公里）
 * @param {number} lat1 - 纬度1
 * @param {number} lon1 - 经度1
 * @param {number} lat2 - 纬度2
 * @param {number} lon2 - 经度2
 * @returns {number} 距离（公里）
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * 切换数据源模式
 * @param {boolean} useApi - 是否使用API
 */
function setDataSourceMode(useApi) {
    USE_API = useApi;
    console.log(`数据源模式已切换为: ${useApi ? 'API' : '本地文件'}`);
}

/**
 * 获取当前数据源模式
 * @returns {boolean} 是否使用API
 */
function getDataSourceMode() {
    return USE_API;
}

// 导出函数（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadMetroLines,
        loadMetroStations,
        loadPOIData,
        loadNearbyPOI,
        setDataSourceMode,
        getDataSourceMode
    };
}

