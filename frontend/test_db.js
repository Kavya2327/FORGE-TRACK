import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijfzltsxlusadjwjozva.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZnpsdHN4bHVzYWRqd2pvenZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NzQ1MDcsImV4cCI6MjA5MzA1MDUwN30.LG4w7Pina-BMmBz6-lA_mzK35FbWEeyXr-ic2G5i0JI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Try to insert a session anonymously
  console.log("Attempting to insert session anonymously...");
  const { data, error } = await supabase.from('sessions').insert([{
    date: '2029-01-01',
    topic: 'Test Session',
    month_number: 1
  }]);
  
  if (error) {
    console.log("Error:", error.message, error.details, error.hint, error.code);
  } else {
    console.log("Success:", data);
  }
}

run();
