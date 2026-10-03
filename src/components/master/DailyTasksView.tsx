import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Flame,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { DailyTaskCard, DailyTaskSubItem } from '../../types';
import { StorageService } from '../../services/storage';

// Simple Canvas Confetti helper written from scratch for absolute reliability and zero external package dependency
class ConfettiEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
  }> = [];
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  public burst(x: number, y: number) {
    const colors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x,
        y,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 12,
        speedY: (Math.random() - 0.7) * 16 - 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    if (!this.animationFrameId) {
      this.animate();
    }
  }

  private animate = () => {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.35; // gravity
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.015;

      if (p.opacity <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      
      // Draw rectangular confetti piece
      this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.animationFrameId = null;
    }
  };

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}

interface DailyTasksViewProps {
  isSuperAdmin?: boolean;
}

export const DailyTasksView: React.FC<DailyTasksViewProps> = ({ isSuperAdmin = true }) => {
  const [tasks, setTasks] = useState<DailyTaskCard[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('TODAS');

  // Modal state for creating/editing entire card
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTaskCard | null>(null);

  // Form State for Card Modal
  const [taskForm, setTaskForm] = useState<{
    title: string;
    description: string;
    items: DailyTaskSubItem[];
    priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  }>({
    title: '',
    description: '',
    items: [],
    priority: 'MEDIA',
  });

  // Pop-up Modal state for Adding/Editing an Individual Activity
  const [activityModal, setActivityModal] = useState<{
    isOpen: boolean;
    cardId: string;
    subItemId?: string;
    text: string;
    priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
    needsPurchase: boolean;
    purchaseDescription: string;
    purchaseValue: string;
  }>({
    isOpen: false,
    cardId: '',
    text: '',
    priority: 'ALTA',
    needsPurchase: false,
    purchaseDescription: '',
    purchaseValue: '',
  });

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Confirm Delete Dialog State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiEngineRef = useRef<ConfettiEngine | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const engine = new ConfettiEngine(canvasRef.current);
      confettiEngineRef.current = engine;
      
      const handleResize = () => {
        if (canvasRef.current) {
          engine.resize(window.innerWidth, window.innerHeight);
        }
      };
      
      window.addEventListener('resize', handleResize);
      handleResize();
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [canvasRef.current]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Weight for priorities
  const getPriorityWeight = (priority?: string): number => {
    switch (priority) {
      case 'URGENTE':
        return 4;
      case 'ALTA':
        return 3;
      case 'MEDIA':
        return 2;
      case 'BAIXA':
      default:
        return 1;
    }
  };

  // Compute highest priority for a card based on its uncompleted activities
  const getCardHighestPriority = (card: DailyTaskCard): 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA' => {
    const items = card.items || [];
    if (items.length === 0) return card.priority || 'MEDIA';

    const activeItems = items.filter((i) => !i.isCompleted);
    const targetItems = activeItems.length > 0 ? activeItems : items;

    let maxWeight = 0;
    let highest: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA' = 'MEDIA';

    targetItems.forEach((item) => {
      const w = getPriorityWeight(item.priority || card.priority || 'MEDIA');
      if (w > maxWeight) {
        maxWeight = w;
        if (w === 4) highest = 'URGENTE';
        else if (w === 3) highest = 'ALTA';
        else if (w === 2) highest = 'MEDIA';
        else highest = 'BAIXA';
      }
    });

    return highest;
  };

  // Load and seed initial tasks if empty
  useEffect(() => {
    const loadedTasks = StorageService.getDailyTasks();
    if (loadedTasks && loadedTasks.length > 0) {
      setTasks(loadedTasks);
    } else {
      // Seed default sample cards with sub-items containing individual priorities
      const sampleTasks: DailyTaskCard[] = [
        {
          id: 'task-1',
          title: 'Card 1 - Organização da Bancada & Teste de Telas',
          description: 'Rotina diária técnica da bancada principal.',
          items: [
            {
              id: 'sub-1',
              text: 'Comprar 2 carretéis de malha dessoldadora Goot Wick',
              isCompleted: false,
              priority: 'URGENTE',
              needsPurchase: true,
              purchaseDescription: 'Malha Goot Wick 3mm 1.5m',
              purchaseValue: 45.0,
            },
            {
              id: 'sub-2',
              text: 'Limpar e calibrar fonte de bancada 30V 5A',
              isCompleted: false,
              priority: 'ALTA',
            },
            {
              id: 'sub-3',
              text: 'Organizar parafusos e gabaritos de bancada',
              isCompleted: true,
              priority: 'BAIXA',
            },
          ],
          needsPurchase: true,
          purchaseDescription: 'Malha Goot Wick 3mm 1.5m',
          purchaseValue: 45.0,
          isCompleted: false,
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          priority: 'URGENTE',
        },
        {
          id: 'task-2',
          title: 'Card 2 - Reposição de Insumos de Solda',
          description: 'Conferência e compra de insumos urgentes.',
          items: [
            {
              id: 'sub-20',
              text: 'Comprar Fluxo de Solda Amtech NC-559',
              isCompleted: false,
              priority: 'ALTA',
              needsPurchase: true,
              purchaseDescription: 'Siringa Fluxo Amtech 10cc',
              purchaseValue: 85.0,
            },
            {
              id: 'sub-21',
              text: 'Conferir ponteiras do ferro de solda JBC',
              isCompleted: false,
              priority: 'MEDIA',
            },
          ],
          needsPurchase: true,
          purchaseDescription: 'Siringa Fluxo Amtech 10cc',
          purchaseValue: 85.0,
          isCompleted: false,
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          priority: 'ALTA',
        },
        {
          id: 'task-3',
          title: 'Card 3 - Limpeza e Teste de Lote de Telas',
          description: 'Teste final antes da entrega.',
          items: [
            {
              id: 'sub-30',
              text: 'Testar touch e brilho tela Moto G22',
              isCompleted: true,
              priority: 'MEDIA',
            },
            {
              id: 'sub-31',
              text: 'Testar biometria e cores tela Samsung A32',
              isCompleted: true,
              priority: 'MEDIA',
            },
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

  // Filter and Sort Tasks strictly by Priority Order
  const sortedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      // Tab filter
      if (activeTab === 'PENDING' && task.isCompleted) return false;
      if (activeTab === 'COMPLETED' && !task.isCompleted) return false;

      // Priority filter (checks if card highest priority or any item priority matches)
      if (priorityFilter !== 'TODOS' && priorityFilter !== 'TODAS') {
        const cardHighest = getCardHighestPriority(task);
        const hasMatchingSubItem = (task.items || []).some((i) => i.priority === priorityFilter);
        if (cardHighest !== priorityFilter && !hasMatchingSubItem) {
          return false;
        }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || '').toLowerCase().includes(q);
        const matchesPurchase = (task.purchaseDescription || '').toLowerCase().includes(q);
        const matchesSubItems = (task.items || []).some(
          (item) =>
            item.text.toLowerCase().includes(q) ||
            (item.purchaseDescription && item.purchaseDescription.toLowerCase().includes(q))
        );
        return matchesTitle || matchesDesc || matchesPurchase || matchesSubItems;
      }

      return true;
    });

    // SORTING STRICTLY BY PRIORITY ORDER: URGENTE -> ALTA -> MEDIA -> BAIXA
    return [...filtered].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }

      const priorityA = getPriorityWeight(getCardHighestPriority(a));
      const priorityB = getPriorityWeight(getCardHighestPriority(b));

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Highest priority rank first
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, activeTab, searchTerm, priorityFilter]);

  // Sort sub-items inside each card strictly by Priority: URGENTE -> ALTA -> MEDIA -> BAIXA
  const getSortedSubItems = (items: DailyTaskSubItem[]) => {
    return [...items].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      const weightA = getPriorityWeight(a.priority);
      const weightB = getPriorityWeight(b.priority);
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      return 0;
    });
  };

  // Statistics Totals
  const stats = useMemo(() => {
    const pending = tasks.filter((t) => !t.isCompleted);
    const completed = tasks.filter((t) => t.isCompleted);

    const pendingPurchasesTotal = pending.reduce((acc, card) => {
      let cardPurchases = card.needsPurchase ? Number(card.purchaseValue) || 0 : 0;
      (card.items || []).forEach((item) => {
        if (!item.isCompleted && item.needsPurchase) {
          cardPurchases += Number(item.purchaseValue) || 0;
        }
      });
      return acc + cardPurchases;
    }, 0);

    const completedPurchasesTotal = completed.reduce((acc, card) => {
      let cardPurchases = card.needsPurchase ? Number(card.purchaseValue) || 0 : 0;
      (card.items || []).forEach((item) => {
        if (item.needsPurchase) {
          cardPurchases += Number(item.purchaseValue) || 0;
        }
      });
      return acc + cardPurchases;
    }, 0);

    return {
      pendingCount: pending.length,
      completedCount: completed.length,
      pendingPurchasesTotal,
      completedPurchasesTotal,
    };
  }, [tasks]);

  // Open Card Add Modal
  const handleOpenAddModal = () => {
    setEditingTask(null);
    setTaskForm({
      title: `Card ${tasks.length + 1}`,
      description: '',
      items: [],
      priority: 'ALTA',
    });
    setIsModalOpen(true);
  };

  // Open Card Edit Modal
  const handleOpenEditModal = (task: DailyTaskCard) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      items: task.items ? task.items.map((i) => ({ ...i })) : [],
      priority: task.priority || 'MEDIA',
    });
    setIsModalOpen(true);
  };

  // Save Task Card
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      showToast('Digite o título do card de tarefa.', 'error');
      return;
    }

    const nowIso = new Date().toISOString();
    const cleanItems = taskForm.items.filter((i) => i.text.trim().length > 0);

    if (editingTask) {
      const updatedTask: DailyTaskCard = {
        ...editingTask,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        items: cleanItems,
        priority: taskForm.priority,
        updatedAt: nowIso,
      };

      const updatedList = tasks.map((t) => (t.id === editingTask.id ? updatedTask : t));
      StorageService.saveDailyTasks(updatedList);
      setTasks(updatedList);
      showToast('Card de tarefa atualizado!');
    } else {
      const newTask: DailyTaskCard = {
        id: `task-${Date.now()}`,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        items: cleanItems,
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

  // Open Pop-up Modal to Add / Edit an Individual Activity
  const handleOpenActivityModal = (cardId: string, subItem?: DailyTaskSubItem) => {
    if (subItem) {
      setActivityModal({
        isOpen: true,
        cardId,
        subItemId: subItem.id,
        text: subItem.text,
        priority: subItem.priority || 'ALTA',
        needsPurchase: !!subItem.needsPurchase,
        purchaseDescription: subItem.purchaseDescription || '',
        purchaseValue: subItem.purchaseValue !== undefined ? String(subItem.purchaseValue).replace('.', ',') : '',
      });
    } else {
      setActivityModal({
        isOpen: true,
        cardId,
        subItemId: undefined,
        text: '',
        priority: 'ALTA',
        needsPurchase: false,
        purchaseDescription: '',
        purchaseValue: '',
      });
    }
  };

  // Save Activity from Pop-up Modal
  const handleSaveActivityModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityModal.text.trim()) {
      showToast('Digite a descrição da atividade.', 'error');
      return;
    }

    const parseVal = (valStr: string) => {
      if (!valStr) return 0;
      const clean = valStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      return parseFloat(clean) || 0;
    };

    const nowIso = new Date().toISOString();
    const updatedList = tasks.map((card) => {
      if (card.id === activityModal.cardId) {
        const currentItems = card.items || [];
        let updatedItems: DailyTaskSubItem[];

        if (activityModal.subItemId) {
          // Edit existing subitem
          updatedItems = currentItems.map((item) => {
            if (item.id === activityModal.subItemId) {
              return {
                ...item,
                text: activityModal.text.trim(),
                priority: activityModal.priority,
                needsPurchase: activityModal.needsPurchase,
                purchaseDescription: activityModal.needsPurchase ? activityModal.purchaseDescription.trim() : undefined,
                purchaseValue: activityModal.needsPurchase ? parseVal(activityModal.purchaseValue) : undefined,
              };
            }
            return item;
          });
        } else {
          // Add new subitem
          const newItem: DailyTaskSubItem = {
            id: `sub-${Date.now()}`,
            text: activityModal.text.trim(),
            isCompleted: false,
            priority: activityModal.priority,
            needsPurchase: activityModal.needsPurchase,
            purchaseDescription: activityModal.needsPurchase ? activityModal.purchaseDescription.trim() : undefined,
            purchaseValue: activityModal.needsPurchase ? parseVal(activityModal.purchaseValue) : undefined,
          };
          updatedItems = [...currentItems, newItem];
        }

        // Recompute card's main priority & purchase status
        const highestPriority = getCardHighestPriority({ ...card, items: updatedItems });

        return {
          ...card,
          items: updatedItems,
          priority: highestPriority,
          isCompleted: false, // adding/editing item reopens card if closed
          updatedAt: nowIso,
        };
      }
      return card;
    });

    StorageService.saveDailyTasks(updatedList);
    setTasks(updatedList);
    setActivityModal((prev) => ({ ...prev, isOpen: false }));
    showToast(activityModal.subItemId ? 'Atividade atualizada!' : 'Nova atividade adicionada com sucesso!');
  };

  // Toggle individual sub-task item completed status
  const handleToggleSubItem = (cardId: string, subItemId: string) => {
    const nowIso = new Date().toISOString();
    let justCompleted = false;

    const updatedList = tasks.map((card) => {
      if (card.id === cardId) {
        const updatedItems = (card.items || []).map((item) => {
          if (item.id === subItemId) {
            const nextCompleted = !item.isCompleted;
            if (nextCompleted) {
              justCompleted = true;
            }
            return {
              ...item,
              isCompleted: nextCompleted,
              completedAt: nextCompleted ? nowIso : undefined,
            };
          }
          return item;
        });

        const allCompleted = updatedItems.length > 0 && updatedItems.every((i) => i.isCompleted);

        return {
          ...card,
          items: updatedItems,
          isCompleted: allCompleted ? true : card.isCompleted,
          completedAt: allCompleted ? nowIso : card.isCompleted ? card.completedAt : undefined,
          updatedAt: nowIso,
        };
      }
      return card;
    });

    StorageService.saveDailyTasks(updatedList);
    setTasks(updatedList);

    if (justCompleted) {
      if (confettiEngineRef.current) {
        confettiEngineRef.current.burst(window.innerWidth / 2, window.innerHeight / 2);
      }
      showToast('Atividade concluída com sucesso! 🎉');
    }
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
    showToast('Atividade removida.');
  };

  // Toggle Entire Card Complete / Reopen Status
  const handleToggleTaskComplete = (id: string) => {
    const nowIso = new Date().toISOString();
    let isCompleting = false;

    const updatedList = tasks.map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.isCompleted;
        if (nextCompleted) {
          isCompleting = true;
        }
        const updatedItems = (t.items || []).map((i) => ({
          ...i,
          isCompleted: nextCompleted ? true : i.isCompleted,
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
      if (isCompleting) {
        if (confettiEngineRef.current) {
          confettiEngineRef.current.burst(window.innerWidth / 2, window.innerHeight / 2);
        }
        showToast(`"${target.title}" concluído! Movido para Serviços Feitos. 🎉`);
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
    showToast('Card excluído com sucesso!');
  };

  // Fluorescent Flaming Glow Classes per Card Priority
  const getCardFlamingGlowClass = (highestPriority: string, isDone: boolean) => {
    if (isDone) {
      return 'bg-[#081410] border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]';
    }

    switch (highestPriority) {
      case 'URGENTE':
        return 'bg-gradient-to-b from-[#2a090e] via-[#150f24] to-[#0b1220] border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.65)] ring-1 ring-rose-400/60 animate-pulse';
      case 'ALTA':
        return 'bg-gradient-to-b from-[#281103] via-[#150f24] to-[#0b1220] border-orange-500 shadow-[0_0_28px_rgba(249,115,22,0.6)] ring-1 ring-orange-400/50';
      case 'MEDIA':
        return 'bg-gradient-to-b from-[#221803] via-[#150f24] to-[#0b1220] border-amber-500 shadow-[0_0_22px_rgba(245,158,11,0.5)] ring-1 ring-amber-400/40';
      case 'BAIXA':
      default:
        return 'bg-[#141a2b] border-cyan-500/50 shadow-[0_0_18px_rgba(6,182,212,0.35)]';
    }
  };

  const getTopFlameBarClass = (highestPriority: string, isDone: boolean) => {
    if (isDone) return 'from-emerald-500 to-teal-400';
    switch (highestPriority) {
      case 'URGENTE':
        return 'from-rose-600 via-red-500 to-orange-500 shadow-[0_0_15px_rgba(244,63,94,0.9)]';
      case 'ALTA':
        return 'from-orange-500 via-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(249,115,22,0.8)]';
      case 'MEDIA':
        return 'from-amber-500 to-yellow-400';
      case 'BAIXA':
      default:
        return 'from-cyan-500 to-blue-500';
    }
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case 'URGENTE':
        return 'bg-rose-600 text-white font-black border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
      case 'ALTA':
        return 'bg-orange-500 text-white font-black border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.5)]';
      case 'MEDIA':
        return 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/40';
      case 'BAIXA':
      default:
        return 'bg-slate-800 text-slate-300 font-bold border-slate-700';
    }
  };

  const renderSubItemPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'URGENTE':
        return (
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/25 text-rose-300 border border-rose-500/50 flex items-center gap-1 shrink-0 shadow-sm animate-pulse">
            <Flame className="w-3 h-3 text-rose-400 fill-rose-500" /> 🔥 URGENTE
          </span>
        );
      case 'ALTA':
        return (
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/25 text-orange-300 border border-orange-500/50 flex items-center gap-1 shrink-0 shadow-sm">
            <Flame className="w-3 h-3 text-orange-400" /> ⚡ ALTA
          </span>
        );
      case 'MEDIA':
        return (
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
            📌 MÉDIA
          </span>
        );
      case 'BAIXA':
      default:
        return (
          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
            BAIXA
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4 font-sans text-slate-300 bg-[#0B1221] p-2.5 sm:p-4 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Confetti canvas for celebrations */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[200] w-full h-full"
      />

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
            <h3 className="text-sm font-bold text-white mb-2">Excluir Card de Tarefa?</h3>
            <p className="text-xs text-slate-400 mb-5">
              Esta ação não poderá ser desfeita. Deseja remover este card de tarefa com todas as suas atividades?
            </p>
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
                Excluir Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-[#161B2B] p-3 sm:p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shrink-0">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">Tarefas Diárias & Prioridades em Chamas</h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                EXCLUSIVO SUPER ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Crie cards, defina a prioridade individual de cada atividade e acompanhe o brilho e compras necessárias direto no celular.
            </p>
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
            <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Cards A Fazer</div>
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
              placeholder="Buscar tarefa, atividade ou compra..."
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
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-bold"
            >
              <option value="TODAS" className="bg-[#161B2B] text-white">Todas Prioridades</option>
              <option value="URGENTE" className="bg-[#161B2B] text-rose-300">🔥 Urgente Primeiro</option>
              <option value="ALTA" className="bg-[#161B2B] text-orange-300">⚡ Alta</option>
              <option value="MEDIA" className="bg-[#161B2B] text-amber-300">📌 Média</option>
              <option value="BAIXA" className="bg-[#161B2B] text-slate-300">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Indicator Order Notice */}
      <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-amber-400">
          <ArrowUpDown className="w-3 h-3 text-amber-400" />
          Ordenado por Prioridade (🔥 Urgente → ⚡ Alta → 📌 Média → Baixa)
        </span>
        <span className="text-slate-500 hidden sm:inline">Modo Celular Otimizado</span>
      </div>

      {/* Task Cards Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-16 min-h-0">
        {sortedTasks.length === 0 ? (
          <div className="bg-[#161B2B] border border-slate-800 rounded-2xl p-8 sm:p-10 text-center shadow-xl flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500">
              <Flame className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {activeTab === 'PENDING' ? 'Nenhuma tarefa pendente encontrada' : 'Nenhum serviço feito encontrado'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              {activeTab === 'PENDING'
                ? 'Crie novos cards de tarefas e adicione atividades com prioridade e compras para ver o efeito luminoso em chamas.'
                : 'Quando todas as atividades individuais de um card forem concluídas, o card irá para esta aba de Serviços Feitos.'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-3 bg-[#0B1221]">
            {sortedTasks.map((task) => {
              const isDone = task.isCompleted;
              const subItems = task.items || [];
              const sortedSubItems = getSortedSubItems(subItems);
              const doneSubCount = subItems.filter((i) => i.isCompleted).length;
              const progressPct = subItems.length > 0 ? Math.round((doneSubCount / subItems.length) * 100) : 0;
              const cardHighestPriority = getCardHighestPriority(task);

              return (
                <div
                  key={task.id}
                  className={`rounded-xl border-2 transition-all flex flex-col justify-between p-2.5 sm:p-3 shadow-xl relative overflow-hidden ${getCardFlamingGlowClass(
                    cardHighestPriority,
                    isDone
                  )}`}
                >
                  {/* Top Flame Bar Gradient */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${getTopFlameBarClass(
                      cardHighestPriority,
                      isDone
                    )}`}
                  />

                  <div>
                    {/* Top Header Badge & Date */}
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] text-slate-300 font-mono font-bold bg-black/40 px-2 py-0.5 rounded-md border border-slate-700/60 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-400" />
                          {task.createdAt && !isNaN(new Date(task.createdAt).getTime())
                            ? new Date(task.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : 'Hoje'}
                        </span>
                      </div>

                      {/* Edit & Delete Card Buttons */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(task)}
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-all cursor-pointer"
                          title="Editar dados gerais do card"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(task.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer"
                          title="Excluir card"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Card Title */}
                    <h3
                      className={`text-sm sm:text-base font-black mb-1 leading-snug break-words whitespace-normal ${
                        isDone ? 'text-emerald-300 line-through opacity-85 font-black' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h3>

                    {/* General Description / Observações */}
                    {task.description && (
                      <p className={`text-xs text-slate-300 mb-1.5 bg-[#0B1221]/80 p-1.5 rounded-lg border border-slate-800 break-words whitespace-normal ${isDone ? 'line-through opacity-70' : ''}`}>
                        {task.description}
                      </p>
                    )}

                    {/* Progress Bar for Sub-items */}
                    {subItems.length > 0 && (
                      <div className="mb-2">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 mb-0.5">
                          <span className="flex items-center gap-1 text-amber-300 uppercase tracking-wider">
                            <ListTodo className="w-2.5 h-2.5" /> Atividades ({doneSubCount}/{subItems.length})
                          </span>
                          <span className={progressPct === 100 ? 'text-emerald-400 font-black' : 'text-amber-300 font-mono font-bold'}>
                            {progressPct}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                          <div
                            className={`h-full transition-all duration-300 ${
                              progressPct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* INDIVIDUAL SUB-TASKS / ACTIVITIES LIST (SORTED BY PRIORITY) */}
                    <div className="space-y-2 mb-2.5">
                      {sortedSubItems.map((subItem) => (
                        <div
                          key={subItem.id}
                          className={`rounded-xl border-2 p-2 sm:p-2.5 transition-all flex flex-col space-y-2 shadow-xl relative overflow-hidden ${
                            subItem.isCompleted
                              ? 'bg-[#091a13] border-emerald-500/80 text-emerald-100 border-l-[6px] border-l-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                              : subItem.priority === 'URGENTE'
                              ? 'bg-[#400c14] border-rose-500 border-l-[6px] border-l-rose-500 text-white shadow-[0_0_18px_rgba(244,63,94,0.5)] ring-1 ring-rose-500/30 animate-pulse'
                              : subItem.priority === 'ALTA'
                              ? 'bg-[#3b1704] border-orange-500 border-l-[6px] border-l-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] ring-1 ring-orange-500/20'
                              : subItem.priority === 'MEDIA'
                              ? 'bg-[#302404] border-amber-500 border-l-[6px] border-l-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                              : 'bg-[#132340] border-cyan-500 border-l-[6px] border-l-cyan-400 text-white shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                          }`}
                        >
                          {/* Priority Badge & Action Buttons */}
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {renderSubItemPriorityBadge(subItem.priority)}
                              {subItem.isCompleted && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> CONCLUÍDO
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenActivityModal(task.id, subItem);
                                }}
                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[10px] font-black flex items-center gap-0.5 cursor-pointer transition-all active:scale-95"
                                title="Editar esta atividade"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSubItemFromCard(task.id, subItem.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer"
                                title="Remover atividade"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Activity Description Text & Touch Completion Action (High visibility, optimized for phone) */}
                          <div
                            onClick={() => handleToggleSubItem(task.id, subItem.id)}
                            className="flex items-center justify-between gap-2.5 bg-black/60 hover:bg-black/80 p-2 sm:p-2.5 rounded-lg border border-white/5 cursor-pointer select-none group transition-all"
                          >
                            <div className="flex-1 min-w-0 pr-1">
                              <p
                                className={`text-xs sm:text-sm font-black leading-snug tracking-wide break-words whitespace-normal ${
                                  subItem.isCompleted ? 'text-emerald-300 line-through opacity-85 font-black' : 'text-white'
                                }`}
                              >
                                {subItem.text}
                              </p>
                            </div>

                            {/* Large Touch Target Completion Toggle Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSubItem(task.id, subItem.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1 shrink-0 border shadow-md active:scale-95 ${
                                subItem.isCompleted
                                  ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)] border-emerald-400'
                                  : subItem.priority === 'URGENTE'
                                  ? 'bg-rose-955 border-rose-400 text-rose-200 hover:bg-rose-900/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                                  : subItem.priority === 'ALTA'
                                  ? 'bg-orange-955 border-orange-400 text-orange-200 hover:bg-orange-900/60 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                                  : subItem.priority === 'MEDIA'
                                  ? 'bg-amber-955 border-amber-400 text-amber-200 hover:bg-amber-900/60 shadow-[0_0_6px_rgba(245,158,11,0.2)]'
                                  : 'bg-cyan-955 border-cyan-400 text-cyan-200 hover:bg-cyan-900/60 shadow-[0_0_6px_rgba(6,182,212,0.2)]'
                              }`}
                            >
                              {subItem.isCompleted ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[4] text-emerald-400" />
                                  <span>FEITO</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2.5 h-2.5 rounded bg-black/40 border border-slate-500 shrink-0" />
                                  <span>CONCLUIR</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Purchase Highlight for this Activity */}
                          {subItem.needsPurchase && (
                            <div className="flex items-center justify-between gap-2 bg-indigo-950/90 border border-indigo-500/50 p-2 rounded-lg text-xs mt-0.5 shadow-inner">
                              <div className="flex items-center gap-1 min-w-0">
                                <ShoppingBag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="text-[10px] font-black text-indigo-100 truncate">
                                  🛒 Comprar: {subItem.purchaseDescription || 'Item necessário'}
                                </span>
                              </div>
                              {subItem.purchaseValue !== undefined && Number(subItem.purchaseValue) > 0 && (
                                <span className="text-[10px] font-black text-cyan-300 font-mono bg-cyan-950 px-2 py-1 rounded-md border border-cyan-500/50 shrink-0 shadow-md">
                                  R$ {Number(subItem.purchaseValue).toFixed(2).replace('.', ',')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Button to Open Pop-up to Add Individual Activity */}
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => handleOpenActivityModal(task.id)}
                        className="w-full py-1.5 px-2.5 mb-2 bg-[#0B1221] hover:bg-amber-500/10 border border-dashed border-amber-500/40 hover:border-amber-500 text-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Adicionar Atividade com Pop-up (Prioridade & Compras)</span>
                      </button>
                    )}
                  </div>

                  {/* Card Footer / Toggle Complete Button */}
                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5 mt-0.5">
                    {isDone ? (
                      <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Card Concluído</span>
                      </div>
                    ) : (
                      <div className="text-[9px] text-amber-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Andamento ({doneSubCount}/{subItems.length})</span>
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

      {/* POP-UP MODAL 1: ADD / EDIT ENTIRE TASK CARD */}
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

      {/* POP-UP MODAL 2: ADD / EDIT INDIVIDUAL ACTIVITY (PRIORITY & PURCHASES) */}
      {activityModal.isOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161B2B] border-2 border-amber-500/50 rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-[0_0_35px_rgba(245,158,11,0.3)] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                {activityModal.subItemId ? 'Editar Atividade' : 'Adicionar Atividade ao Card'}
              </h3>
              <button
                type="button"
                onClick={() => setActivityModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivityModal} className="space-y-4">
              {/* Activity Description */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Descrição da Atividade / Serviço *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Limpar gaveteiro, Comprar fluxo de solda, Testar tela..."
                  value={activityModal.text}
                  onChange={(e) => setActivityModal({ ...activityModal, text: e.target.value })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-bold"
                  required
                  autoFocus
                />
              </div>

              {/* Priority Select */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Prioridade desta Atividade *
                </label>
                <select
                  value={activityModal.priority}
                  onChange={(e) => setActivityModal({ ...activityModal, priority: e.target.value as any })}
                  className="w-full bg-[#0B1221] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer font-bold"
                >
                  <option value="URGENTE" className="bg-[#161B2B] text-rose-300 font-black">🔥 URGENTE (Primeiro lugar e brilho vermelho)</option>
                  <option value="ALTA" className="bg-[#161B2B] text-orange-300 font-bold">⚡ ALTA (Brilho laranja em chamas)</option>
                  <option value="MEDIA" className="bg-[#161B2B] text-amber-300 font-bold">📌 MÉDIA (Brilho amarelo)</option>
                  <option value="BAIXA" className="bg-[#161B2B] text-slate-300">BAIXA</option>
                </select>
              </div>

              {/* Needs Purchase Section */}
              <div className="p-3 bg-[#0B1221] border border-slate-800 rounded-xl space-y-3">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                    Precisa de Compra para Esta Atividade?
                  </span>
                  <input
                    type="checkbox"
                    checked={activityModal.needsPurchase}
                    onChange={(e) => setActivityModal({ ...activityModal, needsPurchase: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 checked:bg-amber-500 cursor-pointer"
                  />
                </label>

                {activityModal.needsPurchase && (
                  <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-indigo-300 mb-1">
                        O que precisa comprar?
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Tela Moto G22, Fluxo Amtech, Malha dessoldadora..."
                        value={activityModal.purchaseDescription}
                        onChange={(e) => setActivityModal({ ...activityModal, purchaseDescription: e.target.value })}
                        className="w-full bg-[#161B2B] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-indigo-300 mb-1">
                        Valor Estimado (R$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">R$</span>
                        <input
                          type="text"
                          placeholder="0,00"
                          value={activityModal.purchaseValue}
                          onChange={(e) => setActivityModal({ ...activityModal, purchaseValue: e.target.value })}
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
                  onClick={() => setActivityModal((prev) => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-orange-600/30"
                >
                  {activityModal.subItemId ? 'Salvar Alterações' : 'Confirmar e Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
