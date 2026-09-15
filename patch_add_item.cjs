const fs = require('fs');
const file = 'src/components/master/SupplierOrdersManagement.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /setCurrentItem\(\{ title: '', quantity: 1, price: 0 \}\);/,
  `setCurrentItem({ title: '', marca: '', modelo: '', estrutura: '', qualidade: '', cor: '', quantity: 1, price: 0 });`
);

code = code.replace(
  /const newItem: SupplierOrderItem = \{\s*id: Date.now\(\).toString\(\),\s*title: currentItem.title \|\| '',\s*quantity: currentItem.quantity \|\| 1,\s*price: currentItem.price \|\| 0\s*\};/,
  `const newItem: SupplierOrderItem = {
      id: Date.now().toString(),
      title: currentItem.title || '',
      marca: currentItem.marca,
      modelo: currentItem.modelo,
      estrutura: currentItem.estrutura,
      qualidade: currentItem.qualidade,
      cor: currentItem.cor,
      quantity: currentItem.quantity || 1,
      price: currentItem.price || 0
    };`
);

code = code.replace(
  /setCurrentItem\(\{ title: '', quantity: 1, price: 0 \}\);/,
  `setCurrentItem({ title: '', marca: '', modelo: '', estrutura: '', qualidade: '', cor: '', quantity: 1, price: 0 });`
);

fs.writeFileSync(file, code);
