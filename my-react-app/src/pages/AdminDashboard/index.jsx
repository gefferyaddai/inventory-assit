import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Package, AlertTriangle, ClipboardList, Users } from 'lucide-react';

// ── Mock data ────────────────────────────────────────────────────────────────

const KPI = [
  { label: 'Total Products',  value: 284,  icon: Package,       color: 'bg-blue-100 text-blue-600' },
  { label: 'Low Stock',       value: 17,   icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-600' },
  { label: 'Pending Orders',  value: 9,    icon: ClipboardList, color: 'bg-orange-100 text-orange-600' },
  { label: 'Active Users',    value: 6,    icon: Users,         color: 'bg-green-100 text-green-600' },
];

const RECENT_TRANSACTIONS = [
  { id: 'TXN-001', product: 'Wireless Mouse',    type: 'Sale',     qty: 5,  date: '2026-03-24', status: 'Completed' },
  { id: 'TXN-002', product: 'USB-C Hub',         type: 'Restock',  qty: 20, date: '2026-03-24', status: 'Completed' },
  { id: 'TXN-003', product: 'Mechanical Keyboard',type: 'Sale',    qty: 2,  date: '2026-03-23', status: 'Pending' },
  { id: 'TXN-004', product: 'Monitor Stand',     type: 'Sale',     qty: 1,  date: '2026-03-23', status: 'Completed' },
  { id: 'TXN-005', product: 'Webcam HD',         type: 'Restock',  qty: 15, date: '2026-03-22', status: 'Completed' },
];

const BAR_DATA = [
  { category: 'Electronics',  value: 12400 },
  { category: 'Peripherals',  value: 8750 },
  { category: 'Furniture',    value: 6300 },
  { category: 'Networking',   value: 4200 },
  { category: 'Accessories',  value: 3100 },
];

const PIE_DATA = [
  { name: 'In Stock',    value: 198 },
  { name: 'Low Stock',   value: 17 },
  { name: 'Out of Stock',value: 8 },
  { name: 'Overstocked', value: 61 },
];

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

const STATUS_CLASSES = {
  Completed: 'bg-green-100 text-green-700',
  Pending:   'bg-yellow-100 text-yellow-700',
  Cancelled: 'bg-red-100 text-red-700',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className={`rounded-full p-3 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart — inventory value by category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Inventory Value by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={BAR_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Value']} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — stock status breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Stock Status Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {PIE_DATA.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, name) => [v, name]} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Transactions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-2 font-medium">ID</th>
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Qty</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {RECENT_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="text-gray-700">
                  <td className="py-2 font-mono text-xs text-gray-400">{tx.id}</td>
                  <td className="py-2">{tx.product}</td>
                  <td className="py-2">{tx.type}</td>
                  <td className="py-2">{tx.qty}</td>
                  <td className="py-2">{tx.date}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[tx.status]}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
