
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrupwoxizgvpmfocljzq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndydXB3b3hpemd2cG1mb2NsanpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwODU4OTksImV4cCI6MjA4MDY2MTg5OX0.LlDZNYu-y8gP39Ylvs61eeJEuI8mUWGyynUNG33gIpE';

export const supabase = createClient(supabaseUrl, supabaseKey);
