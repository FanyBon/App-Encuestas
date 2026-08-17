import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  History,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  Sun,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  browserSessionPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, firebaseConfig } from './services/firebase';
import { SUCURSALES_BASE } from './constants/sucursales';
import { PREGUNTAS_COCINA, PREGUNTAS_USUARIO } from './constants/preguntas';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'sucursales', label: 'Sucursales', icon: Building2 },
  { id: 'encuestas', label: 'Historial', icon: History },
  { id: 'plantillas', label: 'Plantillas', icon: FileText },
  { id: 'reportes', label: 'Reportes', icon: Bell },
];

const ROLE_OPTIONS = ['admin', 'gestor', 'usuario', 'cocina', 'calidad', 'movilidad', 'logistica'];
const BAD_ANSWERS = ['no', 'no cumple', 'malo', 'incorrecta', 'sucios', 'demasiado', 'encontre', 'excesivamente'];
const MID_ANSWERS = ['regular', 'parcial', 'a veces', 'podria'];

const emptyUserForm = {
  nombre: '',
  email: '',
  password: '',
  rol: 'usuario',
  sucursalId: 'sucursal_1',
};

const emptyBranchForm = {
  codigo: '',
  nombre: '',
  direccion: '',
  latitud: '',
  longitud: '',
  radioMetros: 200,
  activa: true,
};

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function answerScore(value) {
  const v = normalize(value);
  if (!v || v.length > 80) return null;
  if (BAD_ANSWERS.some((word) => v.includes(word))) return 15;
  if (MID_ANSWERS.some((word) => v.includes(word))) return 55;
  return 100;
}

function surveyScores(encuestas) {
  const scores = encuestas.flatMap((encuesta) => {
    const respuestas = encuesta.respuestas || {};
    return Object.values(respuestas)
      .map(answerScore)
      .filter((score) => score !== null);
  });
  const promedio = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const negativas = scores.filter((score) => score <= 35).length;
  const tasaNegativa = scores.length ? Math.round((negativas / scores.length) * 100) : 0;
  return { promedio, negativas, total: scores.length, tasaNegativa };
}

function branchHealth(branch, encuestas, reportes) {
  const encuestasSucursal = encuestas.filter((e) => e.sucursalId === branch.id);
  const reportesSucursal = reportes.filter((r) => r.sucursalId === branch.id);
  const unread = reportesSucursal.filter((r) => !r.leido).length;
  const score = surveyScores(encuestasSucursal);
  let estado = 'normal';
  if (unread >= 5 || score.promedio < 55 || score.tasaNegativa >= 45) estado = 'critica';
  else if (unread >= 2 || score.promedio < 70 || score.tasaNegativa >= 30) estado = 'preocupante';
  return {
    ...branch,
    estado,
    encuestas: encuestasSucursal.length,
    reportes: reportesSucursal.length,
    reportesNoLeidos: unread,
    satisfaccion: score.promedio,
    tasaNegativa: score.tasaNegativa,
  };
}

function sortByDateDesc(items, field) {
  return [...items].sort((a, b) => (toDate(b[field])?.getTime() || 0) - (toDate(a[field])?.getTime() || 0));
}

const PREGUNTAS_POR_ROL = {
  cocina: PREGUNTAS_COCINA,
  usuario: PREGUNTAS_USUARIO,
};

function resolveQuestionLabel(encuesta, questionId, plantillas) {
  if (encuesta.plantillaId) {
    const plantilla = plantillas?.find((p) => p.id === encuesta.plantillaId);
    const pregunta = plantilla?.preguntas?.find((p) => p.id === questionId);
    if (pregunta?.texto) return pregunta.texto;
  }
  const lista = PREGUNTAS_POR_ROL[encuesta.rol];
  const pregunta = lista?.find((p) => p.id === questionId);
  if (pregunta?.texto) return pregunta.texto;
  return questionId;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Los inputs type="date" entregan 'YYYY-MM-DD'. new Date('YYYY-MM-DD') lo interpreta
// como medianoche UTC, lo que en zonas horarias negativas (México) corre el dia un
// dia hacia atras al convertirlo a hora local. Por eso se construye la fecha local
// a partir de sus partes en vez de dejar que el motor de JS la interprete como UTC.
function parseLocalDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function quickRangeBounds(rangeId) {
  const now = new Date();
  if (rangeId === 'hoy') {
    return { from: startOfDay(now), to: now };
  }
  if (rangeId === 'semana') {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 6);
    return { from, to: now };
  }
  if (rangeId === 'mes') {
    const from = startOfDay(now);
    from.setDate(from.getDate() - 29);
    return { from, to: now };
  }
  return null;
}

function isWithinDateFilter(value, { quickRange, fromDate, toDate: toDateValue, fromHour, toHour }) {
  const date = toDate(value);
  if (!date) return false;
  if (quickRange && quickRange !== 'todas') {
    const bounds = quickRangeBounds(quickRange);
    if (bounds && (date < bounds.from || date > bounds.to)) return false;
  }
  if (fromDate) {
    const from = startOfDay(parseLocalDate(fromDate));
    if (date < from) return false;
  }
  if (toDateValue) {
    const to = parseLocalDate(toDateValue);
    to.setHours(23, 59, 59, 999);
    if (date > to) return false;
  }
  if (fromHour !== '' && fromHour != null) {
    if (date.getHours() < Number(fromHour)) return false;
  }
  if (toHour !== '' && toHour != null) {
    if (date.getHours() > Number(toHour)) return false;
  }
  return true;
}

function AnimatedNumber({ value, duration = 700 }) {
  const [display, setDisplay] = useState(value || 0);
  const fromRef = useRef(value || 0);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value || 0;
    if (from === to) return;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className="animated-number">{display}</span>;
}

function DateFilterBar({ filter, setFilter, showHours = false }) {
  const ranges = [
    { id: 'todas', label: 'Todas' },
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: '7 días' },
    { id: 'mes', label: '30 días' },
  ];
  return (
    <div className="date-filter-bar">
      <div className="quick-ranges">
        {ranges.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`filter-btn ${filter.quickRange === r.id ? 'active' : ''}`}
            onClick={() => setFilter({ ...filter, quickRange: r.id, fromDate: '', toDate: '' })}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="manual-range">
        <label>
          Desde
          <input
            type="date"
            value={filter.fromDate}
            onChange={(e) => setFilter({ ...filter, fromDate: e.target.value, quickRange: 'todas' })}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={filter.toDate}
            onChange={(e) => setFilter({ ...filter, toDate: e.target.value, quickRange: 'todas' })}
          />
        </label>
        {showHours && (
          <>
            <label>
              Hora desde
              <select value={filter.fromHour} onChange={(e) => setFilter({ ...filter, fromHour: e.target.value })}>
                <option value="">--</option>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </label>
            <label>
              Hora hasta
              <select value={filter.toHour} onChange={(e) => setFilter({ ...filter, toHour: e.target.value })}>
                <option value="">--</option>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </label>
          </>
        )}
      </div>
    </div>
  );
}

const emptyDateFilter = { quickRange: 'todas', fromDate: '', toDate: '', fromHour: '', toHour: '' };


function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch (error) {
      setMessage('Correo o contrasena incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setMessage('Escribe tu correo para recuperar la contrasena.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setMessage('Te enviamos un correo de recuperacion.');
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">P</div>
        <h1>PROCOMIN Admin</h1>
        <p>Panel operativo para sucursales, usuarios, encuestas y alertas.</p>
        <form onSubmit={handleLogin} className="login-form">
          <label>
            Correo corporativo
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tu@procomin.mx" />
          </label>
          <label>
            Contrasena
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Ingresa tu contrasena" />
          </label>
          {message && <div className="form-message">{message}</div>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={18} /> : <Shield size={18} />}
            Iniciar sesion
          </button>
          <button className="text-button" type="button" onClick={resetPassword}>
            Recuperar contrasena
          </button>
        </form>
      </section>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, tone = 'violet', hint }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-top">
        <Icon size={19} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
}

function Dashboard({ data, branchesHealth, setTab }) {
  const score = surveyScores(data.encuestas);
  const unreadReports = data.reportes.filter((r) => !r.leido).length;
  const byBranch = branchesHealth.map((b) => ({
    name: b.nombre.replace(' PROCOMIN', ''),
    satisfaccion: b.satisfaccion,
    reportes: b.reportesNoLeidos,
  }));
  const byRole = Object.entries(
    data.usuarios.reduce((acc, user) => {
      const rol = user.rol || 'sin rol';
      acc[rol] = (acc[rol] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));
  const alerts = branchesHealth.filter((b) => b.estado !== 'normal');

  const barColor = (satisfaccion) => {
    if (satisfaccion >= 75) return '#00b894';
    if (satisfaccion >= 50) return '#ff9e71';
    return '#c4607a';
  };

  const recentActivity = sortByDateDesc(data.encuestas, 'fechaEnvio').slice(0, 5);

  return (
    <div className="page-grid">
      <div className="metrics-grid">
        <button className="metric-link" onClick={() => setTab('encuestas')}>
          <MetricCard icon={CheckCircle2} label="Satisfaccion" value={`${score.promedio || 0}%`} hint={`${score.total} respuestas evaluadas`} tone="green" />
        </button>
        <button className="metric-link" onClick={() => setTab('usuarios')}>
          <MetricCard icon={Users} label="Usuarios" value={data.usuarios.length} hint="Todos los perfiles" tone="orange" />
        </button>
        <button className="metric-link" onClick={() => setTab('sucursales')}>
          <MetricCard icon={Building2} label="Sucursales" value={data.sucursales.length} hint={`${alerts.length} en alerta`} tone="violet" />
        </button>
        <button className="metric-link" onClick={() => setTab('reportes')}>
          <MetricCard icon={Bell} label="Reportes no leidos" value={unreadReports} hint={`${data.reportes.length} reportes totales`} tone="red" />
        </button>
      </div>

      {/* Gráfica satisfacción por sucursal */}
      <section className="panel wide">
        <div className="panel-heading">
          <div>
            <h2>Satisfaccion por sucursal</h2>
            <p>Promedio calculado con respuestas positivas, regulares y negativas.</p>
          </div>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byBranch} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0e8f0" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 13, fill: '#9a8a96' }} />
              <YAxis tickLine={false} axisLine={false} domain={[0, 100]} tick={{ fontSize: 12, fill: '#9a8a96' }} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #ede8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                formatter={(value) => [`${value}%`, 'Satisfacción']}
              />
              <Bar dataKey="satisfaccion" radius={[8, 8, 0, 0]}>
                {byBranch.map((entry, index) => (
                  <Cell key={index} fill={barColor(entry.satisfaccion)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Usuarios por rol */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Usuarios por rol</h2>
            <p>Distribucion actual de perfiles.</p>
          </div>
        </div>
        <div className="chart-box compact">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byRole} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {byRole.map((entry, index) => (
                  <Cell key={entry.name} fill={['#3d263a', '#ff9e71', '#00b894', '#7c5cbf', '#c4607a'][index % 5]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #ede8f0' }}
                formatter={(value, name) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Alertas — respetando lógica original */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Alertas</h2>
            <p>Sucursales que requieren revision.</p>
          </div>
          <AlertTriangle size={18} color="#ff9e71" />
        </div>
        <div className="alert-list">
          {alerts.length === 0 ? (
            <div className="empty-state">No hay sucursales preocupantes por ahora.</div>
          ) : (
            alerts.map((branch) => <BranchAlert key={branch.id} branch={branch} />)
          )}
        </div>
      </section>

      {/* Actividad reciente con avatares */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Actividad reciente</h2>
            <p>Ultimos movimientos del sistema.</p>
          </div>
        </div>
        <div className="activity-list">
          {recentActivity.length === 0 ? (
            <div className="empty-state">Sin actividad reciente.</div>
          ) : recentActivity.map((e) => (
            <div key={e.id} className="activity-row">
              <div className="activity-avatar">
                {(e.userName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="activity-info">
                <strong>{e.userName || 'Sin nombre'}</strong>
                <span>{e.sucursalNombre || e.sucursalId || 'Sin sucursal'}</span>
              </div>
              <span className="activity-date">
                {toDate(e.fechaEnvio)?.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) || ''}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BranchAlert({ branch }) {
  return (
    <article className={`alert-item ${branch.estado}`}>
      <AlertTriangle size={18} />
      <div>
        <strong>{branch.nombre}</strong>
        <span>
          {branch.estado === 'critica' ? 'Critica' : 'Preocupante'} · {branch.satisfaccion || 0}% satisfaccion · {branch.reportesNoLeidos} reportes no leidos
        </span>
      </div>
    </article>
  );
}

function DataTable({ columns, rows, empty = 'Sin datos para mostrar.' }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="empty-cell">{empty}</td></tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function UsersPage({ data, refresh, canAdmin }) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyUserForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const filtered = data.usuarios.filter((user) => {
    const haystack = normalize(`${user.nombre} ${user.email} ${user.rol} ${user.sucursalId}`);
    return haystack.includes(normalize(query));
  });

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          returnSecureToken: true,
        }),
      });
      const payload = await res.json();
      if (payload.error) throw new Error(payload.error.message);
      await setDoc(doc(db, 'usuarios', payload.localId), {
        nombre: form.nombre.trim(),
        email: form.email.trim().toLowerCase(),
        rol: form.rol.trim().toLowerCase(),
        sucursalId: form.sucursalId,
        creadoEn: serverTimestamp(),
      });
      setForm({ ...emptyUserForm, sucursalId: data.sucursales[0]?.id || 'sucursal_1' });
      setMessage('Usuario creado correctamente.');
      await refresh();
    } catch (error) {
      setMessage(error.message?.includes('EMAIL_EXISTS') ? 'Ese correo ya esta registrado.' : error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async (user, changes) => {
    await updateDoc(doc(db, 'usuarios', user.id), changes);
    await refresh();
  };

  return (
    <div className="two-column">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Crear usuario</h2>
            <p>Alta para administradores, gestores, cocina y usuarios generales.</p>
          </div>
          <UserPlus size={20} color="#9a8a96" />
        </div>
        <form className="stack-form" onSubmit={createUser}>
          <label>Nombre<input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" /></label>
          <label>Correo<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@procomin.mx" /></label>
          <label>Contraseña temporal<input required minLength={6} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••••" /></label>
          <div className="form-grid">
            <label>Rol
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label>Sucursal
              <select value={form.sucursalId} onChange={(e) => setForm({ ...form, sucursalId: e.target.value })}>
                {data.sucursales.map((branch) => <option key={branch.id} value={branch.id}>{branch.nombre}</option>)}
              </select>
            </label>
          </div>
          {message && <div className="form-message">{message}</div>}
          <button className="primary-button" disabled={saving || !canAdmin}>
            {saving ? <Loader2 className="spin" size={18} /> : <UserPlus size={18} />}
            Crear usuario
          </button>
        </form>
      </section>

      <section className="panel wide-list">
        <div className="panel-heading">
          <div>
            <h2>Usuarios</h2>
            <p>{filtered.length} registros encontrados.</p>
          </div>
          <div className="search-field">
            <Search size={16} color="#9a8a96" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." />
          </div>
        </div>
        <div className="user-list">
          {filtered.map((user) => (
            <article className="user-row" key={user.id}>
              <div className="avatar">{user.nombre?.[0]?.toUpperCase() || '?'}</div>
              <div>
                <strong>{user.nombre || 'Sin nombre'}</strong>
                <span>{user.email}</span>
              </div>
              <select value={user.rol || ''} onChange={(e) => updateRole(user, { rol: e.target.value })} disabled={!canAdmin}>
                {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <select value={user.sucursalId || ''} onChange={(e) => updateRole(user, { sucursalId: e.target.value })} disabled={!canAdmin}>
                <option value="">Sin sucursal</option>
                {data.sucursales.map((branch) => <option key={branch.id} value={branch.id}>{branch.nombre}</option>)}
              </select>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function BranchesPage({ data, branchesHealth, refresh, canAdmin }) {
  const [form, setForm] = useState(emptyBranchForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const saveBranch = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const id = form.codigo.trim().toLowerCase().replace(/\s+/g, '_');
      await setDoc(doc(db, 'sucursales', id), {
        codigo: id,
        nombre: form.nombre.trim(),
        direccion: form.direccion.trim() || 'Pendiente confirmar',
        latitud: Number(form.latitud) || null,
        longitud: Number(form.longitud) || null,
        radioMetros: Number(form.radioMetros) || 200,
        activa: !!form.activa,
        fechaCreacion: serverTimestamp(),
      }, { merge: true });
      setForm(emptyBranchForm);
      setMessage('Sucursal guardada correctamente.');
      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const seedBranches = async () => {
    setSaving(true);
    try {
      await Promise.all(SUCURSALES_BASE.map((branch) => (
        setDoc(doc(db, 'sucursales', branch.id), {
          ...branch,
          fechaCreacion: serverTimestamp(),
        }, { merge: true })
      )));
      setMessage('Sucursales base sincronizadas en Firestore.');
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="two-column">
      {selectedBranchId ? (
        <BranchDetailPage
          branch={branchesHealth.find((b) => b.id === selectedBranchId)}
          data={data}
          refresh={refresh}
          onBack={() => setSelectedBranchId(null)}
        />
      ) : (
      <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Nueva sucursal</h2>
            <p>Esta coleccion reemplaza el arreglo fijo de la app cuando migremos mobile.</p>
          </div>
          <Building2 size={20} color="#9a8a96" />
        </div>
        <form className="stack-form" onSubmit={saveBranch}>
          <label>Codigo<input required value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="sucursal_3" /></label>
          <label>Nombre<input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Sucursal 3 PROCOMIN" /></label>
          <label>Direccion<input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} /></label>
          <div className="form-grid">
            <label>Latitud<input value={form.latitud} onChange={(e) => setForm({ ...form, latitud: e.target.value })} /></label>
            <label>Longitud<input value={form.longitud} onChange={(e) => setForm({ ...form, longitud: e.target.value })} /></label>
          </div>
          <label>Radio metros<input type="number" value={form.radioMetros} onChange={(e) => setForm({ ...form, radioMetros: e.target.value })} /></label>
          <label className="check-line">
            <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
            Sucursal activa
          </label>
          {message && <div className="form-message">{message}</div>}
          <button className="primary-button" disabled={saving || !canAdmin}>
            {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
            Guardar
          </button>
          <button className="secondary-button" type="button" onClick={seedBranches} disabled={saving || !canAdmin}>
            Sincronizar sucursales base
          </button>
        </form>
      </section>

      <section className="panel wide-list">
        <div className="panel-heading">
          <div>
            <h2>Sucursales</h2>
            <p>Estado calculado con satisfaccion y reportes no leidos. Da clic en una para ver su detalle.</p>
          </div>
        </div>
        <div className="branch-grid">
          {branchesHealth.map((branch) => (
            <article
              className={`branch-card clickable ${branch.estado}`}
              key={branch.id}
              onClick={() => setSelectedBranchId(branch.id)}
            >
              <div className="branch-card-top">
                <div>
                  <strong>{branch.nombre}</strong>
                  <span>{branch.direccion}</span>
                </div>
                <span className={`status-pill ${branch.estado}`}>{branch.estado.toUpperCase()}</span>
              </div>
              <div className="branch-stats">
                <span><b>{branch.encuestas}</b> encuestas</span>
                <span><b>{branch.satisfaccion || 0}%</b> satisfaccion</span>
                <span><b>{branch.reportesNoLeidos}</b> reportes no leidos</span>
              </div>
              <button className="text-button" disabled={!canAdmin} onClick={async (event) => {
                event.stopPropagation();
                await setDoc(doc(db, 'sucursales', branch.id), {
                  ...branch,
                  activa: !branch.activa,
                  actualizadoEn: serverTimestamp(),
                }, { merge: true });
                await refresh();
              }}>
                {branch.activa === false ? 'Activar' : 'Desactivar'}
              </button>
            </article>
          ))}
        </div>
      </section>
      </>
      )}
    </div>
  );
}

function BranchDetailPage({ branch, data, refresh, onBack }) {
  const [type, setType] = useState('todas');

  useEffect(() => {
    const interval = setInterval(() => refresh(), 20000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!branch) {
    return (
      <section className="panel wide">
        <button className="text-button" onClick={onBack}><ArrowLeft size={16} /> Volver a sucursales</button>
        <div className="empty-state">No se encontro la sucursal.</div>
      </section>
    );
  }

  const encuestasSucursal = data.encuestas.filter((e) => e.sucursalId === branch.id);
  const hoy = startOfDay(new Date());
  const contestadasHoy = encuestasSucursal.filter((e) => (toDate(e.fechaEnvio)?.getTime() || 0) >= hoy.getTime()).length;
  const types = [...new Set(encuestasSucursal.map((e) => e.tipo === 'plantilla' ? 'plantilla' : e.rol).filter(Boolean))];
  const rows = sortByDateDesc(
    encuestasSucursal.filter((e) => type === 'todas' || (e.tipo === 'plantilla' ? 'plantilla' : e.rol) === type),
    'fechaEnvio'
  );

  return (
    <section className="panel wide branch-detail">
      <button className="text-button" onClick={onBack}><ArrowLeft size={16} /> Volver a sucursales</button>
      <div className="panel-heading">
        <div>
          <h2>{branch.nombre}</h2>
          <p>{branch.direccion}</p>
        </div>
        <span className={`status-pill ${branch.estado}`}>{branch.estado.toUpperCase()}</span>
      </div>

      <div className="metrics-grid">
        <article className="metric-card violet">
          <div className="metric-top"><ClipboardList size={19} /><span>Encuestas contestadas hoy</span></div>
          <strong><AnimatedNumber value={contestadasHoy} /></strong>
          <small>Se actualiza automaticamente cada 20s</small>
        </article>
        <article className="metric-card orange">
          <div className="metric-top"><BarChart3 size={19} /><span>Total historico</span></div>
          <strong><AnimatedNumber value={encuestasSucursal.length} /></strong>
          <small>Todas las encuestas de esta sucursal</small>
        </article>
        <article className="metric-card green">
          <div className="metric-top"><CheckCircle2 size={19} /><span>Satisfaccion</span></div>
          <strong>{branch.satisfaccion || 0}%</strong>
          <small>Promedio calculado de respuestas</small>
        </article>
        <article className="metric-card red">
          <div className="metric-top"><Bell size={19} /><span>Reportes sin leer</span></div>
          <strong><AnimatedNumber value={branch.reportesNoLeidos} /></strong>
          <small>{branch.reportes} reportes en total</small>
        </article>
      </div>

      <div className="panel-heading">
        <div>
          <h2>Encuestas de esta sucursal</h2>
          <p>Todas las encuestas recibidas, sin excepcion.</p>
        </div>
        <div className="filter-row">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="todas">Todos los tipos</option>
            {types.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <div className="survey-list">
        {rows.map((encuesta) => (
          <SurveyCard key={encuesta.id} encuesta={encuesta} plantillas={data.plantillas} />
        ))}
        {rows.length === 0 && <div className="empty-state">Esta sucursal no tiene encuestas con este filtro.</div>}
      </div>
    </section>
  );
}

function SurveyCard({ encuesta, plantillas }) {
  const tipoLabel = encuesta.tipo === 'plantilla'
    ? (plantillas?.find((p) => p.id === encuesta.plantillaId)?.titulo || 'Plantilla')
    : (encuesta.rol || 'General');
  return (
    <details className="history-card">
      <summary>
        <div className="history-card-left">
          <div className="avatar">{(encuesta.userName || 'U').charAt(0).toUpperCase()}</div>
          <div>
            <strong>{encuesta.userName || 'Sin usuario'}</strong>
            <span>{encuesta.sucursalNombre || encuesta.sucursalId || 'Sin sucursal'}</span>
          </div>
        </div>
        <div className="history-card-right">
          <span className="history-tag">{tipoLabel}</span>
          <time>{formatDate(encuesta.fechaEnvio)}</time>
        </div>
      </summary>
      <div className="answers-grid">
        {Object.entries(encuesta.respuestas || {}).map(([question, answer]) => (
          <div className="answer-item" key={question}>
            <span>{resolveQuestionLabel(encuesta, question, plantillas)}</span>
            <strong>{String(answer)}</strong>
          </div>
        ))}
        {Object.keys(encuesta.respuestas || {}).length === 0 && (
          <div className="empty-state">Sin respuestas registradas.</div>
        )}
      </div>
    </details>
  );
}

function SurveysPage({ data }) {
  const [branch, setBranch] = useState('todas');
  const [type, setType] = useState('todas');
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(emptyDateFilter);

  const rows = data.encuestas.filter((encuesta) => {
    const okBranch = branch === 'todas' || encuesta.sucursalId === branch;
    const encuestaType = encuesta.tipo === 'plantilla' ? 'plantilla' : encuesta.rol;
    const okType = type === 'todas' || encuestaType === type;
    const haystack = normalize(`${encuesta.userName} ${encuesta.titulo} ${encuesta.sucursalNombre}`);
    const okQuery = !query || haystack.includes(normalize(query));
    const okDate = isWithinDateFilter(encuesta.fechaEnvio, dateFilter);
    return okBranch && okType && okQuery && okDate;
  });
  const types = [...new Set(data.encuestas.map((e) => e.tipo === 'plantilla' ? 'plantilla' : e.rol).filter(Boolean))];

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Historial de encuestas</h2>
          <p>Que paso, quien lo respondio y en que sucursal.</p>
        </div>
        <div className="filter-row">
          <div className="search-field">
            <Search size={16} color="#9a8a96" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre..." />
          </div>
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="todas">Todas las sucursales</option>
            {data.sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="todas">Todos los tipos</option>
            {types.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <DateFilterBar filter={dateFilter} setFilter={setDateFilter} />
      <div className="survey-list">
        {sortByDateDesc(rows, 'fechaEnvio').map((encuesta) => (
          <SurveyCard key={encuesta.id} encuesta={encuesta} plantillas={data.plantillas} />
        ))}
        {rows.length === 0 && <div className="empty-state">No hay encuestas con estos filtros.</div>}
      </div>
    </section>
  );
}

function TemplatesPage({ data, refresh, canAdmin }) {
  const [message, setMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const toggleTemplate = async (template) => {
    await updateDoc(doc(db, 'plantillas', template.id), { activa: !template.activa });
    setMessage('Plantilla actualizada.');
    await refresh();
  };

  if (selectedTemplateId) {
    const template = data.plantillas.find((t) => t.id === selectedTemplateId);
    return (
      <TemplateDetailPage
        template={template}
        data={data}
        refresh={refresh}
        canAdmin={canAdmin}
        onBack={() => setSelectedTemplateId(null)}
        onToggle={toggleTemplate}
      />
    );
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Plantillas</h2>
          <p>Encuestas personalizadas creadas por administradores o gestores. Da clic para ver el detalle.</p>
        </div>
        {message && <span className="inline-message">{message}</span>}
      </div>
      <div className="template-grid">
        {sortByDateDesc(data.plantillas, 'fechaCreacion').map((template) => (
          <article
            className={`template-card clickable ${template.activa ? 'template-activa' : ''}`}
            key={template.id}
            onClick={() => setSelectedTemplateId(template.id)}
          >
            <div className="template-card-top">
              <div>
                <strong>{template.titulo || 'Sin titulo'}</strong>
                <span>{template.creadoPorNombre || template.rolCreador || 'Sin creador'} · {formatDate(template.fechaCreacion)}</span>
              </div>
              <span className={`status-pill ${template.activa ? 'normal' : 'pausa'}`}>
                {template.activa ? 'ACTIVA' : 'PAUSADA'}
              </span>
            </div>
            <p>{template.preguntas?.length || 0} preguntas · {template.sucursalId === 'todas' ? 'Todas las sucursales' : template.sucursalId}</p>
            <div className="questions-preview">
              {(template.preguntas || []).slice(0, 4).map((question) => (
                <span key={question.id || question.texto}>{question.texto}</span>
              ))}
            </div>
            <button
              className="secondary-button"
              onClick={(event) => { event.stopPropagation(); toggleTemplate(template); }}
              disabled={!canAdmin}
            >
              {template.activa ? 'Pausar' : 'Activar'}
            </button>
          </article>
        ))}
        {data.plantillas.length === 0 && <div className="empty-state">Aun no hay plantillas creadas.</div>}
      </div>
    </section>
  );
}

function TemplateDetailPage({ template, data, refresh, canAdmin, onBack, onToggle }) {
  useEffect(() => {
    const interval = setInterval(() => refresh(), 20000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!template) {
    return (
      <section className="panel wide">
        <button className="text-button" onClick={onBack}><ArrowLeft size={16} /> Volver a plantillas</button>
        <div className="empty-state">Esta plantilla ya no existe.</div>
      </section>
    );
  }

  const respuestas = data.encuestas.filter((e) => e.plantillaId === template.id);
  const respondentIds = new Set(respuestas.map((e) => e.userId).filter(Boolean));
  const eligibleUsers = data.usuarios.filter((u) => (
    template.sucursalId === 'todas' || u.sucursalId === template.sucursalId
  ));
  const pendingUsers = eligibleUsers.filter((u) => !respondentIds.has(u.id));
  const score = surveyScores(respuestas);
  const totalPreguntas = template.preguntas?.length || 0;

  return (
    <section className="panel wide template-detail">
      <button className="text-button" onClick={onBack}><ArrowLeft size={16} /> Volver a plantillas</button>
      <div className="panel-heading">
        <div>
          <h2>{template.titulo || 'Sin titulo'}</h2>
          <p>{template.creadoPorNombre || template.rolCreador || 'Sin creador'} · {formatDate(template.fechaCreacion)}</p>
        </div>
        <div className="filter-row">
          <span className={`status-pill ${template.activa ? 'normal' : 'pausa'}`}>
            {template.activa ? 'ACTIVA' : 'PAUSADA'}
          </span>
          <button className="secondary-button" onClick={() => onToggle(template)} disabled={!canAdmin}>
            {template.activa ? 'Pausar' : 'Activar'}
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <article className="metric-card green">
          <div className="metric-top"><CheckCircle2 size={19} /><span>Respondida por</span></div>
          <strong><AnimatedNumber value={respuestas.length} /></strong>
          <small>Respuestas recibidas en tiempo real</small>
        </article>
        <article className="metric-card red">
          <div className="metric-top"><Users size={19} /><span>Usuarios pendientes</span></div>
          <strong><AnimatedNumber value={pendingUsers.length} /></strong>
          <small>de {eligibleUsers.length} usuarios convocados</small>
        </article>
        <article className="metric-card orange">
          <div className="metric-top"><ClipboardList size={19} /><span>Preguntas</span></div>
          <strong>{totalPreguntas}</strong>
          <small>{template.sucursalId === 'todas' ? 'Todas las sucursales' : template.sucursalId}</small>
        </article>
        <article className="metric-card violet">
          <div className="metric-top"><BarChart3 size={19} /><span>Satisfaccion</span></div>
          <strong>{score.promedio || 0}%</strong>
          <small>{score.total} respuestas evaluadas</small>
        </article>
      </div>

      <div className="two-column-detail">
        <section className="panel">
          <div className="panel-heading"><div><h2>Preguntas</h2></div></div>
          <div className="questions-preview vertical">
            {(template.preguntas || []).map((question, index) => (
              <span key={question.id || index}>{index + 1}. {question.texto}</span>
            ))}
            {totalPreguntas === 0 && <div className="empty-state">Esta plantilla no tiene preguntas.</div>}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>Usuarios pendientes</h2></div></div>
          <div className="user-list">
            {pendingUsers.map((user) => (
              <div className="user-row" key={user.id}>
                <div className="avatar">{(user.nombre || 'U').charAt(0).toUpperCase()}</div>
                <div>
                  <strong>{user.nombre || 'Sin nombre'}</strong>
                  <span>{user.sucursalId} · {user.rol}</span>
                </div>
              </div>
            ))}
            {pendingUsers.length === 0 && <div className="empty-state">Todos los convocados ya respondieron.</div>}
          </div>
        </section>
      </div>

      <div className="panel-heading">
        <div><h2>Respuestas recibidas</h2></div>
      </div>
      <div className="survey-list">
        {sortByDateDesc(respuestas, 'fechaEnvio').map((encuesta) => (
          <SurveyCard key={encuesta.id} encuesta={encuesta} plantillas={data.plantillas} />
        ))}
        {respuestas.length === 0 && <div className="empty-state">Aun no hay respuestas para esta plantilla.</div>}
      </div>
    </section>
  );
}

function ReportsPage({ data, refresh }) {
  const [branch, setBranch] = useState('todas');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [templateFilter, setTemplateFilter] = useState('todas');
  const [dateFilter, setDateFilter] = useState(emptyDateFilter);

  const rows = data.reportes.filter((reporte) => {
    const okBranch = branch === 'todas' || reporte.sucursalId === branch;
    const okRead = !onlyUnread || !reporte.leido;
    const okTemplate = templateFilter === 'todas'
      || (templateFilter === 'sin_plantilla' ? !reporte.plantillaId : reporte.plantillaId === templateFilter);
    const okDate = isWithinDateFilter(reporte.fecha, dateFilter);
    return okBranch && okRead && okTemplate && okDate;
  });

  const markRead = async (reporte) => {
    await updateDoc(doc(db, 'reportes', reporte.id), { leido: true });
    await refresh();
  };

  return (
    <div>
      <div className="reports-topbar">
        <div>
          <p className="reports-sub">Quejas, notas y alertas enviadas desde la app móvil.</p>
        </div>
        <div className="filter-row">
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="todas">Todas las sucursales</option>
            {data.sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)}>
            <option value="todas">Todas las encuestas/plantillas</option>
            <option value="sin_plantilla">Sin plantilla asociada</option>
            {data.plantillas.map((p) => <option key={p.id} value={p.id}>{p.titulo || p.id}</option>)}
          </select>
          <button
            className={`filter-btn ${onlyUnread ? 'active' : ''}`}
            onClick={() => setOnlyUnread(!onlyUnread)}
          >
            No leídos
          </button>
        </div>
      </div>
      <DateFilterBar filter={dateFilter} setFilter={setDateFilter} showHours />
      <div className="report-list">
        {sortByDateDesc(rows, 'fecha').map((reporte) => (
          <article className={`report-card ${reporte.leido ? '' : 'unread'}`} key={reporte.id}>
            <div className="report-main">
              <div>
                <strong>{reporte.esAnonimo ? 'Anonimo' : reporte.userName || 'Sin nombre'}</strong>
                <span>{reporte.rol || 'general'} · {reporte.sucursalId} · {formatDate(reporte.fecha)}</span>
              </div>
              {!reporte.leido && <span className="status-pill nuevo">NUEVO</span>}
            </div>
            <p>{reporte.texto || 'Sin texto'}</p>
            {reporte.fotoUrl && (
              <a className="photo-link" href={reporte.fotoUrl} target="_blank" rel="noreferrer">
                <Eye size={16} />
                Ver foto adjunta
              </a>
            )}
            {!reporte.leido && (
              <button className="secondary-button" onClick={() => markRead(reporte)}>
                Marcar como leído
              </button>
            )}
          </article>
        ))}
        {rows.length === 0 && <div className="empty-state">No hay reportes con estos filtros.</div>}
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('procomin-theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const [data, setData] = useState({
    usuarios: [],
    sucursales: SUCURSALES_BASE,
    encuestas: [],
    plantillas: [],
    reportes: [],
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('procomin-theme', theme);
    } catch {
      // almacenamiento no disponible, no es critico
    }
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  const canEnter = profile?.rol === 'admin' || profile?.rol === 'gestor';
  const canAdmin = profile?.rol === 'admin';

  const loadData = async (uid = currentUser?.uid, perfil = profile) => {
    if (!uid || !perfil) return;
    setLoading(true);
    setError('');
    try {
      const [usuariosSnap, sucursalesSnap, encuestasSnap, plantillasSnap, reportesSnap] = await Promise.all([
        getDocs(collection(db, 'usuarios')),
        getDocs(collection(db, 'sucursales')).catch(() => ({ docs: [] })),
        getDocs(collection(db, 'encuestas')),
        getDocs(collection(db, 'plantillas')),
        getDocs(collection(db, 'reportes')),
      ]);
      const usuarios = usuariosSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
      let sucursales = sucursalesSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
      if (!sucursales.length) sucursales = SUCURSALES_BASE;
      const encuestas = encuestasSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
      const plantillas = plantillasSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
      const reportes = reportesSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
      const scoped = perfil.rol === 'gestor' ? perfil.sucursalId : null;
      setData({
        usuarios: scoped ? usuarios.filter((u) => u.sucursalId === scoped || u.id === uid) : usuarios,
        sucursales: scoped ? sucursales.filter((s) => s.id === scoped) : sucursales,
        encuestas: scoped ? encuestas.filter((e) => e.sucursalId === scoped) : encuestas,
        plantillas: scoped ? plantillas.filter((p) => p.sucursalId === scoped || p.sucursalId === 'todas') : plantillas,
        reportes: scoped ? reportes.filter((r) => r.sucursalId === scoped || r.gestorId === uid) : reportes,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (!user) {
        setProfile(null);
        setAuthLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        const perfil = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        setProfile(perfil);
        if (perfil) await loadData(user.uid, perfil);
      } catch (error) {
        setError(error.message);
      } finally {
        setAuthLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const branchesHealth = useMemo(
    () => data.sucursales.map((branch) => branchHealth(branch, data.encuestas, data.reportes)),
    [data]
  );

  if (authLoading) {
    return (
      <div className="loading-screen">
        <Loader2 className="spin" size={28} />
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;

  if (!canEnter) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <AlertTriangle size={34} />
          <h1>Acceso restringido</h1>
          <p>Tu perfil no tiene permisos para entrar al panel web.</p>
          <button className="primary-button" onClick={() => signOut(auth)}>
            <LogOut size={18} />
            Cerrar sesion
          </button>
        </section>
      </main>
    );
  }

  const ActivePage = {
    dashboard: <Dashboard data={data} branchesHealth={branchesHealth} setTab={setTab} />,
    usuarios: <UsersPage data={data} refresh={() => loadData()} canAdmin={canAdmin} />,
    sucursales: <BranchesPage data={data} branchesHealth={branchesHealth} refresh={() => loadData()} canAdmin={canAdmin} />,
    encuestas: <SurveysPage data={data} />,
    plantillas: <TemplatesPage data={data} refresh={() => loadData()} canAdmin={canAdmin} />,
    reportes: <ReportsPage data={data} refresh={() => loadData()} />,
  }[tab];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">P</div>
          <div>
            <strong>PROCOMIN</strong>
            <span>Admin web</span>
          </div>
        </div>
        <nav>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <button className="logout-button" onClick={() => signOut(auth)}>
          <LogOut size={18} />
          Cerrar sesion
        </button>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h1>{TABS.find((item) => item.id === tab)?.label}</h1>
            <p>{profile?.nombre} · {profile?.rol}</p>
          </div>
          <div className="topbar-actions">
            {error && <span className="error-pill">{error}</span>}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-button" onClick={() => loadData()} title="Actualizar" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
            </button>
            <a className="icon-button" href={`mailto:${profile?.email || ''}`} title="Correo del usuario">
              <Mail size={18} />
            </a>
          </div>
        </header>
        {ActivePage}
      </main>
    </div>
  );
}
