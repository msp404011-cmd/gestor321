import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Filter,
  DollarSign,
  Calendar,
  RotateCcw,
  Check,
  ListTodo,
} from 'lucide-react';
import { DailyTaskCard, DailyTaskSubItem } from '../../types';
import { StorageService } from '../../services/storage';

interface DailyTasksViewProps {
  isSuperAdmin?: boolean;
}

export const DailyTasksView: React.FC<DailyTasksViewProps> = ({ isSuperAdmin = true }) => {
  const [tasks, setTasks] = useState<DailyTaskCard[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('TODAS');
  
  // Modal state for creating/editing cards
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTaskCard | null>(null);

  // Form State
  const [taskForm, setTaskForm] = useState<{
    title: string;
    description: string;
    items: { id: string; text: string; isCompleted: boolean }[];
    needsPurchase: boolean;
    purchaseDescription: string;
    purchaseValue: string;
    priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  }>({
    title: '',
    description: '',
    items: [],
    needsPurchase: false,
    purchaseDescription: '',
    purchaseValue: '',
    priority: 'MEDIA',
  });

  // Quick sub-item input per card in card view
  const [quickSubItemText, setQuickSubItemText] = useState<{ [cardId: string]: string }>({});

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Confirm Delete Dialog State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load and seed initial tasks if empty
  useEffect(() => {
    const loadedTasks = StorageService.getDailyTasks();
    if (loadedTasks && loadedTasks.length > 0) {
      setTasks(loadedTasks);
    } else {
      // Seed default sample cards with sub-items
      const sampleTasks: DailyTaskCard[] = [
        {
          id: 'task-1',
          title: 'Card 1 - Organização da Bancada Principal',
          description: 'Rotina diária de organização técnica.',
          items: [
            { id: 'sub-1', text: 'Limpar organizadores e gaveteiros de parafusos', isCompleted: false },
            { id: 'sub-2', text: 'Testar e calibrar fonte de bancada 30V', isCompleted: true },
            { id: 'sub-3', text: 'Separar cabos e ponteiras do multímetro', isCompleted: false },
          ],
          needsPurchase: false,
          isCompleted: false,
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          priority: 'ALTA',
        },
        {
          id: 'task-2',
          title: 'Card 2 - Reposição de Insumos de Solda',
          description: 'Conferência de estoque para bancada.',
          items: [
            { id: 'sub-20', text: 'Comprar Fluxo Amtech NC-559', isCompleted: false },
            { id: 'sub-21', text: 'Comprar 2 carretéis de malha dessoldadora Goot Wick', isCompleted: false },
          ],
          needsPurchase: true,
          purchaseDescription: 'Fluxo Amtech NC-559 + 2 Carretéis de Malha Goot Wick 3mm',
          purchaseValue: 145.0,
          isCompleted: false,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          priority: 'URGENTE',
        },
        {
          id: 'task-3',
          title: 'Card 3 - Teste de Telas de Estoque',
          description: 'Conferir lote de telas recebidas.',
          items: [
            { id: 'sub-30', text: 'Testar touch tela Moto G22', isCompleted: true },
            { id: 'sub-31', text: 'Testar brilho e sensor Samsung A32', isCompleted: true },
          ],
          needsPurchase: false,
          isCompleted: true,
          completedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          priority: 'MEDIA',
        },
      ];
      StorageService.saveDailyTasks(sampleTasks);
      setTasks(sampleTasks);
    }

    const unsub = StorageService.subscribe(() => {
      setTasks(StorageService.getDailyTasks());
    });
    return unsub;
  }, []);

  // Filter tasks by active tab, search term, and priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === 'PENDING' && task.isCompleted) return false;
      if (activeTab === 'COMPLETED' && !task.isCompleted) return false;

      // Priority filter
      if (priorityFilter !== 'TODOS' && priorityFilter !== 'TODAS' && task.priority !== priorityFilter) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesPurchase = (task.purchaseDescription || '').toLowerCase().includes(q);
        const matchesSubItems = (task.items || []).some(item => item.text.toLowerCase().includes(q));
        return matchesTitle || matchesDesc || matchesPurchase || matchesSubItems;
      }

      return true;
    });
  }, [tasks, activeTab, searchTerm, priorityFilter]);

  // Statistics Totals
  const stats = useMemo(() => {
    const pending = tasks.filter((t) => !t.isCompleted);
    const completed = tasks.filter((t) => t.isCompleted);

    const pendingPurchasesTotal = pending.reduce((acc, t) => acc + (t.needsPurchase ? Number(t.purchaseValue) || 0 : 0), 0);
    const completedPurchasesTotal = completed.reduce((acc, t) => acc + (t.needsPurchase ? Number(t.purchaseValue) || 0 : 0), 0);

    return {
      pendingCount: pending.length,
      completedCount: completed.length,
      pendingPurchasesTotal,
      completedPurchasesTotal,
    };
  }, [tasks]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: `Card ${tasks.length + 1}`,
      description: '',
      items: [
        { id: `sub-${Date.now()}-1`, text: 'Atividade 1', isCompleted: false }
      ],
      needsPurchase: false,
      purchaseDescription: '',
      purchaseValue: '',
      priority: 'MEDIA',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task: DailyTaskCard) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      items: task.items ? task.items.map(i => ({ ...i })) : [],
      needsPurchase: !!task.needsPurchase,
      purchaseDescription: task.purchaseDescription || '',
      purchaseValue: task.purchaseValue !== undefined ? String(task.purchaseValue).replace('.', ',') : '',
      priority: task.priority || 'MEDIA',
    });
    setIsModalOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      showToast('Digite o título do card de tarefa.', 'error');
      return;
    }

    const parseValue = (valStr: string) => {
      if (!valStr) return 0;
      const clean = valStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      return parseFloat(clean) || 0;
    };

    const nowIso = new Date().toISOString();
    const cleanItems = taskForm.items.filter(i => i.text.trim().length > 0);

    if (editingTask) {
      // Edit existing
      const updatedTask: DailyTaskCard = {
        ...editingTask,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        items: cleanItems,
        needsPurchase: taskForm.needsPurchase,
        purchaseDescription: taskForm.needsPurchase ? taskForm.purchaseDescription.trim() : '',
        purchaseValue: taskForm.needsPurchase ? parseValue(taskForm.purchaseValue) : undefined,
        priority: taskForm.priority,
        updatedAt: nowIso,
      };

      const updatedList = tasks.map((t) => (t.id === editingTask.id ? updatedTask : t));
      StorageService.saveDailyTasks(updatedList);
      setTasks(updatedList);
      showToast('Card de tarefa atualizado!');
    } else {
      // Create new
      const newTask: DailyTaskCard = {
        id: `task-${Date.now()}`,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        items: cleanItems,
        needsPurchase: taskForm.needsPurchase,
        purchaseDescription: taskForm.needsPurchase ? taskForm.purchaseDescription.trim() : '',
        purchaseValue: taskForm.needsPurchase ? parseValue(taskForm.purchaseValue) : undefined,
        isCompleted: false,
        createdAt: nowIso,
        updatedAt: nowIso,
        priority: taskForm.priority,
      };

      const updatedList = [newTask, ...tasks];
      StorageService.saveDailyTasks(updatedList);
      setTasks(updatedList);
      showToast('Card de tarefa criado com sucesso!');
    }

    setIsModalOpen(false);
  };

  // Toggle individual sub-task item inside a card directly
  const handleToggleSubItem = (cardId: string, subItemId: string) => {
    const nowIso = new Date().toISOString();
    const updatedList = tasks.map((card) => {
      if (card.id === cardId) {
        const updatedItems = (card.items || []).map((item) => {
          if (item.id === subItemId) {
            return { ...item, isCompleted: !item.isCompleted };
          }
          return item;
        });

        // Check if all sub-items are completed now
        const allCompleted = updatedItems.length > 0 && updatedItems.every((i) => i.isCompleted);

        return {
          ...card,
          items: updatedItems,
          isCompleted: allCompleted ? true : card.isCompleted,
          completedAt: allCompleted ? nowIso : (card.isCompleted ? card.completedAt : undefined),
          updatedAt: nowIso,
        };
      }
      return card;
    });

    StorageService.saveDailyTasks(updatedList);
    setTasks(updatedList);
  };

  // Quick add a new sub-item directly from card view
  const handleAddSubItemToCard = (cardId: string) => {
    const text = (quickSubItemText[cardId] || '').trim();
    if (!text) return;

    const newSubItem: DailyTaskSubItem = {
      id: `sub-${Date.now()}`,
      text,
      isCompleted: false,
    };

    const nowIso = new Date().toISOString();
    const updatedList = tasks.map((card) => {
      if (card.id === cardId) {
        const currentItems = card.items || [];
        return {
          ...card,
          items: [...currentItems, newSubItem],
          isCompleted: false, // adding a new item reopens card
          completedAt: undefined,
          updatedAt: nowIso,
        };
      }
      return card;
    });

    StorageService.saveDailyTasks(updatedList);
    setTasks(updatedList);
    setQuickSubItemText((prev) => ({ ...prev, [cardId]: '' }));
    showToast('Item adicionado à tarefa!');
  };

  // Delete sub-item directly from card
  const handleDeleteSubItemFromCard = (cardId: string, subItemId: string) => {
    const nowIso = new Date().toISOString();
    const updatedList = tasks.map((card) => {
      if (card.id === cardId) {
        const filteredItems = (card.items || []).filter((i) => i.id !== subItemId);
        return {
          ...card,
          items: filteredItems,
          updatedAt: nowIso,
        };
      }
      return card;
    });

    StorageService.saveDailyTasks(updatedList);
    setTasks(updatedList);
  };

  // Toggle Entire Card Complete / Reopen Status
  const handleToggleTaskComplete = (id: string) => {
    const nowIso = new Date().toISOString();
    const updatedList = tasks.map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.isCompleted;
        // Mark all sub-items completed if marking card completed
        const updatedItems = (t.items || []).map(i => ({
          ...i,
          isCompleted: nextCompleted ? true : i.isCompleted
        }));

        return {
          ...t,
          items: updatedItems,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? nowIso : undefined,
          updatedAt: nowIso,
        };
      }
      return t;
    });

    StorageService.saveDailyTasks(updatedList);
    setTasks(updatedList);

    const target = tasks.find((t) => t.id === id);
    if (target) {
      if (!target.isCompleted) {
        showToast(`"${target.title}" concluído! Movido para Serviços Feitos.`);
      } else {
        showToast(`"${target.title}" reaberto! Movido para A Fazer.`);
      }
    }
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    const updatedList = tasks.filter((t) => t.id !== id);
    StorageService.saveDailyTasks(updatedList);
    setTasks(updatedList);
    setConfirmDeleteId(null);
    showToast('Tarefa excluída com sucesso!');
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'URGENTE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'ALTA':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIA':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'BAIXA':
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4 font-sans text-slate-300 bg-[#0B1221] p-2.5 sm:p-4 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[999] px-4 py-3 rounded-xl font-bold shadow-2xl animate-in slide-in-from-top-2 flex items-center gap-2 border ${
            toast.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-200' : 'bg-rose-950 border-rose-500 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs">{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Excluir Tarefa?</h3>
            <p className="text-xs text-slate-400 mb-5">Esta ação não poderá ser desfeita. Deseja remover este card de tarefa?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTask(confirmDeleteId)}
                className="flex-1 px-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-rose-600/30"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#161B2B] p-3 sm:p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">Tarefas Diárias & Compras</h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                EXCLUSIVO SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">Marque cada tarefa individualmente direto no celular ou computador.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="w-full md:w-auto px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-600/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Card de Tarefa</span>
        </button>
      </div>

      {/* Stats Cards Top Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="bg-[#161B2B] p-2.5 sm:p-3 rounded-xl border border-slate-800 flex items-center gap-2.5 shadow-sm">
          <div className="p-2 sm:p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-white">{stats.pendingCount}</div>
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Tarefas A Fazer</div>
          </div>
        </div>

        <div className="bg-[#161B2B] p-2.5 sm:p-3 rounded-xl border border-emerald-500/30 flex items-center gap-2.5 shadow-sm">
          <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-emerald-400">{stats.completedCount}</div>
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Serviços Feitos</div>
          </div>
        </div>

        <div className="bg-[#161B2B] p-2.5 sm:p-3 rounded-xl border border-indigo-500/30 flex items-center gap-2.5 shadow-sm">
          <div className="p-2 sm:p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-sm sm:text-lg font-black text-indigo-400">R$ {stats.pendingPurchasesTotal.toFixed(2).replace('.', ',')}</div>
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Compras Pendentes</div>
          </div>
        </div>

        <div className="bg-[#161B2B] p-2.5 sm:p-3 rounded-xl border border-cyan-500/30 flex items-center gap-2.5 shadow-sm">
          <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-sm sm:text-lg font-black text-cyan-400">R$ {stats.completedPurchasesTotal.toFixed(2).replace('.', ',')}</div>
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Compras Efetuadas</div>
          </div>
        </div>
      </div>

      {/* Main Control Bar: Tabs, Search and Priority Filters */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2.5 bg-[#161B2B] p-2 sm:p-2.5 rounded-xl border border-slate-800">
        {/* Tabs: A Fazer / Serviços Feitos */}
        <div className="flex items-center bg-[#0B1221] p-1 rounded-lg border border-slate-800 text-xs w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`flex-1 md:flex-none px-3.5 py-2 rounded-md font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'PENDING' ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>A Fazer</span>
            <span className="bg-amber-950/80 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-bold border border-amber-700/50">
              {stats.pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('COMPLETED')}
            className={`flex-1 md:flex-none px-3.5 py-2 rounded-md font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'COMPLETED' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Serviços Feitos</span>
            <span className="bg-emerald-950/80 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-bold border border-emerald-700/50">
              {stats.completedCount}
            </span>
          </button>
        </div>

        {/* Search & Priority Filter */}
        <div className="flex items-center gap-2 flex-1 w-full md:max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tarefa, item ou compra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B1221] border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center bg-[#0B1221] px-2 py-1.5 rounded-lg border border-slate-700 text-xs shrink-0">
            <Filter className="w-3 h-3 text-slate-400 mr-1.5" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="TODAS" className="bg-[#161B2B] text-white">Todas Prioridades</option>
              <option value="URGENTE" className="bg-[#161B2B] text-rose-300">Urgente</option>
              <option value="ALTA" className="bg-[#161B2B] text-amber-300">Alta</option>
              <option value="MEDIA" className="bg-[#161B2B] text-indigo-300">Média</option>
              <option value="BAIXA" className="bg-[#161B2B] text-slate-300">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-16 min-h-0">
        {filteredTasks.length === 0 ? (
          <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-8 sm:p-10 text-center shadow-xl flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500">
              <CheckSquare className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {activeTab === 'PENDING' ? 'Nenhuma tarefa pendente no momento' : 'Nenhum serviço feito encontrado'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              {activeTab === 'PENDING'
                ? 'Crie novos cards de tarefas diárias e marque cada item individualmente conforme for realizando.'
                : 'Quando todas as tarefas individuais de um card forem marcadas como concluídas, o card irá para esta aba de Serviços Feitos.'}
            </p>
            {activeTab === 'PENDING' && (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-600/30"
              >
                <Plus className="w-4 h-4" /> Criar Card de Tarefa
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredTasks.map((task) => {
              const isDone = task.isCompleted;
              const subItems = task.items || [];
              const doneSubCount = subItems.filter((i) => i.isCompleted).length;
              const progressPct = subItems.length > 0 ? Math.round((doneSubCount / subItems.length) * 100) : 0;

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border transition-all flex flex-col justify-between p-3.5 sm:p-4 shadow-xl relative overflow-hidden ${
                    isDone
                      ? 'bg-[#121E21]/90 border-emerald-500/40 shadow-emerald-950/20'
                      : 'bg-[#161B2B] border-slate-800 hover:border-slate-700 shadow-slate-950/30'
                  }`}
                >
                  <div>
                    {/* Top Header Badge & Date */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority || 'MEDIA'}
                        </span>

                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {task.createdAt && !isNaN(new Date(task.createdAt).getTime())
                            ? new Date(task.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : 'Hoje'}
                        </span>
                      </div>

                      {/* Edit & Delete Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(task)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all cursor-pointer"
                          title="Editar card completo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(task.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Excluir card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Card Title */}
                    <h3
                      className={`text-sm sm:text-base font-black mb-2 leading-snug ${
                        isDone ? 'text-emerald-300 line-through opacity-85' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h3>

                    {/* General Description / Observações */}
                    {task.description && (
                      <p className={`text-xs text-slate-300 mb-3 bg-[#0B1221]/70 p-2 rounded-lg border border-slate-800/80 ${isDone ? 'line-through opacity-70' : ''}`}>
                        {task.description}
                      </p>
                    )}

                    {/* Progress Bar for Sub-items */}
                    {subItems.length > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                          <span className="flex items-center gap-1 text-amber-300">
                            <ListTodo className="w-3 h-3" /> Tarefas do Card ({doneSubCount}/{subItems.length})
                          </span>
                          <span className={progressPct === 100 ? 'text-emerald-400 font-black' : 'text-slate-300 font-mono'}>
                            {progressPct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              progressPct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* INDIVIDUAL SUB-TASKS / CHECKLIST ITEMS LIST */}
                    <div className="space-y-1.5 mb-3">
                      {subItems.map((subItem) => (
                        <div
                          key={subItem.id}
                          className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                            subItem.isCompleted
                              ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-200'
                              : 'bg-[#0B1221] border-slate-800/90 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {/* Checkbox & Item Text */}
                          <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none min-w-0 py-0.5">
                            <input
                              type="checkbox"
                              checked={subItem.isCompleted}
                              onChange={() => handleToggleSubItem(task.id, subItem.id)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-emerald-500 cursor-pointer shrink-0"
                            />
                            <span
                              className={`text-xs font-medium truncate ${
                                subItem.isCompleted ? 'line-through text-emerald-300/80' : 'text-slate-200 font-semibold'
                              }`}
                              title={subItem.text}
                            >
                              {subItem.text}
                            </span>
                          </label>

                          {/* Delete Item Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSubItemFromCard(task.id, subItem.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer shrink-0"
                            title="Remover este item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Quick Add Sub-Item Row */}
                    {!isDone && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <input
                          type="text"
                          placeholder="+ Adicionar tarefa individual..."
                          value={quickSubItemText[task.id] || ''}
                          onChange={(e) => setQuickSubItemText({ ...quickSubItemText, [task.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubItemToCard(task.id);
                            }
                          }}
                          className="flex-1 bg-[#0B1221] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSubItemToCard(task.id)}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Optional Purchase Section (Precisa Comprar) */}
                    {task.needsPurchase && (
                      <div
                        className={`p-2.5 rounded-xl border mb-3 text-xs transition-all ${
                          isDone
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-indigo-950/20 border-indigo-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase text-indigo-400 flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3 text-indigo-400" /> Precisa de Compra:
                          </span>
                          {task.purchaseValue !== undefined && Number(task.purchaseValue) > 0 && (
                            <span className="text-xs font-black text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/50 font-mono">
                              R$ {Number(task.purchaseValue).toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>

                        {task.purchaseDescription ? (
                          <p className={`text-indigo-200 font-medium ${isDone ? 'line-through opacity-70' : ''}`}>
                            {task.purchaseDescription}
                          </p>
                        ) : (
                          <p className="text-slate-500 italic text-[11px]">Item de compra solicitado.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer / Toggle Complete Button */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-1">
                    {isDone ? (
                      <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Serviço Concluído</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Serviço Pendente</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleTaskComplete(task.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 ${
                        isDone
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Desfazer</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Concluir Card</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pop-up Modal for Adding / Editing Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border border-slate-700 rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                {editingTask ? 'Editar Card de Tarefa' : 'Novo Card de Tarefa Diária'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {/* Card Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Título / Nome do Card *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Card 1, Organizar Bancada, Insumos de Solda..."
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-bold"
                  required
                  autoFocus
                />
              </div>

              {/* General Description / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Observações / Detalhes Gerais (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Descreva observações gerais deste card..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Individual Sub-Tasks Checklist Editor inside Modal */}
              <div className="p-3 bg-[#0B1221] border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-amber-400" />
                    <span>Tarefas Individuais a Fazer</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setTaskForm({
                        ...taskForm,
                        items: [...taskForm.items, { id: `sub-${Date.now()}`, text: '', isCompleted: false }],
                      })
                    }
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {taskForm.items.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={(e) => {
                          const updated = [...taskForm.items];
                          updated[idx].isCompleted = e.target.checked;
                          setTaskForm({ ...taskForm, items: updated });
                        }}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-amber-500 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        placeholder={`Tarefa ${idx + 1}...`}
                        value={item.text}
                        onChange={(e) => {
                          const updated = [...taskForm.items];
                          updated[idx].text = e.target.value;
                          setTaskForm({ ...taskForm, items: updated });
                        }}
                        className="flex-1 bg-[#161B2B] border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = taskForm.items.filter((_, i) => i !== idx);
                          setTaskForm({ ...taskForm, items: updated });
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Select */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Prioridade
                </label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="URGENTE">Urgente</option>
                </select>
              </div>

              {/* Needs Purchase Toggle */}
              <div className="p-3 bg-[#0B1221] border border-slate-800 rounded-xl space-y-3">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                    Precisa de Compra? (Opcional)
                  </span>
                  <input
                    type="checkbox"
                    checked={taskForm.needsPurchase}
                    onChange={(e) => setTaskForm({ ...taskForm, needsPurchase: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-amber-500 cursor-pointer"
                  />
                </label>

                {taskForm.needsPurchase && (
                  <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-indigo-300 mb-1">
                        O que precisa comprar?
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Tinta de impressora, Malha dessoldadora..."
                        value={taskForm.purchaseDescription}
                        onChange={(e) => setTaskForm({ ...taskForm, purchaseDescription: e.target.value })}
                        className="w-full bg-[#161B2B] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-indigo-300 mb-1">
                        Valor da Compra (R$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">R$</span>
                        <input
                          type="text"
                          placeholder="0,00"
                          value={taskForm.purchaseValue}
                          onChange={(e) => setTaskForm({ ...taskForm, purchaseValue: e.target.value })}
                          className="w-full bg-[#161B2B] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-emerald-400 font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-orange-600/30"
                >
                  {editingTask ? 'Salvar Alterações' : 'Criar Card de Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
