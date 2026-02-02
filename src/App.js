import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient'; // Importa nossa conexão
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign, List, LogOut, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const CATEGORIES = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Salário", "Investimentos", "Outros"];
const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Componente de Login Simples
const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.error_description || error.message);
    else setMessage('Verifique seu e-mail para o link de login!');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="mb-6 flex justify-center"><div className="bg-blue-600 p-3 rounded-full"><DollarSign className="w-8 h-8 text-white" /></div></div>
        <h1 className="text-2xl font-bold mb-2">Bem-vindo ao FinancePro</h1>
        <p className="text-gray-500 mb-6">Entre com seu e-mail para acessar seus dados na nuvem.</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Enviando...' : 'Enviar Link Mágico'}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-green-600 font-medium">{message}</p>}
      </div>
    </div>
  );
};

// Componente Card
const Card = ({ title, value, icon: Icon, type }) => {
  const colorClass = type === 'income' ? 'text-green-600' : type === 'expense' ? 'text-red-600' : 'text-gray-800';
  const bgClass = type === 'income' ? 'bg-green-50' : type === 'expense' ? 'bg-red-50' : 'bg-gray-50';
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div><p className="text-sm text-gray-500 font-medium mb-1">{title}</p><h3 className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(value)}</h3></div>
      <div className={`p-3 rounded-full ${bgClass}`}><Icon className={`w-6 h-6 ${colorClass}`} /></div>
    </div>
  );
};

export default function FinanceApp() {
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ description: '', amount: '', type: 'expense', category: 'Outros', date: new Date().toISOString().split('T')[0] });
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));

  // Gerenciamento de Sessão
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if(session) fetchTransactions(session.user.id); else setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if(session) fetchTransactions(session.user.id); else setTransactions([]); });
    return () => subscription.unsubscribe();
  }, []);

  // CRUD Supabase
  const fetchTransactions = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
      if (error) throw error;
      setTransactions(data);
    } catch (error) { console.error('Erro ao buscar:', error.message); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) return;
    const { description, amount, type, category, date } = formData;
    const payload = { description, amount: parseFloat(amount), type, category, date, user_id: session.user.id };

    if (editingId) {
      const { error } = await supabase.from('transactions').update({ description, amount: parseFloat(amount), type, category, date }).eq('id', editingId);
      if (!error) { setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } : t)); setEditingId(null); }
    } else {
      const { data, error } = await supabase.from('transactions').insert([payload]).select();
      if (!error && data) setTransactions(prev => [data[0], ...prev]);
    }
    setFormData({ description: '', amount: '', type: 'expense', category: 'Outros', date: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir transação?')) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Cálculos (Mantidos do anterior)
  const filteredTransactions = useMemo(() => transactions.filter(t => t.date.startsWith(filterDate)), [transactions, filterDate]);
  const summary = useMemo(() => filteredTransactions.reduce((acc, curr) => { const amt = parseFloat(curr.amount); if(curr.type === 'income') { acc.income += amt; acc.total += amt; } else { acc.expense += amt; acc.total -= amt; } return acc; }, { income: 0, expense: 0, total: 0 }), [filteredTransactions]);
  const chartData = useMemo(() => { const exp = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => { acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount); return acc; }, {}); return Object.entries(exp).map(([name, value]) => ({ name, value })); }, [filteredTransactions]);
  const comparisonData = [{ name: 'Receitas', value: summary.income }, { name: 'Despesas', value: summary.expense }];

  if (!session) return <Auth />;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-10">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2"><div className="bg-blue-600 p-2 rounded-lg"><DollarSign className="w-5 h-5 text-white" /></div><h1 className="text-xl font-bold">Finance<span className="text-blue-600">Pro</span></h1></div>
          <div className="flex items-center gap-4">
            <input type="month" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-gray-100 rounded-lg px-3 py-1 text-sm outline-none" />
            <button onClick={() => supabase.auth.signOut()} className="text-gray-500 hover:text-red-600"><LogOut className="w-5 h-5" /></button>
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
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-blue-600" />{editingId ? 'Editar' : 'Nova Transação'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Descrição</label><input required type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Valor</label><input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Tipo</label><select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border rounded-lg bg-white"><option value="income">Receita</option><option value="expense">Despesa</option></select></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Categoria</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded-lg bg-white">{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase">Data</label><input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
                <div className="md:col-span-2"><button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 shadow-md">{editingId ? 'Atualizar' : 'Salvar'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ description: '', amount: '', type: 'expense', category: 'Outros', date: new Date().toISOString().split('T')[0] }) }} className="w-full mt-2 text-sm text-gray-500">Cancelar</button>}</div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-bold flex gap-2"><List className="w-5 h-5 text-blue-600" /> Histórico</h2></div>
               <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="p-4">Data</th><th className="p-4">Descrição</th><th className="p-4">Valor</th><th className="p-4">Ações</th></tr></thead>
               <tbody className="divide-y divide-gray-100">{filteredTransactions.map(t => (<tr key={t.id} className="hover:bg-gray-50 group"><td className="p-4 text-sm text-gray-600">{new Date(t.date).toLocaleDateString('pt-BR')}</td><td className="p-4 font-medium">{t.description}<br/><span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">{t.category}</span></td><td className={`p-4 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</td><td className="p-4 flex gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => { setFormData(t); setEditingId(t.id); }} className="text-blue-500"><Edit2 className="w-4 h-4" /></button><button onClick={() => handleDelete(t.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody></table></div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparisonData}><XAxis dataKey="name" stroke="#9CA3AF" tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="value" radius={[4, 4, 0, 0]}>{comparisonData.map((e, i) => <Cell key={i} fill={i === 0 ? '#10B981' : '#EF4444'} />)}</Bar></BarChart></ResponsiveContainer></div>
            <div className="bg-white p-6 rounded-xl shadow-sm h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{chartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
          </div>
        </div>
      </div>
    </div>
  );
}