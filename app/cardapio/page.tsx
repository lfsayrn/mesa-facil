"use client";

import { useState, useEffect } from "react";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
  sides?: string[];
  extras?: { name: string; price: number }[];
}

const CATEGORIES = [
  { value: "pratos", label: "Pratos", icon: "🍽️" },
  { value: "porcoes", label: "Porções", icon: "🍟" },
  { value: "bebidas", label: "Bebidas", icon: "🥤" },
];

const COMMON_SIDES = ["Arroz", "Feijão", "Macarrão", "Salada", "Farofa", "Purê", "Legumes", "Batata", "Vinagrete"];

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-200 rounded ${className}`} />;
}

export default function Cardapio() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<{
    name: string;
    category: string;
    price: string;
    sides: string[];
    extras: { name: string; price: number }[];
  }>({
    name: "",
    category: "pratos",
    price: "",
    sides: [],
    extras: [],
  });
  const [saving, setSaving] = useState(false);
  const [newSide, setNewSide] = useState("");
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");
  const [search, setSearch] = useState("");

  const fetchItems = async () => {
    const res = await fetch("/api/menu?all=true");
    if (res.ok) {
      setItems(await res.json());
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setForm({
      name: "",
      category: "pratos",
      price: "",
      sides: [...COMMON_SIDES.slice(0, 5)],
      extras: [
        { name: "Batata Frita", price: 12.0 },
        { name: "Ovo Frito", price: 3.0 },
        { name: "Vinagrete", price: 4.0 },
      ],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      sides: item.sides || [],
      extras: item.extras || [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    const payload = {
      ...form,
      price: parseFloat(form.price),
      sides: form.category === "pratos" ? form.sides : undefined,
      extras: form.category === "pratos" ? form.extras : undefined,
    };

    if (editingItem) {
      await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingItem.id, ...payload }),
      });
    } else {
      await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setIsModalOpen(false);
    fetchItems();
    setSaving(false);
  };

  const toggleActive = async (item: MenuItem) => {
    await fetch("/api/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, active: !item.active }),
    });
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;
    await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
    fetchItems();
  };

  const duplicateItem = async (item: MenuItem) => {
    const payload = { ...item, name: `${item.name} (cópia)`, id: undefined };
    await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    fetchItems();
  };

  const addSide = () => {
    if (newSide.trim() && !form.sides.includes(newSide.trim())) {
      setForm({ ...form, sides: [...form.sides, newSide.trim()] });
      setNewSide("");
    }
  };
  const removeSide = (s: string) => setForm({ ...form, sides: form.sides.filter((x) => x !== s) });
  const addExtra = () => {
    if (newExtraName.trim() && newExtraPrice) {
      setForm({ ...form, extras: [...form.extras, { name: newExtraName.trim(), price: parseFloat(newExtraPrice) }] });
      setNewExtraName("");
      setNewExtraPrice("");
    }
  };
  const removeExtra = (n: string) => setForm({ ...form, extras: form.extras.filter((x) => x.name !== n) });

  const filteredItems = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const groupedItems = CATEGORIES.map((cat) => ({
    ...cat,
    items: filteredItems.filter((i) => i.category === cat.value),
  }));

  const stats = {
    total: items.length,
    active: items.filter((i) => i.active).length,
    pratos: items.filter((i) => i.category === "pratos").length,
    avgPrice: items.length > 0 ? items.reduce((a, i) => a + i.price, 0) / items.length : 0,
  };

  return (
    <div className="min-h-screen bg-amber-50/30 p-4 font-sans">
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full md:max-w-xl md:rounded-xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-4 border-b bg-amber-700 text-white md:rounded-t-xl flex justify-between items-center">
              <div>
                <h2 className="font-bold">{editingItem ? "✏️ Editar Item" : "➕ Novo Item"}</h2>
                <p className="text-amber-200 text-xs">Preencha os dados abaixo</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-amber-200 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </header>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-stone-500 uppercase">Nome do Item *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full mt-1 p-3 border border-stone-200 rounded-lg text-sm font-medium focus:border-amber-500 focus:outline-none"
                    placeholder="Ex: PF Frango Grelhado"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase">Categoria *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 p-3 border border-stone-200 rounded-lg text-sm font-medium focus:border-amber-500 focus:outline-none bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full mt-1 p-3 border border-stone-200 rounded-lg text-sm font-medium focus:border-amber-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {form.category === "pratos" && (
                <>
                  <div className="border-t border-stone-100 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase">Acompanhamentos</label>
                        <p className="text-[10px] text-stone-400">Itens inclusos no prato</p>
                      </div>
                      <span className="text-xs text-amber-600 font-medium">{form.sides.length} itens</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {form.sides.map((s) => (
                        <span
                          key={s}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 text-sm font-medium rounded-full"
                        >
                          {s}{" "}
                          <button onClick={() => removeSide(s)} className="text-amber-500 hover:text-red-500 font-bold">
                            ×
                          </button>
                        </span>
                      ))}
                      {form.sides.length === 0 && (
                        <span className="text-xs text-stone-400 italic">Nenhum acompanhamento</span>
                      )}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newSide}
                        onChange={(e) => setNewSide(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSide()}
                        placeholder="Novo acompanhamento"
                        className="flex-1 p-2.5 border border-stone-200 rounded-lg text-sm focus:border-amber-400 focus:outline-none"
                      />
                      <button
                        onClick={addSide}
                        className="px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_SIDES.filter((s) => !form.sides.includes(s)).map((s) => (
                        <button
                          key={s}
                          onClick={() => setForm({ ...form, sides: [...form.sides, s] })}
                          className="px-2.5 py-1 bg-stone-100 text-stone-500 text-xs font-medium rounded-full hover:bg-amber-100 hover:text-amber-700 transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-stone-100 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase">Adicionais Pagos</label>
                        <p className="text-[10px] text-stone-400">Cobrados à parte</p>
                      </div>
                      <span className="text-xs text-teal-600 font-medium">{form.extras.length} opções</span>
                    </div>
                    <div className="space-y-2 mb-3">
                      {form.extras.map((e) => (
                        <div
                          key={e.name}
                          className="flex justify-between items-center p-2.5 bg-teal-50 rounded-lg border border-teal-100"
                        >
                          <span className="font-medium text-stone-700 text-sm">{e.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-teal-600 font-bold text-sm">+R$ {e.price.toFixed(2)}</span>
                            <button
                              onClick={() => removeExtra(e.name)}
                              className="text-stone-400 hover:text-red-500 font-bold text-lg leading-none"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                      {form.extras.length === 0 && (
                        <span className="text-xs text-stone-400 italic">Nenhum adicional</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newExtraName}
                        onChange={(e) => setNewExtraName(e.target.value)}
                        placeholder="Nome do adicional"
                        className="flex-1 p-2.5 border border-stone-200 rounded-lg text-sm focus:border-teal-400 focus:outline-none"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={newExtraPrice}
                        onChange={(e) => setNewExtraPrice(e.target.value)}
                        placeholder="R$"
                        className="w-24 p-2.5 border border-stone-200 rounded-lg text-sm focus:border-teal-400 focus:outline-none"
                      />
                      <button
                        onClick={addExtra}
                        className="px-4 py-2 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <footer className="p-4 border-t bg-stone-50 flex gap-2 md:rounded-b-xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 text-sm font-medium text-stone-500 border border-stone-300 rounded-lg hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !form.name || !form.price}
                className="flex-[2] py-3 text-sm font-bold bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Salvando..." : editingItem ? "✓ Salvar Alterações" : "✓ Criar Item"}
              </button>
            </footer>
          </div>
        </div>
      )}

      <header className="mb-4 bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">📋</div>
            <div>
              <h1 className="text-xl font-bold text-stone-700">Gestão do Cardápio</h1>
              <p className="text-xs text-stone-400">
                {stats.active} ativos de {stats.total} itens
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <a
              href="/"
              className="px-4 py-2 text-sm font-medium text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50"
            >
              ← Voltar
            </a>
            <button
              onClick={openAddModal}
              className="flex-1 md:flex-none px-5 py-2 text-sm font-bold bg-amber-700 text-white rounded-lg hover:bg-amber-800 shadow-sm"
            >
              + Novo Item
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center p-2 bg-stone-50 rounded-lg">
            <p className="text-lg font-bold text-stone-700">{stats.total}</p>
            <p className="text-[10px] text-stone-400">Total</p>
          </div>
          <div className="text-center p-2 bg-teal-50 rounded-lg">
            <p className="text-lg font-bold text-teal-700">{stats.active}</p>
            <p className="text-[10px] text-teal-500">Ativos</p>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <p className="text-lg font-bold text-amber-700">{stats.pratos}</p>
            <p className="text-[10px] text-amber-500">Pratos</p>
          </div>
          <div className="text-center p-2 bg-violet-50 rounded-lg">
            <p className="text-lg font-bold text-violet-700">R${stats.avgPrice.toFixed(0)}</p>
            <p className="text-[10px] text-violet-500">Média</p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar item..."
            className="w-full p-3 border border-stone-200 rounded-lg text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-4">
              <Skeleton className="h-5 w-24 mb-3" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between py-3 border-b border-stone-100">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedItems.map((cat) => (
            <div key={cat.value} className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-gradient-to-r from-stone-50 to-transparent border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.icon}</span>
                  <h2 className="font-bold text-stone-700">{cat.label}</h2>
                  <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full ml-1">
                    {cat.items.length}
                  </span>
                </div>
              </div>

              {cat.items.length === 0 ? (
                <p className="p-6 text-center text-stone-400 text-sm">Nenhum item nesta categoria</p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 flex items-center justify-between hover:bg-stone-50 transition-colors ${
                        !item.active ? "opacity-50 bg-stone-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleActive(item)}
                          className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                            item.active ? "bg-teal-500" : "bg-stone-300"
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                              item.active ? "left-7" : "left-1"
                            }`}
                          />
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-stone-700">{item.name}</p>
                            {!item.active && (
                              <span className="text-[10px] text-stone-400 bg-stone-200 px-1.5 py-0.5 rounded">
                                Desativado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-amber-700 font-bold">R$ {item.price.toFixed(2)}</span>
                            {item.sides && item.sides.length > 0 && (
                              <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                                {item.sides.length} acomp.
                              </span>
                            )}
                            {item.extras && item.extras.length > 0 && (
                              <span className="text-[10px] text-teal-500 bg-teal-50 px-2 py-0.5 rounded-full">
                                {item.extras.length} extras
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => duplicateItem(item)}
                          className="p-2 text-stone-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Duplicar"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
