const fs = require('fs');
const file = 'src/components/master/SupplierOrdersManagement.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace items list rendering
code = code.replace(
  /groupItems\.map\(\(item\) => \(\s*<div key=\{item\.id\} className="bg\[#0B1221\]/g,
  `groupItems.map((item) => (
                      <div key={item.id} className={\`bg-[#0B1221] border \${selectedItems[item.id] ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700'} rounded-xl p-3 flex justify-between items-center group/item transition-colors\`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                          <input 
                            type="checkbox" 
                            checked={!!selectedItems[item.id]} 
                            onChange={() => toggleItemSelection(item.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-indigo-500 checked:border-indigo-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">`
);

code = code.replace(
  /<div className="flex-1 min-w-0 pr-2">\s*<div className="font-bold text-white text-sm truncate">\{item\.title\}<\/div>/g,
  `                          <div className="font-bold text-white text-sm truncate">{item.title}</div>`
);

code = code.replace(
  /<\/div>\s*<div className="flex items-center gap-1 shrink-0">/g,
  `</div>\n                        </div>\n                        <div className="flex items-center gap-1 shrink-0">`
);

// Add "Enviar Selecionados"
code = code.replace(
  /<button\s*onClick=\{\(\) => \{\s*if \(groupItems\.length === 0\) return showToast\('Nenhuma peça para enviar\.', 'error'\);\s*setSendModal\(\{ isOpen: true, group, itemsToSend: groupItems \}\);\s*\}\}\s*disabled=\{groupItems\.length === 0\}/g,
  `const selectedGroupItems = groupItems.filter(i => selectedItems[i.id]);
                  
                  return (
                    <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
                      <button
                        onClick={() => {
                          if (groupItems.length === 0) return showToast('Nenhuma peça para enviar.', 'error');
                          setSendModal({ isOpen: true, group, itemsToSend: groupItems });
                        }}
                        disabled={groupItems.length === 0}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold text-[11px] sm:text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Tudo
                      </button>
                      <button
                        onClick={() => {
                          if (selectedGroupItems.length === 0) return showToast('Selecione peças para enviar.', 'error');
                          setSendModal({ isOpen: true, group, itemsToSend: selectedGroupItems });
                        }}
                        disabled={selectedGroupItems.length === 0}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold text-[11px] sm:text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Selecionados
                      </button>
                    </div>
                  );
                })();
                
                return (\n                  <div style={{display: 'none'}}><button` // fake to replace the old button
);

code = code.replace(
  /<\/button>\s*<\/div>\s*<\/div>\s*\);\s*\}\)\}\s*<\/div>/g,
  `\n              </div>\n            );\n          })}\n        </div>`
);

fs.writeFileSync(file, code);
