-- Weekly Forecast System Tables
-- Migration for Personalized Weekly Vedic Forecast System

-- Table: weekly_forecast_subscriptions
-- Manages subscription status for weekly forecast emails
CREATE TABLE IF NOT EXISTS weekly_forecast_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kundli_id UUID NOT NULL REFERENCES user_kundli_details(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'canceled', 'past_due'
  trial_started_at TIMESTAMPTZ DEFAULT now(),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  subscription_started_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kundli_id)
);

-- Table: personalized_weekly_forecasts
-- Stores generated weekly forecasts for each user
CREATE TABLE IF NOT EXISTS personalized_weekly_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kundli_id UUID NOT NULL REFERENCES user_kundli_details(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  forecast_content JSONB NOT NULL,
  pratyantardasha_info JSONB, -- Active sub-sub-period info for the week
  generated_at TIMESTAMPTZ DEFAULT now(),
  email_sent_at TIMESTAMPTZ,
  UNIQUE(kundli_id, week_start)
);

-- Table: weekly_transits
-- Stores pre-calculated weekly transit data (Moon journey + slow planets)
CREATE TABLE IF NOT EXISTS weekly_transits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  moon_transits JSONB NOT NULL, -- Moon position for each day
  slow_planet_aspects JSONB NOT NULL, -- Jupiter, Saturn, Rahu/Ketu aspects
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_start)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_weekly_subscriptions_status
  ON weekly_forecast_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_weekly_subscriptions_email
  ON weekly_forecast_subscriptions(email);

CREATE INDEX IF NOT EXISTS idx_weekly_forecasts_kundli_week
  ON personalized_weekly_forecasts(kundli_id, week_start);

CREATE INDEX IF NOT EXISTS idx_weekly_transits_week_start
  ON weekly_transits(week_start);

-- Enable Row Level Security
ALTER TABLE weekly_forecast_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalized_weekly_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_transits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_forecast_subscriptions
-- Service role has full access (for edge functions)
CREATE POLICY "Service role full access on weekly_forecast_subscriptions"
  ON weekly_forecast_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON weekly_forecast_subscriptions
  FOR SELECT
  USING (
    kundli_id IN (
      SELECT id FROM user_kundli_details
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for personalized_weekly_forecasts
-- Service role has full access
CREATE POLICY "Service role full access on personalized_weekly_forecasts"
  ON personalized_weekly_forecasts
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can view their own forecasts
CREATE POLICY "Users can view own weekly forecasts"
  ON personalized_weekly_forecasts
  FOR SELECT
  USING (
    kundli_id IN (
      SELECT id FROM user_kundli_details
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for weekly_transits
-- Service role has full access
CREATE POLICY "Service role full access on weekly_transits"
  ON weekly_transits
  FOR ALL
  USING (auth.role() = 'service_role');

-- Everyone can read weekly transits (they're not user-specific)
CREATE POLICY "Public can read weekly transits"
  ON weekly_transits
  FOR SELECT
  USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weekly_subscriptions_updated_at
  BEFORE UPDATE ON weekly_forecast_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE weekly_forecast_subscriptions IS 'Manages weekly forecast subscription status and billing';
COMMENT ON TABLE personalized_weekly_forecasts IS 'Stores generated personalized weekly forecasts';
COMMENT ON TABLE weekly_transits IS 'Pre-calculated weekly transit data for forecast generation';
COMMENT ON COLUMN weekly_forecast_subscriptions.status IS 'trial: 7-day free trial, active: paid subscription, canceled: user canceled, past_due: payment failed';
