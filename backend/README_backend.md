# 后端使用说明（Flask + PostgreSQL）

> 目标：在本地启动 Flask 后端，为前端提供用户注册 / 登录 / 个人中心 / 退出登录 API。

## 环境准备
1. 安装 Python 3.11（或兼容版本），推荐使用 conda 虚拟环境：
   ```bash
   conda create -n metro python=3.11 -y
   conda activate metro
   ```
2. 安装依赖（位于 `backend/requirements.txt`）：
   ```bash
   pip install -r backend/requirements.txt
   ```

## 环境变量
- 在 `backend/.env` 中已配置远程 PostgreSQL，字段：
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`
- 代码通过 `python-dotenv` 自动加载，不要在代码里写死账号密码。

## 运行后端
在根目录或 `backend/` 目录执行：
```bash
cd backend
python app.py
```
- 默认监听 `http://0.0.0.0:5000`（开发模式开启 `debug=True`）。
- 如端口占用，可在 `app.py` 最后一行调整端口。

## 主要文件
- `app.py`：Flask 主程序，暴露用户相关 API，并开启 CORS，便于静态页调用。
- `db.py` ：数据库连接封装，使用 `.env` 读取连接信息。
- `requirements.txt`：依赖列表（flask、flask-cors、psycopg2-binary、python-dotenv、werkzeug）。
