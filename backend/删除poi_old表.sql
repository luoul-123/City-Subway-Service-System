-- ============================================
-- 删除 poi_old 表的 SQL 脚本
-- 说明: poi_old 表已废弃，系统已全面迁移到使用 poi 表
-- ============================================

-- 步骤1: 检查 poi_old 表是否存在
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'poi_old'
) AS poi_old_exists;

-- 步骤2（可选）: 查看 poi_old 表的记录数（确认要删除的数据量）
SELECT COUNT(*) AS poi_old_count FROM poi_old;

-- 步骤3（推荐）: 备份 poi_old 表到临时表
-- 如果未来需要恢复，可以从这个备份表恢复
CREATE TABLE poi_old_backup AS 
SELECT * FROM poi_old;

-- 验证备份成功
SELECT COUNT(*) AS backup_count FROM poi_old_backup;

-- 步骤4: 删除 poi_old 表
DROP TABLE IF EXISTS poi_old CASCADE;

-- 步骤5: 验证删除成功
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'poi_old'
) AS poi_old_still_exists;
-- 应该返回 false，表示删除成功

-- ============================================
-- 如果将来需要恢复 poi_old 表，执行以下命令：
-- CREATE TABLE poi_old AS SELECT * FROM poi_old_backup;
-- ============================================

-- 如果确认不再需要备份表，可以删除备份（建议保留一段时间）：
-- DROP TABLE IF EXISTS poi_old_backup;
-- ============================================

