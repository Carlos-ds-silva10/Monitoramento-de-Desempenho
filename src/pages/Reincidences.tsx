import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Edit2,
  Plus,
  RefreshCw,
  Repeat2,
  Trash2,
  XCircle,
} from 'lucide-react';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { useReincidences } from '../hooks/useReincidences';
import type { ReincidenceStatus, SegmentType, Service, ServiceReincidence } from '../types';

const SEGMENTS: { value: SegmentType; label: string }[] = [
  { value: 'cameras', label: 'Cameras' },
  { value: 'alarme', label: 'Alarme' },
  { value: 'portao', label: 'Portao' },
  { value: 'cerca_eletrica', label: 'Cerca Eletrica' },
  { value: 'controle_acesso', label: 'Controle de Acesso' },
  { value: 'rede', label: 'Rede' },
  { value: 'interfone', label: 'Interfone' },
  { value: 'outro', label: 'Outro' },
];

type SegmentFilter = 'all' | SegmentType;

type FormState = {
  service_id: string;
  title: string;
  description: string;
  affected_segments: SegmentType[];
  opened_at: string;
  status: ReincidenceStatus;
  closed_at: string;
};

interface ReincidencesProps {
  services: Service[];
  onRefresh?: () => void;
}

export default function Reincidences({ services, onRefresh }: ReincidencesProps) {
  const {
    reincidences,
    loading,
    fetchReincidences,
    createReincidence,
    updateReincidence,
    updateReincidenceStatus,
    deleteReincidence,
  } = useReincidences();

  const handleRefresh = async () => {
    await fetchReincidences();
    if (onRefresh) {
      onRefresh();
    }
  };

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReincidenceStatus>('all');
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [editReincidence, setEditReincidence] = useState<ServiceReincidence | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const finalizedServices = useMemo(
    () => services.filter((service) => service.status === 'finalizado'),
    [services]
  );

  const filteredFinalizedServices = useMemo(() => {
    const normalizedSearch = serviceSearch.trim().toLowerCase();

    if (!normalizedSearch) return finalizedServices;

    return finalizedServices.filter((service) => {
      const serviceNumber = String(service.service_number);
      const clientName = service.client_name.toLowerCase();

      return (
        serviceNumber.includes(normalizedSearch) ||
        clientName.includes(normalizedSearch)
      );
    });
  }, [finalizedServices, serviceSearch]);

  const [form, setForm] = useState<FormState>({
    service_id: '',
    title: '',
    description: '',
    affected_segments: [],
    opened_at: new Date().toISOString().slice(0, 10),
    status: 'em_andamento',
    closed_at: '',
  });

  const selectedService = services.find((service) => service.id === form.service_id);
  const availableSegments = selectedService?.segments ?? [];

  const filtered = reincidences.filter((reincidence) => {
    const service = reincidence.service ?? services.find((item) => item.id === reincidence.service_id);
    const searchText = [
      reincidence.title,
      reincidence.description,
      service?.client_name,
      service?.service_number,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || reincidence.status === statusFilter;
    const matchesSegment =
      segmentFilter === 'all' || reincidence.affected_segments.includes(segmentFilter);

    return matchesSearch && matchesStatus && matchesSegment;
  });

  const openCreate = () => {
    setEditReincidence(null);
    setServiceSearch('');
    setForm({
      service_id: finalizedServices[0]?.id ?? '',
      title: '',
      description: '',
      affected_segments: [],
      opened_at: new Date().toISOString().slice(0, 10),
      status: 'em_andamento',
      closed_at: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (reincidence: ServiceReincidence) => {
    setEditReincidence(reincidence);
    setServiceSearch('');
    setForm({
      service_id: reincidence.service_id,
      title: reincidence.title,
      description: reincidence.description,
      affected_segments: reincidence.affected_segments ?? [],
      opened_at: reincidence.opened_at,
      status: reincidence.status,
      closed_at: reincidence.closed_at ?? '',
    });
    setError('');
    setShowModal(true);
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((item) => item.id === serviceId);
    const serviceSegments = service?.segments ?? [];

    setForm((prev) => ({
      ...prev,
      service_id: serviceId,
      affected_segments: prev.affected_segments.filter((segment) =>
        serviceSegments.includes(segment)
      ),
    }));
  };

  const toggleSegment = (segment: SegmentType) => {
    setForm((prev) => {
      const exists = prev.affected_segments.includes(segment);

      return {
        ...prev,
        affected_segments: exists
          ? prev.affected_segments.filter((item) => item !== segment)
          : [...prev.affected_segments, segment],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.service_id) {
      setError('Selecione o servico original finalizado');
      return;
    }

    if (!form.title.trim()) {
      setError('Informe o titulo da reincidencia');
      return;
    }

    if (form.affected_segments.length === 0) {
      setError('Selecione pelo menos um segmento afetado');
      return;
    }

    if (!form.opened_at) {
      setError('Informe a data de abertura');
      return;
    }

    if (form.status === 'finalizado' && !form.closed_at) {
      setError('Informe a data de finalizacao');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editReincidence) {
        await updateReincidence(editReincidence.id, {
          service_id: form.service_id,
          title: form.title,
          description: form.description,
          affected_segments: form.affected_segments,
          opened_at: form.opened_at,
          status: form.status,
          closed_at: form.status === 'finalizado' ? form.closed_at : null,
        });
      } else {
        await createReincidence({
          service_id: form.service_id,
          title: form.title,
          description: form.description,
          affected_segments: form.affected_segments,
          opened_at: form.opened_at,
        });
      }

      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    reincidence: ServiceReincidence,
    status: ReincidenceStatus
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    await updateReincidenceStatus(
      reincidence.id,
      status,
      status === 'finalizado' ? today : null
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Reincidencias"
        subtitle="Acompanhe retornos vinculados aos servicos originais"
        searchValue={search}
        onSearchChange={setSearch}
        onRefresh={handleRefresh}
        loading={loading}
        actions={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={15} />
            Nova Reincidencia
          </button>
        }
      />

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'em_andamento', 'finalizado'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0f1729] border border-[#1e2d4d] text-slate-400 hover:text-slate-200'
                }`}
              >
                {statusLabel(filter)}
              </button>
            ))}

            <span className="ml-auto text-xs text-slate-500">
              {filtered.length} resultado(s)
            </span>
          </div>

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

            {SEGMENTS.map((segment) => (
              <button
                key={segment.value}
                onClick={() => setSegmentFilter(segment.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  segmentFilter === segment.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#0f1729] border border-[#1e2d4d] text-slate-400 hover:text-slate-200'
                }`}
              >
                {segment.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Repeat2}
            title="Nenhuma reincidencia encontrada"
            description="Registre retornos sem reabrir o servico original"
            action={
              <button onClick={openCreate} className="btn-primary">
                <Plus size={14} />
                Nova Reincidencia
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((reincidence, index) => {
                const service =
                  reincidence.service ??
                  services.find((item) => item.id === reincidence.service_id);

                return (
                  <motion.div
                    key={reincidence.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="glass-card-hover p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Repeat2 size={18} className="text-indigo-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white truncate">
                            {reincidence.title}
                          </p>
                          <span className={statusClass(reincidence.status)}>
                            {statusLabel(reincidence.status)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          Servico #{service?.service_number ?? '-'} -{' '}
                          {service?.client_name ?? 'Servico nao encontrado'}
                        </p>
                      

                        {reincidence.description && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                            {reincidence.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-1 mt-3">
                          {reincidence.affected_segments.map((segment) => (
                            <span
                              key={segment}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              {segmentLabel(segment)}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                          <span>Abertura: {formatDate(reincidence.opened_at)}</span>
                          <span>
                            Finalizacao:{' '}
                            {reincidence.closed_at ? formatDate(reincidence.closed_at) : '-'}
                          </span>
                        </div>
                         {reincidence.assigned_team && (
                          <div className="mt-2 text-xs text-blue-400">
                            Equipe Responsável: {reincidence.assigned_team.name}
                            </div> 
                           )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {reincidence.status === 'em_andamento' ? (
                          <button
                            onClick={() => handleStatusChange(reincidence, 'finalizado')}
                            className="w-8 h-8 rounded-lg bg-[#1a2744] flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Finalizar reincidencia"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(reincidence, 'em_andamento')}
                            className="w-8 h-8 rounded-lg bg-[#1a2744] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"
                            title="Reabrir reincidencia"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}

                        <button
                          onClick={() => openEdit(reincidence)}
                          className="w-8 h-8 rounded-lg bg-[#1a2744] flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors"
                          title="Editar reincidencia"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('Excluir reincidencia?')) {
                              deleteReincidence(reincidence.id);
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-[#1a2744] flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                          title="Excluir reincidencia"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editReincidence ? 'Editar Reincidencia' : 'Nova Reincidencia'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">
              Servico original finalizado *
            </label>
            <input
              className="input-dark mb-2"
              placeholder="Pesquisar por cliente ou codigo"
              value={serviceSearch}
              onChange={(event) => setServiceSearch(event.target.value)}
            />
            <select
              className="input-dark"
              value={form.service_id}
              onChange={(event) => handleServiceChange(event.target.value)}
            >
              <option value="">Selecione um servico</option>
              {filteredFinalizedServices.map((service) => (
                <option key={service.id} value={service.id}>
                  #{service.service_number} - {service.client_name}
                </option>
              ))}
            </select>
            {serviceSearch && filteredFinalizedServices.length === 0 && (
              <p className="text-xs text-slate-500 mt-2">
                Nenhum servico finalizado encontrado para essa busca.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">
              Titulo *
            </label>
            <input
              className="input-dark"
              placeholder="Ex: Camera parou de funcionar"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">
              Descricao
            </label>
            <textarea
              className="input-dark min-h-24 resize-none"
              placeholder="Descreva o retorno informado pelo cliente"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">
              Data de abertura *
            </label>
            <input
              type="date"
              className="input-dark"
              value={form.opened_at}
              onChange={(event) =>
                setForm({ ...form, opened_at: event.target.value })
              }
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">
              Segmentos afetados *
            </label>

            {availableSegments.length === 0 ? (
              <p className="text-xs text-slate-500 bg-[#080d1a]/60 border border-[#1e2d4d] rounded-lg px-3 py-2">
                Selecione um servico finalizado com segmentos cadastrados.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableSegments.map((segment) => (
                  <label
                    key={segment}
                    className="flex items-center gap-2 p-2 rounded-lg border border-[#1e2d4d] bg-[#0f1729] cursor-pointer hover:border-blue-500/30"
                  >
                    <input
                      type="checkbox"
                      checked={form.affected_segments.includes(segment)}
                      onChange={() => toggleSegment(segment)}
                    />
                    <span className="text-xs text-slate-300">
                      {segmentLabel(segment)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {editReincidence && (
            <>
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">
                  Status
                </label>
                <select
                  className="input-dark"
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as ReincidenceStatus,
                      closed_at:
                        event.target.value === 'em_andamento' ? '' : form.closed_at,
                    })
                  }
                >
                  <option value="em_andamento">Em Andamento</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>

              {form.status === 'finalizado' && (
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">
                    Data de finalizacao *
                  </label>
                  <input
                    type="date"
                    className="input-dark"
                    value={form.closed_at}
                    onChange={(event) =>
                      setForm({ ...form, closed_at: event.target.value })
                    }
                  />
                </div>
              )}
            </>
          )}

          {finalizedServices.length === 0 && (
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              Nao ha servicos finalizados disponiveis para vincular.
            </p>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              <XCircle size={14} />
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : editReincidence ? 'Salvar' : 'Criar Reincidencia'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function segmentLabel(segment: SegmentType) {
  return SEGMENTS.find((item) => item.value === segment)?.label ?? segment;
}

function statusLabel(status: 'all' | ReincidenceStatus) {
  if (status === 'all') return 'Todos';
  if (status === 'finalizado') return 'Finalizadas';
  return 'Em Andamento';
}

function statusClass(status: ReincidenceStatus) {
  if (status === 'finalizado') {
    return 'px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
  }

  return 'px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20';
}

function formatDate(date: string) {
  if (!date) return '-';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}
