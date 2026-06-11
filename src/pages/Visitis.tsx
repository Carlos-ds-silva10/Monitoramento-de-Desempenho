import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Activity, Calendar, Trash2, Edit2, Filter } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import type { Team, Service, TeamVisit, VisitType } from '../types';

interface VisitsProps {
  visits: TeamVisit[];
  teams: Team[];
  services: Service[];
  loading: boolean;
  onCreate: (serviceId: string, teamId: string, date: string, type: VisitType, notes: string) => Promise<void>;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

const visitTypes: { value: VisitType; label: string }[] = [
  { value: 'inicio', label: 'Início' },
  { value: 'continuacao', label: 'Continuação' },
  { value: 'finalizacao', label: 'Finalização' },
];

function typeStyle(t: VisitType) {
  if (t === 'inicio') return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  if (t === 'finalizacao') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
}

function typeLabel(t: VisitType) {
  if (t === 'inicio') return 'Início';
  if (t === 'finalizacao') return 'Finalização';
  return 'Continuação';
}

function formatDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export default function Visits({ visits, teams, services, loading, onCreate, onUpdate, onDelete, onRefresh }: VisitsProps) {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<VisitType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editVisit, setEditVisit] = useState<TeamVisit | null>(null);
  const [form, setForm] = useState({
    service_id: '',
    team_id: '',
    visit_date: new Date().toISOString().slice(0, 10),
    visit_type: 'continuacao' as VisitType,
    notes: '',
  });
  const [serviceSearch, setServiceSearch] = useState('');
  const filteredServices = services.filter((service) =>
  `${service.service_number} ${service.client_name}`
    .toLowerCase()
    .includes(serviceSearch.toLowerCase()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const filtered = visits.filter((v) => {
    const service = services.find((s) => s.id === v.service_id);
    const team = teams.find((t) => t.id === v.team_id);
    const matchSearch =
      service?.client_name.toLowerCase().includes(search.toLowerCase()) ||
      team?.name.toLowerCase().includes(search.toLowerCase()) ||
      String(service?.service_number).includes(search);
    const matchTeam = !teamFilter || v.team_id === teamFilter;
    const matchType = !typeFilter || v.visit_type === typeFilter;
    return matchSearch && matchTeam && matchType;
  });

  const openCreate = () => {
    setEditVisit(null);
    setForm({ service_id: '', team_id: '', visit_date: new Date().toISOString().slice(0, 10), visit_type: 'continuacao', notes: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (v: TeamVisit) => {
    setEditVisit(v);
    setForm({ service_id: v.service_id, team_id: v.team_id, visit_date: v.visit_date, visit_type: v.visit_type, notes: v.notes });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.service_id) { setError('Selecione o serviço'); return; }
    if (!form.team_id) { setError('Selecione a equipe'); return; }
    if (!form.visit_date) { setError('Informe a data da visita'); return; }
    setSaving(true);
    try {
      if (editVisit) {
        await onUpdate(editVisit.id, { visit_date: form.visit_date, visit_type: form.visit_type, notes: form.notes });
      } else {
        await onCreate(form.service_id, form.team_id, form.visit_date, form.visit_type, form.notes);
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
        title="Registro de Visitas"
        subtitle="Controle de participação das equipes nos serviços"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={onRefresh}
        loading={loading}
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} />
            Nova Visita
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            className="bg-[#0f1729] border border-[#1e2d4d] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="">Todas as equipes</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            className="bg-[#0f1729] border border-[#1e2d4d] rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as VisitType | '')}
          >
            <option value="">Todos os tipos</option>
            {visitTypes.map((vt) => (
              <option key={vt.value} value={vt.value}>{vt.label}</option>
            ))}
          </select>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} resultado(s)</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Nenhuma visita registrada"
            description="Registre a primeira visita de uma equipe a um serviço"
            action={<button onClick={openCreate} className="btn-primary"><Plus size={14} /> Nova Visita</button>}
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((visit, idx) => {
                const service = services.find((s) => s.id === visit.service_id);
                const team = teams.find((t) => t.id === visit.team_id);
                return (
                  <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.02 }}
                    className="glass-card-hover flex items-center gap-4 p-4"
                  >
                    {/* Date */}
                    <div className="w-12 h-12 rounded-xl bg-[#0a0f1e] border border-[#1e2d4d] flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white leading-tight">
                        {visit.visit_date.split('-')[2]}
                      </span>
                      <span className="text-[10px] text-slate-500 leading-tight">
                        {monthAbbr(visit.visit_date.split('-')[1])}
                      </span>
                    </div>

                    {/* Team color dot */}
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: team?.color ?? '#3b82f6' }}
                    />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{team?.name ?? '—'}</p>
                      <p className="text-xs text-slate-500 truncate">
                        #{service?.service_number} — {service?.client_name ?? '—'}
                      </p>
                    </div>

                    {visit.notes && (
                      <p className="text-xs text-slate-500 hidden md:block max-w-xs truncate italic">
                        "{visit.notes}"
                      </p>
                    )}

                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border shrink-0 ${typeStyle(visit.visit_type)}`}>
                      {typeLabel(visit.visit_type)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(visit)}
                        className="w-7 h-7 rounded-lg bg-[#1a2744] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Excluir visita?')) onDelete(visit.id); }}
                        className="w-7 h-7 rounded-lg bg-[#1a2744] flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editVisit ? 'Editar Visita' : 'Nova Visita'}>
        <div className="space-y-4">
          {!editVisit && (
            <>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">
                  Serviço *
                   </label>
                    <input type="text" placeholder="🔍 Pesquisar serviço..." className="input-dark mb-2"
                     value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)}/>
                      <select className="input-dark" value={form.service_id} onChange={(e) =>
                      setForm({ ...form, service_id: e.target.value })}>
                <option value="">Selecione o serviço</option>
                 {filteredServices.map((s) => ( <option key={s.id} value={s.id}> #{s.service_number} — {s.client_name}
                </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">
              Equipe *
              </label>
              <select className="input-dark" value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value 
              })}>
    <option value="">Selecione a equipe</option>
    {teams.map((t) => (
      <option key={t.id} value={t.id}>
        {t.name}
      </option>
    ))}
        </select>
        </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Data da Visita *</label>
            <input
              type="date"
              className="input-dark"
              value={form.visit_date}
              onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Tipo de Visita</label>
            <select
              className="input-dark"
              value={form.visit_type}
              onChange={(e) => setForm({ ...form, visit_type: e.target.value as VisitType })}
            >
              {visitTypes.map((vt) => (
                <option key={vt.value} value={vt.value}>{vt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Observações</label>
            <textarea
              className="input-dark resize-none"
              rows={2}
              placeholder="Opcional..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : editVisit ? 'Salvar' : 'Registrar Visita'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function monthAbbr(m: string) {
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return months[parseInt(m) - 1] ?? m;
}
