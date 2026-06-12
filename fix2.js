const fs = require('fs');
const path = require('path');

const filesToFix = [
  { file: 'AddAccountModal.tsx', prop: 'initialBalance' },
  { file: 'AddCreditCardModal.tsx', prop: 'totalLimit' },
  { file: 'EditAccountModal.tsx', prop: 'initialBalance' },
  { file: 'EditCreditCardModal.tsx', prop: 'totalLimit' },
  { file: 'BillPaymentModal.tsx', prop: 'customAmount' },
  { file: 'BudgetModal.tsx', prop: 'suggestedBudget' },
  { file: 'InstallmentModal.tsx', prop: 'totalAmount' }
];

for (const { file, prop } of filesToFix) {
  const filePath = path.join(__dirname, 'src', 'components', file);
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // We want to replace <input type="text" ... onChange=... prop: e.target.value ... />
  // We can do it by finding type="text" specifically near the prop name
  
  // Actually, since these are small files, let's just do a string replace for type="text" 
  // where value={form.prop} or value={prop} or setCustomAmount(e.target.value) is present.
  
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('type="text"')) {
      // look ahead 5 lines
      let isAmountField = false;
      for (let j = 1; j <= 5 && i + j < lines.length; j++) {
        if (lines[i+j].includes(`value={form.${prop}}`) || 
            lines[i+j].includes(`${prop}: e.target.value`) ||
            lines[i+j].includes(`setCustomAmount(e.target.value)`) ||
            lines[i+j].includes(`value={customAmount}`)
        ) {
          isAmountField = true;
          break;
        }
      }
      
      if (isAmountField) {
        lines[i] = lines[i].replace('type="text"', 'type="number"\n              step="0.01"');
      }
    }
  }
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Fixed types in', file);
}
