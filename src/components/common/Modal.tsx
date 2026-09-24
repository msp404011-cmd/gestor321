import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    info: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  subtitle?: string;
  footer?: React.ReactNode;
  hideHeaderClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'lg',
  footer,
  hideHeaderClose = false,
}) => {
  const { isDark } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '4xl': 'max-w-6xl',
    full: 'max-w-[96vw] h-[95vh]',
  }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 overflow-y-auto bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${sizeClasses} rounded-2xl border-2 overflow-hidden flex flex-col max-h-[96vh] animate-in zoom-in-95 duration-150 transition-all cursor-default ${
          isDark
            ? 'bg-[#0c1626] border-slate-700/90 shadow-[0_0_35px_rgba(6,182,212,0.2)] text-white'
            : 'bg-white border-slate-200 shadow-2xl text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 sm:px-5 py-3 border-b-2 shrink-0 ${
          isDark ? 'bg-[#070e1d] border-slate-800' : 'bg-slate-50/90 border-slate-100'
        }`}>
          <div>
            <h3 className={`text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {!hideHeaderClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
              }`}
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className={`flex items-center justify-end gap-3 px-4 sm:px-5 py-2.5 border-t-2 shrink-0 ${
            isDark ? 'bg-[#070e1d] border-slate-800' : 'bg-slate-50/90 border-slate-100'
          }`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
}) => {
  const { isDark } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 whitespace-nowrap">
          {isDestructive && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />}
          <span>{title}</span>
        </div>
      }
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200/70'
            }`}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
            }`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p>
    </Modal>
  );
};
