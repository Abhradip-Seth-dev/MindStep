const fs = require('fs');

const files = [
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

  // Check if it already has isMobile definition
  if (!content.includes('const isMobile = useIsMobile()')) {
    // Add it after useRouter
    content = content.replace(
      /const router = useRouter\(\)/,
      "const router = useRouter()\n  const isMobile = useIsMobile()"
    );
    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
  } else {
    console.log(`Skipping ${file}`);
  }
}
