const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const componentsDir = path.join(srcDir, 'components');

const mappings = {
  layout: ['Header.tsx', 'Sidebar.tsx', 'ThemeProvider.tsx', 'ThemeToggle.tsx'],
  modals: [
    'AddAccountModal.tsx',
    'AddCreditCardModal.tsx',
    'BillPaymentModal.tsx',
    'BudgetModal.tsx',
    'EditAccountModal.tsx',
    'EditCreditCardModal.tsx',
    'EditTransactionModal.tsx',
    'InstallmentModal.tsx',
    'TransactionModal.tsx'
  ],
  views: ['AccountsView.tsx', 'CreditCardView.tsx', 'BudgetDashboard.tsx'],
  dashboard: ['Dashboard.tsx', 'KpiCard.tsx']
};

// Create dirs
for (const dir of Object.keys(mappings)) {
  const dirPath = path.join(componentsDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
}

// Move files
const movedFiles = {};
for (const [folder, files] of Object.entries(mappings)) {
  for (const file of files) {
    const oldPath = path.join(componentsDir, file);
    const newPath = path.join(componentsDir, folder, file);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      movedFiles[file.replace('.tsx', '')] = folder;
    }
  }
}

// Update imports
function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else {
      if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
}

const allTsxFiles = walkSync(srcDir);

for (const filepath of allTsxFiles) {
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  for (const [componentName, folder] of Object.entries(movedFiles)) {
    // Look for exact matches of @/components/ComponentName
    const regex = new RegExp(`@/components/${componentName}(?=['"\\/])`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `@/components/${folder}/${componentName}`);
      changed = true;
    }
    
    // Also look for relative imports like ../components/ComponentName or ./ComponentName
    // Since we moved files, inside components it might be trickier, but the app uses absolute `@/components/` mostly.
    // Let's check for relative ones just in case:
    const relRegex1 = new RegExp(`\\.\\./${componentName}(?=['"])`, 'g');
    const relRegex2 = new RegExp(`\\./${componentName}(?=['"])`, 'g');
    
    if (relRegex1.test(content)) {
      content = content.replace(relRegex1, `@/components/${folder}/${componentName}`);
      changed = true;
    }
    if (relRegex2.test(content)) {
      content = content.replace(relRegex2, `@/components/${folder}/${componentName}`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filepath, content, 'utf8');
  }
}

console.log('Refactor complete.');
