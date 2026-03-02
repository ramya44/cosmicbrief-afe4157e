-- Chatbot Subscription System Tables
-- Migration for Maya AI Astrologer Chatbot

-- Table: chatbot_subscriptions
-- Manages subscription status for chatbot access
CREATE TABLE IF NOT EXISTS chatbot_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kundli_id UUID NOT NULL REFERENCES user_kundli_details(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive', -- 'active', 'canceled', 'past_due', 'inactive'
  subscription_started_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kundli_id)
);

-- Table: chat_sessions
-- Groups conversations for a user
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kundli_id UUID NOT NULL REFERENCES user_kundli_details(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  message_count INTEGER DEFAULT 0
);

-- Table: chat_messages
-- Stores all chat messages (persistent history)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  kundli_id UUID NOT NULL REFERENCES user_kundli_details(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: chat_rate_limits
-- Rate limiting (30 messages/hour)
CREATE TABLE IF NOT EXISTS chat_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kundli_id UUID NOT NULL REFERENCES user_kundli_details(id) ON DELETE CASCADE,
  hour_bucket TIMESTAMPTZ NOT NULL, -- Truncated to hour
  message_count INTEGER DEFAULT 1,
  UNIQUE(kundli_id, hour_bucket)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_chatbot_subscriptions_status
  ON chatbot_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_chatbot_subscriptions_kundli
  ON chatbot_subscriptions(kundli_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_kundli
  ON chat_sessions(kundli_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message
  ON chat_sessions(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON chat_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_kundli
  ON chat_messages(kundli_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created
  ON chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_kundli_bucket
  ON chat_rate_limits(kundli_id, hour_bucket);

-- Enable Row Level Security
ALTER TABLE chatbot_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_subscriptions
CREATE POLICY "Service role full access on chatbot_subscriptions"
  ON chatbot_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own chatbot subscription"
  ON chatbot_subscriptions
  FOR SELECT
  USING (
    kundli_id IN (
      SELECT id FROM user_kundli_details
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chat_sessions
CREATE POLICY "Service role full access on chat_sessions"
  ON chat_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions
  FOR SELECT
  USING (
    kundli_id IN (
      SELECT id FROM user_kundli_details
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chat_messages
CREATE POLICY "Service role full access on chat_messages"
  ON chat_messages
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own chat messages"
  ON chat_messages
  FOR SELECT
  USING (
    kundli_id IN (
      SELECT id FROM user_kundli_details
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for chat_rate_limits
CREATE POLICY "Service role full access on chat_rate_limits"
  ON chat_rate_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger to update updated_at timestamp on chatbot_subscriptions
CREATE TRIGGER update_chatbot_subscriptions_updated_at
  BEFORE UPDATE ON chatbot_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE chatbot_subscriptions IS 'Manages Maya AI chatbot subscription status and billing';
COMMENT ON TABLE chat_sessions IS 'Groups chat conversations for each user';
COMMENT ON TABLE chat_messages IS 'Stores all chat messages with Maya AI';
COMMENT ON TABLE chat_rate_limits IS 'Rate limiting for chat messages (30/hour)';
COMMENT ON COLUMN chatbot_subscriptions.status IS 'active: paid subscription, canceled: user canceled, past_due: payment failed, inactive: no subscription';
