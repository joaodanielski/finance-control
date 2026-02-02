import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import Tesseract from 'tesseract.js';
import { 
  Wallet, ArrowUpCircle, ArrowDownCircle, History, 
  PlusCircle, Trash, Pencil, LogOut, Loader2, 
  Search, Calendar, Camera, Moon, Sun,
  Briefcase, TrendingUp, TrendingDown, LayoutDashboard, Download
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Legend } from 'recharts';

// --- CONFIGURAÇÕES ---
const CATEGORIES = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Salário", "Outros"];
const INVEST_TYPES = ["Renda Fixa", "Ações (BR)", "Stocks (US)", "FIIs", "Cripto", "Reserva de Emergência"];
const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- COMPONENTES UI ---
const Card = ({ title, value, icon: Icon, type, subtitle }) => {
  let colorClass = 'text-blue-600 dark:text-blue-400';
  let bgClass = 'bg-blue-50 dark:bg-blue-900/20';

  if (type === 'income' || type === 'profit') { colorClass = 'text-emerald-600 dark:text-emerald-400'; bgClass = 'bg-emerald-50 dark:bg-emerald-900/20'; }
  if (type === 'expense' || type === 'loss') { colorClass = 'text-rose-600 dark:text-rose-400'; bgClass = 'bg-rose-50 dark:bg-rose-900/20'; }
  if (type === 'neutral') { colorClass = 'text-gray-600 dark:text-gray-400'; bgClass = 'bg-gray-100 dark:bg-slate-700'; }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1 tracking-wide">{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>{formatCurrency(value)}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-4 rounded-xl ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} strokeWidth={1.5} />
      </div>
    </div>
  );
};

// --- COMPONENTE LOGIN (Simples) ---
const Auth = () => {
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center border dark:border-slate-700">
        <div className="mb-6 flex justify-center"><div className="bg-blue-600 p-3 rounded-full shadow-lg shadow-blue-600/30"><Wallet className="w-8 h-8 text-white" /></div></div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">FinancePro</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-8">Faça login para acessar sua carteira.</p>
        <button onClick={handleLogin} disabled={loading} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-white p-3 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-slate-600 transition shadow-sm">
          {loading ? 'Carregando...' : 'Entrar com Google'}
        </button>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function FinanceApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'investments'
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  // Estados de Transações
  const [transactions, setTransactions] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));
  const [formTrans, setFormTrans] = useState({ description: '', amount: '', type: 'expense', category: 'Outros', date: new Date().toISOString().split('T')[0] });
  const [editingId, setEditingId] = useState(null);

  // Estados de Investimentos
  const [investments, setInvestments] = useState([]);
  const [formInvest, setFormInvest] = useState({ name: '', type: 'Renda Fixa', invested_amount: '', current_value: '' });
  const [editingInvestId, setEditingInvestId] = useState(null);

  // Estado OCR
  const [isScanning, setIsScanning] = useState(false);

  // --- EFEITOS ---
  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if(session) fetchAllData(session.user.id); else setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if(session) fetchAllData(session.user.id); });
    return () => subscription.unsubscribe();
  }, []);

  // --- FETCH DATA ---
  const fetchAllData = async (userId) => {
    setLoading(true);
    // 1. Pega Transações
    const { data: transData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (transData) setTransactions(transData);
    
    // 2. Pega Investimentos
    const { data: investData } = await supabase.from('investments').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (investData) setInvestments(investData);
    
    setLoading(false);
  };

  // --- LÓGICA TRANSAÇÕES (CRUD + OCR) ---
  const handleTransSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formTrans, amount: parseFloat(formTrans.amount), user_id: session.user.id };
    if (editingId) {
      const { error } = await supabase.from('transactions').update(payload).eq('id', editingId);
      if (!error) { setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } : t)); setEditingId(null); }
    } else {
      const { data, error } = await supabase.from('transactions').insert([payload]).select();
      if (!error && data) setTransactions(prev => [data[0], ...prev]);
    }
    setFormTrans({ description: '', amount: '', type: 'expense', category: 'Outros', date: new Date().toISOString().split('T')[0] });
  };

  const handleTransDelete = async (id) => {
    if (window.confirm('Excluir?')) { await supabase.from('transactions').delete().eq('id', id); setTransactions(prev => prev.filter(t => t.id !== id)); }
  };

  const processReceiptImage = async (imageFile) => {
    setIsScanning(true);
    try {
      const { data: { text } } = await Tesseract.recognize(imageFile, 'por');
      const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
      const priceRegex = /(?:R\$ ?)?(\b\d{1,3}(?:\.\d{3})*,\d{2}\b|\b\d+\.\d{2}\b)/g;
      const prices = text.match(priceRegex);
      
      let maxAmount = '';
      if (prices) {
        const cleanPrices = prices.map(p => parseFloat(p.replace('R$', '').replace('.', '').replace(',', '.').trim()));
        const maxVal = Math.max(...cleanPrices);
        if (maxVal > 0) maxAmount = maxVal.toFixed(2);
      }
      let formattedDate = new Date().toISOString().split('T')[0];
      if (dateMatch) formattedDate = `${dateMatch[3].length === 2 ? '20'+dateMatch[3] : dateMatch[3]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[1].padStart(2,'0')}`;

      setFormTrans(prev => ({ ...prev, description: 'Compra (OCR)', amount: maxAmount || prev.amount, date: formattedDate }));
      alert('Leitura concluída!');
    } catch (err) { alert('Erro na leitura.'); } finally { setIsScanning(false); }
  };

  // --- LÓGICA INVESTIMENTOS (CRUD) ---
  const handleInvestSubmit = async (e) => {
    e.preventDefault();
    const payload = { 
      name: formInvest.name, 
      type: formInvest.type, 
      invested_amount: parseFloat(formInvest.invested_amount), 
      current_value: parseFloat(formInvest.current_value), 
      user_id: session.user.id 
    };

    if (editingInvestId) {
      const { error } = await supabase.from('investments').update(payload).eq('id', editingInvestId);
      if (!error) { setInvestments(prev => prev.map(i => i.id === editingInvestId ? { ...i, ...payload } : i)); setEditingInvestId(null); }
    } else {
      const { data, error } = await supabase.from('investments').insert([payload]).select();
      if (!error && data) setInvestments(prev => [data[0], ...prev]);
    }
    setFormInvest({ name: '', type: 'Renda Fixa', invested_amount: '', current_value: '' });
  };

  const handleInvestDelete = async (id) => {
    if (window.confirm('Excluir Investimento?')) { await supabase.from('investments').delete().eq('id', id); setInvestments(prev => prev.filter(i => i.id !== id)); }
  };

  // --- CÁLCULOS & MEMO ---
  const transFiltered = useMemo(() => transactions.filter(t => t.date.startsWith(filterDate)), [transactions, filterDate]);
  const summaryTrans = useMemo(() => transFiltered.reduce((acc, curr) => { const val = parseFloat(curr.amount); if(curr.type==='income'){ acc.income+=val; acc.total+=val; } else { acc.expense+=val; acc.total-=val; } return acc; }, { income: 0, expense: 0, total: 0 }), [transFiltered]);
  
  const summaryInvest = useMemo(() => investments.reduce((acc, curr) => { 
    acc.invested += parseFloat(curr.invested_amount); 
    acc.current += parseFloat(curr.current_value); 
    return acc; 
  }, { invested: 0, current: 0 }), [investments]);
  
  const investProfit = summaryInvest.current - summaryInvest.invested;
  const investYield = summaryInvest.invested > 0 ? (investProfit / summaryInvest.invested) * 100 : 0;

  const chartData = useMemo(() => { const exp = transFiltered.filter(t => t.type === 'expense').reduce((acc, curr) => { acc[curr.category] = (acc[curr.category] || 0) + parseFloat(curr.amount); return acc; }, {}); return Object.entries(exp).map(([name, value]) => ({ name, value })); }, [transFiltered]);
  const comparisonData = [{ name: 'Receitas', value: summaryTrans.income }, { name: 'Despesas', value: summaryTrans.expense }];

  if (!session) return <Auth />;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  // --- FUNÇÃO DE EXPORTAÇÃO (CSV) ---
  const handleExport = () => {
    // 1. Cabeçalho do CSV (Separado por ponto e vírgula para Excel PT-BR)
    const header = ["Data;Tipo;Categoria;Descrição;Valor;Origem\n"];

    // 2. Processa Transações
    const csvTrans = transactions.map(t => {
      const date = new Date(t.date).toLocaleDateString('pt-BR');
      const amount = t.amount.toString().replace('.', ','); // Troca ponto por vírgula pro Excel entender como número
      const type = t.type === 'income' ? 'Receita' : 'Despesa';
      return `${date};${type};${t.category};${t.description};${amount};Caixa`;
    });

    // 3. Processa Investimentos
    const csvInvest = investments.map(i => {
      const date = new Date(i.created_at).toLocaleDateString('pt-BR');
      const amount = i.current_value.toString().replace('.', ',');
      return `${date};Investimento;${i.type};${i.name};${amount};Carteira`;
    });

    // 4. Junta tudo em um BLOB (Arquivo na memória)
    const csvContent = header.concat(csvTrans).concat(csvInvest).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 5. Cria link falso para download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financepro_relatorio_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-sans pb-10 transition-colors duration-300">
      
      {/* HEADER */}
      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 mb-8 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              {/* LÓGICA DO ÍCONE DINÂMICO */}
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-300 transform hover:scale-110">
              {activeTab === 'transactions' ? (
                <Wallet className="w-6 h-6 text-white" strokeWidth={1.5} />
              ) : (
                <Briefcase className="w-6 h-6 text-white" strokeWidth={1.5} />
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block text-gray-900 dark:text-white">
              Finance<span className="text-blue-600 dark:text-blue-400">Pro</span>
            </h1>
          </div>
            </div>
          
          {/* TAB SWITCHER */}
          <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
            <button onClick={() => setActiveTab('transactions')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'transactions' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Caixa</button>
            <button onClick={() => setActiveTab('investments')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'investments' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Investimentos</button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600">{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            {/* NOVO: Botão Exportar */}
            <button 
              onClick={handleExport} 
              title="Baixar Relatório (CSV)"
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>
            <button onClick={() => supabase.auth.signOut()} className="text-gray-500 dark:text-slate-400 hover:text-red-600"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        
        {/* --- VIEW: TRANSAÇÕES --- */}
        {activeTab === 'transactions' && (
          <>
            <div className="flex justify-end mb-6">
              <input type="month" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card title="Entradas" value={summaryTrans.income} icon={ArrowUpCircle} type="income" />
              <Card title="Saídas" value={summaryTrans.expense} icon={ArrowDownCircle} type="expense" />
              <Card title="Saldo Total" value={summaryTrans.total} icon={Wallet} type={summaryTrans.total >= 0 ? 'income' : 'expense'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* FORM TRANSAÇÕES */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white"><PlusCircle className="w-5 h-5 text-blue-600" /> {editingId ? 'Editar' : 'Nova Transação'}</h2>
                    <div className="relative">
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => processReceiptImage(e.target.files[0])} disabled={isScanning} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                      <button type="button" className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isScanning ? 'bg-gray-100 dark:bg-slate-700 text-gray-400' : 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400'}`}>{isScanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Lendo...</> : <><Camera className="w-4 h-4" /> OCR</>}</button>
                    </div>
                  </div>
                  <form onSubmit={handleTransSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição</label><input required type="text" value={formTrans.description} onChange={e => setFormTrans({...formTrans, description: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor</label><input required type="number" step="0.01" value={formTrans.amount} onChange={e => setFormTrans({...formTrans, amount: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" /></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo</label><select value={formTrans.type} onChange={e => setFormTrans({...formTrans, type: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl dark:text-white"><option value="income">Receita</option><option value="expense">Despesa</option></select></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Categoria</label><select value={formTrans.category} onChange={e => setFormTrans({...formTrans, category: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl dark:text-white">{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                    <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Data</label><input required type="date" value={formTrans.date} onChange={e => setFormTrans({...formTrans, date: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl dark:text-white" /></div>
                    <div className="md:col-span-2 pt-2"><button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all">{editingId ? 'Atualizar' : 'Salvar'}</button></div>
                  </form>
                </div>
                
                {/* LISTA TRANSAÇÕES */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b dark:border-slate-700"><h2 className="text-lg font-bold flex gap-2 dark:text-white"><History className="w-5 h-5 text-blue-600" /> Histórico</h2></div>
                  <div className="overflow-x-auto"><table className="w-full text-left"><tbody className="divide-y divide-gray-100 dark:divide-slate-700">{transFiltered.map(t => (<tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 group"><td className="p-4 text-sm text-gray-600 dark:text-slate-300">{new Date(t.date).toLocaleDateString('pt-BR')}</td><td className="p-4"><p className="font-semibold dark:text-white">{t.description}</p><span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-500">{t.category}</span></td><td className={`p-4 font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'expense' ? '-' : '+'} {formatCurrency(t.amount)}</td><td className="p-4 text-right flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100"><button onClick={() => {setFormTrans(t); setEditingId(t.id)}} className="text-blue-500"><Pencil className="w-4 h-4"/></button><button onClick={() => handleTransDelete(t.id)} className="text-rose-500"><Trash className="w-4 h-4"/></button></td></tr>))}</tbody></table></div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 h-80"><h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Balanço</h3><ResponsiveContainer width="100%" height="100%"><BarChart data={comparisonData}><XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} /><Tooltip contentStyle={{backgroundColor:'#1e293b', borderRadius:'8px', border:'none', color:'#fff'}} /><Bar dataKey="value" radius={[4,4,0,0]}>{comparisonData.map((e,i)=><Cell key={i} fill={i===0?'#10B981':'#F43F5E'}/>)}</Bar></BarChart></ResponsiveContainer></div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border dark:border-slate-700 h-80"><h3 className="text-sm font-bold text-gray-500 uppercase mb-4">Gastos</h3><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{chartData.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip contentStyle={{backgroundColor:'#1e293b', borderRadius:'8px', border:'none', color:'#fff'}} /></PieChart></ResponsiveContainer></div>
              </div>
            </div>
          </>
        )}

        {/* --- VIEW: INVESTIMENTOS --- */}
        {activeTab === 'investments' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card title="Total Investido" value={summaryInvest.invested} icon={Briefcase} type="neutral" subtitle="Custo de aquisição" />
              <Card title="Valor Atual" value={summaryInvest.current} icon={LayoutDashboard} type="neutral" subtitle="Valor de mercado" />
              <Card title="Lucro / Prejuízo" value={investProfit} icon={investProfit >= 0 ? TrendingUp : TrendingDown} type={investProfit >= 0 ? 'profit' : 'loss'} subtitle={`${investYield.toFixed(2)}% de retorno`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* FORM INVESTIMENTOS */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 h-fit sticky top-24">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-6 dark:text-white"><PlusCircle className="w-5 h-5 text-blue-600" /> {editingInvestId ? 'Editar Ativo' : 'Novo Investimento'}</h2>
                <form onSubmit={handleInvestSubmit} className="space-y-4">
                  <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome do Ativo</label><input required type="text" placeholder="Ex: Bitcoin, Tesouro IPCA+" value={formInvest.name} onChange={e => setFormInvest({...formInvest, name: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo</label><select value={formInvest.type} onChange={e => setFormInvest({...formInvest, type: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl dark:text-white">{INVEST_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor Investido</label><input required type="number" step="0.01" value={formInvest.invested_amount} onChange={e => setFormInvest({...formInvest, invested_amount: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" /></div>
                  <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor Atual</label><input required type="number" step="0.01" value={formInvest.current_value} onChange={e => setFormInvest({...formInvest, current_value: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" /></div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all">{editingInvestId ? 'Atualizar Carteira' : 'Adicionar à Carteira'}</button>
                  {editingInvestId && <button type="button" onClick={() => { setEditingInvestId(null); setFormInvest({ name: '', type: 'Renda Fixa', invested_amount: '', current_value: '' }) }} className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400">Cancelar</button>}
                </form>
              </div>

              {/* LISTA INVESTIMENTOS */}
              <div className="lg:col-span-2 space-y-4">
                {investments.map(inv => {
                  const profit = inv.current_value - inv.invested_amount;
                  const yieldPerc = (profit / inv.invested_amount) * 100;
                  return (
                    <div key={inv.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between items-center group transition-all hover:scale-[1.01]">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase">{inv.type}</span>
                          <h3 className="font-bold text-gray-800 dark:text-white">{inv.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Investido: {formatCurrency(inv.invested_amount)}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-lg font-bold dark:text-white">{formatCurrency(inv.current_value)}</p>
                          <p className={`text-xs font-bold ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({yieldPerc.toFixed(1)}%)
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setFormInvest(inv); setEditingInvestId(inv.id); window.scrollTo({top:0, behavior:'smooth'}) }} className="text-blue-500"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleInvestDelete(inv.id)} className="text-rose-500"><Trash className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {investments.length === 0 && <div className="text-center p-10 text-gray-400 dark:text-slate-600">Sua carteira está vazia. Comece a investir!</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}