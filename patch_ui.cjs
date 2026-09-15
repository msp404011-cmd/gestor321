const fs = require('fs');
const file = 'src/components/master/SupplierOrdersManagement.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add handleSaveSettings
code = code.replace(
  /const handleDeleteGroup = \(groupId: string\) => \{/,
  `const handleSaveSettings = async (newSettings: SupplierFieldSettings) => {
    try {
      const userEmail = "mmspmartins62@gmail.com";
      await setDoc(doc(db, \`accounts/\${userEmail}/settings\`, 'supplierOrderFields'), newSettings);
      showToast("Configurações salvas!", "success");
      setIsSettingsModalOpen(false);
    } catch (e) {
      showToast("Erro ao salvar configurações", "error");
    }
  };

  const handleDeleteGroup = (groupId: string) => {`
);

// Format Message adjustment to include the new fields
code = code.replace(
  /items\.forEach\(item => \{/,
  `items.forEach(item => {
      let details = [];
      if (item.marca) details.push(item.marca);
      if (item.modelo) details.push(item.modelo);
      if (item.estrutura) details.push(\`(\${item.estrutura})\`);
      if (item.qualidade) details.push(\`[\${item.qualidade}]\`);
      if (item.cor) details.push(\`Cor: \${item.cor}\`);
      
      const detailsStr = details.length > 0 ? \` - \${details.join(' ')}\` : '';
`
);

code = code.replace(
  /text \+= `- \$\{item\.quantity\}x \$\{item\.title\} \(R\$ \$\{\(item\.price \|\| 0\)\.toFixed\(2\)\.replace\('\.', ','\)\}\ un\)\\n`;/g,
  `text += \`- \${item.quantity}x \${item.title}\${detailsStr} (R$ \${(item.price || 0).toFixed(2).replace('.', ',')} un)\\n\`;`
);
code = code.replace(
  /text \+= `- \$\{item\.quantity\}x \$\{item\.title\}\\n`;/g,
  `text += \`- \${item.quantity}x \${item.title}\${detailsStr}\\n\`;`
);


// Settings button in header
code = code.replace(
  /<button\s*onClick=\{\(\) => handleOpenModal\(\)\}\s*className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"\s*>/g,
  `<button
            onClick={() => setIsSettingsModalOpen(true)}
            className="bg-[#161B2B] hover:bg-[#1A2133] border border-slate-700 text-slate-300 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <Settings className="w-5 h-5" /> Configurar Campos
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >`
);

fs.writeFileSync(file, code);
