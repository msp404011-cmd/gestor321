const fs = require('fs');
const file = 'src/components/master/SupplierOrdersManagement.tsx';
let code = fs.readFileSync(file, 'utf8');


const itemDetailsRender = `<div className="flex-1">
                          <div className="font-bold text-white text-sm">{item.title}</div>
                          
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.marca && <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">{item.marca}</span>}
                            {item.modelo && <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">{item.modelo}</span>}
                            {item.estrutura && <span className="bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded text-[10px]">{item.estrutura}</span>}
                            {item.qualidade && <span className="bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded text-[10px]">{item.qualidade}</span>}
                            {item.cor && <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">Cor: {item.cor}</span>}
                          </div>

                          <div className="flex flex-wrap gap-4 mt-2 text-xs font-medium text-slate-400">`;

// In Form render
code = code.replace(
  /<div className="flex-1">\s*<div className="font-bold text-white text-sm">\{item\.title\}<\/div>\s*<div className="flex flex-wrap gap-4 mt-2 text-xs font-medium text-slate-400">/g,
  itemDetailsRender
);

// In Main list render
const mainListDetailsRender = `<div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm truncate">{item.title}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.marca && <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{item.marca}</span>}
                              {item.modelo && <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{item.modelo}</span>}
                              {item.estrutura && <span className="bg-indigo-900/40 text-indigo-300 px-1.5 py-0.5 rounded text-[10px]">{item.estrutura}</span>}
                              {item.qualidade && <span className="bg-emerald-900/40 text-emerald-300 px-1.5 py-0.5 rounded text-[10px]">{item.qualidade}</span>}
                              {item.cor && <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">Cor: {item.cor}</span>}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex gap-3">`;


code = code.replace(
  /<div className="flex-1 min-w-0">\s*<div className="font-bold text-white text-sm truncate">\{item\.title\}<\/div>\s*<div className="text-xs text-slate-400 mt-1 flex gap-3">/g,
  mainListDetailsRender
);


fs.writeFileSync(file, code);
