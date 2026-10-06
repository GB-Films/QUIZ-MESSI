ALTER TABLE quiz_games ADD COLUMN lives integer NOT NULL DEFAULT 10;
ALTER TABLE quiz_games ADD COLUMN rules_version integer NOT NULL DEFAULT 1;
ALTER TABLE quiz_games ADD COLUMN last_correct integer NOT NULL DEFAULT 0;
ALTER TABLE quiz_games ADD COLUMN last_reason text;
