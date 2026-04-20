-- ============================================================
-- SEED: Default social channel configurations
-- ============================================================

INSERT INTO social_channels (id, name, slug, caption_max_chars, hashtag_count, tone, format, content_types, posting_mode)
VALUES
  ('soc_instagram', 'Instagram', 'instagram', 2200, 30, 'Visual, aspirational, lifestyle', 'Carousel + Reels', '["image","carousel","reel","story"]', 'manual'),
  ('soc_tiktok', 'TikTok', 'tiktok', 2200, 5, 'Casual, trendy, authentic, hook-first', 'Short video + text overlay', '["video","slideshow"]', 'manual'),
  ('soc_pinterest', 'Pinterest', 'pinterest', 500, 0, 'Inspirational, aspirational, how-to', 'Pin + Board description', '["pin","idea_pin"]', 'manual'),
  ('soc_twitter', 'X (Twitter)', 'twitter', 280, 3, 'Concise, witty, value-packed', 'Thread or single post', '["tweet","thread"]', 'manual');
