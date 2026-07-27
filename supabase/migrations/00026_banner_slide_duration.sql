-- Add configurable slide duration (seconds) for banner slides
-- Used by HeroSlider auto-play and Ken Burns animation

ALTER TABLE banner_slides
  ADD COLUMN duration integer NOT NULL DEFAULT 5;

COMMENT ON COLUMN banner_slides.duration IS 'Slide visibility duration in seconds. Controls auto-play timing and Ken Burns pan speed. Range: 2-30.';

ALTER TABLE banner_slides
  ADD CONSTRAINT banner_slides_duration_range CHECK (duration >= 2 AND duration <= 30);
