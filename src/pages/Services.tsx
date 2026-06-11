import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  ChevronDown,
  Eye,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { buildServiceStats } from '../lib/analytics';
import type { Service, Team, TeamVisit } from '../types';

interface ServicesProps {
  services: Service[];
  teams: Team[];
  visits: TeamVisit[];
  loading: boolean;
  onCreate: (client: string, openedAt: string) => Promise<void>;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export default function Services({
  services,
  teams,
  visits,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  onRefresh,
}: ServicesProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'em_andamento' | 'finalizado'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ client_name: '', service_type: 'instalacao' as 'instalacao' | 'manutencao', opened_at: new Date().toISOString().slice(0, 10), status: 'em_andamento' as const, closed_at: ''});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filtered = services
    .filter((s) => {
      const matchSearch = s.client_name.toLowerCase().includes(search.toLowerCase()) ||
        String(s.service_number).includes(search);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });

  const serviceStats = filtered.map((s) => buildServiceStats(s, visits, teams));

  const openCreate = () => {
    setEditService(null);
    setForm({
  client_name: '',
  service_type: 'instalacao', opened_at: new Date().toISOString().slice(0, 10), status: 'em_andamento', closed_at: ''});
    setError('');
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditService(s);
   setForm({ client_name: s.client_name, service_type: s.service_type, opened_at: s.opened_at, status: s.status, closed_at: s.closed_at ?? ''});
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.client_name.trim()) { setError('Informe o nome do cliente'); return; }
    if (!form.opened_at) { setError('Informe a data de abertura'); return; }
    if (form.status === 'finalizado' && !form.closed_at) { setError('Informe a data de finalização'); return; }
    setSaving(true);
    try {
      if (editService) {
        await onUpdate(editService.id, {
          client_name: form.client_name,
          service_type: form.service_type,
          opened_at: form.opened_at,
          status: form.status,
          closed_at: form.status === 'finalizado' ? form.closed_at : null,
        });
      } else {
        await onCreate( form.client_name, form.opened_at, form.service_type );
      }
      setShowModal(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Gerenciar Serviços"
        subtitle="Cadastre e acompanhe todos os serviços"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={onRefresh}
        loading={loading}
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} />
            Novo Serviço
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'em_andamento', 'finalizado'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0f1729] border border-[#1e2d4d] text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'em_andamento' ? 'Em Andamento' : 'Finalizados'}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-500">{filtered.length} resultado(s)</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Nenhum serviço encontrado"
            description="Cadastre o primeiro serviço clicando no botão acima"
            action={<button onClick={openCreate} className="btn-primary"><Plus size={14} /> Novo Serviço</button>}
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {serviceStats.map((stat, idx) => (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: idx * 0.03 }}
                  className="glass-card-hover overflow-hidden"
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpanded(expanded === stat.id ? null : stat.id)}
                  >
                    {/* Service number */}
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-blue-400">#{stat.service_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white truncate">{stat.client_name}</p>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${ stat.service_type === 'manutencao'
                             ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'
                            }`}>
                                 {stat.service_type === 'manutencao'
                                 ? 'Manutenção'
                                 : 'Instalação'}
                                 </span>
                                 </div>
                                 <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar size={11} /> {formatDate(stat.opened_at)}
                        </span>
                        {stat.technical_days > 0 && (
                          <span className="text-xs text-slate-500">
                            {stat.technical_days} dia(s) técnico(s)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="hidden md:flex items-center gap-1">
                      {stat.participating_teams.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          title={t.name}
                          className="w-6 h-6 rounded-full border-2 border-[#0f1729] flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: t.color }}
                        >
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {stat.participating_teams.length > 3 && (
                        <span className="text-xs text-slate-500">+{stat.participating_teams.length - 3}</span>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 ${
                        stat.status === 'finalizado'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {stat.status === 'finalizado' ? 'Finalizado' : 'Em Andamento'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(stat); }}
                        className="w-7 h-7 rounded-lg bg-[#1a2744] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm('Excluir serviço?')) onDelete(stat.id); }}
                        className="w-7 h-7 rounded-lg bg-[#1a2744] flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                      <ChevronDown
                        size={14}
                        className={`text-slate-500 transition-transform ${expanded === stat.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Expanded */}
                  <AnimatePresence>
                    {expanded === stat.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[#1e2d4d]/60 overflow-hidden"
                      >
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <InfoItem label="Abertura" value={formatDate(stat.opened_at)} />
                          <InfoItem label="Finalização" value={stat.closed_at ? formatDate(stat.closed_at) : '—'} />
                          <InfoItem label="Dias Técnicos" value={`${stat.technical_days} dia(s)`} />
                          <InfoItem label="Equipes" value={`${stat.participating_teams.length} equipe(s)`} />
                        </div>
                        {stat.visits.length > 0 && (
                          <div className="px-4 pb-4 space-y-1.5">
                            <p className="text-xs font-medium text-slate-400 mb-2">Histórico de Visitas</p>
                            {stat.visits
                              .slice()
                              .sort((a, b) => a.visit_date.localeCompare(b.visit_date))
                              .map((v) => {
                                const t = teams.find((t) => t.id === v.team_id);
                                return (
                                  <div key={v.id} className="flex items-center gap-3 text-xs bg-[#080d1a]/60 rounded-lg px-3 py-2">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t?.color ?? '#3b82f6' }} />
                                    <span className="text-slate-300 font-medium">{t?.name ?? '—'}</span>
                                    <span className="text-slate-500">{formatDate(v.visit_date)}</span>
                                    <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${visitTypeStyle(v.visit_type)}`}>
                                      {visitTypeLabel(v.visit_type)}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editService ? 'Editar Serviço' : 'Novo Serviço'}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome do Cliente *</label>
            <input
              className="input-dark"
              placeholder="Ex: Empresa XYZ"
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Data de Abertura *</label>
            <input
              type="date"
              className="input-dark"
              value={form.opened_at}
              onChange={(e) => setForm({ ...form, opened_at: e.target.value })}
            />
          </div>
          <div>
  <label className="text-xs text-slate-400 font-medium block mb-1.5">
    Tipo de Serviço
  </label>

  <select
    className="input-dark"
    value={form.service_type}
    onChange={(e) =>
      setForm({
        ...form,
        service_type: e.target.value as 'instalacao' | 'manutencao',
      })
    }
  >
    <option value="instalacao">Instalação</option>
    <option value="manutencao">Manutenção</option>
  </select>
            </div>
          {editService && (
            <>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Status</label>
                <select
                  className="input-dark"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                >
                  <option value="em_andamento">Em Andamento</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
              {form.status === 'finalizado' && (
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Data de Finalização *</label>
                  <input
                    type="date"
                    className="input-dark"
                    value={form.closed_at}
                    onChange={(e) => setForm({ ...form, closed_at: e.target.value })}
                  />
                </div>
              )}
            </>
          )}
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : editService ? 'Salvar' : 'Criar Serviço'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-600 mb-0.5">{label}</p>
      <p className="text-slate-300 font-medium">{value}</p>
    </div>
  );
}

function formatDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function visitTypeLabel(t: string) {
  if (t === 'inicio') return 'Início';
  if (t === 'finalizacao') return 'Finalização';
  return 'Continuação';
}

function visitTypeStyle(t: string) {
  if (t === 'inicio') return 'bg-blue-500/10 text-blue-400';
  if (t === 'finalizacao') return 'bg-emerald-500/10 text-emerald-400';
  return 'bg-orange-500/10 text-orange-400';
}
