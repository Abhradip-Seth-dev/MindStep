const fs = require('fs');

const files = [
  'app/games/page.tsx',
  'app/games/leaderboard/page.tsx',
  'app/games/memory-matrix/page.tsx',
  'app/games/speed-math/page.tsx',
  'app/games/focus-flow/page.tsx',
  'app/games/pattern-pulse/page.tsx',
  'app/games/emotion-recall/page.tsx',
  'app/games/word-weaver/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Skip if already processed
  if (content.includes('useIsMobile')) {
    console.log(`Skipping ${file} - already processed`);
    continue;
  }

  // 1. Add imports
  content = content.replace(
    "import Sidebar from '@/components/Sidebar'",
    "import Sidebar from '@/components/Sidebar'\nimport BottomNav from '@/components/BottomNav'\nimport { useIsMobile } from '@/lib/hooks'"
  );

  // 2. Add hook (find where useUser is called)
  content = content.replace(
    /const \{ user, userData, loading \} = useUser\(\)/g,
    "const { user, userData, loading } = useUser()\n  const isMobile = useIsMobile()"
  );

  // 3. Add BottomNav after Sidebar
  content = content.replace(
    /<Sidebar userName=\{userName\} userData=\{userData\} \/>/g,
    "<Sidebar userName={userName} userData={userData} />\n      {isMobile && <BottomNav userName={userName} />}"
  );

  // 4. Fix marginLeft
  content = content.replace(
    /marginLeft:\s*'220px'/g,
    "marginLeft: isMobile ? 0 : '220px'"
  );

  // 5. Add paddingBottom for BottomNav
  // Note: we can replace zIndex: 1 } with zIndex: 1, paddingBottom: isMobile ? 80 : 0 }
  content = content.replace(
    /zIndex:\s*1\s*\}\}/g,
    "zIndex: 1, paddingBottom: isMobile ? 80 : 0 }}"
  );
  
  // Update padding for mobile (padding: '60px' -> padding: isMobile ? '20px 16px' : '60px')
  content = content.replace(
    /padding:\s*'60px'/g,
    "padding: isMobile ? '20px 16px' : '60px'"
  );
  content = content.replace(
    /padding:\s*'50px 60px'/g,
    "padding: isMobile ? '20px 16px' : '50px 60px'"
  );
  content = content.replace(
    /padding:\s*'40px 60px'/g,
    "padding: isMobile ? '20px 16px' : '40px 60px'"
  );

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
