import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Trash2, Edit2, BarChart2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { buildTeamStats } from '../lib/analytics';
import type { Team, Service, TeamVisit } from '../types';

interface TeamsProps {
  teams: Team[];
  services: Service[];
  visits: TeamVisit[];
  loading: boolean;
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (id: string, name: string, color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f97316', '#ef4444',
  '#06b6d4', '#8b5cf6', '#ec4899', '#eab308',
  '#14b8a6', '#6366f1',
];

function categoryColor(cat: 'fast' | 'average' | 'slow') {
  if (cat === 'fast') return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20' };
  if (cat === 'average') return { text: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/20' };
  return { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20' };
}

function categoryLabel(cat: 'fast' | 'average' | 'slow') {
  if (cat === 'fast') return 'Rápida';
  if (cat === 'average') return 'Na Média';
  return 'Lenta';
}

export default function Teams({ teams, services, visits, loading, onCreate, onUpdate, onDelete, onRefresh }: TeamsProps) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [form, setForm] = useState({ name: '', color: '#3b82f6' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const stats = buildTeamStats(teams, services, visits);

  const filtered = stats.filter((s) =>
    s.team.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditTeam(null);
    setForm({ name: '', color: '#3b82f6' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (team: Team) => {
    setEditTeam(team);
    setForm({ name: team.name, color: team.color });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Informe o nome da equipe'); return; }
    setSaving(true);
    try {
      if (editTeam) {
        await onUpdate(editTeam.id, form.name, form.color);
      } else {
        await onCreate(form.name, form.color);
      }
      setShowModal(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar equipe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Gerenciar Equipes"
        subtitle="Cadastre e monitore as equipes técnicas"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={onRefresh}
        loading={loading}
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} />
            Nova Equipe
          </button>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhuma equipe encontrada"
            description="Cadastre as equipes técnicas para começar o monitoramento"
            action={<button onClick={openCreate} className="btn-primary"><Plus size={14} /> Nova Equipe</button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((stat, idx) => {
                const colors = categoryColor(stat.category);
                const hasData = stat.completed_services > 0;
                return (
                  <motion.div
                    key={stat.team.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -3 }}
                    className="glass-card p-5 border border-[#1e2d4d]/60 hover:border-[#2d4a8a]/60 transition-all duration-300 group"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                          style={{ backgroundColor: stat.team.color, boxShadow: `0 4px 20px ${stat.team.color}40` }}
                        >
                          {stat.team.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{stat.team.name}</p>
                          {hasData && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
                              {categoryLabel(stat.category)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(stat.team)}
                          className="w-7 h-7 rounded-lg bg-[#1a2744] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Excluir equipe "${stat.team.name}"?`)) onDelete(stat.team.id); }}
                          className="w-7 h-7 rounded-lg bg-[#1a2744] flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <StatBox label="Concluídos" value={stat.completed_services} unit="" />
                      <StatBox
                        label="Dias Médios"
                        value={hasData ? parseFloat(stat.avg_days_per_service.toFixed(1)) : 0}
                        unit=""
                      />
                      <StatBox label="Score" value={stat.performance_score} unit="pts" />
                    </div>

                    {/* Score bar */}
                    {hasData && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Eficiência</span>
                          <span>{stat.performance_score}%</span>
                        </div>
                        <div className="h-1.5 bg-[#1a2744] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stat.performance_score}%` }}
                            transition={{ delay: 0.3 + idx * 0.05, duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: stat.team.color }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Rank badge */}
                    {hasData && (
                      <div className="mt-3 flex justify-between items-center text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <BarChart2 size={11} />
                          Ranking #{stat.rank}
                        </span>
                        <span>{stat.total_technical_days} dias técnicos</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTeam ? 'Editar Equipe' : 'Nova Equipe'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome da Equipe *</label>
            <input
              className="input-dark"
              placeholder="Ex: Equipe Alpha"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Cor da Equipe</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-7 h-7 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f1729] scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
              />
              <span className="text-xs text-slate-500">Ou escolha uma cor personalizada</span>
            </div>
          </div>
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : editTeam ? 'Salvar' : 'Criar Equipe'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatBox({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="bg-[#080d1a]/60 rounded-xl p-3 text-center border border-[#1a2744]/40">
      <p className="text-lg font-bold text-white">{value}{unit}</p>
      <p className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}
