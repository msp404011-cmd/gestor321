const fs = require('fs');
const file = 'src/components/master/SupplierOrdersManagement.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add selected state for items in UI
code = code.replace(
  /const \[sendModal, setSendModal\] = useState<{/,
  "const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});\n\n  const [sendModal, setSendModal] = useState<{"
);

// Toggle selected item
code = code.replace(
  /const handleDeleteItem = \(group: SupplierOrderGroup, itemId: string\) => {/,
  `const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleDeleteItem = (group: SupplierOrderGroup, itemId: string) => {`
);

// Render checkbox
code = code.replace(
  /<div key={item.id} className="bg/g,
  `<div key={item.id} className="bg`
);
// Actually I'll use sed or manual replacement for the items render.
fs.writeFileSync(file, code);
