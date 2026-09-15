const fs = require('fs');
const file = 'src/components/master/SupplierOrdersManagement.tsx';
let code = fs.readFileSync(file, 'utf8');

const dynamicInputs = `
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Produto / Peça *</label>
                    <input
                      type="text"
                      placeholder="Ex: Bateria, Tela Display..."
                      value={currentItem.title}
                      onChange={e => setCurrentItem({...currentItem, title: e.target.value})}
                      className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fieldSettings.showMarca && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase">Marca</label>
                        <input
                          type="text"
                          placeholder="Ex: Apple, Samsung"
                          value={currentItem.marca || ''}
                          onChange={e => setCurrentItem({...currentItem, marca: e.target.value})}
                          className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    )}
                    
                    {fieldSettings.showModelo && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase">Modelo</label>
                        <input
                          type="text"
                          placeholder="Ex: iPhone 13"
                          value={currentItem.modelo || ''}
                          onChange={e => setCurrentItem({...currentItem, modelo: e.target.value})}
                          className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    )}

                    {fieldSettings.showEstrutura && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase">Estrutura</label>
                        <select
                          value={currentItem.estrutura || ''}
                          onChange={e => setCurrentItem({...currentItem, estrutura: e.target.value})}
                          className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                        >
                          <option value="">Selecione...</option>
                          <option value="Com aro">Com aro</option>
                          <option value="Sem aro">Sem aro</option>
                        </select>
                      </div>
                    )}

                    {fieldSettings.showQualidade && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase">Qualidade</label>
                        <select
                          value={currentItem.qualidade || ''}
                          onChange={e => setCurrentItem({...currentItem, qualidade: e.target.value})}
                          className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                        >
                          <option value="">Selecione...</option>
                          <option value="Incell">Incell</option>
                          <option value="OLED">OLED</option>
                          <option value="AMOLED">AMOLED</option>
                          <option value="Premium">Premium</option>
                          <option value="Original">Original Nacional</option>
                          <option value="Primeira Linha">Primeira Linha</option>
                        </select>
                      </div>
                    )}

                    {fieldSettings.showCor && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase">Cor</label>
                        <input
                          type="text"
                          placeholder="Ex: Preto"
                          value={currentItem.cor || ''}
                          onChange={e => setCurrentItem({...currentItem, cor: e.target.value})}
                          className="w-full bg-[#161B2B] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
`;

code = code.replace(
  /<div className="space-y-1\.5">\s*<label className="text-xs font-bold text-slate-400 uppercase">Descrição da Peça \*<\/label>\s*<input\s*type="text"\s*placeholder="Ex: Capinha iPhone 13 Preta"\s*value=\{currentItem\.title\}\s*onChange=\{e => setCurrentItem\(\{\.\.\.currentItem, title: e\.target\.value\}\)\}\s*onKeyDown=\{e => \{\s*if \(e\.key === 'Enter'\) handleAddItemToForm\(\);\s*\}\}\s*className="w-full bg-\[#161B2B\] border border-slate-700 rounded-xl px-4 py-2\.5 text-sm text-white focus:border-indigo-500 outline-none transition-all"\s*\/>\s*<\/div>/,
  dynamicInputs
);

fs.writeFileSync(file, code);
