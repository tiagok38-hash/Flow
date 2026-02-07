import { useState, useRef, useEffect } from 'react';
import { Camera, Trash2, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/react-app/supabaseClient';
import Modal from './Modal';
import Button from './Button';

interface ProfileEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onUpdate: () => void;
}

export default function ProfileEditorModal({ isOpen, onClose, user, onUpdate }: ProfileEditorModalProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Inicializar com imagem atual
    useEffect(() => {
        if (isOpen) {
            setPreviewUrl(user?.user_metadata?.picture || null);
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen, user]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!previewUrl) return;
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX - position.x, y: clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (isDragging) {
            e.preventDefault();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            setPosition({
                x: clientX - dragStart.x,
                y: clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Gerar imagem cropada usando Canvas
    const getCroppedImg = async (): Promise<Blob | null> => {
        if (!imageRef.current) return null;

        const canvas = document.createElement('canvas');
        const size = 300; // Tamanho do output
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) return null;

        // Configurações de desenho
        // A imagem é desenhada baseada na posição visual relativa ao container de 200px (ver JSX)
        // Precisamos mapear as coordenadas do container (200px) para o canvas (300px)
        const containerSize = 256; // Tamanho visual na tela
        const ratio = size / containerSize;

        // Fundo branco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Calcular dimensões desenhadas
        const img = imageRef.current;

        // O transform scale no CSS scale(N)
        // A posição x,y no CSS translate(x,y)

        // No canvas:
        ctx.translate(size / 2, size / 2);
        ctx.translate(position.x * ratio, position.y * ratio);
        ctx.scale(scale, scale);
        ctx.translate(-size / 2, -size / 2); // Center pivot

        // Desenhar imagem centralizada
        // Precisamos manter a proporção da imagem original
        const aspect = img.naturalWidth / img.naturalHeight;
        let drawWidth = size;
        let drawHeight = size;

        if (aspect > 1) {
            drawHeight = size / aspect;
        } else {
            drawWidth = size * aspect;
        }

        // Centralizar no contexto desenhado
        const xOffset = (size - drawWidth) / 2;
        const yOffset = (size - drawHeight) / 2;

        ctx.drawImage(img, xOffset, yOffset, drawWidth, drawHeight);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.9);
        });
    };

    const handleSave = async () => {
        if (!previewUrl) return;
        setLoading(true);

        try {
            let publicUrl = previewUrl;

            // Se temos um arquivo novo (ou apenas ajustamos o existente e queremos salvar o crop)
            // Vamos gerar o blob sempre que houver preview para garantir o crop visual
            const blob = await getCroppedImg();

            if (blob) {
                const fileName = `${user.id}-${Date.now()}.jpg`;

                // Upload para Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, blob, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // Get Public URL
                const { data } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                publicUrl = data.publicUrl;
            }

            // Atualizar Auth Metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { picture: publicUrl }
            });

            if (updateError) throw updateError;

            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar foto: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!confirm('Remover foto de perfil?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { picture: null }
            });
            if (error) throw error;
            setPreviewUrl(null);
            onUpdate();
            onClose();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Foto de Perfil">
            <div className="flex flex-col items-center gap-6">

                {/* Área de Preview / Crop */}
                <div className="relative group">
                    <div
                        className="w-64 h-64 rounded-full border-4 border-gray-100 overflow-hidden bg-gray-50 relative cursor-move shadow-inner"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onTouchMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchEnd={handleMouseUp}
                        ref={containerRef}
                    >
                        {previewUrl ? (
                            <img
                                ref={imageRef}
                                src={previewUrl}
                                alt="Preview"
                                className="max-w-none pointer-events-none select-none origin-center absolute top-0 left-0 w-full h-full object-contain"
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
                                }}
                                draggable={false}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <ImageIcon size={48} className="mb-2 opacity-50" />
                                <span className="text-sm">Sem foto</span>
                            </div>
                        )}
                    </div>

                    {/* Botão de Upload Overlay */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 p-3 bg-teal-500 text-white rounded-full shadow-lg hover:bg-teal-600 transition-transform hover:scale-110 active:scale-95"
                        title="Carregar nova foto"
                    >
                        <Camera size={20} />
                    </button>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                />

                {/* Controles de Zoom */}
                {previewUrl && (
                    <div className="w-full flex items-center gap-4 px-4">
                        <ZoomOut size={16} className="text-gray-400" />
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                        <ZoomIn size={16} className="text-gray-400" />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 w-full mt-2">
                    {previewUrl && (
                        <button
                            onClick={handleRemove}
                            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"
                            disabled={loading}
                        >
                            <Trash2 size={18} />
                            Remover
                        </button>
                    )}

                    <div className="flex-1"></div>

                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm font-medium"
                        disabled={loading}
                    >
                        Cancelar
                    </button>

                    <Button
                        onClick={handleSave}
                        disabled={loading || !previewUrl}
                        className="px-6 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-xl shadow-lg shadow-teal-500/25 min-w-[100px]"
                    >
                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mx-auto"></div> : 'Salvar'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
