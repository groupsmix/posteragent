-- ============================================================
-- SEED: Default platform configurations
-- ============================================================

INSERT INTO platforms (id, name, slug, url, title_max_chars, description_max, tag_count, tag_max_chars, audience, tone, seo_style, description_style, cta_style)
VALUES
  ('plt_etsy', 'Etsy', 'etsy', 'https://www.etsy.com', 140, 10000, 13, 20, 'Craft-loving buyers seeking unique handmade or vintage items', 'Warm, personal, artisan', 'Long-tail keywords, natural language', 'Story-driven, materials focus, process details', 'Soft sell, "Add to cart", "Made just for you"'),
  ('plt_gumroad', 'Gumroad', 'gumroad', 'https://gumroad.com', 200, 50000, 5, 50, 'Creators, indie hackers, digital product enthusiasts', 'Direct, value-focused, creator-to-creator', 'Benefit-driven headlines', 'Feature list + social proof + demo preview', 'Direct, "Get instant access", "Start now"'),
  ('plt_shopify', 'Shopify', 'shopify', 'https://www.shopify.com', 255, 65000, 15, 50, 'General e-commerce buyers', 'Professional, brand-aligned', 'Product-focused SEO, structured data', 'Benefit-first, scannable sections, FAQ', 'Strong CTA, "Buy now", "Shop today"');
