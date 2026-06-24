import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env file manually
const envPath = path.resolve('./.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Supabase URL:", env.VITE_SUPABASE_URL);
  
  // Try fetching one service to see its structure
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .limit(1);
    
  if (servicesError) {
    console.error("Error fetching services:", servicesError);
  } else {
    console.log("Service structure:", services);
  }

  // Try fetching one team visit to see its structure
  const { data: visits, error: visitsError } = await supabase
    .from('team_visits')
    .select('*')
    .limit(1);
    
  if (visitsError) {
    console.error("Error fetching visits:", visitsError);
  } else {
    console.log("Visit structure:", visits);
  }

  // Try fetching one reincidence to see its structure
  const { data: reincidences, error: reincidencesError } = await supabase
    .from('service_reincidences')
    .select('*')
    .limit(1);
    
  if (reincidencesError) {
    console.error("Error fetching reincidences:", reincidencesError);
  } else {
    console.log("Reincidence structure:", reincidences);
  }
}

main();
