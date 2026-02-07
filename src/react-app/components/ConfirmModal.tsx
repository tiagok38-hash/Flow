import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDestructive = false,
}: ConfirmModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-full mb-4 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'}`}>
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 mb-6">{message}</p>

                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 px-4 py-2.5 rounded-xl font-medium shadow-lg transition-all ${isDestructive
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25'
                                : 'bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/25'
                            }`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
