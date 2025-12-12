export interface MenuItem {
  id: string;
  name: string;
  category: "pratos" | "bebidas" | "porcoes" | "sobremesas";
  price: number;
  active: boolean;
  sides?: string[];
  extras?: { name: string; price: number }[];
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  details: string[];
  observation?: string;
}

export interface Order {
  id: string;
  customer: string;
  items: OrderItem[];
  status: "pending" | "preparing" | "ready" | "delivered" | "paid";
  createdAt: Date;
}

declare global {
  var ordersStore: Order[];
  var menuStore: MenuItem[];
}

// Initialize Orders store
if (!global.ordersStore) {
  global.ordersStore = [];
}

// Default sides and extras
const DEFAULT_SIDES = ["Arroz", "Feijão", "Macarrão", "Salada", "Farofa"];
const DEFAULT_EXTRAS = [
  { name: "Batata Frita", price: 12.0 },
  { name: "Ovo Frito", price: 3.0 },
  { name: "Vinagrete", price: 4.0 },
  { name: "Torresmo", price: 8.0 },
];

// Initialize Menu Store
if (!global.menuStore) {
  global.menuStore = [
    {
      id: "1",
      name: "Filé de Tilápia",
      category: "pratos",
      price: 26.0,
      active: true,
      sides: DEFAULT_SIDES,
      extras: DEFAULT_EXTRAS,
    },
    {
      id: "2",
      name: "Contra-Filé",
      category: "pratos",
      price: 26.0,
      active: true,
      sides: DEFAULT_SIDES,
      extras: DEFAULT_EXTRAS,
    },
    {
      id: "3",
      name: "PF Frango Grelhado",
      category: "pratos",
      price: 16.0,
      active: true,
      sides: DEFAULT_SIDES,
      extras: DEFAULT_EXTRAS,
    },
    {
      id: "4",
      name: "PF Calabresa",
      category: "pratos",
      price: 16.0,
      active: true,
      sides: DEFAULT_SIDES,
      extras: DEFAULT_EXTRAS,
    },
    {
      id: "5",
      name: "PF Bisteca",
      category: "pratos",
      price: 16.0,
      active: true,
      sides: DEFAULT_SIDES,
      extras: DEFAULT_EXTRAS,
    },
    {
      id: "6",
      name: "PF Omelete",
      category: "pratos",
      price: 16.0,
      active: true,
      sides: ["Arroz", "Feijão", "Salada"],
      extras: DEFAULT_EXTRAS,
    },
    { id: "10", name: "Porção de Fritas", category: "porcoes", price: 12.0, active: true },
    { id: "11", name: "Salada Extra", category: "porcoes", price: 8.0, active: true },
    { id: "12", name: "Ovo Frito (Un)", category: "porcoes", price: 3.0, active: true },
    { id: "20", name: "Coca-Cola (Lata)", category: "bebidas", price: 6.0, active: true },
    { id: "21", name: "Guaraná (Lata)", category: "bebidas", price: 6.0, active: true },
    { id: "22", name: "Suco de Laranja", category: "bebidas", price: 9.0, active: true },
    { id: "23", name: "Suco de Limão", category: "bebidas", price: 8.0, active: true },
    { id: "24", name: "Água Mineral", category: "bebidas", price: 4.0, active: true },
    { id: "25", name: "Cerveja (Lata)", category: "bebidas", price: 7.0, active: true },
  ];
}

export const orders = global.ordersStore;
export const menu = global.menuStore;

export function addOrder(order: Order) {
  global.ordersStore.push(order);
}

export function updateOrderStatus(id: string, status: Order["status"]) {
  const order = global.ordersStore.find((o) => o.id === id);
  if (order) {
    order.status = status;
  }
}

export function getOrders() {
  return [...global.ordersStore].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export function getMenu() {
  return global.menuStore.filter((item) => item.active);
}

export function getAllMenuItems() {
  return global.menuStore;
}

export function addMenuItem(item: MenuItem) {
  global.menuStore.push(item);
}

export function updateMenuItem(id: string, updates: Partial<MenuItem>) {
  const item = global.menuStore.find((i) => i.id === id);
  if (item) {
    Object.assign(item, updates);
  }
}

export function deleteMenuItem(id: string) {
  const index = global.menuStore.findIndex((i) => i.id === id);
  if (index > -1) {
    global.menuStore.splice(index, 1);
  }
}
