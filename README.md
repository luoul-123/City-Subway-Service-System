# City-Subway-Service-System（城市地铁服务系统）

## 项目基础信息

- 地理信息服务课程第4次作业

## 项目分工

- 罗日彤：前端架构搭建与 Mapbox 地图引擎集成，站点与路线数据爬取；线路详情页、路线规划页设计与功能实现；登录页功能完善；代码整合与版本管理；
- 陆妍：
- 朱霁萌：云端服务器上的数据库部署，数据库设计与数据入库；系统后端搭建；首页，线路总览页设计与功能实现，登录、注册页、个人中心、收藏站点、安全问题、修改密码等用户相关页面及功能实现；路线规划算法改进与功能优化；

## 项目结构

```
城市地铁服务系统/
├── frontend/         # 前端文件（HTML、CSS、JS、图片、数据）
│   ├── index.html    # 首页
│   ├── login.html    # 登录页
│   ├── css/          # 样式文件
│   ├── js/           # JavaScript文件
│   ├── images/       # 图片资源
│   ├── data/         # 地铁数据（GeoJSON等）
│   └── iconfont/     # 图标字体
├── backend/          # 后端文件（Flask API）
│   ├── app.py        # Flask主程序
│   ├── db.py         # 数据库连接
│   └── requirements.txt
├── README.md         # 项目说明
└── CONTRIBUTING.md   # 贡献指南
```

## 快速开始

### 前端
直接用浏览器打开 `frontend/index.html` 即可访问系统首页

### 后端
详见 `backend/README_backend.md`

### 数据入库
如需将地铁和POI数据导入PostgreSQL数据库：
1. 安装PostgreSQL + PostGIS扩展
2. 执行 `backend/create_metro_tables.sql` 创建表结构
3. 运行 `python backend/import_metro_data.py` 导入数据
4. 详细步骤见 `backend/快速入门-数据入库.md`

## 数据来源

### 1. 地铁数据

- 来源：[CSDN博客 - Onestaring 的地铁数据分享](https://blog.csdn.net/Onestaring/article/details/136083773)

- 核心文件：`stop.json`（包含往返站点数据）

- 字段说明：stop.json为代表站点数据（包含往返）的json文件，其中name代表站点名字，linename代表线路的名称，x是线路的编号，lon代表经度，lat代表纬度，num代表该站点在该线路的第几个站，direction代表线路的方向，例如地铁1号线（莘庄-富锦路）的direction为1，而地铁1号线（富锦路-莘庄）的direction为2，direction仅有1和2两个取值。

### 2. POI数据

- 来源：高德地图开放平台爬取
