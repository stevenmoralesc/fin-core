const fs = require('fs');
const path = require('path');

const filesToFix = [
  'AddAccountModal.tsx',
  'AddCreditCardModal.tsx',
  'EditAccountModal.tsx',
  'EditCreditCardModal.tsx'
];

for (const file of filesToFix) {
  const filePath = path.join(__dirname, 'src', 'components', file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix name field
  content = content.replace(/<input\s+type="number"\s+step="0\.01"\s+value=\{form\.name\}/g, '<input\n              type="text"\n              value={form.name}');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', file);
}
