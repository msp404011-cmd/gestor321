const fs = require('fs');
const file = 'src/components/master/SupplierOrdersManagement.tsx';
let code = fs.readFileSync(file, 'utf8');

const replacementTypes = `interface SupplierOrderItem {
  id: string;
  title: string;
  marca?: string;
  modelo?: string;
  estrutura?: string;
  qualidade?: string;
  cor?: string;
  quantity: number;
  price: number;
}

interface SupplierFieldSettings {
  showMarca: boolean;
  showModelo: boolean;
  showEstrutura: boolean;
  showQualidade: boolean;
  showCor: boolean;
}`;

code = code.replace(
  /interface SupplierOrderItem \{[\s\S]*?price: number;\n\}/,
  replacementTypes
);

fs.writeFileSync(file, code);
