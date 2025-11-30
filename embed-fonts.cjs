const fs = require('fs');

// Read fonts as base64
const printChar = fs.readFileSync('fonts/print-char-21/print-char-21.ttf', 'base64');
const robotoReg = fs.readFileSync('fonts/roboto_mono/RobotoMono-Regular.ttf', 'base64');
const robotoBold = fs.readFileSync('fonts/roboto_mono/RobotoMono-Bold.ttf', 'base64');

// Read template
const template = fs.readFileSync('src/monitor/frames/boot-sequence.html', 'utf8');

// Replace font URLs with base64 data URIs
const embedded = template
  .replace(
    /url\('\.\.\/\.\.\/\.\.\/fonts\/print-char-21\/print-char-21\.ttf'\)/g,
    `url('data:font/truetype;charset=utf-8;base64,${printChar}')`
  )
  .replace(
    /url\('\.\.\/\.\.\/\.\.\/fonts\/roboto_mono\/RobotoMono-Regular\.ttf'\)/g,
    `url('data:font/truetype;charset=utf-8;base64,${robotoReg}')`
  )
  .replace(
    /url\('\.\.\/\.\.\/\.\.\/fonts\/roboto_mono\/RobotoMono-Bold\.ttf'\)/g,
    `url('data:font/truetype;charset=utf-8;base64,${robotoBold}')`
  );

// Write output
fs.writeFileSync('src/monitor/frames/boot-sequence-base64.html', embedded);

console.log('✓ Created boot-sequence-base64.html with embedded fonts');
console.log(`  Print Char 21: ${(printChar.length / 1024).toFixed(1)} KB`);
console.log(`  Roboto Regular: ${(robotoReg.length / 1024).toFixed(1)} KB`);
console.log(`  Roboto Bold: ${(robotoBold.length / 1024).toFixed(1)} KB`);
console.log(`  Total file size: ${(embedded.length / 1024).toFixed(1)} KB`);
