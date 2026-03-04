-- Add maya_memory column for storing user insights across conversations
ALTER TABLE chatbot_subscriptions
ADD COLUMN IF NOT EXISTS maya_memory JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN chatbot_subscriptions.maya_memory IS 'Stores extracted user insights (career goals, relationship status, concerns) for personalized conversations';
