-- Add color customization columns to banner_slides
-- overlay_color: hex color for the panel background (applied at 40% opacity)
-- text_color: hex color for text
-- button_color: hex color for button background
alter table banner_slides
  add column overlay_color text default '#000000',
  add column text_color text default '#ffffff',
  add column button_color text default '#d90057';
