/* global React */
const { useState, useMemo, useEffect, useRef } = React;

// ─── Mock data ──────────────────────────────────────────────────────────────
const TYPES = [
  { key: 'premsa',       label: 'Premsa',       sub: 'Mitjans i crítica' },
  { key: 'professional', label: 'Professional', sub: 'Indústria audiovisual' },
  { key: 'nitoman',      label: 'Nitòman',      sub: 'Abonats al festival' },
];

const NITOMAN_VARIANTS = [
  { key: 'all',   label: 'Tots' },
  { key: 'nitoman', label: 'Nitòman' },
  { key: 'super',   label: 'Super Nitòman' },
];

const NAMES = [
  'Aina Vidal-Puig','Pere Cassanyes','Mireia Solé Riera','Jordi Bofill','Laia Comaposada',
  'Marc Estrada','Núria Tarragó','Quim Roviralta','Helena Vilà','Albert Puigdomènech',
  'Sergi Bonals','Clara Montsalvatge','Roger Pérez-Comas','Alba Fontanella','Bernat Ribera',
  'Ona Castells','Toni Camprubí','Júlia Aragonès','Pau Solernou','Mar Vilanova',
  'Èric Ballester','Anna Soldevila','Lluís Brugarolas','Carla Pinatella','Oriol Sanmartí'
];
const DOMAINS = ['gmail.com','ara.cat','catorze.cat','elpunt.cat','vilaweb.cat','filmin.cat','time-out.cat','cinemania.cat'];

function seedRng(seed){let s=seed;return ()=>{s=(s*9301+49297)%233280;return s/233280;};}
function emailOf(n){return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]+/g,'.').replace(/(^\.|\.$)/g,'')+'@'+DOMAINS[(n.length*7)%DOMAINS.length];}

function makeRows(type){
  const rnd = seedRng(type==='premsa'?7:type==='professional'?13:23);
  const statuses = ['pending','pending','pending','code_assigned','code_assigned','email_sent','email_sent','email_sent','email_sent'];
  const out = [];
  for (let i=0;i<14;i++){
    const name = NAMES[(Math.floor(rnd()*1000))%NAMES.length];
    const st = statuses[Math.floor(rnd()*statuses.length)];
    const daysAgo = Math.floor(rnd()*9);
    const created = new Date(Date.now()-daysAgo*86400000-Math.floor(rnd()*86400000));
    const isSuper = type==='nitoman' && rnd() > 0.65;
    const codePrefix = type==='premsa'?'PR':type==='professional'?'PRO':isSuper?'SNIT':'NIT';
    const code = st==='pending'?null:`${codePrefix}-26-${String(100+Math.floor(rnd()*900)).padStart(3,'0')}`;
    const emailSent = st==='email_sent' ? new Date(created.getTime()+Math.floor(rnd()*86400000)) : null;
    const outlet = ['ARA','Catorze','VilaWeb','Time Out','Filmin','El Punt','—'][Math.floor(rnd()*7)];
    out.push({
      id: i+1+type.length*100,
      order_id: `#${10240+i*7+(type==='premsa'?0:type==='professional'?500:1000)}`,
      customer_name: name,
      customer_email: emailOf(name),
      outlet,
      type,
      variant: type==='nitoman' ? (isSuper?'super':'nitoman') : null,
      code,
      status: st,
      created_at: created,
      email_sent_at: emailSent,
    });
  }
  return out;
}

// ─── Status atom ────────────────────────────────────────────────────────────
const STATUS = {
  pending:       { label: 'Pendent',       dot: 'var(--ink-50)',  ring: 'var(--rule)',     fg: 'var(--ink-70)' },
  code_assigned: { label: 'Codi assignat', dot: 'var(--gold)',    ring: 'var(--gold-30)',  fg: 'var(--gold-ink)' },
  email_sent:    { label: 'Enviat',        dot: 'var(--accent)',  ring: 'var(--accent-20)', fg: 'var(--accent)' },
};

function StatusPill({ status, compact }){
  const s = STATUS[status];
  return (
    <span className="status-pill" style={{ borderColor: s.ring, color: s.fg }}>
      <span className="status-dot" style={{ background: s.dot }}></span>
      {!compact && s.label}
    </span>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ currentType, setCurrentType, currentView, setCurrentView, user }){
  const visibleTypes = TYPES.filter(t => user.types.includes(t.key));
  const isAdmin = user.role === 'Admin';
  return (
    <aside className="sidebar" data-current-type={currentType}>
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 44 44" width="38" height="38">
            <circle cx="22" cy="22" r="21" fill="currentColor"/>
            <path d="M28 12 a14 14 0 1 0 0 20 a11 11 0 1 1 0 -20 z" fill="var(--paper)"/>
            <circle cx="30" cy="16" r="1.6" fill="var(--paper)"/>
            <circle cx="33" cy="22" r="1.2" fill="var(--paper)"/>
            <circle cx="30" cy="28" r="1.6" fill="var(--paper)"/>
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-name">FesNits</div>
          <div className="brand-sub">Acreditacions · 23a edició</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-group">
          <div className="nav-heading">{visibleTypes.length>1?'Els teus espais':'El teu espai'}</div>
          {visibleTypes.map(t => (
            <div key={t.key}>
              <button
                className={`nav-type ${currentType===t.key?'is-active':''}`}
                onClick={()=>{setCurrentType(t.key); setCurrentView('list');}}
              >
                <span className="nav-type-label">
                  <span className="nav-marker" data-type={t.key}></span>
                  {t.label}
                </span>
                <span className="nav-sub">{t.sub}</span>
              </button>
              {currentType===t.key && (
                <div className="nav-children">
                  {[
                    ['list','Acreditacions'],
                    ['codes','Codis'],
                    ['templates','Plantilles'],
                    ['settings','Configuració'],
                  ].map(([k,label])=>(
                    <button
                      key={k}
                      className={`nav-child ${currentView===k?'is-active':''}`}
                      onClick={()=>setCurrentView(k)}
                    >{label}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="nav-group">
            <div className="nav-heading">Administració</div>
            <button className="nav-child">Usuaris</button>
            <button className="nav-child">Activitat global</button>
          </div>
        )}
      </nav>

      <div className="sidebar-foot">
        <div className="festival-dates">
          <div className="dates-num">14 — 19</div>
          <div className="dates-meta">Juliol 2026 · Vic</div>
        </div>
      </div>
    </aside>
  );
}

// ─── Topbar ─────────────────────────────────────────────────────────────────
function Topbar({ user }){
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span className="crumb-muted">Festival Nits de Cinema Oriental</span>
        <span className="crumb-sep">/</span>
        <span>Sistema d'Acreditacions</span>
      </div>
      <div className="topbar-right">
        <button className="ghost-btn" title="Cerca global (⌘K)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
          <span>Cerca</span>
          <kbd>⌘K</kbd>
        </button>
        <button className="ghost-btn icon-only" title="Notificacions">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
          <span className="dot-badge"></span>
        </button>
        <div className="user-chip">
          <div className="user-ava">{user.initial}</div>
          <div className="user-meta">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Stats hero ─────────────────────────────────────────────────────────────
function StatsHero({ type, rows, codesAvailable, variant, setVariant }){
  const total = rows.length;
  const pending = rows.filter(r=>r.status==='pending').length;
  const codeAssigned = rows.filter(r=>r.status==='code_assigned').length;
  const sent = rows.filter(r=>r.status==='email_sent').length;
  const tDef = TYPES.find(t=>t.key===type);
  const low = codesAvailable < pending + codeAssigned + 3;
  const typeColor = type==='premsa'?'var(--premsa)':type==='professional'?'var(--professional)':'var(--nitoman)';
  const isNitoman = type==='nitoman';
  const superCount = rows.filter(r=>r.variant==='super').length;
  const stdCount   = rows.filter(r=>r.variant==='nitoman').length;

  // The flow: rebudes → esperant codi → codi assignat, per enviar → email enviat
  const flow = [
    { n: total,        label: 'Sol·licituds',      hint: 'Rebudes en total',                    tone: 'mute' },
    { n: pending,      label: 'Esperant codi',     hint: 'Encara sense codi assignat',            tone: 'warn' },
    { n: codeAssigned, label: 'Per enviar',        hint: 'Codi assignat, falta enviar email',     tone: 'info' },
    { n: sent,         label: 'Email enviat',      hint: 'Tot completat',                         tone: 'ok'   },
  ];

  return (
    <section className="hero">
      <div className="hero-head">
        <div className="hero-eyebrow">
          <span className="eyebrow-marker" style={{background:typeColor}}></span>
          Espai independent · {tDef.sub}
        </div>
        <h1 className="hero-title">{tDef.label}</h1>
        <p className="hero-lede">
          Gestiona les sol·licituds, assigna codis i envia confirmacions per la secció <em>{tDef.label}</em> del festival.
        </p>

        {isNitoman && (
          <div className="variant-switch" role="tablist" aria-label="Variant">
            {NITOMAN_VARIANTS.map(v=>(
              <button
                key={v.key}
                role="tab"
                aria-selected={variant===v.key}
                className={`vs-btn ${variant===v.key?'is-on':''}`}
                onClick={()=>setVariant(v.key)}
              >
                {v.label}
                <span className="vs-n">{v.key==='all'?total:v.key==='super'?superCount:stdCount}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flow-strip" role="list" aria-label="Estat del pipeline">
        {flow.map((s,i)=>(
          <React.Fragment key={s.label}>
            <div className={`flow-step tone-${s.tone}`} role="listitem">
              <div className="flow-n">{s.n}</div>
              <div className="flow-l">{s.label}</div>
              <div className="flow-h">{s.hint}</div>
            </div>
            {i<flow.length-1 && <div className="flow-arrow" aria-hidden="true">→</div>}
          </React.Fragment>
        ))}
        <div className={`flow-aside tone-${low?'alert':'mute'}`}>
          <div className="flow-n">{codesAvailable}</div>
          <div className="flow-l">Codis lliures{low?' · baix':''}</div>
          <div className="flow-h">Pool disponible</div>
        </div>
      </div>

      {low && (
        <div className="alert">
          <span className="alert-bullet">⚠</span>
          <span><strong>Pool de codis baix</strong> — quedaran insuficients per cobrir les acreditacions pendents. <button className="link">Afegir codis</button></span>
        </div>
      )}
    </section>
  );
}
function Stat({ n, label, tone='mute', suffix='' }){
  return (
    <div className={`stat tone-${tone}`}>
      <div className="stat-n">{n}</div>
      <div className="stat-l">{label}{suffix}</div>
    </div>
  );
}

// ─── Toolbar ────────────────────────────────────────────────────────────────
function Toolbar({ q, setQ, filter, setFilter, counts, selectedCount, onBulkAssign, onBulkSend, onClearSel, viewMode, setViewMode }){
  const filters = [
    { k: 'all',           label: 'Totes',            n: counts.all },
    { k: 'pending',       label: 'Pendents',         n: counts.pending },
    { k: 'code_assigned', label: 'Per enviar',       n: counts.code_assigned },
    { k: 'email_sent',    label: 'Enviades',         n: counts.email_sent },
  ];

  return (
    <div className={`toolbar ${selectedCount>0?'has-selection':''}`}>
      {selectedCount===0 ? (
        <>
          <div className="filter-row">
            {filters.map(f=>(
              <button
                key={f.k}
                onClick={()=>setFilter(f.k)}
                className={`chip ${filter===f.k?'is-active':''}`}
              >
                {f.label}
                <span className="chip-n">{f.n}</span>
              </button>
            ))}
          </div>

          <div className="search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Cerca per nom, email, codi o comanda…"
            />
            {q && <button className="clear" onClick={()=>setQ('')} aria-label="Esborrar">×</button>}
          </div>

          <div className="view-toggle">
            <button className={viewMode==='list'?'is-on':''} onClick={()=>setViewMode('list')} title="Vista llista">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <button className={viewMode==='cards'?'is-on':''} onClick={()=>setViewMode('cards')} title="Vista targetes">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
          </div>
          <button className="ghost-btn">Exportar CSV</button>
          <button className="primary-btn">+ Nova acreditació</button>
        </>
      ) : (
        <>
          <div className="selection-info">
            <button className="link-soft" onClick={onClearSel}>✕</button>
            <strong>{selectedCount}</strong> seleccionades
          </div>
          <div className="selection-actions">
            <button className="ghost-btn" onClick={onBulkAssign}>Assignar codis</button>
            <button className="primary-btn" onClick={onBulkSend}>Assignar + Enviar</button>
            <span className="kbd-hint">Shift+E per enviar · Esc per sortir</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Row ────────────────────────────────────────────────────────────────────
function AccRow({ row, checked, onCheck, expanded, onExpand, onAssign, onSend, onDelete }){
  const s = STATUS[row.status];
  const dateStr = row.created_at.toLocaleDateString('ca-ES',{day:'2-digit',month:'short'});
  return (
    <>
      <tr className={`row ${checked?'is-checked':''} ${expanded?'is-expanded':''}`}>
        <td className="col-check">
          <label className="check">
            <input type="checkbox" checked={checked} onChange={onCheck}/>
            <span></span>
          </label>
        </td>
        <td className="col-name" onClick={onExpand}>
          <div className="name">
            {row.customer_name}
            {row.variant==='super' && <span className="variant-tag">Super</span>}
          </div>
          <div className="email">{row.customer_email}</div>
        </td>
        <td className="col-order" onClick={onExpand}>
          <div className="order-id">{row.order_id}</div>
          <div className="outlet">{row.outlet}</div>
        </td>
        <td className="col-code" onClick={onExpand}>
          {row.code ? <code className="code-chip">{row.code}</code> : <span className="dash">—</span>}
        </td>
        <td className="col-status" onClick={onExpand}>
          <StatusPill status={row.status}/>
        </td>
        <td className="col-date" onClick={onExpand}>
          <span>{dateStr}</span>
          {row.email_sent_at && <div className="sub-date">→ {row.email_sent_at.toLocaleDateString('ca-ES',{day:'2-digit',month:'short'})}</div>}
        </td>
        <td className="col-actions">
          {row.status==='pending' && (
            <button className="row-btn row-btn-primary" onClick={onAssign}>Assignar</button>
          )}
          {row.status==='code_assigned' && (
            <button className="row-btn row-btn-primary" onClick={onSend}>Enviar</button>
          )}
          {row.status==='email_sent' && (
            <button className="row-btn row-btn-ghost" title="Reenviar">Reenviar</button>
          )}
          <button className="row-btn-icon" onClick={onExpand} title="Detalls">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={expanded?'M18 15l-6-6-6 6':'M6 9l6 6 6-6'}/></svg>
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="row-detail-wrap">
          <td colSpan="7">
            <RowDetail row={row} onDelete={onDelete}/>
          </td>
        </tr>
      )}
    </>
  );
}

function RowDetail({ row, onDelete }){
  return (
    <div className="detail-grid">
      <div className="detail-col detail-meta">
        <h4>Acreditació</h4>
        <dl>
          <dt>Comanda</dt><dd>{row.order_id}</dd>
          <dt>Email</dt><dd>{row.customer_email}</dd>
          <dt>Mitjà / Empresa</dt><dd>{row.outlet}</dd>
          <dt>Codi</dt><dd>{row.code || <em>encara no assignat</em>}</dd>
          <dt>Creat</dt><dd>{row.created_at.toLocaleString('ca-ES')}</dd>
          {row.email_sent_at && <><dt>Email enviat</dt><dd>{row.email_sent_at.toLocaleString('ca-ES')}</dd></>}
        </dl>

        <h4>Activitat</h4>
        <ol className="timeline">
          <li><span className="t-dot" data-tone="ok"></span><span>Sol·licitud rebuda<br/><em>{row.created_at.toLocaleString('ca-ES')}</em></span></li>
          {row.code && <li><span className="t-dot" data-tone="info"></span><span>Codi <code>{row.code}</code> assignat<br/><em>fa 2 hores</em></span></li>}
          {row.email_sent_at && <li><span className="t-dot" data-tone="ok"></span><span>Email enviat a {row.customer_email}<br/><em>{row.email_sent_at.toLocaleString('ca-ES')}</em></span></li>}
        </ol>
      </div>

      <div className="detail-col detail-mail">
        <div className="mail-head">
          <span className="mail-from">nits@cinemaoriental.com</span>
          <span className="mail-arrow">→</span>
          <span>{row.customer_email}</span>
        </div>
        <div className="mail-subject">La teva acreditació de {TYPES.find(t=>t.key===row.type).label} — Festival Nits</div>
        <div className="mail-body">
          <p>Hola {row.customer_name.split(' ')[0]},</p>
          <p>Gràcies per acreditar-te al festival. Aquí tens el teu codi:</p>
          <div className="mail-code">{row.code || 'XXX-26-000'}</div>
          <p>Presenta'l a l'entrada del recinte (Bassa dels Hermanos, Vic) per recollir la teva acreditació física.</p>
          <p>Ens veiem al juliol.<br/>— L'equip de Nits</p>
        </div>
        <div className="detail-actions">
          {row.status==='code_assigned' && <button className="primary-btn">Enviar email</button>}
          <button className="ghost-btn">Editar plantilla</button>
          <button className="ghost-btn">Copiar enllaç</button>
          <button className="ghost-btn danger" onClick={onDelete}>Eliminar acreditació</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ type, codesAvailable, setCodesAvailable }){
  const [rows, setRows] = useState(() => makeRows(type));
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [expanded, setExpanded] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [variant, setVariant] = useState('all');

  useEffect(() => {
    setRows(makeRows(type));
    setFilter('all'); setQ(''); setSelected(new Set()); setExpanded(null); setVariant('all');
  }, [type]);

  const counts = useMemo(()=>({
    all: rows.length,
    pending: rows.filter(r=>r.status==='pending').length,
    code_assigned: rows.filter(r=>r.status==='code_assigned').length,
    email_sent: rows.filter(r=>r.status==='email_sent').length,
  }),[rows]);

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase();
    return rows.filter(r=>{
      if (type==='nitoman' && variant!=='all' && r.variant!==variant) return false;
      if (filter!=='all' && r.status!==filter) return false;
      if (!term) return true;
      return (
        r.customer_name.toLowerCase().includes(term) ||
        r.customer_email.toLowerCase().includes(term) ||
        (r.code||'').toLowerCase().includes(term) ||
        r.order_id.toLowerCase().includes(term)
      );
    });
  },[rows, filter, q, variant, type]);

  const toggle = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(r=>r.id)));
  };

  const assignOne = (id) => {
    const code = `${type==='premsa'?'PR':type==='professional'?'PRO':'NIT'}-26-${String(200+Math.floor(Math.random()*700)).padStart(3,'0')}`;
    setRows(rs=>rs.map(r=>r.id===id?{...r,status:'code_assigned',code}:r));
    setCodesAvailable(c=>Math.max(0,c-1));
  };
  const sendOne = (id) => {
    setRows(rs=>rs.map(r=>r.id===id?{...r,status:'email_sent',email_sent_at:new Date()}:r));
  };
  const bulkAssign = () => {
    selected.forEach(id => {
      const r = rows.find(x=>x.id===id);
      if (r && r.status==='pending') assignOne(id);
    });
    setSelected(new Set());
  };
  const bulkSend = () => {
    selected.forEach(id => {
      const r = rows.find(x=>x.id===id);
      if (!r) return;
      if (r.status==='pending') assignOne(id);
      if (r.status==='code_assigned') sendOne(id);
      // also send freshly-assigned in same tick:
      setRows(rs=>rs.map(x=>x.id===id && x.status!=='email_sent'?{...x,status:'email_sent',email_sent_at:new Date()}:x));
    });
    setSelected(new Set());
  };
  const deleteOne = (id) => {
    setRows(rs=>rs.filter(r=>r.id!==id));
    setExpanded(null);
  };

  const allChecked = filtered.length>0 && filtered.every(r=>selected.has(r.id));

  return (
    <div className="dashboard">
      <StatsHero type={type} rows={rows} codesAvailable={codesAvailable} variant={variant} setVariant={setVariant}/>

      <Toolbar
        q={q} setQ={setQ}
        filter={filter} setFilter={setFilter}
        counts={counts}
        selectedCount={selected.size}
        onBulkAssign={bulkAssign}
        onBulkSend={bulkSend}
        onClearSel={()=>setSelected(new Set())}
        viewMode={viewMode} setViewMode={setViewMode}
      />

      {viewMode==='list' ? (
        <div className="table-wrap">
          <table className="acc-table">
            <thead>
              <tr>
                <th className="col-check">
                  <label className="check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll}/>
                    <span></span>
                  </label>
                </th>
                <th>Client</th>
                <th>Comanda / Mitjà</th>
                <th>Codi</th>
                <th>Estat</th>
                <th>Data</th>
                <th className="col-actions">Accions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan="7" className="empty">No hi ha resultats per aquest filtre.</td></tr>
              ) : filtered.map(r=>(
                <AccRow
                  key={r.id}
                  row={r}
                  checked={selected.has(r.id)}
                  onCheck={()=>toggle(r.id)}
                  expanded={expanded===r.id}
                  onExpand={()=>setExpanded(expanded===r.id?null:r.id)}
                  onAssign={()=>assignOne(r.id)}
                  onSend={()=>sendOne(r.id)}
                  onDelete={()=>deleteOne(r.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(r=>(
            <article key={r.id} className="acc-card">
              <header className="card-head">
                <div>
                  <div className="name">{r.customer_name}</div>
                  <div className="email">{r.customer_email}</div>
                </div>
                <StatusPill status={r.status}/>
              </header>
              <dl className="card-meta">
                <div><dt>Comanda</dt><dd>{r.order_id}</dd></div>
                <div><dt>Mitjà</dt><dd>{r.outlet}</dd></div>
                <div><dt>Codi</dt><dd>{r.code ? <code className="code-chip">{r.code}</code> : <span className="dash">—</span>}</dd></div>
                <div><dt>Data</dt><dd>{r.created_at.toLocaleDateString('ca-ES',{day:'2-digit',month:'short'})}</dd></div>
              </dl>
              <footer className="card-foot">
                {r.status==='pending'       && <button className="primary-btn" onClick={()=>assignOne(r.id)}>Assignar</button>}
                {r.status==='code_assigned' && <button className="primary-btn" onClick={()=>sendOne(r.id)}>Enviar</button>}
                {r.status==='email_sent'    && <button className="ghost-btn">Reenviar</button>}
                <button className="ghost-btn">Detalls</button>
              </footer>
            </article>
          ))}
        </div>
      )}

      <div className="footer-hint">
        <kbd>↑</kbd><kbd>↓</kbd> navegar · <kbd>Space</kbd> seleccionar · <kbd>E</kbd> enviar · <kbd>⌘K</kbd> cerca
      </div>
    </div>
  );
}

// ─── Codes view (compact peek) ──────────────────────────────────────────────
function CodesView({ type, codesAvailable, setCodesAvailable }){
  const used = 47;
  return (
    <div className="dashboard">
      <section className="hero">
        <div className="hero-head">
          <div className="hero-eyebrow"><span className="eyebrow-marker" data-type={type}></span>Pool de codis</div>
          <h1 className="hero-title">Codis · {TYPES.find(t=>t.key===type).label}</h1>
          <p className="hero-lede">Importa codis al pool i fes-ne seguiment. Els codis s'assignen en ordre FIFO.</p>
        </div>
        <div className="hero-stats">
          <Stat n={codesAvailable+used} label="Total"/>
          <Stat n={codesAvailable}      label="Disponibles" tone="ok"/>
          <Stat n={used}                label="Assignats"   tone="info"/>
        </div>
      </section>

      <div className="code-import">
        <div className="ci-head">
          <h3>Afegir codis</h3>
          <p>Enganxa un codi per línia. Els duplicats s'ignoraran.</p>
        </div>
        <textarea placeholder={`${type.toUpperCase()}-26-001\n${type.toUpperCase()}-26-002\n${type.toUpperCase()}-26-003`} rows="6"></textarea>
        <div className="ci-foot">
          <span className="hint">0 codis a la cua</span>
          <button className="primary-btn">Importar al pool</button>
        </div>
      </div>

      <div className="code-list">
        <h3>Codis disponibles</h3>
        <div className="code-grid">
          {Array.from({length: codesAvailable}).map((_,i)=>(
            <code key={i} className="code-tile">{(type==='premsa'?'PR':type==='professional'?'PRO':'NIT')+'-26-'+String(i+1).padStart(3,'0')}</code>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────
window.NitsApp = function NitsApp({ tweaks, user }){
  const [currentType, setCurrentType] = useState(user.types[0]);
  const [currentView, setCurrentView] = useState('list');
  const [codesAvailable, setCodesAvailable] = useState(12);

  // When the user's accessible types change, snap to the first available
  useEffect(()=>{
    if (!user.types.includes(currentType)) setCurrentType(user.types[0]);
  },[user]);

  // Apply tweaks → CSS variables
  useEffect(()=>{
    const r = document.documentElement;
    r.dataset.density = tweaks.density;
    r.dataset.theme = tweaks.dark ? 'dark' : 'light';
    if (tweaks.palette === 'crimson') {
      r.style.setProperty('--accent', tweaks.dark ? '#ff5a52' : '#c8201c');
      r.style.setProperty('--accent-20','color-mix(in oklab, var(--accent) 20%, transparent)');
      r.style.setProperty('--gold','#b8893a');
      r.style.setProperty('--gold-ink','#6e4d12');
      r.style.setProperty('--gold-30','color-mix(in oklab, var(--gold) 30%, transparent)');
    } else if (tweaks.palette === 'indigo') {
      r.style.setProperty('--accent', tweaks.dark ? '#7aa2ff' : '#2b3ea8');
      r.style.setProperty('--gold','#7a5cb8');
      r.style.setProperty('--gold-ink','#3d2b6e');
    } else { // ink
      r.style.setProperty('--accent', tweaks.dark ? '#e9e6dd' : '#171514');
      r.style.setProperty('--gold','#8a7349');
      r.style.setProperty('--gold-ink','#4a3a1f');
    }
  },[tweaks]);

  const topUser = { name: user.name, initial: user.name.charAt(0), role: user.role };

  return (
    <div className="app-shell" data-current-type={currentType}>
      <Sidebar
        user={user}
        currentType={currentType} setCurrentType={setCurrentType}
        currentView={currentView} setCurrentView={setCurrentView}
      />
      <div className="main-col">
        <Topbar user={topUser}/>
        <main className="main">
          {currentView==='list' && <Dashboard type={currentType} codesAvailable={codesAvailable} setCodesAvailable={setCodesAvailable}/>}
          {currentView==='codes' && <CodesView type={currentType} codesAvailable={codesAvailable} setCodesAvailable={setCodesAvailable}/>}
          {currentView==='templates' && <PlaceholderView title="Plantilles d'email" lede="Editor d'email amb previsualització en directe."/>}
          {currentView==='settings' && <PlaceholderView title="Configuració" lede="Automatització i integracions per aquest tipus."/>}
        </main>
      </div>
    </div>
  );
};

function PlaceholderView({ title, lede }){
  return (
    <div className="dashboard">
      <section className="hero">
        <div className="hero-head">
          <div className="hero-eyebrow"><span className="eyebrow-marker"></span>Pròximament</div>
          <h1 className="hero-title">{title}</h1>
          <p className="hero-lede">{lede}</p>
        </div>
      </section>
      <div className="placeholder">
        <span>Aquest panell encara no està redissenyat</span>
      </div>
    </div>
  );
}
