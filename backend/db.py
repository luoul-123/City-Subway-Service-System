"""
数据库连接封装

使用 python-dotenv 读取 backend/.env 中的 DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD。
示例启动步骤（可写进实验报告）：
1) conda create -n metro python=3.11 -y && conda activate metro
2) pip install -r backend/requirements.txt
3) cd backend && python app.py
前端调试：直接用浏览器打开 frontend 目录下的 login.html / index.html，API 基地址 http://127.0.0.1:5000
"""

import os
import psycopg2
from dotenv import load_dotenv


# 在 backend 目录下加载 .env
load_dotenv()


def get_conn():
    """获取 PostgreSQL 连接，不直接暴露密码给代码。"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
        )
        return conn
    except Exception as e:
        print(f"[DB] 数据库连接失败: {e}")
        raise

