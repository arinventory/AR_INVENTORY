const fs = require('fs');
const content = fs.readFileSync('c:/Users/prana/OneDrive/Desktop/AR_FASHION_ERP/ar_fashion_erp/pages/SalesBill.tsx', 'utf8');
const openBraces = (content.match(/\{/g) || []).length;
const closeBraces = (content.match(/\}/g) || []).length;
const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;
console.log(`Open braces: ${openBraces}, Close braces: ${closeBraces}`);
console.log(`Open parens: ${openParens}, Close parens: ${closeParens}`);
