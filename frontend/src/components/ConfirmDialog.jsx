/**
 * components/ConfirmDialog.jsx
 * Modal confirmation dialog for destructive actions
 */

import { AlertTriangle, X } from 'lucide-react';

// Accepts both `confirmLabel` (preferred) and `confirmText` (legacy alias)
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText, confirmLabel, danger = true }) => {
  const buttonLabel = confirmLabel || confirmText || 'Confirm';
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 animate-fade-in">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <div className="flex items-start gap-4">
          {danger && (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
