const fs = require('fs');
const file = 'src/components/master/SupplierOrdersManagement.tsx';
let code = fs.readFileSync(file, 'utf8');

// Icons
code = code.replace(
  /Search, Send/g,
  "Search, Send, Settings, X"
);

// State
code = code.replace(
  /const \[currentItem, setCurrentItem\] = useState<Partial<SupplierOrderItem>>\(\{/,
  `const [fieldSettings, setFieldSettings] = useState<SupplierFieldSettings>({
    showMarca: true,
    showModelo: true,
    showEstrutura: false,
    showQualidade: false,
    showCor: false,
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const [currentItem, setCurrentItem] = useState<Partial<SupplierOrderItem>>({`
);

// Item state init
code = code.replace(
  /title: '', quantity: 1, price: 0/,
  `title: '', marca: '', modelo: '', estrutura: '', qualidade: '', cor: '', quantity: 1, price: 0`
);

// Firebase hook
code = code.replace(
  /const unsubscribe = onSnapshot\(colRef, \(snapshot\) => \{/,
  `// Fetch Settings
    const settingsRef = doc(db, \`accounts/\${userEmail}/settings\`, 'supplierOrderFields');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setFieldSettings(docSnap.data() as SupplierFieldSettings);
      }
    });

    const unsubscribe = onSnapshot(colRef, (snapshot) => {`
);

code = code.replace(
  /return \(\) => unsubscribe\(\);/,
  `return () => {
      unsubscribe();
      unsubSettings();
    };`
);

fs.writeFileSync(file, code);
