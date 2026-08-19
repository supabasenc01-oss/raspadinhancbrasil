#!/usr/bin/env python3
import re
import sys

def add_on_conflict(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern for roles
    content = re.sub(
        r"(INSERT INTO public\.roles\s+\(key, name, description, is_staff\)\s+VALUES\s+.*?;)",
        lambda m: m.group(1).replace(';', '\nON CONFLICT (key) DO UPDATE SET\n  name = EXCLUDED.name,\n  description = EXCLUDED.description,\n  is_staff = EXCLUDED.is_staff;'),
        content, flags=re.DOTALL
    )

    # Pattern for wallets in handle_new_user_wallet
    content = re.sub(
        r"(INSERT INTO public\.wallets\s+\(user_id, balance\)\s+VALUES\s+\(new\.id, 0\.00\))(;)",
        r"\1\n  ON CONFLICT (user_id) DO NOTHING\2",
        content
    )

    # Pattern for initial wallets
    content = re.sub(
        r"(INSERT INTO public\.wallets\s+\(user_id, balance\)\s+SELECT\s+id, 0\.00\s+FROM\s+auth\.users)(;)",
        r"\1\nON CONFLICT (user_id) DO NOTHING\2",
        content
    )

    # Pattern for user_roles in admin setup blocks
    # We look for user_roles insert inside a DO block where it might be missing
    content = re.sub(
        r"(INSERT INTO public\.user_roles\s+\(user_id, role\)\s+VALUES\s+\(target_user_id, '(?:ADMIN|SUPER_ADMIN)'\))(;)",
        r"\1\n    ON CONFLICT (user_id, role) DO NOTHING\2",
        content
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    add_on_conflict('supabase_external_migration.sql')
