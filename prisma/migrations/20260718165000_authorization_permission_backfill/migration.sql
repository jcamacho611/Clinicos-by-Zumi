-- Backfill first-class workspace permissions for every existing tenant role.
WITH grants(role_key, resource, actions) AS (
  VALUES
    ('clinic_owner', 'cases', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('clinic_owner', 'quality', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('clinic_owner', 'insurance', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('clinic_owner', 'telemedicine', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('clinic_owner', 'portal', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('clinic_owner', 'integrations', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('clinic_owner', 'ai', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('administrator', 'cases', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('administrator', 'quality', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('administrator', 'insurance', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('administrator', 'telemedicine', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('administrator', 'portal', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('administrator', 'integrations', ARRAY['read', 'create', 'update']::TEXT[]),
    ('administrator', 'ai', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('provider', 'cases', ARRAY['read', 'create', 'update']::TEXT[]),
    ('provider', 'quality', ARRAY['read', 'update']::TEXT[]),
    ('provider', 'insurance', ARRAY['read']::TEXT[]),
    ('provider', 'telemedicine', ARRAY['read', 'create', 'update']::TEXT[]),
    ('provider', 'portal', ARRAY['read']::TEXT[]),
    ('provider', 'ai', ARRAY['read', 'create', 'update']::TEXT[]),
    ('clinical_staff', 'cases', ARRAY['read', 'create', 'update']::TEXT[]),
    ('clinical_staff', 'quality', ARRAY['read']::TEXT[]),
    ('clinical_staff', 'insurance', ARRAY['read', 'update']::TEXT[]),
    ('clinical_staff', 'telemedicine', ARRAY['read', 'create', 'update']::TEXT[]),
    ('clinical_staff', 'portal', ARRAY['read', 'update']::TEXT[]),
    ('clinical_staff', 'ai', ARRAY['read', 'create', 'update']::TEXT[]),
    ('front_desk', 'cases', ARRAY['read']::TEXT[]),
    ('front_desk', 'insurance', ARRAY['read', 'create', 'update']::TEXT[]),
    ('front_desk', 'telemedicine', ARRAY['read', 'update']::TEXT[]),
    ('front_desk', 'portal', ARRAY['read', 'create', 'update']::TEXT[]),
    ('front_desk', 'ai', ARRAY['read', 'create']::TEXT[]),
    ('biller', 'cases', ARRAY['read', 'create', 'update']::TEXT[]),
    ('biller', 'insurance', ARRAY['read', 'create', 'update']::TEXT[]),
    ('biller', 'telemedicine', ARRAY['read']::TEXT[]),
    ('biller', 'portal', ARRAY['read']::TEXT[]),
    ('biller', 'ai', ARRAY['read']::TEXT[]),
    ('quality', 'cases', ARRAY['read']::TEXT[]),
    ('quality', 'quality', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('quality', 'insurance', ARRAY['read']::TEXT[]),
    ('quality', 'telemedicine', ARRAY['read']::TEXT[]),
    ('quality', 'portal', ARRAY['read']::TEXT[]),
    ('quality', 'ai', ARRAY['read', 'create']::TEXT[]),
    ('case_manager', 'cases', ARRAY['read', 'create', 'update', 'manage']::TEXT[]),
    ('case_manager', 'quality', ARRAY['read']::TEXT[]),
    ('case_manager', 'insurance', ARRAY['read', 'create', 'update']::TEXT[]),
    ('case_manager', 'telemedicine', ARRAY['read']::TEXT[]),
    ('case_manager', 'portal', ARRAY['read', 'update']::TEXT[]),
    ('case_manager', 'ai', ARRAY['read', 'create', 'update']::TEXT[]),
    ('viewer', 'cases', ARRAY['read']::TEXT[]),
    ('viewer', 'quality', ARRAY['read']::TEXT[]),
    ('viewer', 'insurance', ARRAY['read']::TEXT[]),
    ('viewer', 'telemedicine', ARRAY['read']::TEXT[]),
    ('viewer', 'portal', ARRAY['read']::TEXT[]),
    ('viewer', 'integrations', ARRAY['read']::TEXT[]),
    ('viewer', 'ai', ARRAY['read']::TEXT[])
), expanded AS (
  SELECT role_key, resource, unnest(actions) AS action
  FROM grants
)
INSERT INTO "permissions" ("id", "roleId", "resource", "action", "allowed", "createdAt", "updatedAt")
SELECT
  'permission-' || md5(role.id || ':' || expanded.resource || ':' || expanded.action),
  role.id,
  expanded.resource,
  expanded.action,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "roles" role
JOIN expanded ON expanded.role_key = role.key
WHERE NOT EXISTS (
  SELECT 1
  FROM "permissions" permission
  WHERE permission."roleId" = role.id
    AND permission.resource = expanded.resource
    AND permission.action = expanded.action
);
