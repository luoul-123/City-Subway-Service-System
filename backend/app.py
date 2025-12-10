"""
Flask 后端 - 用户最小闭环

启动步骤：
1) conda create -n metro python=3.11 -y
2) conda activate metro
3) pip install -r backend/requirements.txt
4) cd backend && python app.py
前端：直接双击打开 login.html / index.html，通过 http://127.0.0.1:5000 调用 API。
"""

import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2
from psycopg2.extras import RealDictCursor

from db import get_conn


app = Flask(__name__)
CORS(app)  # 允许前端静态页跨域调用


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


if __name__ == "__main__":
    # 在本地开发环境使用，生产需替换为更安全的部署方式
    app.run(host="0.0.0.0", port=5000, debug=True)

