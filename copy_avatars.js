const fs = require('fs');
const path = require('path');

const avatars = [
  { src: 'C:\\Users\\ersum\\.gemini\\antigravity\\brain\\002f60a3-9ddb-41b1-b0d9-795a32cc2934\\avatar_man_1_1774356813452.png', dest: 'avatar_1.png' },
  { src: 'C:\\Users\\ersum\\.gemini\\antigravity\\brain\\002f60a3-9ddb-41b1-b0d9-795a32cc2934\\avatar_woman_1_1774356831200.png', dest: 'avatar_2.png' },
  { src: 'C:\\Users\\ersum\\.gemini\\antigravity\\brain\\002f60a3-9ddb-41b1-b0d9-795a32cc2934\\avatar_man_2_1774356851656.png', dest: 'avatar_3.png' },
  { src: 'C:\\Users\\ersum\\.gemini\\antigravity\\brain\\002f60a3-9ddb-41b1-b0d9-795a32cc2934\\avatar_woman_2_1774356869857.png', dest: 'avatar_4.png' }
];

const destDir = 'd:\\devconnect\\client\\public\\avatars';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

avatars.forEach(avatar => {
  const destPath = path.join(destDir, avatar.dest);
  fs.copyFileSync(avatar.src, destPath);
  console.log(`Copied ${avatar.src} to ${destPath}`);
});
