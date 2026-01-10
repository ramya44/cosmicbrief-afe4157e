-- Add additional birth chart fields to free_forecasts table
ALTER TABLE public.free_forecasts
ADD COLUMN deity text,
ADD COLUMN ganam text,
ADD COLUMN birth_symbol text,
ADD COLUMN animal_sign text,
ADD COLUMN nadi text,
ADD COLUMN lucky_color text,
ADD COLUMN best_direction text,
ADD COLUMN syllables text,
ADD COLUMN birth_stone text,
ADD COLUMN nakshatra_gender text,
ADD COLUMN nakshatra_lord text,
ADD COLUMN moon_sign_lord text,
ADD COLUMN sun_sign_lord text;

-- Add additional birth chart fields to paid_forecasts table  
ALTER TABLE public.paid_forecasts
ADD COLUMN deity text,
ADD COLUMN ganam text,
ADD COLUMN birth_symbol text,
ADD COLUMN animal_sign text,
ADD COLUMN nadi text,
ADD COLUMN lucky_color text,
ADD COLUMN best_direction text,
ADD COLUMN syllables text,
ADD COLUMN birth_stone text,
ADD COLUMN nakshatra_gender text,
ADD COLUMN nakshatra_lord text,
ADD COLUMN moon_sign_lord text,
ADD COLUMN sun_sign_lord text;