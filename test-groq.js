const fs = require('fs');

function parseEnv() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const env = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      // Remove surrounding quotes if present
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length-1) === '"') {
        value = value.replace(/^"|"$/g, '');
      } else if (value.length > 0 && value.charAt(0) === "'" && value.charAt(value.length-1) === "'") {
        value = value.replace(/^'|'$/g, '');
      }
      env[key] = value;
    }
  });
  return env;
}

const envVars = parseEnv();
const groqKey = envVars['GROQ_API_KEY'];

async function test() {
  if (!groqKey) {
    console.error("GROQ_API_KEY not found in .env.local");
    return;
  }
  
  const systemPrompt = "You are a test assistant.";
  const groqMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Hi, testing' }
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: groqMessages,
        max_tokens: 300,
        temperature: 0.8,
      }),
    });
    
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}

test();
