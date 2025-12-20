/**
 * 自动完成工具函数
 */

class AutocompleteManager {
    constructor(map, poiData, stopData, onSelectCallback) {
        this.map = map;
        this.poiData = poiData;
        this.stopData = stopData;
        this.onSelectCallback = onSelectCallback;
        this.activeDropdowns = new Set();
    }

    /**
     * 初始化输入框的自动完成
     */
    initForInput(inputElement, type) {
        let autocompleteItems = [];
        let selectedIndex = -1;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        inputElement.parentNode.appendChild(dropdown);
        this.activeDropdowns.add(dropdown);

        // 输入事件
        inputElement.addEventListener('input', (e) => this.handleInput(e, inputElement, dropdown, type));
        
        // 键盘导航
        inputElement.addEventListener('keydown', (e) => this.handleKeydown(e, inputElement, dropdown, autocompleteItems, selectedIndex));
        
        // 点击外部隐藏
        document.addEventListener('click', (e) => this.handleClickOutside(e, inputElement, dropdown));
    }

    /**
     * 处理输入
     */
    handleInput(e, inputElement, dropdown, type) {
        const value = e.target.value.trim();
        if (value.length < 1) {
            dropdown.style.display = 'none';
            return;
        }

        const results = this.searchLocation(value);
        
        if (results.length === 0) {
            dropdown.innerHTML = '<div class="autocomplete-item no-results">未找到相关地点</div>';
            dropdown.style.display = 'block';
            return;
        }

        dropdown.innerHTML = results.map((item, index) => `
            <div class="autocomplete-item" data-index="${index}">
                <div class="poi-name">${highlightText(item.name, value)}</div>
                <div class="poi-info">
                    <div class="poi-type">${item.type}</div>
                    ${item.address ? `<div class="poi-address">${item.address}</div>` : ''}
                </div>
            </div>
        `).join('');

        dropdown.style.display = 'block';

        // 绑定点击事件
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.getAttribute('data-index'));
                this.selectItem(results[index], inputElement, dropdown, type);
            });
        });
    }

    /**
     * 搜索位置
     */
    searchLocation(query) {
        const filteredPOIs = this.poiData.filter(poi => 
            poi.name.includes(query) || (poi.address && poi.address.includes(query))
        );
        
        const filteredStops = this.stopData.filter(stop => 
            stop.name.includes(query) || (stop.linename && stop.linename.includes(query))
        );
        
        console.log('搜索结果 - 地铁站:', filteredStops.length, '个, POI:', filteredPOIs.length, '个');
        if (filteredStops.length > 0) {
            console.log('第一个地铁站:', filteredStops[0]);
        }
        
        const results = [...filteredStops, ...filteredPOIs]
            .filter((item, index, self) => self.findIndex(i => i.name === item.name) === index)
            .slice(0, 8);
        
        return results;
    }

    /**
     * 选择项目
     */
    selectItem(item, inputElement, dropdown, type) {
        inputElement.value = item.name;
        dropdown.style.display = 'none';
        
        // 地图跳转到该位置
        this.map.flyTo({
            center: [item.wgsLon, item.wgsLat],
            zoom: 15,
            duration: 1000
        });

        // 回调函数处理标记创建
        if (this.onSelectCallback) {
            this.onSelectCallback(item, type);
        }
    }

    /**
     * 处理键盘导航
     */
    handleKeydown(e, inputElement, dropdown, autocompleteItems, selectedIndex) {
        if (!dropdown.style.display || dropdown.style.display === 'none') return;

        const items = dropdown.querySelectorAll('.autocomplete-item:not(.no-results)');
        if (items.length === 0) return;

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                this.updateSelectedItem(items, selectedIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                this.updateSelectedItem(items, selectedIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    const item = autocompleteItems[selectedIndex];
                    this.selectItem(item, inputElement, dropdown, 'start');
                }
                break;
            case 'Escape':
                dropdown.style.display = 'none';
                break;
        }
    }

    /**
     * 更新选中项目样式
     */
    updateSelectedItem(items, selectedIndex) {
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === selectedIndex);
        });
    }

    /**
     * 处理点击外部
     */
    handleClickOutside(e, inputElement, dropdown) {
        if (!inputElement.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    }

    /**
     * 更新数据源
     */
    updateData(poiData, stopData) {
        this.poiData = poiData;
        this.stopData = stopData;
    }

    /**
     * 清理
     */
    cleanup() {
        this.activeDropdowns.forEach(dropdown => {
            if (dropdown.parentNode) {
                dropdown.parentNode.removeChild(dropdown);
            }
        });
        this.activeDropdowns.clear();
    }
}

// 导出到全局
window.AutocompleteManager = AutocompleteManager;