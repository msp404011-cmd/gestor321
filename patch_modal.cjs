const fs = require('fs');
const file = 'src/components/master/SupplierOrdersManagement.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add settings modal
const settingsModal = `
      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#161B2B] rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#0B1221]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                  <Settings className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-white">Configurar Campos da Peça</h2>
              </div>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 bg-[#161B2B] space-y-4">
              <p className="text-sm text-slate-400 mb-4">
                Ative ou desative os campos extras que você deseja preencher ao adicionar uma peça no pedido.
              </p>
              
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1221] border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div className="text-sm font-bold text-white">Marca (Ex: Apple, Samsung)</div>
                <input type="checkbox" checked={fieldSettings.showMarca} onChange={e => setFieldSettings({...fieldSettings, showMarca: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-indigo-500 checked:border-indigo-500" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1221] border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div className="text-sm font-bold text-white">Modelo (Ex: iPhone 13)</div>
                <input type="checkbox" checked={fieldSettings.showModelo} onChange={e => setFieldSettings({...fieldSettings, showModelo: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-indigo-500 checked:border-indigo-500" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1221] border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div className="text-sm font-bold text-white">Estrutura (Com aro / Sem aro)</div>
                <input type="checkbox" checked={fieldSettings.showEstrutura} onChange={e => setFieldSettings({...fieldSettings, showEstrutura: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-indigo-500 checked:border-indigo-500" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1221] border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div className="text-sm font-bold text-white">Qualidade (Incell / OLED / Premium...)</div>
                <input type="checkbox" checked={fieldSettings.showQualidade} onChange={e => setFieldSettings({...fieldSettings, showQualidade: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-indigo-500 checked:border-indigo-500" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#0B1221] border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div className="text-sm font-bold text-white">Cor</div>
                <input type="checkbox" checked={fieldSettings.showCor} onChange={e => setFieldSettings({...fieldSettings, showCor: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-indigo-500 checked:border-indigo-500" />
              </label>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button onClick={() => setIsSettingsModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-300 font-bold hover:bg-slate-800 transition-colors text-sm">Cancelar</button>
                <button onClick={() => handleSaveSettings(fieldSettings)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors text-sm">Salvar Configurações</button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  /\{sendModal\.isOpen && \(/,
  settingsModal + "\n      {sendModal.isOpen && ("
);

fs.writeFileSync(file, code);
