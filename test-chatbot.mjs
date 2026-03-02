import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tgjjgshoviowjnoeksar.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnampnc2hvdmlvd2pub2Vrc2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDg0NjgsImV4cCI6MjA4NDI4NDQ2OH0.5qtcG3N7jZ-pfrcctCXfaNFoeC84jUjSemDxdO0qrg8'
);

// Get a recent kundli
const { data } = await supabase
  .from('user_kundli_details')
  .select('id, email')
  .limit(1)
  .single();

console.log('Test kundli:', data);

// Test the function
const { data: result, error } = await supabase.functions.invoke('create-chatbot-subscription', {
  body: { kundli_id: data.id }
});

if (error) {
  console.error('Error:', error);
} else {
  console.log('Result:', result);
}
