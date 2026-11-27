'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Printer, Copy, CheckSquare, Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/language-provider';

interface ShoppingItem {
  name: string;
  amount: string;
  checked: boolean;
}

export function ShoppingListClient() {
  const { t, tf } = useLanguage();
  const catLabel = (key: string) =>
    (t.categories as Record<string, string>)[key] ?? key;
  const [categories, setCategories] = useState<Record<string, ShoppingItem[]>>({});
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping-list');
      const data = await res.json();
      setCategories(data?.categories ?? {});
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const toggleItem = (category: string, idx: number) => {
    setCategories((prev: Record<string, ShoppingItem[]>) => {
      const newCats = { ...(prev ?? {}) };
      const items = [...(newCats[category] ?? [])];
      if (items[idx]) {
        items[idx] = { ...items[idx], checked: !items[idx].checked };
      }
      newCats[category] = items;
      return newCats;
    });
  };

  const addCheckedToPantry = async () => {
    const checked: Array<{ name: string; amount: string }> = [];
    for (const cat of Object.values(categories ?? {})) {
      for (const item of (cat ?? [])) {
        if (item?.checked) {
          checked.push({ name: item.name, amount: item.amount });
        }
      }
    }
    if (checked.length === 0) {
      toast.info(t.shopping.toastCheck);
      return;
    }
    for (const item of checked) {
      await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.name, quantity: 1, unit: 'pcs' }),
      });
    }
    toast.success(tf(t.shopping.toastAdded, { n: checked.length }));
  };

  const copyList = () => {
    const lines: string[] = [];
    for (const [cat, items] of Object.entries(categories ?? {})) {
      lines.push(`\n${catLabel(cat)}:`);
      for (const item of (items ?? [])) {
        lines.push(`  ${item?.checked ? '✓' : '○'} ${item?.name ?? ''} — ${item?.amount ?? ''}`);
      }
    }
    navigator?.clipboard?.writeText?.(lines.join('\n'))?.then?.(() => {
      toast.success(t.shopping.toastCopied);
    });
  };

  const printList = () => {
    window?.print?.();
  };

  const allEntries = Object.entries(categories ?? {});
  const isEmpty = allEntries.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.shopping.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t.shopping.subtitle}
          </p>
        </div>
        {!isEmpty && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyList}>
              <Copy className="h-4 w-4 mr-1" /> {t.shopping.copy}
            </Button>
            <Button variant="outline" size="sm" onClick={printList}>
              <Printer className="h-4 w-4 mr-1" /> {t.shopping.print}
            </Button>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t.shopping.emptyTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t.shopping.emptyDesc}
          </p>
        </div>
      ) : (
        <>
          {allEntries.map(([category, items]: [string, ShoppingItem[]]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                {catLabel(category)}
              </h3>
              <div className="space-y-1">
                {(items ?? []).map((item: ShoppingItem, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      item?.checked ? 'bg-muted/50' : 'bg-card hover:bg-card/80'
                    }`}
                    style={{ boxShadow: item?.checked ? 'none' : 'var(--shadow-sm)' }}
                  >
                    <Checkbox
                      checked={item?.checked ?? false}
                      onCheckedChange={() => toggleItem(category, idx)}
                    />
                    <span className={`flex-1 text-sm ${item?.checked ? 'line-through text-muted-foreground' : ''}`}>
                      {item?.name ?? ''}
                    </span>
                    <span className="text-sm text-muted-foreground">{item?.amount ?? ''}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button onClick={addCheckedToPantry} className="mt-4">
            <Plus className="h-4 w-4 mr-1" /> {t.shopping.addToPantry}
          </Button>
        </>
      )}
    </div>
  );
}
