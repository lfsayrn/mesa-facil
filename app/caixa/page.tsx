"use client";

import { useEffect, useState } from "react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  details?: string[];
  observation?: string;
}

interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  status: string;
  createdAt: string;
}

const STATUS_PT: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-red-100 text-red-700" },
  preparing: { label: "Preparando", color: "bg-amber-100 text-amber-700" },
  ready: { label: "Pronto", color: "bg-sky-100 text-sky-700" },
  delivered: { label: "Entregue", color: "bg-teal-100 text-teal-700" },
  paid: { label: "Pago", color: "bg-emerald-100 text-emerald-700" },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-200 rounded ${className}`} />;
}

export default function Caixa() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [splitItems, setSplitItems] = useState<string[]>([]);
  const [splitCount, setSplitCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    if (res.ok) {
      const data = await res.json();
      const sorted = data.sort((a: Order, b: Order) => {
        if (a.status === "paid" && b.status !== "paid") return 1;
        if (a.status !== "paid" && b.status === "paid") return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setOrders(sorted);
      if (selected) {
        const up = sorted.find((o: Order) => o.id === selected.id);
        if (up) setSelected(up);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const i = setInterval(fetchOrders, 5000);
    return () => clearInterval(i);
  }, []);

  const toggleItem = (id: string) =>
    setSplitItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const selectAll = () => selected && setSplitItems(selected.items.map((i) => i.id));
  const clearAll = () => setSplitItems([]);

  const markPaid = async (id: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    fetchOrders();
  };

  const getStatus = (s: string) => {
    const st = STATUS_PT[s] || { label: s, color: "bg-stone-100 text-stone-600" };
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${st.color}`}>{st.label}</span>;
  };

  const orderTotal = selected ? selected.items.reduce((a, i) => a + i.price, 0) : 0;
  const selectedTotal = selected
    ? selected.items.filter((i) => splitItems.includes(i.id)).reduce((a, i) => a + i.price, 0)
    : 0;
  const perPerson = selectedTotal / splitCount;

  // Stats
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const paidToday = todayOrders.filter((o) => o.status === "paid");
  const pendingToday = todayOrders.filter((o) => o.status !== "paid");
  const revenueToday = paidToday.reduce((a, o) => a + o.items.reduce((b, i) => b + i.price, 0), 0);
  const pendingRevenue = pendingToday.reduce((a, o) => a + o.items.reduce((b, i) => b + i.price, 0), 0);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-amber-50/30 font-sans">
      {/* List */}
      <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-stone-200 bg-white flex flex-col">
        <header className="p-4 border-b border-stone-100 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-xl">💰</div>
              <div>
                <h1 className="font-bold text-stone-700">Caixa</h1>
                <p className="text-[10px] text-stone-400">{orders.length} pedidos</p>
              </div>
            </div>
            <a href="/" className="text-stone-400 hover:text-stone-600 text-sm">
              ← Voltar
            </a>
          </div>

          {/* Today's stats */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
              <p className="text-[10px] text-emerald-600 font-semibold">Recebido Hoje</p>
              <p className="text-lg font-bold text-emerald-700">R$ {revenueToday.toFixed(2)}</p>
              <p className="text-[10px] text-emerald-500">{paidToday.length} pagos</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
              <p className="text-[10px] text-amber-600 font-semibold">A Receber</p>
              <p className="text-lg font-bold text-amber-700">R$ {pendingRevenue.toFixed(2)}</p>
              <p className="text-[10px] text-amber-500">{pendingToday.length} pendentes</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto max-h-[25vh] md:max-h-none">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 border border-stone-100 rounded-lg">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-3 w-20 mt-2" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center text-stone-400">
              <p className="text-3xl mb-2 opacity-30">📋</p>
              <p className="text-sm">Nenhum pedido</p>
            </div>
          ) : (
            orders.map((o, i) => (
              <button
                key={o.id}
                onClick={() => {
                  setSelected(o);
                  setSplitItems([]);
                  setSplitCount(1);
                }}
                className={`w-full p-3 border-b border-stone-100 text-left hover:bg-stone-50 flex justify-between items-center transition-colors animate-slide-up
                  ${selected?.id === o.id ? "bg-amber-50 border-l-3 border-l-amber-500" : ""} ${
                  o.status === "paid" ? "opacity-60" : ""
                }`}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <div>
                  <p className="font-semibold text-stone-700">{o.customer}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-stone-400">
                      {new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <span className="text-[10px] text-stone-300">•</span>
                    <p className="text-[10px] text-stone-400">{o.items.length} itens</p>
                  </div>
                </div>
                <div className="text-right">
                  {getStatus(o.status)}
                  <p className="font-bold text-stone-600 mt-1">
                    R$ {o.items.reduce((a, i) => a + i.price, 0).toFixed(2)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <header className="p-4 bg-white border-b border-stone-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-stone-700">{selected.customer}</h2>
                  {getStatus(selected.status)}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                  <span>📅 {new Date(selected.createdAt).toLocaleDateString()}</span>
                  <span>
                    🕐 {new Date(selected.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span>🍽️ {selected.items.length} itens</span>
                </div>
              </div>
              <div className="flex gap-2">
                {selected.status !== "paid" && (
                  <button
                    onClick={() => markPaid(selected.id)}
                    className="px-5 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-lg hover:bg-teal-700 shadow-sm"
                  >
                    ✓ Receber Pagamento
                  </button>
                )}
              </div>
            </header>

            <div className="flex-1 p-4 flex flex-col lg:flex-row gap-4 overflow-auto">
              {/* Items */}
              <div className="flex-1 bg-white rounded-xl border border-stone-200 flex flex-col overflow-hidden shadow-sm">
                <div className="p-3 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-stone-500 uppercase">Itens do Pedido</span>
                    <span className="text-xs text-stone-400 ml-2">({selected.items.length})</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={selectAll} className="text-xs font-medium text-amber-600 hover:underline">
                      Selecionar Todos
                    </button>
                    <button onClick={clearAll} className="text-xs font-medium text-stone-400 hover:underline">
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {selected.items.map((item, i) => (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all animate-slide-up
                        ${
                          splitItems.includes(item.id)
                            ? "border-amber-400 bg-amber-50 shadow-sm"
                            : "border-stone-100 hover:border-stone-200 hover:bg-stone-50"
                        }`}
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs font-bold transition-all
                          ${
                            splitItems.includes(item.id)
                              ? "bg-amber-500 border-amber-500 text-white"
                              : "border-stone-300 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                        <div>
                          <p className="font-medium text-stone-700">{item.name}</p>
                          {item.details && item.details.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-0.5">
                              {item.details.map((d, j) => (
                                <span key={j} className="text-[9px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.observation && (
                            <p className="text-[10px] text-amber-600 mt-0.5 italic">💬 {item.observation}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-stone-600">R$ {item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom summary bar */}
                <div className="p-4 border-t border-stone-100 bg-stone-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-stone-400">Total do pedido</span>
                      <p className="text-xl font-bold text-stone-700">R$ {orderTotal.toFixed(2)}</p>
                    </div>
                    {splitItems.length > 0 && (
                      <div className="text-right bg-amber-100 px-4 py-2 rounded-lg border border-amber-200">
                        <span className="text-[10px] text-amber-600 font-semibold">
                          {splitItems.length} selecionados
                        </span>
                        <p className="text-xl font-bold text-amber-700">R$ {selectedTotal.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculator */}
              <div className="w-full lg:w-72 bg-white rounded-xl border border-stone-200 flex flex-col shadow-sm">
                <div className="p-4 border-b border-stone-100 bg-stone-50 rounded-t-xl">
                  <span className="text-xs font-semibold text-stone-500 uppercase">Dividir Conta</span>
                </div>
                <div className="p-4 flex-1">
                  <div className="mb-5">
                    <p className="text-xs text-stone-400 mb-1">Valor selecionado</p>
                    <p className="text-3xl font-bold text-amber-700">R$ {selectedTotal.toFixed(2)}</p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      {splitItems.length} de {selected.items.length} itens
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 mb-3">Dividir entre:</p>
                    <div className="flex items-center gap-3 justify-center">
                      <button
                        onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                        className="w-12 h-12 border border-stone-200 rounded-lg text-xl font-bold text-stone-500 hover:bg-stone-50 active:bg-stone-100"
                      >
                        −
                      </button>
                      <span className="text-4xl font-bold w-14 text-center text-stone-700">{splitCount}</span>
                      <button
                        onClick={() => setSplitCount(splitCount + 1)}
                        className="w-12 h-12 bg-stone-700 text-white rounded-lg text-xl font-bold hover:bg-stone-800"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-center text-xs text-stone-400 mt-2">pessoas</p>
                  </div>
                </div>
                <div className="p-4 bg-teal-600 text-white rounded-b-xl">
                  <p className="text-[10px] text-teal-200 uppercase font-semibold mb-1">Cada pessoa paga</p>
                  <p className="text-4xl font-bold">R$ {perPerson.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-stone-400">
            <div className="text-center">
              <p className="text-5xl mb-3 opacity-20">👆</p>
              <p className="font-medium">Selecione um pedido</p>
              <p className="text-sm text-stone-300 mt-1">na lista ao lado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
