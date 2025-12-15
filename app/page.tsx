"use client";

import { useState, useEffect } from "react";

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  sides?: string[];
  extras?: { name: string; price: number }[];
}

interface CartItem {
  name: string;
  price: number;
  details: string[];
  observation?: string;
  isMarmitex?: boolean;
  quantity: number;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-200 rounded ${className}`} />;
}

export default function Home() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [activeCategory, setActiveCategory] = useState("pratos");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedSides, setSelectedSides] = useState<string[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [observation, setObservation] = useState("");
  const [isMarmitex, setIsMarmitex] = useState(false);

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((d) => {
        setMenu(d);
        setLoading(false);
      });
  }, []);

  const openCustomize = (item: MenuItem) => {
    if (item.category === "pratos" && item.sides) {
      setSelectedItem(item);
      setSelectedSides([...item.sides]);
      setSelectedExtras([]);
      setObservation("");
      setIsMarmitex(false);
      setIsModalOpen(true);
    } else {
      // Item básico (sem acompanhamentos) - incrementar quantidade se já existir
      const existingIndex = cart.findIndex((c) => c.name === item.name && c.details.length === 0 && !c.observation);
      if (existingIndex >= 0) {
        const updated = [...cart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        setCart(updated);
      } else {
        setCart([...cart, { name: item.name, price: item.price, details: [], quantity: 1 }]);
      }
    }
  };

  const confirmCustomization = () => {
    if (!selectedItem) return;
    const extras = selectedItem.extras || [];
    const finalPrice =
      selectedItem.price + selectedExtras.reduce((acc, en) => acc + (extras.find((e) => e.name === en)?.price || 0), 0);
    const details: string[] = [];
    const itemSides = selectedItem.sides || [];

    if (isMarmitex) details.push("📦 MARMITEX");
    if (selectedSides.length === itemSides.length) details.push("Completa");
    else if (selectedSides.length === 0) details.push("Sem acompanhamentos");
    else {
      const removed = itemSides.filter((s) => !selectedSides.includes(s));
      if (removed.length > 0) details.push("S/ " + removed.join(", "));
    }
    if (selectedExtras.length > 0) details.push(...selectedExtras.map((e) => `+ ${e}`));

    setCart([
      ...cart,
      {
        name: selectedItem.name,
        price: finalPrice,
        details,
        observation: observation.trim() || undefined,
        isMarmitex,
        quantity: 1,
      },
    ]);
    setIsModalOpen(false);
  };

  const toggleSide = (s: string) => setSelectedSides((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const toggleExtra = (e: string) => setSelectedExtras((p) => (p.includes(e) ? p.filter((x) => x !== e) : [...p, e]));
  const removeFromCart = (i: number) => setCart(cart.filter((_, idx) => idx !== i));

  const updateQuantity = (i: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[i].quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((_, idx) => idx !== i));
    } else {
      updated[i] = { ...updated[i], quantity: newQty };
      setCart(updated);
    }
  };

  const categories = ["pratos", "porcoes", "bebidas"];
  const filteredMenu = menu.filter((item) => item.category === activeCategory);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0 || !customer) {
      setMessage("Preencha mesa e itens!");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, items: cart }),
      });
      if (res.ok) {
        setMessage("✓ Pedido enviado!");
        setCart([]);
        setCustomer("");
        setIsCartOpen(false);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch {
      setMessage("Erro de conexão.");
    } finally {
      setSending(false);
    }
  };

  const getCatIcon = (c: string) => (c === "pratos" ? "🍽️" : c === "bebidas" ? "🥤" : "🍟");
  const getCatLabel = (c: string) => (c === "pratos" ? "Pratos" : c === "bebidas" ? "Bebidas" : "Porções");

  return (
    <div className="flex flex-col md:flex-row h-screen bg-amber-50/30 overflow-hidden font-sans">
      {/* MODAL */}
      {isModalOpen && selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full md:max-w-md md:rounded-xl shadow-2xl flex flex-col max-h-[85vh] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-4 border-b bg-amber-700 text-white md:rounded-t-xl">
              <h2 className="text-lg font-bold">{selectedItem.name}</h2>
              <p className="text-amber-200 text-sm">Personalize seu prato</p>
            </header>

            <div className="overflow-y-auto p-4 space-y-5 flex-1">
              {selectedItem.sides && selectedItem.sides.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Acompanhamentos</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.sides.map((side) => (
                      <button
                        key={side}
                        onClick={() => toggleSide(side)}
                        className={`p-3 text-left text-sm font-medium border rounded-lg transition-all ${
                          selectedSides.includes(side)
                            ? "bg-amber-700 text-white border-amber-700"
                            : "bg-white text-stone-600 border-stone-200 hover:border-amber-400"
                        }`}
                      >
                        {selectedSides.includes(side) ? "✓ " : ""}
                        {side}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.extras && selectedItem.extras.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Adicionais</h3>
                  <div className="space-y-2">
                    {selectedItem.extras.map((extra) => (
                      <button
                        key={extra.name}
                        onClick={() => toggleExtra(extra.name)}
                        className={`w-full p-3 flex justify-between text-sm font-medium border rounded-lg transition-all ${
                          selectedExtras.includes(extra.name)
                            ? "bg-teal-600 text-white border-teal-600"
                            : "bg-white text-stone-600 border-stone-200 hover:border-teal-400"
                        }`}
                      >
                        <span>
                          {selectedExtras.includes(extra.name) ? "✓ " : ""}
                          {extra.name}
                        </span>
                        <span>+R$ {extra.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Tipo de Pedido</h3>
                <button
                  onClick={() => setIsMarmitex(!isMarmitex)}
                  className={`w-full p-3 flex items-center justify-between text-sm font-medium border rounded-lg transition-all ${
                    isMarmitex
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-white text-stone-600 border-stone-200 hover:border-orange-400"
                  }`}
                >
                  <span className="flex items-center gap-2">📦 Marmitex</span>
                  <span>{isMarmitex ? "✓ Sim" : "Mesa"}</span>
                </button>
              </div>

              <div>
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Observação</h3>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex: sem cebola, bem passado..."
                  className="w-full p-3 border border-stone-200 rounded-lg text-sm resize-none h-16 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <footer className="p-4 border-t bg-stone-50 md:rounded-b-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-stone-500 text-sm">Total:</span>
                <span className="text-xl font-bold text-stone-800">
                  R${" "}
                  {(
                    selectedItem.price +
                    selectedExtras.reduce(
                      (a, en) => a + ((selectedItem.extras || []).find((e) => e.name === en)?.price || 0),
                      0
                    )
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-sm font-medium text-stone-500 border border-stone-300 rounded-lg hover:bg-stone-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmCustomization}
                  className="flex-2 py-3 text-sm font-bold bg-amber-700 text-white rounded-lg hover:bg-amber-800"
                >
                  Adicionar
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* MENU */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="p-4 bg-white border-b border-stone-200 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-stone-800">Novo Pedido</h1>
              <p className="text-stone-400 text-xs">Selecione os itens</p>
            </div>
            <div className="flex gap-1.5">
              {[
                { h: "/cardapio", i: "📋", t: "Cardápio" },
                { h: "/kitchen", i: "🍳", t: "Cozinha" },
                { h: "/caixa", i: "💰", t: "Caixa" },
                { h: "/relatorio", i: "📊", t: "Relatório" },
              ].map((l) => (
                <a
                  key={l.h}
                  href={l.h}
                  className="w-9 h-9 flex items-center justify-center text-sm border border-stone-200 rounded-lg hover:bg-stone-50 hover:border-stone-300"
                  title={l.t}
                >
                  {l.i}
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-all ${
                  activeCategory === cat
                    ? "bg-amber-700 text-white"
                    : "bg-white text-stone-500 border border-stone-200 hover:border-stone-300"
                }`}
              >
                {getCatIcon(cat)} {getCatLabel(cat)}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-lg border border-stone-200 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-11 h-11 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="w-9 h-9 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {filteredMenu.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => openCustomize(item)}
                  className="bg-white p-4 rounded-lg border border-stone-200 flex justify-between items-center hover:border-amber-300 hover:shadow-sm active:bg-stone-50 transition-all text-left animate-slide-up"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-amber-50 rounded-lg flex items-center justify-center text-xl">
                      {getCatIcon(item.category)}
                    </div>
                    <div>
                      <span className="block font-medium text-stone-700">{item.name}</span>
                      {item.category === "pratos" && item.sides && (
                        <span className="text-xs text-stone-400">{item.sides.length} acompanhamentos</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-700">R$ {item.price.toFixed(2)}</span>
                    <div className="w-9 h-9 bg-amber-700 text-white rounded-lg flex items-center justify-center text-lg font-bold hover:bg-amber-800">
                      +
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile cart bar */}
        {!isCartOpen && cart.length > 0 && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-stone-200">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-amber-700 text-white p-3 rounded-lg flex justify-between items-center active:bg-amber-800"
            >
              <span className="flex items-center gap-2 font-medium">
                <span className="bg-white text-amber-700 w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold">
                  {cart.length}
                </span>
                Ver Carrinho
              </span>
              <span className="font-bold">R$ {cartTotal.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>

      {/* CART */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:static md:bg-transparent md:w-80 md:border-l md:border-stone-200 ${
          isCartOpen ? "opacity-100 visible" : "opacity-0 invisible md:opacity-100 md:visible"
        }`}
      >
        <div
          className={`absolute bottom-0 left-0 right-0 top-12 bg-white flex flex-col transition-transform md:static md:h-full ${
            isCartOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
          }`}
        >
          <div className="md:hidden py-2 flex justify-center" onClick={() => setIsCartOpen(false)}>
            <div className="w-10 h-1 bg-stone-300 rounded-full" />
          </div>

          <div className="p-4 border-b border-stone-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-stone-700">Resumo do Pedido</h2>
              <p className="text-xs text-stone-400">
                {cart.length} {cart.length === 1 ? "item" : "itens"}
              </p>
            </div>
            <button onClick={() => setIsCartOpen(false)} className="md:hidden text-stone-400 p-1 hover:text-stone-600">
              ✕
            </button>
          </div>

          <div className="p-4 border-b border-stone-100 bg-amber-50/50">
            <label className="text-xs font-bold text-stone-500 uppercase">Mesa / Cliente</label>
            <input
              type="text"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full mt-1 p-3 border border-stone-200 rounded-lg text-lg font-bold bg-white focus:border-amber-500 focus:outline-none"
              placeholder="Mesa 10..."
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center text-stone-400 mt-8">
                <p className="text-3xl mb-2 opacity-30">🛒</p>
                <p className="text-sm">Carrinho vazio</p>
              </div>
            ) : (
              cart.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start p-3 bg-stone-50 rounded-lg border border-stone-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.quantity > 1 && (
                        <span className="bg-amber-700 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                          {item.quantity}x
                        </span>
                      )}
                      <p className="font-medium text-stone-700 text-sm truncate">{item.name}</p>
                    </div>
                    {item.details.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.details.map((d, j) => (
                          <span
                            key={j}
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${
                              d.includes("MARMITEX")
                                ? "text-orange-700 bg-orange-50 border-orange-200 font-bold"
                                : "text-stone-500 bg-white border-stone-200"
                            }`}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.observation && (
                      <p className="text-[10px] text-amber-600 mt-1 italic">💬 {item.observation}</p>
                    )}
                    <p className="text-sm font-bold text-amber-700 mt-1">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {/* Controles de quantidade para itens básicos */}
                    {item.details.length === 0 && !item.observation && (
                      <>
                        <button
                          onClick={() => updateQuantity(i, -1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-500 border border-stone-200 rounded hover:bg-stone-100 active:bg-stone-200"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(i, 1)}
                          className="w-7 h-7 flex items-center justify-center text-stone-500 border border-stone-200 rounded hover:bg-stone-100 active:bg-stone-200"
                        >
                          +
                        </button>
                      </>
                    )}
                    {/* Botão de remover - sempre visível */}
                    <button
                      onClick={() => removeFromCart(i)}
                      className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-stone-200 bg-white pb-safe">
            <div className="flex justify-between items-center mb-4">
              <span className="text-stone-500">Total</span>
              <span className="text-2xl font-bold text-stone-800">R$ {cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={sending || cart.length === 0}
              className={`w-full py-4 font-bold rounded-lg transition-all ${
                sending || cart.length === 0
                  ? "bg-stone-200 text-stone-400"
                  : "bg-teal-600 text-white hover:bg-teal-700"
              }`}
            >
              {sending ? "Enviando..." : "✓ Confirmar Pedido"}
            </button>
            {message && (
              <p
                className={`mt-3 text-center text-sm font-medium ${
                  message.includes("Erro") ? "text-red-600" : "text-teal-600"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
