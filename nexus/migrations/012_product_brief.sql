-- Store the rich build context (buyer psychology, market, keywords) on the
-- product so the deliverable generator can produce specific, non-generic
-- content long after the workflow run has finished.
ALTER TABLE products ADD COLUMN brief_json TEXT;
