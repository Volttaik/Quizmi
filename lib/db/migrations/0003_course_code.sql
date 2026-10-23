-- Optional course code as assigned by the institution, for example "GST 112".
-- NULL for courses ingested before this column existed; the app displays
-- nothing and search simply skips the code term for those rows.
ALTER TABLE courses ADD COLUMN code text;
