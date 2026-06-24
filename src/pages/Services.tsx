import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Briefcase,
  Calendar,
  Repeat2,
  Trash2,
  Edit2,
  ChevronDown,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { buildServiceStats } from '../lib/analytics';
import { useReincidences } from '../hooks/useReincidences';
import type { Service, Team, TeamVisit } from '../types';

const SEGMENTS = [
  { value: 'cameras', label: 'Câmeras' },
  { value: 'alarme', label: 'Alarme' },
  { value: 'portao', label: 'Portão' },
  { value: 'cerca_eletrica', label: 'Cerca Elétrica' },
  { value: 'controle_acesso', label: 'Controle de Acesso' },
  { value: 'rede', label: 'Rede' },
  { value: 'interfone', label: 'Interfone' },
  { value: 'outro', label: 'Outro' },
];
type SegmentType = (typeof SEGMENTS)[number]['value'];

interface ServicesProps {
  services: Service[];
  teams: Team[];
  visits: TeamVisit[];
  loading: boolean;
  onCreate: (
  client: string,
  openedAt: string,
  serviceType: 'instalacao' | 'manutencao',
  segments: string[]
) => Promise<void>;
  onUpdate: (
    id: string,
    data: {
      client_name?: string;
      service_type?: 'instalacao' | 'manutencao';
      segments?: string[];
      opened_at?: string;
      status?: ServiceStatus;
      closed_at?: string | null;
    }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

type ServiceStatus = 'em_andamento' | 'finalizado';

type FormState = {
  client_name: string;
  service_type: 'instalacao' | 'manutencao';
  segments: string[];
  opened_at: string;
  status: ServiceStatus;
  closed_at: string;
};

type ReincidenceFormState = {
  title: string;
  description: string;
  affected_segments: SegmentType[];
  opened_at: string;
};
function getSegmentStatus(segment: string, serviceVisits: TeamVisit[]) {
  const visitsWithSegment = serviceVisits.filter((v) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    v.segments_worked?.includes(segment as any)
  );

  const hasFinalization = visitsWithSegment.some(
    (v) => v.visit_type === 'finalizacao'
  );
  if (hasFinalization) return 'completed';
  if (visitsWithSegment.length > 0) return 'progress';
  return 'pending';
}

function getSegmentBadge(status: string) {
  switch (status) {
    case 'completed':
      return {
        icon: '✅',
        label: 'Concluído',
        className:
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      };

    case 'progress':
      return {
        icon: '⏳',
        label: 'Em andamento',
        className:
          'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      };

    default:
      return {
        icon: '⚪',
        label: 'Pendente',
        className:
          'bg-slate-500/10 text-slate-400 border border-slate-500/20',
      };
  }
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
  const getTeamById = (id?: string | null) => {
  if (!id) return undefined;
  return teams.find((t) => t.id === id);
};
  const { reincidences, createReincidence, findLastResponsibleVisit } = useReincidences();
const getServiceReincidences = (serviceId: string) => {
  return reincidences.filter( (r) => r.service_id === serviceId);};
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | 'em_andamento' | 'finalizado'>('all');
    const [segmentFilter, setSegmentFilter] = useState<'all' | SegmentType>('all');

  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showReincidenceModal, setShowReincidenceModal] = useState(false);

const [selectedService, setSelectedService] =
  useState<Service | null>(null);

const [reincidenceForm, setReincidenceForm] =
  useState<ReincidenceFormState>({
    title: '',
    description: '',
    affected_segments: [],
    opened_at: new Date().toISOString().slice(0, 10),
  });

  const [form, setForm] = useState<FormState>({
    client_name: '',
    service_type: 'instalacao',
    segments: [],
    opened_at: new Date().toISOString().slice(0, 10),
    status: 'em_andamento',
    closed_at: '',
  });

  // FUNÇÃO PARA SEGMENTS
  const toggleSegment = (value: string) => {
    setForm((prev) => {
      const exists = prev.segments.includes(value);

      return {
        ...prev,
        segments: exists
          ? prev.segments.filter((s) => s !== value)
          : [...prev.segments, value],
      };
    });
  };
const filtered = services.filter((s) => {
  const matchSearch =
    s.client_name.toLowerCase().includes(search.toLowerCase()) ||
    String(s.service_number).includes(search);

  const matchStatus =
    statusFilter === 'all' || s.status === statusFilter;

  const matchSegment =
    segmentFilter === 'all'
      ? true
      : (s.segments as SegmentType[]).includes(segmentFilter);

  return matchSearch && matchStatus && matchSegment;
});
  const serviceStats = filtered.map((s) => buildServiceStats(s, visits, teams));

 const openCreate = () => {
  setEditService(null);

  setForm({
    client_name: '',
    service_type: 'instalacao',
    segments: [],
    opened_at: new Date().toISOString().slice(0, 10),
    status: 'em_andamento',
    closed_at: '',
  });

  setError('');
  setShowModal(true);
};

  const openEdit = (s: Service) => {
  setEditService(s);

  setForm({
    client_name: s.client_name,
    service_type: s.service_type,
    segments: s.segments ?? [],
    opened_at: s.opened_at,
    status: s.status,
    closed_at: s.closed_at ?? '',
  });

  setError('');
  setShowModal(true);
};
const openReincidence = (service: Service) => {
  setSelectedService(service);

  setReincidenceForm({
    title: '',
    description: '',
    affected_segments: [],
    opened_at: new Date().toISOString().slice(0, 10),
  });

  setError('');
  setShowReincidenceModal(true);
};

const handleCreateReincidence = async () => {
  if (!selectedService) return;
  if (!reincidenceForm.title.trim()) {
    setError('Informe o título da reincidência');
    return;
  }

  if (reincidenceForm.affected_segments.length === 0) {
    setError('Selecione pelo menos um segmento afetado');
    return;
  }

  if (!reincidenceForm.opened_at) {
    setError('Informe a data de abertura');
    return;
  }

  setSaving(true);
  setError('');

  try {
    const visit = await findLastResponsibleVisit(
      selectedService.id,
      reincidenceForm.affected_segments
    );
    if (!visit) {
      setError(
        'Nenhuma equipe encontrada para os segmentos selecionados'
      );
      return;
    }

    await createReincidence({
      service_id: selectedService.id,
      title: reincidenceForm.title,
      description: reincidenceForm.description,
      // @ts-ignore
      affected_segments: reincidenceForm.affected_segments as unknown as SegmentType[],
      opened_at: reincidenceForm.opened_at,

      assigned_team_id: visit.team_id,
      origin_visit_id: visit.id,
    });

    setShowReincidenceModal(false);
  } catch (err: unknown) {
    setError(
      err instanceof Error
        ? err.message
        : 'Erro ao criar reincidência'
    );
  } finally {
    setSaving(false);
  }
};

  const handleSubmit = async () => {
    if (form.segments.length === 0) {
  setError('Selecione pelo menos um segmento');return;
      }
    if (!form.client_name.trim()) { setError('Informe o nome do cliente'); return;
     }
    if (!form.opened_at) { setError('Informe a data de abertura'); return; 
    }
    if (form.status === 'finalizado' && !form.closed_at) { setError('Informe a data de finalização'); return;
    }
    setSaving(true);
    try {
      if (editService) {
       await onUpdate(editService.id, {
  client_name: form.client_name,
  service_type: form.service_type,
  segments: form.segments,
  opened_at: form.opened_at,
  status: form.status,
  closed_at:
    form.status === 'finalizado'
      ? form.closed_at
      : null,
    });
      } else {
        await onCreate(
  form.client_name,
  form.opened_at,
  form.service_type,
  form.segments
);
      }
      setShowModal(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar serviço');
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
<div className="space-y-3">

  {/* Status */}
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
        {f === 'all'
          ? 'Todos'
          : f === 'em_andamento'
          ? 'Em Andamento'
          : 'Finalizados'}
      </button>
    ))}

    <span className="ml-auto text-xs text-slate-500">
      {filtered.length} resultado(s)
    </span>
  </div>

  {/* Segmentos */}
  <div className="flex flex-wrap gap-2">
    <button
      onClick={() => setSegmentFilter('all')}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
        segmentFilter === 'all'
          ? 'bg-indigo-600 text-white'
          : 'bg-[#0f1729] border border-[#1e2d4d] text-slate-400 hover:text-slate-200'
      }`}
    >
      Todos Segmentos
    </button>

    {SEGMENTS.map((seg) => (
      <button
        key={seg.value}
        onClick={() => setSegmentFilter(seg.value as SegmentType)}
        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
          segmentFilter === seg.value
            ? 'bg-indigo-600 text-white'
            : 'bg-[#0f1729] border border-[#1e2d4d] text-slate-400 hover:text-slate-200'
        }`}
      >
        {seg.label}
      </button>
    ))}
  </div>

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
    <p className="text-sm font-semibold text-white truncate">
      {stat.client_name}
    </p>

    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        stat.service_type === 'manutencao'
          ? 'bg-yellow-500/10 text-yellow-400'
          : 'bg-blue-500/10 text-blue-400'
      }`}
    >
      {stat.service_type === 'manutencao' ? 'Manutenção' : 'Instalação'}
    </span>
  </div>

  {/* 👇SEGMENTOS */}
  {stat.segments?.length > 0 && (
    <div className="flex flex-wrap gap-1 mt-1">
      {stat.segments.map((seg) => {
        const label = SEGMENTS.find((s) => s.value === seg)?.label;

        return (
          <span
            key={seg}
            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
          >
            {label}
          </span>
        );
      })}
    </div>
  )}

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

<div className="px-4 pb-4">
  <button
    onClick={() => openReincidence(stat)}
    className="btn-secondary flex items-center gap-2"
  >
    <Repeat2 size={14} />
    Abrir Reincidência
  </button>                
</div>
{getServiceReincidences(stat.id).length > 0 && (
  <div className="px-4 pb-4">
    <p className="text-xs font-medium text-slate-400 mb-2">
      Reincidências
    </p>

    <div className="space-y-2">
      {getServiceReincidences(stat.id).map((r) => (
       <div key={r.id} className="bg-[#080d1a]/60 rounded-lg px-3 py-2">
  
  <div className="flex items-center justify-between">
    <span className="text-xs text-white font-medium">
      {r.title}
    </span>

    <span
      className={`text-[10px] px-2 py-0.5 rounded ${
        r.status === 'finalizado'
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-blue-500/10 text-blue-400'
      }`}
    >
      {r.status === 'finalizado' ? 'Finalizada' : 'Em andamento'}
    </span>
  </div>

  {/*equipe responsável */}
  <div className="mt-2 text-xs text-blue-400">
    Equipe responsável:{' '}
    <span className="text-slate-200 font-medium">
      {getTeamById(r.assigned_team_id)?.name ?? 'Não encontrada'}
    </span>
  </div>

</div>
      ))}
    </div>
  </div>
)}
<div className="px-4 pb-4">
  <p className="text-xs font-medium text-slate-400 mb-2">
    Progresso dos Segmentos
  </p>
  <div className="space-y-2">
    {stat.segments?.map((segment) => {
      const status = getSegmentStatus(
        segment,
        stat.visits
      );

      const badge = getSegmentBadge(status);

      const segmentLabel =
        SEGMENTS.find((s) => s.value === segment)?.label ??
        segment;

      return (
        <div
          key={segment}
          className="flex items-center justify-between bg-[#080d1a]/40 rounded-lg px-3 py-2"
        >
          <span className="text-xs text-slate-300">
            {segmentLabel}
          </span>

          <span
            className={`px-2 py-1 rounded-md text-[10px] font-medium ${badge.className}`}
          >
            {badge.icon} {badge.label}
          </span>
        </div>
      );
    })}
  </div>
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
                                    <div className="ml-auto flex items-center gap-1 flex-wrap justify-end">
  <span
    className={`px-2 py-0.5 rounded text-xs font-medium ${visitTypeStyle(v.visit_type)}`}
  >
    {visitTypeLabel(v.visit_type)}
  </span>

  {v.segments_worked?.map((seg) => {
    const label =
      SEGMENTS.find((s) => s.value === seg)?.label ?? seg;

    return (
      <span
        key={seg}
        className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20"
      >
        {label}
      </span>
    );
  })}
</div>
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

{/*SEGMENTOS */}
<div>
  <label className="text-xs text-slate-400 font-medium block mb-1.5">
    Segmentos
  </label>

  <div className="grid grid-cols-2 gap-2">
    {SEGMENTS.map((seg) => (
      <label
        key={seg.value}
        className="flex items-center gap-2 p-2 rounded-lg border border-[#1e2d4d] bg-[#0f1729] cursor-pointer hover:border-blue-500/30"
      >
        <input
          type="checkbox"
          checked={form.segments.includes(seg.value)}
          onChange={() => toggleSegment(seg.value)}
        />
        <span className="text-xs text-slate-300">{seg.label}</span>
      </label>
    ))}
  </div>

  {form.segments.length > 0 && (
    <div className="flex flex-wrap gap-1 mt-2">
      {form.segments.map((seg) => {
        const label = SEGMENTS.find((s) => s.value === seg)?.label;

        return (
          <span
            key={seg}
            className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
          >
            {label}
          </span>
        );
      })}
    </div>
  )}
</div>
          {editService && (
            <>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Status</label>
                <select
                  className="input-dark"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ServiceStatus })}
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

      {/* Modal de Reincidência */}
      <Modal
        isOpen={showReincidenceModal}
        onClose={() => setShowReincidenceModal(false)}
        title="Abrir Reincidência"
      >
        <div className="space-y-4">
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Serviço: #{selectedService?.service_number} — {selectedService?.client_name}
            </p>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Título *</label>
            <input
              className="input-dark"
              placeholder="Ex: Câmera parou de funcionar"
              value={reincidenceForm.title}
              onChange={(e) => setReincidenceForm({ ...reincidenceForm, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Descrição</label>
            <textarea
              className="input-dark min-h-20 resize-none"
              placeholder="Descreva o problema relatado"
              value={reincidenceForm.description}
              onChange={(e) => setReincidenceForm({ ...reincidenceForm, description: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Data de Abertura *</label>
            <input
              type="date"
              className="input-dark"
              value={reincidenceForm.opened_at}
              onChange={(e) => setReincidenceForm({ ...reincidenceForm, opened_at: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Segmentos Afetados *</label>
            <div className="grid grid-cols-2 gap-2">
              {selectedService?.segments?.map((seg) => {
                const label = SEGMENTS.find((s) => s.value === seg)?.label ?? seg;
                return (
                  <label
                    key={seg}
                    className="flex items-center gap-2 p-2 rounded-lg border border-[#1e2d4d] bg-[#0f1729] cursor-pointer hover:border-blue-500/30"
                  >
                    <input
                      type="checkbox"
                      checked={reincidenceForm.affected_segments.includes(seg)}
                      onChange={() => {
                        const exists = reincidenceForm.affected_segments.includes(seg);
                        setReincidenceForm({
                          ...reincidenceForm,
                          affected_segments: exists
                            ? reincidenceForm.affected_segments.filter((s) => s !== seg)
                            : [...reincidenceForm.affected_segments, seg],
                        });
                      }}
                    />
                    <span className="text-xs text-slate-300">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowReincidenceModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleCreateReincidence} disabled={saving} className="btn-primary">
              {saving ? 'Abrindo...' : 'Abrir Reincidência'}
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
