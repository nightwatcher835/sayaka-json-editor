import React, { useState, useEffect } from 'react';
import { CardDocument, CardVariant } from '../types/card';
import { VariantEditor } from './VariantEditor';
import { toText, cloneCard } from '../utils/cardUtils';
import {
  Save,
  Code2,
  Trash2,
  Image as ImageIcon,
  Copy,
  CheckCircle2,
  ExternalLink,
  Layers
} from 'lucide-react';

interface CardEditorProps {
  card: CardDocument | null;
  isDirty: boolean;
  onSave: (updated: CardDocument) => void;
  onDelete: (cardId: string) => void;
  onDuplicate: (card: CardDocument) => void;
  onOpenRawJson: () => void;
}

export const CardEditor: React.FC<CardEditorProps> = ({
  card,
  isDirty,
  onSave,
  onDelete,
  onDuplicate,
  onOpenRawJson,
}) => {
  const [formData, setFormData] = useState<CardDocument | null>(null);
  const [imageError, setImageError] = useState(false);
  const [showImageUrls, setShowImageUrls] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Sincroniza formulário com o cartão selecionado
  useEffect(() => {
    if (card) {
      setFormData(cloneCard(card));
      setImageError(false);
    } else {
      setFormData(null);
    }
  }, [card]);

  if (!card || !formData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-500 bg-zinc-950/40">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-400 shadow-inner">
          <Layers className="w-8 h-8 opacity-60" />
        </div>
        <h3 className="text-base font-semibold text-zinc-300 mb-1">Nenhuma carta selecionada</h3>
        <p className="text-xs text-zinc-500 max-w-sm">
          Selecione uma carta da lista à esquerda para visualizar e editar os dados, suas variantes e preços.
        </p>
      </div>
    );
  }

  const imageUrl =
    formData.images?.large || formData.images?.small || '';

  const handleFieldChange = (field: keyof CardDocument, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleImageChange = (type: 'small' | 'large', value: string) => {
    setImageError(false);
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        images: {
          ...prev.images,
          [type]: value,
        },
      };
    });
  };

  const handleVariantChange = (index: number, updated: CardVariant) => {
    setFormData((prev) => {
      if (!prev) return null;
      const variants = [...(prev.variants || [])];
      variants[index] = updated;
      return { ...prev, variants };
    });
  };

  const handleRemoveVariant = (index: number) => {
    setFormData((prev) => {
      if (!prev) return null;
      const variants = [...(prev.variants || [])];
      variants.splice(index, 1);
      return { ...prev, variants };
    });
  };

  const handleSaveClick = () => {
    if (!formData) return;
    onSave(formData);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Header do Card (Título, ID, Subtítulo e botões de topo) */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur flex items-center justify-between gap-4 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-100 truncate">
              {formData.name || 'Sem nome'}
            </h2>
            {isDirty && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Edições não salvas
              </span>
            )}
            {saveSuccessNotice && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-fade-in">
                <CheckCircle2 className="w-3 h-3" /> Salvo!
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 truncate mt-0.5 font-mono">
            {formData.code || formData.id || '-'} • ID: {formData._id || 'novo documento'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onOpenRawJson}
            title="Abrir editor de JSON completo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-colors shadow-sm"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={() => onDuplicate(formData)}
            title="Duplicar esta carta como um novo documento"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-colors shadow-sm"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Duplicar</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(formData._id)}
            title="Excluir carta definitivamente"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-medium border border-rose-900/40 transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Conteúdo rolável com formulário da carta e variantes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Bloco Superior: Imagem + Metadados Centrais */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 shadow-sm">
          {/* Card Image Preview */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-36 h-50 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 relative flex items-center justify-center shadow-md group">
              {imageUrl && !imageError ? (
                <img
                  src={imageUrl}
                  alt={formData.name || 'Card preview'}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-contain p-1 transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500 p-2 text-center">
                  <ImageIcon className="w-8 h-8 mb-1.5 opacity-40 text-zinc-400" />
                  <span className="text-[11px] font-medium">Sem imagem</span>
                  <span className="text-[9px] text-zinc-600 mt-0.5">URL não informada ou indisponível</span>
                </div>
              )}

              {imageUrl && (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir imagem em nova aba"
                  className="absolute bottom-1 right-1 p-1 bg-black/70 hover:bg-black text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowImageUrls(!showImageUrls)}
              className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {showImageUrls ? 'Ocultar URLs' : 'Editar URLs de imagem'}
            </button>
          </div>

          {/* Campos Principais: ID, Code, Name e URLs opcionais */}
          <div className="flex-1 space-y-2.5">
            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 sm:col-span-2 text-zinc-400 text-xs text-right font-medium">
                ID:
              </label>
              <div className="col-span-9 sm:col-span-10">
                <input
                  type="text"
                  placeholder="ID da carta (ex: base1-4)"
                  value={toText(formData.id)}
                  onChange={(e) => handleFieldChange('id', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 sm:col-span-2 text-zinc-400 text-xs text-right font-medium">
                Code:
              </label>
              <div className="col-span-9 sm:col-span-10">
                <input
                  type="text"
                  placeholder="Código de coleção/carta (ex: BS-004)"
                  value={toText(formData.code)}
                  onChange={(e) => handleFieldChange('code', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-blue-500 font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 items-center">
              <label className="col-span-3 sm:col-span-2 text-zinc-400 text-xs text-right font-medium">
                Name:
              </label>
              <div className="col-span-9 sm:col-span-10">
                <input
                  type="text"
                  placeholder="Nome oficial da carta"
                  value={toText(formData.name)}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-zinc-100 text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Expansor de URLs de imagem */}
            {showImageUrls && (
              <div className="pt-2 border-t border-zinc-800/60 space-y-2 mt-2 bg-zinc-950/60 p-3 rounded-lg">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <label className="col-span-3 sm:col-span-2 text-zinc-400 text-[11px] text-right">
                    Small URL:
                  </label>
                  <div className="col-span-9 sm:col-span-10">
                    <input
                      type="text"
                      placeholder="https://... small image"
                      value={toText(formData.images?.small)}
                      onChange={(e) => handleImageChange('small', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-zinc-300 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 items-center">
                  <label className="col-span-3 sm:col-span-2 text-zinc-400 text-[11px] text-right">
                    Large URL:
                  </label>
                  <div className="col-span-9 sm:col-span-10">
                    <input
                      type="text"
                      placeholder="https://... large/hires image"
                      value={toText(formData.images?.large)}
                      onChange={(e) => handleImageChange('large', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-zinc-300 text-xs focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seção de Variantes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-zinc-200">
                Variantes ({formData.variants?.length || 0})
              </h3>
              <span className="text-[11px] text-zinc-500">
                Edite dados de Set, TCGPlayer ID e cotação de mercado
              </span>
            </div>
          </div>

          {/* Lista de variantes */}
          {(!formData.variants || formData.variants.length === 0) ? (
            <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 text-zinc-500 text-xs">
              <p>Nenhuma variante cadastrada para esta carta.</p>
            </div>
          ) : (
            formData.variants.map((variant, index) => (
              <VariantEditor
                key={`variant-${index}`}
                variant={variant}
                index={index + 1}
                total={formData.variants!.length}
                onChange={(updated) => handleVariantChange(index, updated)}
                onRemove={() => handleRemoveVariant(index)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
