// 加载POI数据（GCJ02转WGS84）- 使用API
function loadPOIData(currentCity) {
    // 使用API加载数据（已在api-data-utils.js中定义）
    return loadPOIData_API(currentCity).then(data => {
        const pois = data.pois || [];
        const formattedData = pois.map(poi => {
            const [wgsLng, wgsLat] = gcj02ToWgs84(
                parseFloat(poi.lon), 
                parseFloat(poi.lat)
            );
            return { ...poi, wgsLon: wgsLng, wgsLat: wgsLat };
        });
        console.log('POI数据加载成功:', formattedData.length, '条');
        return formattedData;
    }).catch(error => {
        console.error('API加载失败，尝试本地文件:', error);
        // 降级到本地文件
        return fetch(`./data/POI/${currentCity}_poi.json`)
            .then(response => {
                if (!response.ok) throw new Error('网络响应不正常');
                return response.json();
            })
            .then(data => {
                const formattedData = data.pois.map(poi => {
                    const [wgsLng, wgsLat] = gcj02ToWgs84(
                        parseFloat(poi.lon), 
                        parseFloat(poi.lat)
                    );
                    return { ...poi, wgsLon: wgsLng, wgsLat: wgsLat };
                });
                console.log('POI数据加载成功:', formattedData.length, '条');
                return formattedData;
            });
    });
}

// 格式化站点数据
function formatStopData(rawData) {
    const stops = [];
    const keys = Object.keys(rawData.name || {});
    
    keys.forEach(key => {
        const rawLineName = rawData.linename[key] || '';
        const cleanedLineName = rawLineName.replace(/\(.*?\)/g, '').trim();
        
        stops.push({
            id: key,
            name: rawData.name[key] || '',
            linename: cleanedLineName,
            lineNumber: rawData.x ? rawData.x[key] : '',
            lon: parseFloat(rawData.lon[key]) || 0,
            lat: parseFloat(rawData.lat[key]) || 0,
            num: parseInt(rawData.num[key]) || 0,
            direction: parseInt(rawData.direction[key]) || 1,
            type: '地铁站',
            wgsLon: parseFloat(rawData.lon[key]) || 0, 
            wgsLat: parseFloat(rawData.lat[key]) || 0,
            address: `${cleanedLineName}沿线站点`
        });
    });
    
    return stops;
}

// 加载地铁站数据 - 使用API
function loadStopData(currentCity) {
    // 使用API加载数据（已在api-data-utils.js中定义）
    return loadMetroStations(currentCity).then(rawData => {
        return formatStopData(rawData);
    }).catch(error => {
        console.error('API加载失败，尝试本地文件:', error);
        // 降级到本地文件
        return fetch(`./data/${currentCity}_stop.json`)
            .then(response => {
                if (!response.ok) throw new Error('站点数据加载失败');
                return response.json();
            })
            .then(rawData => formatStopData(rawData));
    });
}