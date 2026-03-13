ALTER TABLE user_accounts_852
  DROP CONSTRAINT IF EXISTS user_accounts_852_masp_canonical_check;

DROP INDEX IF EXISTS user_accounts_masp_unique;

UPDATE user_accounts_852
SET masp = NULLIF(regexp_replace(masp, '\D', '', 'g'), '')
WHERE masp IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM user_accounts_852
    WHERE masp IS NOT NULL
      AND masp !~ '^\d{8}$'
  ) THEN
    RAISE EXCEPTION 'Existing MASP values are not in canonical 8-digit format. Clean the remaining rows before reapplying this migration.';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM user_accounts_852
    WHERE masp IS NOT NULL
    GROUP BY masp
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate canonical MASP values found after normalization. Resolve duplicates before recreating the unique index.';
  END IF;
END
$$;

ALTER TABLE user_accounts_852
  ADD CONSTRAINT user_accounts_852_masp_canonical_check
  CHECK (masp IS NULL OR masp ~ '^\d{8}$');

CREATE UNIQUE INDEX user_accounts_masp_unique
  ON user_accounts_852(masp)
  WHERE masp IS NOT NULL;
