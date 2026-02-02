import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign, List } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// --- Constantes ---
const CATEGORIES = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Salário", "Investimentos", "Outros"];
const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- Componentes UI ---
const Card = ({ title, value, icon: Icon, type }) => {
  const colorClass = type === 'income' ? 'text-green-600' : type === 'expense' ? 'text-red-600' : 'text-gray-800';
  const bgClass = type === 'income' ? 'bg-green-50' : type === 'expense' ? 'bg-red-50' : 'bg-gray-50';
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(value)}</h3>
      </div>
      <div className={`p-3 rounded-full ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
    </div>
  );
};

// --- Aplicação Principal ---
export default function FinanceApp() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('finance_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [formData, setFormData] = useState({
    description: '', amount: '', type: 'expense', category: 'Outros', date: new Date().toISOString().split('T')[0]
  });
  
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(filterDate)).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filterDate]);

  const summary = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => {
      const amount = parseFloat(curr.amount);
      if (curr.type === 'income') {
        acc.income += amount;
        acc.total += amount;
      } else {
        acc.expense += amount;
        acc.total -= amount;
      }
      return acc;
    }, { income: 0, expense: 0, total: 0 });
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const expensesByCategory = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount);
        return acc;
      }, {});

    return Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const comparisonData = [
    { name: 'Receitas', value: summary.income },
    { name: 'Despesas', value: summary.expense }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) return;

    const newTransaction = {
      id: editingId || Date.now(),
      ...formData,
      amount: parseFloat(formData.amount)
    };

    if (editingId) {
      setTransactions(prev => prev.map(t => t.id === editingId ? newTransaction : t));
      setEditingId(null);
    } else {
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    setFormData({ description: '', amount: '', type: 'expense', category: 'Outros', date: new Date().toISOString().split('T')[0] });
  };

  const handleEdit = (transaction) => {
    setFormData(transaction);
    setEditingId(transaction.id);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-10">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Finance<span className="text-blue-600">Pro</span></h1>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <input type="month" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-medium px-2 py-1 outline-none"/>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card title="Receitas" value={summary.income} icon={TrendingUp} type="income" />
          <Card title="Despesas" value={summary.expense} icon={TrendingDown} type="expense" />
          <Card title="Saldo Atual" value={summary.total} icon={DollarSign} type={summary.total >= 0 ? 'income' : 'expense'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                {editingId ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Descrição</label>
                  <input required type="text" placeholder="Ex: Salário..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Valor</label>
                  <input required type="number" step="0.01" placeholder="0,00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tipo</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg outline-none bg-white">
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Categoria</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg outline-none bg-white">
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Data</label>
                  <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg outline-none" />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className={`w-full py-2.5 rounded-lg text-white font-medium shadow-md transition-all ${editingId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {editingId ? 'Atualizar' : 'Adicionar'}
                  </button>
                  {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ description: '', amount: '', type: 'expense', category: 'Outros', date: new Date().toISOString().split('T')[0] }) }} className="w-full mt-2 text-sm text-gray-500">Cancelar</button>}
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2"><List className="w-5 h-5 text-blue-600" /> Transações</h2>
                <span className="text-sm text-gray-400">{filteredTransactions.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Categoria</th><th className="p-4 text-right">Valor</th><th className="p-4 text-center">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4 text-sm text-gray-600">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 font-medium text-gray-800">{t.description}</td>
                        <td className="p-4 text-sm"><span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">{t.category}</span></td>
                        <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'expense' && '- '}{formatCurrency(t.amount)}</td>
                        <td className="p-4 text-center flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(t)} className="text-blue-500"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(t.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Balanço</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>{comparisonData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Por Categoria</h3>
              <div className="h-64">
                
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}