const fs = require('fs');
const file = 'src/components/master/SupplierOrdersManagement.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /if \(cleanPhone\) url \+= `&phone=55\$\{cleanPhone\}`;/g,
  `if (cleanPhone) {
        url = \`https://api.whatsapp.com/send?phone=\${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}&text=\${text}\`;
      }`
);

fs.writeFileSync(file, code);
