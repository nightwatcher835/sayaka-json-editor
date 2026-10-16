import React from 'react';
import { CardVariant } from '../types/card';
import { getJustNameKey, toNumber, toText } from '../utils/cardUtils';
import { AlertCircle, AlertTriangle, DollarSign, Tag, Layers, Copy } from 'lucide-react';

interface VariantEditorProps {
  variant: CardVariant;
  index: number;
  total: number;
  isDuplicateTcg?: boolean;
  onChange: (updated: CardVariant) => void;
}

export const VariantEditor: React.FC<VariantEditorProps> = ({
  variant,
  index,
  isDuplicateTcg = false,
  onChange,
}) => {
  const justnameKey = getJustNameKey(variant);
  const set = variant.set || {};
  const isTcgEmpty = !variant.tcgplayerId || String(variant.tcgplayerId).trim() === '';

  const handleSetChange = (field: 'groupId' | 'set_code' | 'name', value: string) => {
    const updatedSet = { ...set };
    if (field === 'groupId') {
      updatedSet.groupId = value.trim() ? toNumber(value, true) : null;
    } else {
      updatedSet[field] = value;
    }
    onChange({
      ...variant,
      set: updatedSet,
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    onChange({
      ...variant,
      [field]: value,
    });
  };

  return (
    <div
      className={`rounded-lg border transition-all text-xs p-3.5 mb-2.5 ${
        isDuplicateTcg
          ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60 shadow-sm'
          : isTcgEmpty
          ? 'bg-zinc-900/90 border-amber-500/30 hover:border-amber-500/50 shadow-sm'
          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Header da Variante */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-zinc-800/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-zinc-800 text-zinc-300">
            {index}
          </span>
          <span className="font-semibold text-zinc-200">
            Variante {index}
          </span>
          {set.name && (
            <span className="text-zinc-400 text-[11px] font-normal truncate max-w-[200px]">
              • {set.name}
            </span>
          )}

          {/* Tag de Duplicado (Prioridade máxima de atenção) */}
          {isDuplicateTcg && (
            <span
              title="Este TCGPlayer ID aparece mais de uma vez na coleção"
              className="flex items-center gap-1 text-rose-300 text-[11px] bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/40 font-medium"
            >
              <Copy className="w-3 h-3 text-rose-400" />
              TCGPlayer ID repetido
            </span>
          )}

          {/* Tag de Vazio */}
          {isTcgEmpty && !isDuplicateTcg && (
            <span className="flex items-center gap-1 text-amber-400 text-[11px] bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 font-medium">
              <AlertCircle className="w-3 h-3" />
              TCGPlayer ID pendente
            </span>
          )}
        </div>
      </div>

      {/* Grid de Formulário exatamente como no PyQt */}
      <div className="space-y-2.5">
        {/* Linha 1: Set (groupId, set_code, name) */}
        <div className="grid grid-cols-12 gap-2 items-center">
          <label className="col-span-12 sm:col-span-2 text-zinc-400 text-[11px] flex items-center gap-1 font-medium sm:justify-end">
            <Layers className="w-3 h-3 text-zinc-500" />
            Set:
          </label>
          <div className="col-span-12 sm:col-span-10 grid grid-cols-12 gap-2">
            <div className="col-span-3 sm:col-span-3">
              <input
                type="text"
                placeholder="Group ID (ex: 101)"
                value={toText(set.groupId)}
                onChange={(e) => handleSetChange('groupId', e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div className="col-span-4 sm:col-span-3">
              <input
                type="text"
                placeholder="Set Code (ex: BS1)"
                value={toText(set.set_code)}
                onChange={(e) => handleSetChange('set_code', e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 font-mono font-medium"
              />
            </div>
            <div className="col-span-5 sm:col-span-6">
              <input
                type="text"
                placeholder="Nome do Set (ex: Base Set)"
                value={toText(set.name)}
                onChange={(e) => handleSetChange('name', e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Linha 2: Variant (tcgplayerId, justname, printing) */}
        <div className="grid grid-cols-12 gap-2 items-center">
          <label className="col-span-12 sm:col-span-2 text-zinc-400 text-[11px] flex items-center gap-1 font-medium sm:justify-end">
            <Tag className="w-3 h-3 text-zinc-500" />
            Variant:
          </label>
          <div className="col-span-12 sm:col-span-10 grid grid-cols-12 gap-2">
            <div className="col-span-4 sm:col-span-3 relative">
              <input
                type="text"
                placeholder="TCGPlayer ID"
                value={toText(variant.tcgplayerId)}
                onChange={(e) => handleFieldChange('tcgplayerId', e.target.value.trim() || null)}
                className={`w-full bg-zinc-950/80 border rounded px-2 py-1 text-xs placeholder:text-zinc-600 focus:outline-none font-mono ${
                  isDuplicateTcg
                    ? 'border-rose-500/70 text-rose-300 bg-rose-950/30 focus:border-rose-400 font-semibold'
                    : isTcgEmpty
                    ? 'border-amber-500/60 text-amber-300 focus:border-amber-400'
                    : 'border-zinc-800 text-zinc-200 focus:border-blue-500'
                }`}
              />
            </div>
            <div className="col-span-5 sm:col-span-6">
              <input
                type="text"
                placeholder={`Título variante (${justnameKey})`}
                value={toText(variant[justnameKey])}
                onChange={(e) => handleFieldChange(justnameKey, e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-3 sm:col-span-3">
              <input
                type="text"
                placeholder="Printing (ex: Holo)"
                value={toText(variant.printing)}
                onChange={(e) => handleFieldChange('printing', e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Linha 3: Preço (marketPrice, price) */}
        <div className="grid grid-cols-12 gap-2 items-center">
          <label className="col-span-12 sm:col-span-2 text-zinc-400 text-[11px] flex items-center gap-1 font-medium sm:justify-end">
            <DollarSign className="w-3 h-3 text-zinc-500" />
            Preço:
          </label>
          <div className="col-span-12 sm:col-span-10 grid grid-cols-12 gap-2">
            <div className="col-span-6 sm:col-span-6 flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Market:</span>
              <input
                type="text"
                placeholder="Market Price (ex: 120.50)"
                value={toText(variant.marketPrice)}
                onChange={(e) =>
                  handleFieldChange('marketPrice', e.target.value.trim() ? toNumber(e.target.value) : null)
                }
                className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-emerald-400 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div className="col-span-6 sm:col-span-6 flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Price:</span>
              <input
                type="text"
                placeholder="Price (ex: 135.00)"
                value={toText(variant.price)}
                onChange={(e) =>
                  handleFieldChange('price', e.target.value.trim() ? toNumber(e.target.value) : null)
                }
                className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-emerald-300 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 font-mono font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
