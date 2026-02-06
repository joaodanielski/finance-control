// src/App.js
// Importações

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";
import Tesseract from "tesseract.js";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  PlusCircle,
  Trash,
  Pencil,
  LogOut,
  Loader2,
  Camera,
  Moon,
  Sun,
  Briefcase,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Download,
  Target,
  Calendar,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

// --- CONSTANTES ---
const CATEGORIES = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Lazer",
  "Salário",
  "Outros",
];
const INVEST_TYPES = [
  "Renda Fixa",
  "Ações (BR)",
  "Stocks (US)",
  "FIIs",
  "Cripto",
  "Reserva de Emergência",
];
const COLORS = [
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];
// Formatação de moeda BRL
const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

// --- COMPONENTE CARD DE RESUMO ---
const Card = ({ title, value, icon: Icon, type, subtitle }) => {
  let colorClass = "text-blue-600 dark:text-blue-400";
  let bgClass = "bg-blue-50 dark:bg-blue-900/20";

  if (type === "income" || type === "profit") {
    colorClass = "text-emerald-600 dark:text-emerald-400";
    bgClass = "bg-emerald-50 dark:bg-emerald-900/20";
  }
  if (type === "expense" || type === "loss") {
    colorClass = "text-rose-600 dark:text-rose-400";
    bgClass = "bg-rose-50 dark:bg-rose-900/20";
  }
  if (type === "neutral") {
    colorClass = "text-gray-600 dark:text-gray-400";
    bgClass = "bg-gray-100 dark:bg-slate-700";
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1 tracking-wide">
          {title}
        </p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>
          {formatCurrency(value)}
        </h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-4 rounded-xl ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} strokeWidth={1.5} />
      </div>
    </div>
  );
};

// --- COMPONENTE DE AUTENTICAÇÃO ---
const Auth = () => {
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) alert(error.message);
    setLoading(false);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg text-center border dark:border-slate-700">
        <div className="mb-6 flex justify-center">
          <div className="bg-blue-600 p-3 rounded-full shadow-lg shadow-blue-600/30">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">
          FinancePro
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mb-8">
          Faça login para acessar sua carteira.
        </p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-white p-3 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-slate-600 transition shadow-sm"
        >
          {loading ? "Carregando..." : "Entrar com Google"}
        </button>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function FinanceApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions"); // 'transactions' | 'investments' | 'goals'
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  const [isScanning, setIsScanning] = useState(false);

  // DATA STATES
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [goals, setGoals] = useState([]);

  // FORMS & FILTERS
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [formTrans, setFormTrans] = useState({
    description: "",
    amount: "",
    type: "expense",
    category: "Outros",
    date: new Date().toISOString().split("T")[0],
  });
  const [editingId, setEditingId] = useState(null);

  const [formInvest, setFormInvest] = useState({
    name: "",
    type: "Renda Fixa",
    invested_amount: "",
    current_value: "",
  });
  const [editingInvestId, setEditingInvestId] = useState(null);

  const [formGoal, setFormGoal] = useState({
    title: "",
    target_amount: "",
    current_amount: "",
    deadline: "",
  });
  const [editingGoalId, setEditingGoalId] = useState(null);

  // --- EFEITOS ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async (userId) => {
    setLoading(true);
    const { data: t } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    if (t) setTransactions(t);
    const { data: i } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (i) setInvestments(i);
    const { data: g } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("deadline", { ascending: true });
    if (g) setGoals(g);
    setLoading(false);
  };

  // --- ACTIONS (CRUD) ---
  const handleTransSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formTrans,
      amount: parseFloat(formTrans.amount),
      user_id: session.user.id,
    };
    if (editingId) {
      const { error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", editingId);
      if (!error) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === editingId ? { ...t, ...payload } : t)),
        );
        setEditingId(null);
      }
    } else {
      const { data, error } = await supabase
        .from("transactions")
        .insert([payload])
        .select();
      if (!error && data) setTransactions((prev) => [data[0], ...prev]);
    }
    setFormTrans({
      description: "",
      amount: "",
      type: "expense",
      category: "Outros",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleInvestSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formInvest.name,
      type: formInvest.type,
      invested_amount: parseFloat(formInvest.invested_amount),
      current_value: parseFloat(formInvest.current_value),
      user_id: session.user.id,
    };
    if (editingInvestId) {
      const { error } = await supabase
        .from("investments")
        .update(payload)
        .eq("id", editingInvestId);
      if (!error) {
        setInvestments((prev) =>
          prev.map((i) =>
            i.id === editingInvestId ? { ...i, ...payload } : i,
          ),
        );
        setEditingInvestId(null);
      }
    } else {
      const { data, error } = await supabase
        .from("investments")
        .insert([payload])
        .select();
      if (!error && data) setInvestments((prev) => [data[0], ...prev]);
    }
    setFormInvest({
      name: "",
      type: "Renda Fixa",
      invested_amount: "",
      current_value: "",
    });
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formGoal.title,
      target_amount: parseFloat(formGoal.target_amount),
      current_amount: parseFloat(formGoal.current_amount),
      deadline: formGoal.deadline || null,
      user_id: session.user.id,
    };
    if (editingGoalId) {
      const { error } = await supabase
        .from("goals")
        .update(payload)
        .eq("id", editingGoalId);
      if (!error) {
        setGoals((prev) =>
          prev.map((g) => (g.id === editingGoalId ? { ...g, ...payload } : g)),
        );
        setEditingGoalId(null);
      }
    } else {
      const { data, error } = await supabase
        .from("goals")
        .insert([payload])
        .select();
      if (!error && data) setGoals((prev) => [...prev, data[0]]);
    }
    setFormGoal({
      title: "",
      target_amount: "",
      current_amount: "",
      deadline: "",
    });
  };

  const deleteItem = async (table, id, setter) => {
    if (window.confirm("Excluir item?")) {
      await supabase.from(table).delete().eq("id", id);
      setter((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // --- FEATURES EXTRAS ---
  const processReceiptImage = async (imageFile) => {
    setIsScanning(true);
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(imageFile, "por");
      const prices = text.match(
        /(?:R\$ ?)?(\b\d{1,3}(?:\.\d{3})*,\d{2}\b|\b\d+\.\d{2}\b)/g,
      );
      let maxAmount = "";
      if (prices) {
        const clean = prices.map((p) =>
          parseFloat(
            p.replace("R$", "").replace(".", "").replace(",", ".").trim(),
          ),
        );
        maxAmount = Math.max(...clean).toFixed(2);
      }
      setFormTrans((prev) => ({
        ...prev,
        description: "Compra (OCR)",
        amount: maxAmount || prev.amount,
      }));
      alert("Leitura concluída!");
    } catch (err) {
      alert("Erro na leitura.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleExport = () => {
    const header = ["Data;Tipo;Categoria;Descrição;Valor;Origem\n"];
    const csvTrans = transactions.map(
      (t) =>
        `${new Date(t.date).toLocaleDateString("pt-BR")};${t.type === "income" ? "Receita" : "Despesa"};${t.category};${t.description};${t.amount.toString().replace(".", ",")};Caixa`,
    );
    const csvInvest = investments.map(
      (i) =>
        `${new Date(i.created_at).toLocaleDateString("pt-BR")};Investimento;${i.type};${i.name};${i.current_value.toString().replace(".", ",")};Carteira`,
    );
    const blob = new Blob(
      [header.concat(csvTrans).concat(csvInvest).join("\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `financepro_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // --- DATA PROCESSING ---
  const transFiltered = useMemo(
    () => transactions.filter((t) => t.date.startsWith(filterDate)),
    [transactions, filterDate],
  );
  const summaryTrans = useMemo(
    () =>
      transFiltered.reduce(
        (acc, c) => {
          const v = parseFloat(c.amount);
          if (c.type === "income") {
            acc.income += v;
            acc.total += v;
          } else {
            acc.expense += v;
            acc.total -= v;
          }
          return acc;
        },
        { income: 0, expense: 0, total: 0 },
      ),
    [transFiltered],
  );
  const summaryInvest = useMemo(
    () =>
      investments.reduce(
        (acc, c) => {
          acc.invested += parseFloat(c.invested_amount);
          acc.current += parseFloat(c.current_value);
          return acc;
        },
        { invested: 0, current: 0 },
      ),
    [investments],
  );
  const chartData = useMemo(
    () =>
      Object.entries(
        transFiltered
          .filter((t) => t.type === "expense")
          .reduce((acc, c) => {
            acc[c.category] = (acc[c.category] || 0) + parseFloat(c.amount);
            return acc;
          }, {}),
      ).map(([name, value]) => ({ name, value })),
    [transFiltered],
  );

  if (!session) return <Auth />;
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-sans pb-20 transition-colors duration-300">
      {/* HEADER */}
      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 mb-8 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-500 transform hover:rotate-6">
              {activeTab === "transactions" ? (
                <Wallet className="w-6 h-6 text-white" />
              ) : activeTab === "investments" ? (
                <Briefcase className="w-6 h-6 text-white" />
              ) : (
                <Target className="w-6 h-6 text-white" />
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              Finance
              <span className="text-blue-600 dark:text-blue-400">Pro</span>
            </h1>
          </div>

          <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "transactions" ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500"}`}
            >
              Caixa
            </button>
            <button
              onClick={() => setActiveTab("investments")}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "investments" ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500"}`}
            >
              Invest
            </button>
            <button
              onClick={() => setActiveTab("goals")}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "goals" ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500"}`}
            >
              Metas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        {/* --- ABA 1: CAIXA (TRANSAÇÕES) --- */}
        {activeTab === "transactions" && (
          <>
            <div className="flex justify-end mb-6">
              <input
                type="month"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border dark:border-slate-700 dark:text-white rounded-lg px-4 py-2 text-sm shadow-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card
                title="Entradas"
                value={summaryTrans.income}
                icon={ArrowUpCircle}
                type="income"
              />
              <Card
                title="Saídas"
                value={summaryTrans.expense}
                icon={ArrowDownCircle}
                type="expense"
              />
              <Card
                title="Saldo"
                value={summaryTrans.total}
                icon={Wallet}
                type={summaryTrans.total >= 0 ? "income" : "expense"}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold flex gap-2 dark:text-white">
                      <PlusCircle className="w-5 h-5 text-blue-600" />{" "}
                      {editingId ? "Editar" : "Nova Transação"}
                    </h2>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => processReceiptImage(e.target.files[0])}
                        disabled={isScanning}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg"
                      >
                        {isScanning ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}{" "}
                        OCR
                      </button>
                    </div>
                  </div>
                  <form
                    onSubmit={handleTransSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-5"
                  >
                    <div className="md:col-span-2">
                      <input
                        required
                        placeholder="Descrição"
                        value={formTrans.description}
                        onChange={(e) =>
                          setFormTrans({
                            ...formTrans,
                            description: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                      />
                    </div>
                    <div>
                      <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={formTrans.amount}
                        onChange={(e) =>
                          setFormTrans({ ...formTrans, amount: e.target.value })
                        }
                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                      />
                    </div>
                    <div>
                      <select
                        value={formTrans.type}
                        onChange={(e) =>
                          setFormTrans({ ...formTrans, type: e.target.value })
                        }
                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                      >
                        <option value="income">Receita</option>
                        <option value="expense">Despesa</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={formTrans.category}
                        onChange={(e) =>
                          setFormTrans({
                            ...formTrans,
                            category: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        required
                        type="date"
                        value={formTrans.date}
                        onChange={(e) =>
                          setFormTrans({ ...formTrans, date: e.target.value })
                        }
                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg"
                      >
                        {editingId ? "Atualizar" : "Salvar"}
                      </button>
                    </div>
                  </form>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b dark:border-slate-700">
                    <h2 className="font-bold flex gap-2 dark:text-white">
                      <History className="w-5 h-5 text-blue-600" /> Histórico
                    </h2>
                  </div>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {transFiltered.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-700/50 group"
                        >
                          <td className="p-4 text-sm text-gray-600 dark:text-slate-300">
                            {new Date(t.date).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-4">
                            <p className="font-semibold dark:text-white">
                              {t.description}
                            </p>
                            <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 px-2 py-0.5 rounded">
                              {t.category}
                            </span>
                          </td>
                          <td
                            className={`p-4 font-bold ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {formatCurrency(t.amount)}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => {
                                setFormTrans(t);
                                setEditingId(t.id);
                              }}
                              className="text-blue-500"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                deleteItem(
                                  "transactions",
                                  t.id,
                                  setTransactions,
                                )
                              }
                              className="text-rose-500"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 h-64">
                  <h3 className="font-bold text-gray-500 mb-4">Balanço</h3>
                  <ResponsiveContainer>
                    <BarChart
                      data={[
                        { name: "Ent", v: summaryTrans.income },
                        { name: "Sai", v: summaryTrans.expense },
                      ]}
                    >
                      <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                        {(_, i) => (
                          <Cell
                            key={i}
                            fill={i === 0 ? "#10B981" : "#F43F5E"}
                          />
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 h-64">
                  <h3 className="font-bold text-gray-500 mb-4">Gastos</h3>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- ABA 2: INVESTIMENTOS --- */}
        {activeTab === "investments" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card
                title="Total Investido"
                value={summaryInvest.invested}
                icon={Briefcase}
                type="neutral"
              />
              <Card
                title="Valor Atual"
                value={summaryInvest.current}
                icon={LayoutDashboard}
                type="neutral"
              />
              <Card
                title="Lucro/Prejuízo"
                value={summaryInvest.current - summaryInvest.invested}
                icon={TrendingUp}
                type={
                  summaryInvest.current >= summaryInvest.invested
                    ? "profit"
                    : "loss"
                }
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 h-fit">
                <h2 className="font-bold mb-4 dark:text-white">
                  Gerenciar Carteira
                </h2>
                <form onSubmit={handleInvestSubmit} className="space-y-4">
                  <input
                    required
                    placeholder="Nome do Ativo"
                    value={formInvest.name}
                    onChange={(e) =>
                      setFormInvest({ ...formInvest, name: e.target.value })
                    }
                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                  />
                  <select
                    value={formInvest.type}
                    onChange={(e) =>
                      setFormInvest({ ...formInvest, type: e.target.value })
                    }
                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                  >
                    {INVEST_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="Valor Investido"
                    value={formInvest.invested_amount}
                    onChange={(e) =>
                      setFormInvest({
                        ...formInvest,
                        invested_amount: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                  />
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="Valor Atual"
                    value={formInvest.current_value}
                    onChange={(e) =>
                      setFormInvest({
                        ...formInvest,
                        current_value: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
                  >
                    {editingInvestId ? "Atualizar" : "Adicionar"}
                  </button>
                </form>
              </div>
              <div className="lg:col-span-2 space-y-4">
                {investments.map((i) => {
                  const profit = i.current_value - i.invested_amount;
                  return (
                    <div
                      key={i.id}
                      className="bg-white dark:bg-slate-800 p-5 rounded-xl border dark:border-slate-700 flex justify-between items-center group"
                    >
                      <div>
                        <h3 className="font-bold dark:text-white">{i.name}</h3>
                        <span className="text-xs text-gray-500">{i.type}</span>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-bold dark:text-white">
                            {formatCurrency(i.current_value)}
                          </p>
                          <p
                            className={`text-xs ${profit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                          >
                            {formatCurrency(profit)}
                          </p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setFormInvest(i);
                              setEditingInvestId(i.id);
                            }}
                            className="text-blue-500"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              deleteItem("investments", i.id, setInvestments)
                            }
                            className="text-rose-500"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* --- ABA 3: METAS (NOVO!) --- */}
        {activeTab === "goals" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 h-fit">
              <h2 className="font-bold mb-4 flex items-center gap-2 dark:text-white">
                <Target className="w-5 h-5 text-rose-500" /> Nova Meta
              </h2>
              <form onSubmit={handleGoalSubmit} className="space-y-4">
                <input
                  required
                  placeholder="Meu Sonho (Ex: Carro)"
                  value={formGoal.title}
                  onChange={(e) =>
                    setFormGoal({ ...formGoal, title: e.target.value })
                  }
                  className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                />
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Quanto custa? (Alvo)"
                  value={formGoal.target_amount}
                  onChange={(e) =>
                    setFormGoal({ ...formGoal, target_amount: e.target.value })
                  }
                  className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                />
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Quanto já tenho?"
                  value={formGoal.current_amount}
                  onChange={(e) =>
                    setFormGoal({ ...formGoal, current_amount: e.target.value })
                  }
                  className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                />
                <div>
                  <label className="text-xs text-gray-500 font-bold ml-1">
                    Prazo (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formGoal.deadline}
                    onChange={(e) =>
                      setFormGoal({ ...formGoal, deadline: e.target.value })
                    }
                    className="w-full p-3 bg-gray-50 dark:bg-slate-900 border dark:border-slate-600 rounded-xl dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl"
                >
                  {editingGoalId ? "Salvar Meta" : "Criar Meta"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goals.length === 0 ? (
                <div className="col-span-2 text-center p-10 text-gray-400">
                  Nenhuma meta definida. Ouse sonhar!
                </div>
              ) : (
                goals.map((g) => {
                  const perc = Math.min(
                    (g.current_amount / g.target_amount) * 100,
                    100,
                  );
                  const daysLeft = g.deadline
                    ? Math.ceil(
                        (new Date(g.deadline) - new Date()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : null;
                  return (
                    <div
                      key={g.id}
                      className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm relative overflow-hidden group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg dark:text-white">
                            {g.title}
                          </h3>
                          {daysLeft !== null && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />{" "}
                              {daysLeft > 0
                                ? `${daysLeft} dias restantes`
                                : "Prazo vencido!"}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setFormGoal(g);
                              setEditingGoalId(g.id);
                            }}
                            className="text-blue-500"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem("goals", g.id, setGoals)}
                            className="text-rose-500"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm mb-2 font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(g.current_amount)}
                        </span>
                        <span className="text-gray-400">
                          {formatCurrency(g.target_amount)}
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-linear-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${perc}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                        {perc.toFixed(1)}%
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
