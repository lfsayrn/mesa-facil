"use client";

import { useEffect, useState } from "react";

interface OrderItem {
  name: string;
  price: number;
  details?: string[];
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

export default function Historico() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d);
        setLoading(false);
      });
  }, []);

  const filtered = orders.filter((o) => {
    const d = new Date(o.createdAt).toISOString().split("T")[0];
    return d === dateFilter && (statusFilter === "all" || o.status === statusFilter);
  });

  const totals = {
    count: filtered.length,
    revenue: filtered.reduce((a, o) => a + o.items.reduce((b, i) => b + i.price, 0), 0),
    paid: filtered.filter((o) => o.status === "paid").reduce((a, o) => a + o.items.reduce((b, i) => b + i.price, 0), 0),
  };

  const getStatus = (s: string) => {
    const st = STATUS_PT[s] || { label: s, color: "bg-stone-100 text-stone-600" };
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${st.color}`}>{st.label}</span>;
  };

  return (
    <div className="min-h-screen bg-amber-50/30 p-4 font-sans">
      <header className="mb-4 bg-white rounded-xl border border-stone-200 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-sky-100 rounded-xl flex items-center justify-center text-2xl">📜</div>
          <div>
            <h1 className="text-lg font-bold text-stone-700">Histórico de Pedidos</h1>
            <p className="text-xs text-stone-400">Consulte pedidos anteriores</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a
            href="/"
            className="px-4 py-2 text-sm font-medium text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50"
          >
            ← Voltar
          </a>
          <a
            href="/relatorio"
            className="px-4 py-2 text-sm font-medium text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50"
          >
            📊 Relatório
          </a>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-[10px] font-semibold text-stone-400 uppercase block mb-1">Data</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="p-2.5 border border-stone-200 rounded-lg text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-stone-400 uppercase block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2.5 border border-stone-200 rounded-lg text-sm bg-white focus:border-amber-400 focus:outline-none"
            >
              <option value="all">Todos</option>
              <option value="paid">Pagos</option>
              <option value="delivered">Entregues</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>
          <div className="flex-1" />
          <div className="flex gap-4">
            <div className="text-center bg-stone-50 px-4 py-2 rounded-lg">
              <p className="text-xl font-bold text-stone-700">{totals.count}</p>
              <p className="text-[10px] text-stone-400">Pedidos</p>
            </div>
            <div className="text-center bg-teal-50 px-4 py-2 rounded-lg border border-teal-100">
              <p className="text-xl font-bold text-teal-600">R$ {totals.paid.toFixed(2)}</p>
              <p className="text-[10px] text-teal-500">Pago</p>
            </div>
            <div className="text-center bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
              <p className="text-xl font-bold text-amber-600">R$ {totals.revenue.toFixed(2)}</p>
              <p className="text-[10px] text-amber-500">Total</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 border-b border-stone-100">
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            <p className="text-4xl mb-3 opacity-20">📋</p>
            <p className="font-medium">Nenhum pedido encontrado</p>
            <p className="text-sm text-stone-300 mt-1">Tente alterar os filtros</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map((o) => (
              <div key={o.id} className="hover:bg-stone-50 transition-colors">
                <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="w-full p-4 text-left">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-stone-700">{o.customer}</p>
                      <p className="text-[10px] text-stone-400">{new Date(o.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatus(o.status)}
                      <span className="font-bold text-stone-600">
                        R$ {o.items.reduce((a, i) => a + i.price, 0).toFixed(2)}
                      </span>
                      <span className={`text-stone-400 transition-transform ${expanded === o.id ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {o.items.slice(0, 3).map((item, i) => (
                      <span key={i} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md">
                        {item.name}
                      </span>
                    ))}
                    {o.items.length > 3 && (
                      <span className="text-[10px] text-stone-400">+{o.items.length - 3} mais</span>
                    )}
                  </div>
                </button>

                {expanded === o.id && (
                  <div className="px-4 pb-4 animate-slide-up">
                    <div className="bg-stone-50 rounded-lg p-3 border border-stone-100">
                      <p className="text-xs font-semibold text-stone-500 uppercase mb-2">Itens do Pedido</p>
                      <div className="space-y-2">
                        {o.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-stone-700">{item.name}</p>
                              {item.details && item.details.length > 0 && (
                                <p className="text-[10px] text-stone-400">{item.details.join(" • ")}</p>
                              )}
                            </div>
                            <span className="text-sm font-bold text-stone-600">R$ {item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
