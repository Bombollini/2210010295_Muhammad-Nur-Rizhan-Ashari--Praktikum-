-- Add 'staff' to user_role_enum
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'staff';
