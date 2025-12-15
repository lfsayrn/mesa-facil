"use client";

import { useEffect, useState, useRef } from "react";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  details?: string[];
  observation?: string;
  isMarmitex?: boolean;
  quantity?: number;
}

interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "delivered" | "paid";
  createdAt: string;
}

const STATUS_PT: Record<string, { label: string; color: string }> = {
  pending: { label: "Novo", color: "text-red-600" },
  preparing: { label: "Preparando", color: "text-amber-600" },
  ready: { label: "Pronto", color: "text-emerald-600" },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-stone-600 rounded ${className}`} />;
}

export default function Kitchen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const previousOrderCount = useRef(0);

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 600;
      osc.type = "triangle";
      gain.gain.value = 0.2;
      osc.start();
      setTimeout(() => {
        osc.frequency.value = 800;
      }, 150);
      setTimeout(() => {
        osc.stop();
      }, 300);
    } catch {
      /* Audio not supported */
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        const active = data.filter((o: Order) => o.status !== "delivered" && o.status !== "paid");
        const pending = active.filter((o: Order) => o.status === "pending").length;
        if (pending > 0 && pending > previousOrderCount.current) {
          playSound();
          if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
        }
        previousOrderCount.current = pending;
        setOrders(active);
        setLoading(false);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchOrders();
    const i = setInterval(fetchOrders, 3000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchOrders();
  };

  const getElapsed = (d: string) => {
    const mins = Math.floor((currentTime.getTime() - new Date(d).getTime()) / 60000);
    return mins < 1 ? "agora" : mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60}m`;
  };

  const getConfig = (s: string) => {
    switch (s) {
      case "pending":
        return {
          pin: "bg-red-500",
          badge: STATUS_PT.pending,
          btn: "bg-red-600 hover:bg-red-700",
          next: "preparing",
          label: "🍳 COMEÇAR",
          urgent: true,
        };
      case "preparing":
        return {
          pin: "bg-amber-500",
          badge: STATUS_PT.preparing,
          btn: "bg-amber-600 hover:bg-amber-700",
          next: "ready",
          label: "✅ PRONTO!",
          urgent: false,
        };
      case "ready":
        return {
          pin: "bg-emerald-500",
          badge: STATUS_PT.ready,
          btn: "bg-emerald-600 hover:bg-emerald-700",
          next: "delivered",
          label: "🚀 ENTREGAR",
          urgent: false,
        };
      default:
        return {
          pin: "bg-stone-400",
          badge: { label: s, color: "text-stone-500" },
          btn: "hidden",
          next: "",
          label: "",
          urgent: false,
        };
    }
  };

  const pending = orders.filter((o) => o.status === "pending").length;
  const preparing = orders.filter((o) => o.status === "preparing").length;
  const ready = orders.filter((o) => o.status === "ready").length;

  return (
    <div className="min-h-screen bg-stone-700 p-4 font-sans">
      {/* Header */}
      <header className="mb-4 bg-stone-800 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border border-stone-600">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-500 rounded-lg flex items-center justify-center text-2xl shadow-lg">
            👨‍🍳
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Cozinha</h1>
            <p className="text-xs text-stone-400">Quadro de Pedidos</p>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <a
            href="/"
            className="px-3 py-1.5 text-xs font-medium text-stone-400 border border-stone-600 rounded-lg hover:bg-stone-700"
          >
            ← Voltar
          </a>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/50 border border-red-700/50 text-xs font-bold text-red-300">
            <span className={`w-2 h-2 rounded-full bg-red-500 ${pending > 0 ? "animate-pulse" : ""}`} /> {pending} novos
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/50 border border-amber-700/50 text-xs font-bold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> {preparing} fazendo
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-xs font-bold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {ready} prontos
          </div>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-stone-800 rounded-lg p-4 border border-stone-600">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-16 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-stone-500">
          <p className="text-6xl mb-4 opacity-30">🍳</p>
          <p className="font-medium text-stone-400 text-lg">Quadro limpo</p>
          <p className="text-sm text-stone-500">Nenhum pedido pendente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order, i) => {
            const cfg = getConfig(order.status);
            const elapsed = getElapsed(order.createdAt);
            const isLate = cfg.urgent && parseInt(elapsed) > 10;
            return (
              <div
                key={order.id}
                className="paper-card rounded-lg flex flex-col animate-slide-up relative"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Pin */}
                <div
                  className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full ${cfg.pin} shadow-md border-2 border-white z-10`}
                />

                {/* Header */}
                <div className="pt-5 px-4 pb-3 border-b border-dashed border-stone-300">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-black text-stone-800 font-mono">{order.customer}</h2>
                      <p className={`text-xs font-bold uppercase ${cfg.badge.color}`}>{cfg.badge.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-stone-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className={`text-sm font-bold ${isLate ? "text-red-600" : "text-stone-400"}`}>⏱️ {elapsed}</p>
                    </div>
                  </div>
                </div>

                {/* Items - handwritten style */}
                <div className="p-4 grow">
                  <ul className="space-y-2.5">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-stone-400 font-mono text-lg leading-none">□</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {(item.quantity ?? 1) > 1 && (
                              <span className="bg-amber-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                {item.quantity}x
                              </span>
                            )}
                            <p className="font-semibold text-stone-700">{item.name}</p>
                            {item.isMarmitex && (
                              <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                📦 MARMITEX
                              </span>
                            )}
                          </div>
                          {item.details && item.details.length > 0 && (
                            <p className="text-xs text-amber-700 font-medium mt-0.5">
                              {item.details.filter((d) => !d.includes("MARMITEX")).join(" • ")}
                            </p>
                          )}
                          {item.observation && (
                            <p className="text-xs text-stone-500 italic mt-0.5 bg-amber-50 px-2 py-0.5 rounded inline-block">
                              💬 {item.observation}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action */}
                <button
                  onClick={() => updateStatus(order.id, cfg.next)}
                  className={`w-full py-4 text-sm font-bold text-white rounded-b-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${cfg.btn}`}
                >
                  {cfg.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
