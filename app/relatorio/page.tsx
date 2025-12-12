"use client";

import { useEffect, useState } from "react";

interface OrderItem {
  name: string;
  price: number;
}
interface Order {
  id: string;
  items: OrderItem[];
  status: string;
  createdAt: string;
}

const STATUS_PT: Record<string, string> = {
  pending: "Pendente",
  preparing: "Preparando",
  ready: "Pronto",
  delivered: "Entregue",
  paid: "Pago",
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-200 rounded ${className}`} />;
}

export default function Relatorio() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d);
        setLoading(false);
      });
  }, []);

  const filtered = orders.filter((o) => new Date(o.createdAt).toISOString().split("T")[0] === dateFilter);

  // Main stats
  const total = filtered.length;
  const paid = filtered.filter((o) => o.status === "paid");
  const paidCount = paid.length;
  const revenue = paid.reduce((a, o) => a + o.items.reduce((b, i) => b + i.price, 0), 0);
  const pending = filtered.filter((o) => o.status !== "paid");
  const pendingRevenue = pending.reduce((a, o) => a + o.items.reduce((b, i) => b + i.price, 0), 0);
  const avgTicket = paidCount > 0 ? revenue / paidCount : 0;
  const avgItems = paidCount > 0 ? paid.reduce((a, o) => a + o.items.length, 0) / paidCount : 0;

  // Item stats
  const itemStats: Record<string, { count: number; revenue: number }> = {};
  filtered.forEach((o) =>
    o.items.forEach((i) => {
      if (!itemStats[i.name]) itemStats[i.name] = { count: 0, revenue: 0 };
      itemStats[i.name].count++;
      itemStats[i.name].revenue += i.price;
    })
  );
  const topItems = Object.entries(itemStats)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  const totalItems = Object.values(itemStats).reduce((a, b) => a + b.count, 0);

  // Category stats
  const categories = {
    pratos: topItems
      .filter(([n]) => n.includes("PF") || n.includes("Filé") || n.includes("Contra"))
      .reduce((a, [, d]) => a + d.revenue, 0),
    bebidas: topItems
      .filter(
        ([n]) =>
          n.includes("Coca") ||
          n.includes("Suco") ||
          n.includes("Água") ||
          n.includes("Guaraná") ||
          n.includes("Cerveja")
      )
      .reduce((a, [, d]) => a + d.revenue, 0),
  };

  // Peak hours
  const hourCounts: Record<number, number> = {};
  filtered.forEach((o) => {
    const h = new Date(o.createdAt).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

  // Previous day comparison (simplified)
  const yesterday = new Date(dateFilter);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const yesterdayOrders = orders.filter((o) => new Date(o.createdAt).toISOString().split("T")[0] === yesterdayStr);
  const yesterdayRevenue = yesterdayOrders
    .filter((o) => o.status === "paid")
    .reduce((a, o) => a + o.items.reduce((b, i) => b + i.price, 0), 0);
  const revenueChange = yesterdayRevenue > 0 ? ((revenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

  return (
    <div className="min-h-screen bg-amber-50/30 p-4 font-sans">
      <header className="mb-4 bg-white rounded-xl border border-stone-200 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
          <div>
            <h1 className="text-lg font-bold text-stone-700">Relatório do Dia</h1>
            <p className="text-xs text-stone-400">Análise de vendas e performance</p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <a
            href="/"
            className="px-4 py-2 text-sm font-medium text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50"
          >
            ← Voltar
          </a>
          <a
            href="/historico"
            className="px-4 py-2 text-sm font-medium text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50"
          >
            📜 Histórico
          </a>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="p-2 border border-stone-200 rounded-lg text-sm focus:border-amber-400 focus:outline-none"
          />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-4">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Main KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
              <p className="text-[10px] text-stone-400 uppercase font-semibold">Faturamento</p>
              <p className="text-2xl font-bold text-emerald-600">R$ {revenue.toFixed(0)}</p>
              {revenueChange !== 0 && (
                <p
                  className={`text-[11px] font-medium mt-1 ${revenueChange > 0 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {revenueChange > 0 ? "↑" : "↓"} {Math.abs(revenueChange).toFixed(0)}% vs ontem
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
              <p className="text-[10px] text-stone-400 uppercase font-semibold">Pedidos</p>
              <p className="text-2xl font-bold text-stone-700">{total}</p>
              <p className="text-[11px] text-teal-600">
                {paidCount} pagos • {pending.length} pendentes
              </p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
              <p className="text-[10px] text-stone-400 uppercase font-semibold">Ticket Médio</p>
              <p className="text-2xl font-bold text-amber-600">R$ {avgTicket.toFixed(0)}</p>
              <p className="text-[11px] text-stone-400">~{avgItems.toFixed(1)} itens/pedido</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
              <p className="text-[10px] text-stone-400 uppercase font-semibold">A Receber</p>
              <p className="text-2xl font-bold text-rose-500">R$ {pendingRevenue.toFixed(0)}</p>
              <p className="text-[11px] text-stone-400">{pending.length} pedidos abertos</p>
            </div>
          </div>

          {/* Insights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 p-4 shadow-sm">
              <p className="text-[10px] text-amber-600 uppercase font-semibold mb-2">💡 Insight</p>
              <p className="text-sm text-stone-600">
                {peakHour ? (
                  <>
                    O <strong>horário de pico</strong> foi às <strong>{peakHour[0]}h</strong> com {peakHour[1]} pedidos.
                  </>
                ) : (
                  "Sem dados suficientes para insights."
                )}
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-100 p-4 shadow-sm">
              <p className="text-[10px] text-teal-600 uppercase font-semibold mb-2">📈 Performance</p>
              <p className="text-sm text-stone-600">
                Foram vendidos <strong>{totalItems} itens</strong> hoje.
                {topItems[0] && (
                  <>
                    {" "}
                    O mais vendido foi <strong>{topItems[0][0]}</strong>.
                  </>
                )}
              </p>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-white rounded-xl border border-violet-100 p-4 shadow-sm">
              <p className="text-[10px] text-violet-600 uppercase font-semibold mb-2">🏷️ Categorias</p>
              <p className="text-sm text-stone-600">
                <strong>Pratos:</strong> R$ {categories.pratos.toFixed(0)} • <strong>Bebidas:</strong> R${" "}
                {categories.bebidas.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Top sellers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-transparent border-b border-stone-100 flex justify-between items-center">
                <h2 className="font-bold text-stone-700">🏆 Mais Vendidos</h2>
                <span className="text-xs text-stone-400">{topItems.length} produtos</span>
              </div>
              {topItems.length === 0 ? (
                <p className="p-6 text-center text-stone-400 text-sm">Nenhuma venda</p>
              ) : (
                <div className="divide-y divide-stone-100">
                  {topItems.map(([name, data], i) => (
                    <div key={name} className="p-3 flex items-center gap-3 hover:bg-stone-50 transition-colors">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                        ${
                          i === 0
                            ? "bg-amber-100 text-amber-700"
                            : i === 1
                            ? "bg-stone-200 text-stone-600"
                            : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-stone-700 text-sm">{name}</p>
                        <p className="text-[10px] text-stone-400">{data.count} vendidos</p>
                      </div>
                      <p className="font-bold text-teal-600 text-sm">R$ {data.revenue.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accounting Summary */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-transparent border-b border-stone-100">
                <h2 className="font-bold text-stone-700">📋 Resumo Contábil</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
                  <span className="text-sm text-stone-600">Total de Vendas (Bruto)</span>
                  <span className="font-bold text-stone-700">R$ {(revenue + pendingRevenue).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-sm text-emerald-700">✓ Recebido (Pago)</span>
                  <span className="font-bold text-emerald-700">R$ {revenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="text-sm text-amber-700">⏳ A Receber (Pendente)</span>
                  <span className="font-bold text-amber-700">R$ {pendingRevenue.toFixed(2)}</span>
                </div>
                <hr className="border-stone-200" />
                <div className="flex justify-between items-center p-3">
                  <span className="text-sm text-stone-600">Número de Transações</span>
                  <span className="font-bold text-stone-700">{paidCount}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-sm text-stone-600">Ticket Médio</span>
                  <span className="font-bold text-stone-700">R$ {avgTicket.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3">
                  <span className="text-sm text-stone-600">Itens por Pedido (média)</span>
                  <span className="font-bold text-stone-700">{avgItems.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
