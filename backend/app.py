"""
Flask 后端 - 用户最小闭环

启动步骤：
1) conda create -n metro python=3.11 -y
2) conda activate metro
3) pip install -r backend/requirements.txt
4) cd backend && python app.py
前端：直接双击打开 frontend/login.html / frontend/index.html，通过 http://127.0.0.1:5000 调用 API。
"""

import datetime
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_compress import Compress  # 添加 gzip 压缩支持
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2
from psycopg2.extras import RealDictCursor

from db import get_conn


app = Flask(__name__)
CORS(app)  # 允许前端静态页跨域调用
Compress(app)  # 启用 gzip 压缩，显著减少传输数据量

# ========== 数据缓存（提升性能）==========
_metro_data_cache = {}

def format_ts(ts):
    """时间转字符串（本地时区，易读格式）。"""
    if ts is None:
        return None
    if isinstance(ts, datetime.datetime):
        return ts.astimezone().strftime("%Y-%m-%d %H:%M:%S")
    return str(ts)


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    display_name = (data.get("display_name") or username).strip()
    email = (data.get("email") or "").strip()

    if not username or not password:
        return jsonify({"message": "用户名和密码不能为空"}), 400

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 查重（用户名 / 昵称 / 邮箱）
        cur.execute(
            """
            SELECT username, display_name, email
            FROM app_user
            WHERE username = %s OR display_name = %s OR email = %s
            """,
            (username, display_name, email or None),
        )
        existing = cur.fetchone()
        if existing:
            # 返回具体提示，供前端展示
            if existing.get("username") == username:
                return jsonify({"message": "用户名已存在"}), 400
            if existing.get("display_name") == display_name:
                return jsonify({"message": "昵称已存在"}), 400
            if email and existing.get("email") == email:
                return jsonify({"message": "邮箱已存在"}), 400

        safe_question = (data.get("safe_question") or "").strip()
        if not safe_question:
            return jsonify({"message": "安全问题答案不能为空"}), 400

        pwd_hash = generate_password_hash(password)
        safe_question_hash = generate_password_hash(safe_question)  # 安全问题答案也加密存储
        cur.execute(
            """
            INSERT INTO app_user (username, password_hash, display_name, email, safe_question)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING user_id, username, display_name, email, created_at
            """,
            (username, pwd_hash, display_name, email, safe_question_hash),
        )
        user = cur.fetchone()
        conn.commit()

        user["created_at"] = format_ts(user["created_at"])
        return jsonify({"message": "注册成功", **user}), 201
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[register] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("username") or "").strip()  # 可为用户名或邮箱
    password = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"message": "请输入用户名/邮箱和密码"}), 400

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(
            """
            SELECT user_id, username, password_hash, display_name, email, status
            FROM app_user
            WHERE (username = %s OR email = %s)
            """,
            (identifier, identifier),
        )
        user = cur.fetchone()
        if not user or user["status"] != 1:
            return jsonify({"message": "用户不存在或已被停用"}), 401

        if not check_password_hash(user["password_hash"], password):
            return jsonify({"message": "密码错误"}), 401

        # 更新最后登录时间
        cur.execute(
            "UPDATE app_user SET last_login_at = NOW() WHERE user_id = %s",
            (user["user_id"],),
        )

        # 记录登录日志
        ip_addr = request.remote_addr
        ua = (request.headers.get("User-Agent") or "")[:500]
        cur.execute(
            """
            INSERT INTO user_login_log (user_id, ip_address, user_agent)
            VALUES (%s, %s, %s)
            """,
            (user["user_id"], ip_addr, ua),
        )

        conn.commit()

        resp = {
            "message": "登录成功",
            "user_id": user["user_id"],
            "username": user["username"],
            "display_name": user["display_name"],
            "email": user["email"],
        }
        return jsonify(resp), 200
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[login] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/profile", methods=["GET"])
def profile():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"message": "缺少 user_id 参数"}), 400

    conn = None
    cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT user_id, username, display_name, email, created_at, last_login_at, status
            FROM app_user
            WHERE user_id = %s
            """,
            (user_id,),
        )
        user = cur.fetchone()
        if not user:
            return jsonify({"message": "用户不存在"}), 404

        user["created_at"] = format_ts(user["created_at"])
        user["last_login_at"] = format_ts(user["last_login_at"])
        return jsonify(user), 200
    except Exception as e:
        print(f"[profile] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/logout", methods=["POST"])
def logout():
    # 简版：不做服务端状态清理，直接返回成功
    return jsonify({"message": "已退出登录"}), 200


@app.route("/api/check_user", methods=["POST"])
def check_user():
    """实时校验用户名 / 邮箱是否已存在，用于前端输入时提示。"""
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()

    if not username and not email:
        return jsonify({"message": "缺少校验字段"}), 400

    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT username, email
            FROM app_user
            WHERE (%s <> '' AND username = %s)
               OR (%s <> '' AND email = %s)
            """,
            (username, username, email, email),
        )
        rows = cur.fetchall()
        username_taken = any(r.get("username") == username for r in rows)
        email_taken = any(email and r.get("email") == email for r in rows)
        return jsonify({
            "username_taken": username_taken,
            "email_taken": email_taken
        }), 200
    except Exception as e:
        print(f"[check_user] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/get_security_question", methods=["GET"])
def get_security_question():
    """获取用户的安全问题（用于忘记密码/修改密码页面）。"""
    identifier = request.args.get("identifier", "").strip()  # 用户名或邮箱
    if not identifier:
        return jsonify({"message": "缺少用户标识"}), 400

    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT user_id, username, email
            FROM app_user
            WHERE (username = %s OR email = %s) AND status = 1
            """,
            (identifier, identifier),
        )
        user = cur.fetchone()
        if not user:
            return jsonify({"message": "用户不存在"}), 404

        return jsonify({
            "user_id": user["user_id"],
            "username": user["username"],
            "question": "你小学时期最喜欢的老师的名字是什么？"
        }), 200
    except Exception as e:
        print(f"[get_security_question] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/verify_security_answer", methods=["POST"])
def verify_security_answer():
    """验证安全问题答案（用于忘记密码/修改密码/修改安全问题）。"""
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    answer = (data.get("answer") or "").strip()

    if not user_id or not answer:
        return jsonify({"message": "缺少必要参数"}), 400

    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT safe_question
            FROM app_user
            WHERE user_id = %s AND status = 1
            """,
            (user_id,),
        )
        user = cur.fetchone()
        if not user:
            return jsonify({"message": "用户不存在"}), 404

        if not user.get("safe_question"):
            return jsonify({"message": "用户未设置安全问题"}), 400

        if not check_password_hash(user["safe_question"], answer):
            return jsonify({"message": "安全问题答案错误"}), 401

        return jsonify({"message": "验证成功"}), 200
    except Exception as e:
        print(f"[verify_security_answer] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/reset_password", methods=["POST"])
def reset_password():
    """忘记密码：通过安全问题重置密码。"""
    data = request.get_json(silent=True) or {}
    identifier = (data.get("identifier") or "").strip()  # 用户名或邮箱
    answer = (data.get("answer") or "").strip()
    new_password = data.get("new_password") or ""

    if not identifier or not answer or not new_password:
        return jsonify({"message": "缺少必要参数"}), 400

    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT user_id, safe_question
            FROM app_user
            WHERE (username = %s OR email = %s) AND status = 1
            """,
            (identifier, identifier),
        )
        user = cur.fetchone()
        if not user:
            return jsonify({"message": "用户不存在"}), 404

        if not user.get("safe_question"):
            return jsonify({"message": "用户未设置安全问题"}), 400

        if not check_password_hash(user["safe_question"], answer):
            return jsonify({"message": "安全问题答案错误"}), 401

        # 更新密码
        new_pwd_hash = generate_password_hash(new_password)
        cur.execute(
            "UPDATE app_user SET password_hash = %s WHERE user_id = %s",
            (new_pwd_hash, user["user_id"]),
        )
        conn.commit()

        return jsonify({"message": "密码重置成功"}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[reset_password] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/change_password", methods=["POST"])
def change_password():
    """修改密码（需要先验证安全问题答案）。"""
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    answer = (data.get("answer") or "").strip()
    new_password = data.get("new_password") or ""

    if not user_id or not answer or not new_password:
        return jsonify({"message": "缺少必要参数"}), 400

    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT safe_question
            FROM app_user
            WHERE user_id = %s AND status = 1
            """,
            (user_id,),
        )
        user = cur.fetchone()
        if not user:
            return jsonify({"message": "用户不存在"}), 404

        if not user.get("safe_question"):
            return jsonify({"message": "用户未设置安全问题"}), 400

        if not check_password_hash(user["safe_question"], answer):
            return jsonify({"message": "安全问题答案错误"}), 401

        # 更新密码
        new_pwd_hash = generate_password_hash(new_password)
        cur.execute(
            "UPDATE app_user SET password_hash = %s WHERE user_id = %s",
            (new_pwd_hash, user_id),
        )
        conn.commit()

        return jsonify({"message": "密码修改成功"}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[change_password] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/change_security_answer", methods=["POST"])
def change_security_answer():
    """修改安全问题答案（需要先验证旧答案）。"""
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    old_answer = (data.get("old_answer") or "").strip()
    new_answer = (data.get("new_answer") or "").strip()

    if not user_id or not old_answer or not new_answer:
        return jsonify({"message": "缺少必要参数"}), 400

    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            """
            SELECT safe_question
            FROM app_user
            WHERE user_id = %s AND status = 1
            """,
            (user_id,),
        )
        user = cur.fetchone()
        if not user:
            return jsonify({"message": "用户不存在"}), 404

        if not user.get("safe_question"):
            return jsonify({"message": "用户未设置安全问题"}), 400

        if not check_password_hash(user["safe_question"], old_answer):
            return jsonify({"message": "原安全问题答案错误"}), 401

        # 更新安全问题答案
        new_answer_hash = generate_password_hash(new_answer)
        cur.execute(
            "UPDATE app_user SET safe_question = %s WHERE user_id = %s",
            (new_answer_hash, user_id),
        )
        conn.commit()

        return jsonify({"message": "安全问题答案修改成功"}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[change_security_answer] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/metro/lines", methods=["GET"])
def get_metro_lines():
    """获取地铁线路数据（GeoJSON格式，带缓存优化）"""
    city_code = request.args.get("city", "nj")
    
    # 【性能优化】检查缓存
    cache_key = f"lines_{city_code}"
    if cache_key in _metro_data_cache:
        print(f"[缓存命中] 线路数据: {city_code}")
        return jsonify(_metro_data_cache[cache_key]), 200
    
    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 查询线路数据，转换为 GeoJSON 格式
        # 使用 ST_SimplifyPreserveTopology 简化复杂几何（可选，如需进一步优化可启用）
        cur.execute("""
            SELECT 
                line_id,
                city_code,
                line_name,
                ST_AsGeoJSON(line_geom) as geometry,
                properties
            FROM metro_line
            WHERE city_code = %s
            ORDER BY line_name
        """, (city_code,))
        
        lines = cur.fetchall()
        
        # 构建 GeoJSON FeatureCollection
        features = []
        for line in lines:
            feature = {
                "type": "Feature",
                "properties": {
                    "name": line["line_name"],
                    "line_id": line["line_id"],
                    **(line["properties"] or {})
                },
                "geometry": json.loads(line["geometry"]) if line["geometry"] else None
            }
            features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        # 【性能优化】存入缓存
        _metro_data_cache[cache_key] = geojson
        print(f"[缓存更新] 线路数据: {city_code}, 共{len(lines)}条线路")
        
        return jsonify(geojson), 200
        
    except Exception as e:
        print(f"[get_metro_lines] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/metro/stations", methods=["GET"])
def get_metro_stations():
    """获取地铁站点数据（带缓存优化）"""
    city_code = request.args.get("city", "nj")
    
    # 【性能优化】检查缓存
    cache_key = f"stations_{city_code}"
    if cache_key in _metro_data_cache:
        print(f"[缓存命中] 站点数据: {city_code}")
        return jsonify(_metro_data_cache[cache_key]), 200
    
    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 查询站点数据（包含line_number字段）
        cur.execute("""
            SELECT 
                station_id,
                city_code,
                station_name as name,
                line_name as linename,
                line_number,
                lon,
                lat,
                station_num as num,
                direction,
                properties
            FROM metro_station
            WHERE city_code = %s
            ORDER BY line_name, station_num
        """, (city_code,))
        
        stations = cur.fetchall()
        
        # 从线路名称提取线路编号的辅助函数（备用，当line_number为空时使用）
        def extract_line_number(line_name):
            """从线路名称提取编号，如 '1号线' -> 1, 'S1号线' -> 'S1'"""
            import re
            if not line_name:
                return 0
            # 匹配 S1, S2 等
            match = re.search(r'(S\d+)', line_name)
            if match:
                return match.group(1)
            # 匹配普通数字
            match = re.search(r'(\d+)', line_name)
            if match:
                return int(match.group(1))
            return 0
        
        # 转换为原格式（兼容前端）
        result = {
            "name": {},
            "linename": {},
            "lon": {},
            "lat": {},
            "num": {},
            "direction": {},
            "x": {}  # 线路编号（关键字段！用于路径规划）
        }
        
        for idx, station in enumerate(stations):
            str_idx = str(idx * 2)  # 保持原格式的索引方式
            result["name"][str_idx] = station["name"]
            result["linename"][str_idx] = station["linename"]
            result["lon"][str_idx] = float(station["lon"])
            result["lat"][str_idx] = float(station["lat"])
            result["num"][str_idx] = station["num"]
            result["direction"][str_idx] = station["direction"]
            # 优先使用数据库中的line_number，否则从line_name提取
            line_num = station.get("line_number")
            if line_num:
                # 尝试转为整数（如果是纯数字）
                try:
                    result["x"][str_idx] = int(line_num)
                except (ValueError, TypeError):
                    result["x"][str_idx] = line_num  # 保持字符串如 "S1"
            else:
                result["x"][str_idx] = extract_line_number(station["linename"])
        
        # 【性能优化】存入缓存
        _metro_data_cache[cache_key] = result
        print(f"[缓存更新] 站点数据: {city_code}, 共{len(stations)}条")
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"[get_metro_stations] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/poi", methods=["GET"])
def get_poi_data():
    """获取POI数据"""
    city_code = request.args.get("city", "nj")
    poi_type = request.args.get("type")  # 可选：按类型筛选
    
    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 构建查询
        if poi_type:
            cur.execute("""
                SELECT 
                    external_id as id,
                    poi_name as name,
                    poi_type as type,
                    type_code,
                    search_type,
                    lon,
                    lat,
                    address,
                    tel,
                    business_area,
                    properties
                FROM poi
                WHERE city_code = %s AND poi_type = %s
                ORDER BY poi_name
            """, (city_code, poi_type))
        else:
            cur.execute("""
                SELECT 
                    external_id as id,
                    poi_name as name,
                    poi_type as type,
                    type_code,
                    search_type,
                    lon,
                    lat,
                    address,
                    tel,
                    business_area,
                    properties
                FROM poi
                WHERE city_code = %s
                ORDER BY poi_name
            """, (city_code,))
        
        pois = cur.fetchall()
        
        # 转换格式（兼容前端）
        result_pois = []
        for poi in pois:
            poi_dict = dict(poi)
            # 合并 properties 到主对象
            if poi_dict.get('properties'):
                props = poi_dict.pop('properties')
                poi_dict.update(props)
            result_pois.append(poi_dict)
        
        result = {
            "pois": result_pois
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"[get_poi_data] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/poi/nearby", methods=["GET"])
def get_nearby_poi():
    """获取站点附近的POI（使用PostGIS空间查询）"""
    city_code = request.args.get("city", "nj")
    lon = request.args.get("lon", type=float)
    lat = request.args.get("lat", type=float)
    radius = request.args.get("radius", 300, type=int)  # 半径（米）
    
    if not lon or not lat:
        return jsonify({"message": "缺少经纬度参数"}), 400
    
    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 使用 PostGIS 的 ST_DWithin 进行空间查询
        # ST_DWithin 的第三个参数是距离，需要转换为度（大约1度≈111km）
        radius_degrees = radius / 111000.0
        
        cur.execute("""
            SELECT 
                external_id as id,
                poi_name as name,
                poi_type as type,
                type_code,
                lon,
                lat,
                address,
                tel,
                business_area,
                ST_Distance(
                    location::geography, 
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
                ) as distance
            FROM poi
            WHERE city_code = %s
                AND ST_DWithin(
                    location::geography,
                    ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                    %s
                )
            ORDER BY distance
            LIMIT 500
        """, (lon, lat, city_code, lon, lat, radius))
        
        pois = cur.fetchall()
        
        result_pois = []
        for poi in pois:
            poi_dict = dict(poi)
            poi_dict['distance'] = round(poi_dict['distance'], 2)  # 距离（米）
            result_pois.append(poi_dict)
        
        return jsonify({"pois": result_pois, "total": len(result_pois)}), 200
        
    except Exception as e:
        print(f"[get_nearby_poi] 错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


# ========== 收藏站点相关接口 ==========

@app.route("/api/favorite/add", methods=["POST"])
def add_favorite_station():
    """添加收藏站点"""
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    city_code = (data.get("city_code") or "").strip()
    station_id = (data.get("station_id") or "").strip()

    if not user_id or not city_code or not station_id:
        return jsonify({"message": "缺少必要参数"}), 400

    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 检查是否已收藏
        cur.execute(
            """
            SELECT fav_id FROM user_favorite_station
            WHERE user_id = %s AND city_code = %s AND station_id = %s
            """,
            (user_id, city_code, station_id),
        )
        existing = cur.fetchone()
        if existing:
            return jsonify({"message": "该站点已收藏", "fav_id": existing["fav_id"]}), 200

        # 添加收藏（只存储基本信息）
        cur.execute(
            """
            INSERT INTO user_favorite_station (user_id, city_code, station_id)
            VALUES (%s, %s, %s)
            RETURNING fav_id, created_at
            """,
            (user_id, city_code, station_id),
        )
        result = cur.fetchone()
        conn.commit()

        return jsonify({
            "message": "收藏成功",
            "fav_id": result["fav_id"],
            "created_at": format_ts(result["created_at"])
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[add_favorite_station] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/favorite/remove", methods=["POST"])
def remove_favorite_station():
    """取消收藏站点"""
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    city_code = (data.get("city_code") or "").strip()
    station_id = (data.get("station_id") or "").strip()

    if not user_id or not city_code or not station_id:
        return jsonify({"message": "缺少必要参数"}), 400

    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 删除收藏
        cur.execute(
            """
            DELETE FROM user_favorite_station
            WHERE user_id = %s AND city_code = %s AND station_id = %s
            RETURNING fav_id
            """,
            (user_id, city_code, station_id),
        )
        deleted = cur.fetchone()
        conn.commit()

        if deleted:
            return jsonify({"message": "已取消收藏"}), 200
        else:
            return jsonify({"message": "未找到该收藏记录"}), 404

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[remove_favorite_station] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/favorite/list", methods=["GET"])
def get_favorite_stations():
    """获取用户收藏的站点列表（关联查询站点和线路信息）"""
    user_id = request.args.get("user_id")
    
    if not user_id:
        return jsonify({"message": "缺少user_id参数"}), 400

    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # 查询收藏列表，并关联metro_station表获取站点详情
        # station_id存储的是站点名称
        cur.execute(
            """
            SELECT DISTINCT 
                f.fav_id, 
                f.city_code, 
                f.station_id,
                f.station_id as station_name,
                f.created_at,
                COALESCE(
                    (SELECT ms.line_name FROM metro_station ms 
                     WHERE ms.city_code = f.city_code 
                     AND ms.station_name = f.station_id 
                     LIMIT 1),
                    '未知线路'
                ) as line_name,
                COALESCE(
                    (SELECT ms.lon FROM metro_station ms 
                     WHERE ms.city_code = f.city_code 
                     AND ms.station_name = f.station_id 
                     LIMIT 1),
                    0
                ) as lon,
                COALESCE(
                    (SELECT ms.lat FROM metro_station ms 
                     WHERE ms.city_code = f.city_code 
                     AND ms.station_name = f.station_id 
                     LIMIT 1),
                    0
                ) as lat
            FROM user_favorite_station f
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
            """,
            (user_id,),
        )
        favorites = cur.fetchall()

        # 格式化时间和坐标
        for fav in favorites:
            fav["created_at"] = format_ts(fav["created_at"])
            fav["lon"] = float(fav["lon"]) if fav["lon"] else 0
            fav["lat"] = float(fav["lat"]) if fav["lat"] else 0

        return jsonify({"favorites": favorites, "total": len(favorites)}), 200

    except Exception as e:
        print(f"[get_favorite_stations] 错误: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/favorite/check", methods=["GET"])
def check_favorite_station():
    """检查站点是否已收藏"""
    user_id = request.args.get("user_id")
    city_code = request.args.get("city_code", "").strip()
    station_id = request.args.get("station_id", "").strip()

    if not user_id or not city_code or not station_id:
        return jsonify({"message": "缺少必要参数"}), 400

    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute(
            """
            SELECT fav_id FROM user_favorite_station
            WHERE user_id = %s AND city_code = %s AND station_id = %s
            """,
            (user_id, city_code, station_id),
        )
        existing = cur.fetchone()

        return jsonify({
            "is_favorite": existing is not None,
            "fav_id": existing["fav_id"] if existing else None
        }), 200

    except Exception as e:
        print(f"[check_favorite_station] 错误: {e}")
        return jsonify({"message": "服务器错误，请稍后重试"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/cache/warm", methods=["POST"])
def warm_cache():
    """预热缓存 - 预加载所有城市的地铁数据"""
    city_codes = ["nj", "bj", "sh", "wh"]
    results = {}
    
    conn = cur = None
    try:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        for city_code in city_codes:
            # 预热线路数据
            lines_cache_key = f"lines_{city_code}"
            if lines_cache_key not in _metro_data_cache:
                cur.execute("""
                    SELECT line_id, city_code, line_name,
                           ST_AsGeoJSON(line_geom) as geometry, properties
                    FROM metro_line WHERE city_code = %s ORDER BY line_name
                """, (city_code,))
                lines = cur.fetchall()
                features = []
                for line in lines:
                    features.append({
                        "type": "Feature",
                        "properties": {"name": line["line_name"], "line_id": line["line_id"], **(line["properties"] or {})},
                        "geometry": json.loads(line["geometry"]) if line["geometry"] else None
                    })
                _metro_data_cache[lines_cache_key] = {"type": "FeatureCollection", "features": features}
                results[f"{city_code}_lines"] = f"已缓存 {len(lines)} 条线路"
            else:
                results[f"{city_code}_lines"] = "已存在缓存"
            
            # 预热站点数据
            stations_cache_key = f"stations_{city_code}"
            if stations_cache_key not in _metro_data_cache:
                cur.execute("""
                    SELECT station_id, city_code, station_name as name, line_name as linename,
                           line_number, lon, lat, station_num as num, direction, properties
                    FROM metro_station WHERE city_code = %s ORDER BY line_name, station_num
                """, (city_code,))
                stations = cur.fetchall()
                result = {"name": {}, "linename": {}, "lon": {}, "lat": {}, "num": {}, "direction": {}, "x": {}}
                for idx, station in enumerate(stations):
                    str_idx = str(idx * 2)
                    result["name"][str_idx] = station["name"]
                    result["linename"][str_idx] = station["linename"]
                    result["lon"][str_idx] = float(station["lon"])
                    result["lat"][str_idx] = float(station["lat"])
                    result["num"][str_idx] = station["num"]
                    result["direction"][str_idx] = station["direction"]
                    line_num = station.get("line_number")
                    if line_num:
                        try:
                            result["x"][str_idx] = int(line_num)
                        except (ValueError, TypeError):
                            result["x"][str_idx] = line_num
                    else:
                        result["x"][str_idx] = 0
                _metro_data_cache[stations_cache_key] = result
                results[f"{city_code}_stations"] = f"已缓存 {len(stations)} 个站点"
            else:
                results[f"{city_code}_stations"] = "已存在缓存"
        
        return jsonify({"message": "缓存预热完成", "results": results}), 200
    except Exception as e:
        print(f"[warm_cache] 错误: {e}")
        return jsonify({"message": f"缓存预热失败: {str(e)}"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@app.route("/api/cache/clear", methods=["POST"])
def clear_cache():
    """清除所有缓存"""
    _metro_data_cache.clear()
    return jsonify({"message": "缓存已清除"}), 200


def preload_cache():
    """服务启动时预加载缓存"""
    print("[启动] 开始预热缓存...")
    try:
        with app.test_client() as client:
            client.post('/api/cache/warm')
        print("[启动] 缓存预热完成")
    except Exception as e:
        print(f"[启动] 缓存预热失败: {e}")


if __name__ == "__main__":
    # 预热缓存（首次加载后，后续请求将使用缓存）
    preload_cache()
    # 在本地开发环境使用，生产需替换为更安全的部署方式
    app.run(host="0.0.0.0", port=5000, debug=True)

