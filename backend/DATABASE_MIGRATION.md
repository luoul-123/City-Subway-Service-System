# 数据库迁移说明

## 添加 safe_question 列

为了支持安全问题功能，需要在 `app_user` 表中添加 `safe_question` 列。

### SQL 执行语句

请在 PostgreSQL 数据库中执行以下 SQL：

```sql
ALTER TABLE app_user 
ADD COLUMN safe_question VARCHAR(255);

COMMENT ON COLUMN app_user.safe_question IS '安全问题答案（加密存储）';
```

### 说明

- `safe_question` 字段用于存储用户注册时设置的安全问题答案
- 安全问题固定为："你小学时期最喜欢的老师的名字是什么？"
- 答案使用 `werkzeug.security.generate_password_hash` 加密存储
- 该字段用于：
  - 忘记密码时验证身份
  - 修改密码时验证身份
  - 修改安全问题答案时验证原答案

### 注意事项

- 对于已存在的用户，`safe_question` 字段值为 `NULL`
- 这些用户需要先登录，然后在个人中心设置安全问题答案后才能使用相关功能
- 新注册的用户必须填写安全问题答案才能完成注册

