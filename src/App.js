import Tesseract from 'tesseract.js';
import { Camera } from 'lucide-react'; // Adicione o ícone da Camera aqui

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

  const handleLogin = async () => {
    setLoading(true);
    // Inicia o fluxo do Google
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redireciona de volta para onde o usuário estava
        redirectTo: window.location.origin 
      }
    });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-blue-600 p-3 rounded-full">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">FinancePro</h1>
        <p className="text-gray-500 mb-8">Gerencie suas finanças em qualquer lugar.</p>
        
        <button 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 p-3 rounded-lg font-bold hover:bg-gray-50 transition shadow-sm"
        >
          {loading ? (
            <span className="text-gray-500">Carregando...</span>
          ) : (
            <>
              {/* Ícone do Google (SVG Inline) */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Entrar com Google
            </>
          )}
        </button>
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

  // --- Lógica de OCR ---
  const [isScanning, setIsScanning] = useState(false);

  const processReceiptImage = async (imageFile) => {
    setIsScanning(true);
    try {
      // 1. Executa o Tesseract (Português)
      const { data: { text } } = await Tesseract.recognize(
        imageFile,
        'por', // Idioma português
        { logger: m => console.log(m) } // Log de progresso no console
      );

      console.log("Texto extraído:", text); // Para depuração

      // 2. Inteligência de Extração (Regex)
      
      // Procura datas (ex: 25/12/2023 ou 25-12-23)
      const dateRegex = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
      const dateMatch = text.match(dateRegex);
      
      // Procura valores monetários (ex: 100,00 ou 100.00)
      // Essa regex procura números que tenham vírgula ou ponto seguidos de 2 digitos, 
      // ignorando números de telefone ou CEPs longos
      const priceRegex = /(?:R\$ ?)?(\b\d{1,3}(?:\.\d{3})*,\d{2}\b|\b\d+\.\d{2}\b)/g;
      const prices = text.match(priceRegex);

      // Lógica para pegar o MAIOR valor encontrado (geralmente é o total)
      let maxAmount = '';
      if (prices) {
        const cleanPrices = prices.map(p => parseFloat(p.replace('R$', '').replace('.', '').replace(',', '.').trim()));
        const maxVal = Math.max(...cleanPrices);
        if (maxVal > 0) maxAmount = maxVal.toFixed(2); // Formato para o input
      }

      // 3. Formatar Data para o Input (YYYY-MM-DD)
      let formattedDate = new Date().toISOString().split('T')[0]; // Hoje (fallback)
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        // Assume ano atual se achar só 2 digitos, ou usa o encontrado
        const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
        formattedDate = `${year}-${month}-${day}`;
      }

      // 4. Preencher o Formulário
      setFormData(prev => ({
        ...prev,
        description: 'Compra Detectada (OCR)', // Descrição genérica (difícil extrair nome da loja sem IA avançada)
        amount: maxAmount || prev.amount,
        date: formattedDate
      }));

      alert('Leitura concluída! Verifique os valores.');

    } catch (err) {
      console.error(err);
      alert('Erro ao ler a imagem. Tente uma foto mais clara.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCameraInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      processReceiptImage(file);
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
              {/* INICIO DO NOVO CABEÇALHO COM CÂMERA */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  {editingId ? 'Editar Lançamento' : 'Nova Transação'}
                </h2>
                
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    disabled={isScanning}
                  />
                  <button 
                    type="button" 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isScanning ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Lendo...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Escanear Nota
                      </>
                    )}
                  </button>
                </div>
              </div>
              {/* FIM DO NOVO CABEÇALHO */}
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