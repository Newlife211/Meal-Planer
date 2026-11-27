'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Search, Apple, Pencil, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/lib/i18n/language-provider';
import { METRIC_UNIT_KEYS, IMPERIAL_UNIT_KEYS } from '@/lib/i18n/translations';

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string | null;
}

export function PantryClient() {
  const { t, locale } = useLanguage();
  const unitLabel = (u: string) => (t.units as Record<string, string>)[u] ?? u;
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const UNIT_OPTIONS = unitSystem === 'imperial' ? IMPERIAL_UNIT_KEYS : METRIC_UNIT_KEYS;
  const defaultUnit = String(UNIT_OPTIONS[0]);
  const [form, setForm] = useState({ name: '', quantity: '', unit: 'g', expiryDate: '' });

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/pantry');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    (async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        const us = data?.unitSystem === 'imperial' ? 'imperial' : 'metric';
        setUnitSystem(us);
        setForm((p: any) => ({ ...p, unit: us === 'imperial' ? String(IMPERIAL_UNIT_KEYS[0]) : String(METRIC_UNIT_KEYS[0]) }));
      } catch (e: any) {
        console.error(e);
      }
    })();
  }, [fetchItems]);

  const addItem = async () => {
    if (!form.name || !form.quantity) return;
    try {
      const res = await fetch('/api/pantry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: '', quantity: '', unit: defaultUnit, expiryDate: '' });
        setShowAdd(false);
        fetchItems();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const updateItem = async () => {
    if (!editId || !form.name || !form.quantity) return;
    try {
      await fetch('/api/pantry', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, ...form }),
      });
      setEditId(null);
      setForm({ name: '', quantity: '', unit: defaultUnit, expiryDate: '' });
      fetchItems();
    } catch (e: any) {
      console.error(e);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await fetch(`/api/pantry?id=${id}`, { method: 'DELETE' });
      fetchItems();
    } catch (e: any) {
      console.error(e);
    }
  };

  const startEdit = (item: PantryItem) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : '',
    });
    setShowAdd(false);
  };

  const filtered = (items ?? []).filter((i: PantryItem) =>
    (i?.name ?? '').toLowerCase().includes((search ?? '').toLowerCase())
  );

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
          <h1 className="text-2xl font-bold tracking-tight">{t.pantry.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.pantry.subtitle}</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: '', quantity: '', unit: defaultUnit, expiryDate: '' }); }}>
          <Plus className="h-4 w-4 mr-1" /> {t.pantry.add}
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.pantry.searchPlaceholder}
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Add/Edit form */}
      {(showAdd || editId) && (
        <div className="bg-card rounded-xl p-5 mb-4" style={{ boxShadow: 'var(--shadow-md)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{editId ? t.pantry.edit : t.pantry.newItem}</h3>
            <button onClick={() => { setShowAdd(false); setEditId(null); }} className="p-1 rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>{t.pantry.name}</Label>
              <Input placeholder={t.pantry.namePlaceholder} value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.pantry.quantity}</Label>
              <Input type="number" placeholder="500" value={form.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, quantity: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t.pantry.unit}</Label>
              <select
                value={form.unit}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((p: any) => ({ ...p, unit: e.target.value }))}
                className="w-full h-10 rounded-lg border bg-background px-3 text-sm"
              >
                {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{t.units[u]}</option>)}
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>{t.pantry.expiry}</Label>
              <Input type="date" value={form.expiryDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p: any) => ({ ...p, expiryDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={editId ? updateItem : addItem}>
              <Check className="h-4 w-4 mr-1" /> {editId ? t.pantry.save : t.pantry.addBtn}
            </Button>
          </div>
        </div>
      )}

      {/* Items list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Apple className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t.pantry.emptyTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.pantry.emptyDesc}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item: PantryItem) => (
            <div key={item.id} className="bg-card rounded-xl px-5 py-4 flex items-center justify-between group" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div>
                <p className="font-medium">{item?.name ?? ''}</p>
                <p className="text-sm text-muted-foreground">
                  {item?.quantity ?? 0} {unitLabel(item?.unit ?? '')}
                  {item?.expiryDate && (
                    <span className="ml-2">• {t.pantry.until} {new Date(item.expiryDate).toLocaleDateString(locale, { timeZone: 'UTC' })}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(item)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </button>
                <button onClick={() => deleteItem(item.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
