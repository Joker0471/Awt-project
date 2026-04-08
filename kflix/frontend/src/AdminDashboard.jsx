import { useState, useEffect } from "react";
import { mediaAPI, usersAPI } from './api';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';

function useToast() {
  const [list, setList] = useState([]);
  const add = (msg, type = "success") => {
    const id = Date.now();
    setList(t => [...t, { id, msg, type }]);
    setTimeout(() => setList(t => t.filter(x => x.id !== id)), 3000);
  };
  return { list, add };
}

const MOVIE_PLATFORMS = ["NETFLIX","PRIME","MARVEL","DC","ROMANTIC","DREAMWORKS","TOP"];
const SHOW_PLATFORMS  = ["NETFLIX","PRIME","HBO","DISNEY","HOTSTAR","TOP"];
const ROLES    = ["user","premium","admin"];
const STATUSES = ["active","suspended","inactive"];
const avatarColor = name => ["#e50914","#3b82f6","#22c55e","#a855f7","#f59e0b","#ff6b35"][(name?.charCodeAt(0)||0)%6];
const initials    = name => (name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

export default function AdminDashboard() {
  const [tab,    setTab]    = useState("dashboard");
  const [movies, setMovies] = useState([]);
  const [shows,  setShows]  = useState([]);
  const [users,  setUsers]  = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [grouped, usersRes] = await Promise.all([
        mediaAPI.getGrouped(),
        usersAPI.getAll({ limit: 100 }),
      ]);

      // Flatten grouped media — keep MongoDB _id
      const allMovies = [];
      const allShows  = [];
      for (const [platform, items] of Object.entries(grouped.movies || {})) {
        items.forEach(item => allMovies.push({ ...item, platform }));
      }
      for (const [platform, items] of Object.entries(grouped.shows || {})) {
        items.forEach(item => allShows.push({ ...item, platform }));
      }
      setMovies(allMovies);
      setShows(allShows);
      setUsers(usersRes.data || []);
    } catch (err) {
      toast.add("Failed to load data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  if (loading) return <div className="loading">Loading admin data...</div>;

  const TABS = [
    { id:"dashboard", icon:"📊", label:"Dashboard" },
    { id:"movies",    icon:"🎬", label:"Movies",  badge: movies.length },
    { id:"shows",     icon:"📺", label:"Series",  badge: shows.length  },
    { id:"users",     icon:"👥", label:"Users",   badge: users.length  },
    { id:"settings",  icon:"⚙️",  label:"Settings" },
  ];
  const PAGE_TITLE = { dashboard:"Dashboard", movies:"Movies", shows:"Series", users:"Users", settings:"Settings" };

  return (
    <>
      <style>{CSS}</style>
      <div className="ad-shell">
        <aside className="ad-sidebar">
          <div className="ad-logo">
            <div className="ad-logo-icon">🎬</div>
            <div>
              <div className="ad-logo-name">KFLIX</div>
              <div className="ad-logo-sub">Admin Panel</div>
            </div>
          </div>
          {TABS.map(item => (
            <div key={item.id} className={`ad-nav-item${tab===item.id?" active":""}`} onClick={()=>setTab(item.id)}>
              <span>{item.icon}</span>
              <span className="ad-nav-label">{item.label}</span>
              {item.badge != null && <span className="ad-nav-badge">{item.badge}</span>}
            </div>
          ))}
          <div className="ad-sidebar-footer">
            <div className="ad-avatar" style={{background:"#e50914"}}>
              {initials(currentUser?.username || "SA")}
            </div>
            <div>
              <div style={{fontSize:"0.85rem",fontWeight:600}}>{currentUser?.username || "Admin"}</div>
              <div style={{fontSize:"0.68rem",color:"var(--t3)"}}>{currentUser?.email || "admin@kflix.com"}</div>
            </div>
          </div>
        </aside>

        <div className="ad-main">
          <header className="ad-topbar">
            <div>
              <div className="ad-topbar-title">{PAGE_TITLE[tab]}</div>
              <div className="ad-topbar-crumb">KFLIX Admin / {PAGE_TITLE[tab]}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button className="ad-btn ad-btn-ghost" onClick={fetchAll} title="Refresh">🔄</button>
              <button className="ad-btn ad-btn-outline" onClick={handleLogout}>Logout</button>
              <div className="ad-avatar" style={{background:"#e50914",cursor:"pointer"}}>
                {initials(currentUser?.username || "SA")}
              </div>
            </div>
          </header>
          <main className="ad-content">
            {tab==="dashboard" && <Dashboard movies={movies} shows={shows} users={users} />}
            {tab==="movies"    && <ContentManager data={movies} setData={setMovies} type="movie" platforms={MOVIE_PLATFORMS} toast={toast} onRefresh={fetchAll} />}
            {tab==="shows"     && <ContentManager data={shows}  setData={setShows}  type="show"  platforms={SHOW_PLATFORMS}  toast={toast} onRefresh={fetchAll} />}
            {tab==="users"     && <UsersManager   users={users} setUsers={setUsers} toast={toast} onRefresh={fetchAll} />}
            {tab==="settings"  && <Settings toast={toast} />}
          </main>
        </div>
      </div>
      <div className="ad-toasts">
        {toast.list.map(t => (
          <div key={t.id} className={`ad-toast ad-toast-${t.type}`}>
            {t.type==="success"?"✅":t.type==="error"?"❌":"ℹ️"} {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}

function Dashboard({ movies, shows, users }) {
  const platformCounts = {};
  [...movies, ...shows].forEach(i => { platformCounts[i.platform] = (platformCounts[i.platform]||0)+1; });
  const topPlatforms = Object.entries(platformCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxP = Math.max(...topPlatforms.map(p=>p[1]), 1);
  const COLORS = ["#e50914","#3b82f6","#a855f7","#f59e0b","#22c55e","#ff6b35"];

  const stats = [
    { icon:"🎬", label:"Total Movies",  value:movies.length,                                            color:"#e50914" },
    { icon:"📺", label:"Total Series",  value:shows.length,                                             color:"#3b82f6" },
    { icon:"👥", label:"Active Users",  value:users.filter(u=>u.status==="active").length,              color:"#22c55e" },
    { icon:"👑", label:"Premium Users", value:users.filter(u=>u.role==="premium").length,               color:"#f59e0b" },
    { icon:"📦", label:"All Content",   value:movies.length+shows.length,                               color:"#a855f7" },
  ];

  return (
    <div>
      <div className="ad-stats">
        {stats.map((s,i) => (
          <div key={i} className="ad-stat-card" style={{"--ac":s.color}}>
            <div className="ad-stat-icon">{s.icon}</div>
            <div className="ad-stat-label">{s.label}</div>
            <div className="ad-stat-value" style={{color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="ad-two-col">
        <div className="ad-panel">
          <div className="ad-panel-head"><span>Content by Platform</span><span style={{fontSize:"0.72rem",color:"var(--t3)"}}>Live from API</span></div>
          <div className="ad-panel-body">
            {topPlatforms.map(([plat,count],i) => (
              <div key={plat} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem",marginBottom:5}}>
                  <span>{plat}</span>
                  <span style={{fontFamily:"var(--mono)",color:"var(--t3)"}}>{count} titles</span>
                </div>
                <div className="ad-bar-bg"><div className="ad-bar-fill" style={{width:`${(count/maxP)*100}%`,background:COLORS[i%COLORS.length]}} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="ad-panel">
          <div className="ad-panel-head"><span>User Overview</span></div>
          <div className="ad-panel-body">
            {[
              {label:"Regular Users", count:users.filter(u=>u.role==="user").length,      color:"#3b82f6"},
              {label:"Premium",       count:users.filter(u=>u.role==="premium").length,   color:"#f59e0b"},
              {label:"Admin",         count:users.filter(u=>u.role==="admin").length,     color:"#e50914"},
              {label:"Active",        count:users.filter(u=>u.status==="active").length,  color:"#22c55e"},
              {label:"Suspended",     count:users.filter(u=>u.status==="suspended").length, color:"#e50914"},
            ].map((r,i) => (
              <div key={i} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.82rem",marginBottom:5}}>
                  <span>{r.label}</span>
                  <span style={{fontFamily:"var(--mono)",color:r.color,fontWeight:600}}>{r.count}</span>
                </div>
                <div className="ad-bar-bg"><div className="ad-bar-fill" style={{width:`${users.length ? (r.count/users.length)*100 : 0}%`,background:r.color}} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ad-panel">
        <div className="ad-panel-head"><span>Latest Movies</span></div>
        <ContentTable data={movies.slice(0,6)} type="movie" readOnly />
      </div>
    </div>
  );
}

function VideoUploadField({ form, setForm, type, toast }) {
  const [uploading, setUploading] = useState(false);

  const handleBrowse = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/webm,video/x-matroska,video/avi,video/quicktime';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploading(true);
      try {
        const folder = type === 'show' ? 'shows' : 'movies';
        const formData = new FormData();
        formData.append('video', file);
        const token = localStorage.getItem('kflix_token');
        const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${BASE}/api/upload/video?folder=${folder}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        setForm(f => ({ ...f, video: data.path }));
        toast.add(`"${file.name}" uploaded successfully`);
      } catch (err) {
        toast.add(err.message || 'Upload failed', 'error');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  return (
    <div className="ad-fgroup" style={{marginTop:16}}>
      <label className="ad-label">🎬 Video</label>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input
          className="ad-input"
          style={{flex:1}}
          value={form.video||""}
          onChange={e=>setForm(f=>({...f,video:e.target.value}))}
          placeholder="/videos/movies/inception.mp4 or browse below"
        />
        <button
          type="button"
          className="ad-btn ad-btn-outline"
          style={{whiteSpace:"nowrap",flexShrink:0}}
          onClick={handleBrowse}
          disabled={uploading}
        >
          {uploading ? "⏳ Uploading…" : "📁 Browse"}
        </button>
      </div>
      {uploading && (
        <div style={{marginTop:6,padding:"8px 12px",background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:6,fontSize:"0.75rem",color:"#3b82f6"}}>
          ⏳ Uploading video, please wait…
        </div>
      )}
      {!uploading && form.video ? (
        <div style={{marginTop:6,padding:"8px 12px",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:6,fontSize:"0.75rem",color:"#22c55e"}}>
          ✅ Video set — users will see the player when logged in<br/>
          <span style={{opacity:0.7,fontFamily:"monospace"}}>{form.video}</span>
        </div>
      ) : !uploading && (
        <div style={{marginTop:6,fontSize:"0.72rem",color:"var(--t3)"}}>
          Browse to upload a video file, or type a path manually. Leave blank → "Video coming soon"
        </div>
      )}
    </div>
  );
}

function ContentManager({ data, setData, type, platforms, toast, onRefresh }) {
  const [search, setSearch] = useState("");
  const [plat,   setPlat]   = useState("All");
  const [modal,  setModal]  = useState(null);
  const [confirm,setConfirm]= useState(null);
  const [saving, setSaving] = useState(false);
  const blank = { name:"", genre:"", type: type, platform:platforms[0], status:"Active", img:"", video:"", description:"", releaseYear:"", rating:"" };
  const [form, setForm] = useState(blank);

  const filtered = data.filter(i =>
    (plat==="All" || i.platform===plat) &&
    (i.name||"").toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    if (!form.name.trim()) { toast.add("Title is required","error"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: type,
        genre: form.genre || form.type || "",
        platform: form.platform,
        status: form.status || "Active",
        img: form.img || "",
        video: form.video || "",
        description: form.description || "",
        releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
        rating: form.rating ? Number(form.rating) : undefined,
      };

      if (modal === "add") {
        await mediaAPI.create(payload);
        toast.add(`"${form.name}" added`);
      } else {
        await mediaAPI.update(modal._id, payload);
        toast.add(`"${form.name}" updated`);
      }
      setModal(null);
      onRefresh();
    } catch (err) {
      toast.add(err.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDel = async () => {
    try {
      await mediaAPI.delete(confirm._id);
      toast.add(`"${confirm.name}" deleted`, "error");
      setConfirm(null);
      onRefresh();
    } catch (err) {
      toast.add(err.message || "Delete failed", "error");
      setConfirm(null);
    }
  };

  const label = type==="movie" ? "Movie" : "Series";

  return (
    <div className="ad-panel">
      <div className="ad-panel-head">
        <span>{label}s — {filtered.length} shown / {data.length} total</span>
        <button className="ad-btn ad-btn-primary" onClick={()=>{setForm(blank);setModal("add")}}>＋ Add {label}</button>
      </div>
      <div className="ad-filter-bar">
        <input className="ad-input" placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1}} />
        <select className="ad-select" value={plat} onChange={e=>setPlat(e.target.value)}>
          <option>All</option>{platforms.map(p=><option key={p}>{p}</option>)}
        </select>
      </div>
      <ContentTable data={filtered} type={type}
        onEdit={item=>{setForm({...item, genre: item.genre||item.type||"" });setModal(item)}}
        onDelete={(id,name,_id)=>setConfirm({id,name,_id})} />

      {modal && (
        <div className="ad-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="ad-modal">
            <div className="ad-modal-head">
              <span>{modal==="add"?`Add ${label}`:`Edit — ${modal.name}`}</span>
              <button className="ad-modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div className="ad-modal-body">
              <div className="ad-form-grid">
                <div className="ad-fgroup">
                  <label className="ad-label">Title *</label>
                  <input className="ad-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
                </div>
                <div className="ad-fgroup">
                  <label className="ad-label">Genre</label>
                  <input className="ad-input" value={form.genre} onChange={e=>setForm(f=>({...f,genre:e.target.value}))} placeholder="e.g. Action" />
                </div>
                <div className="ad-fgroup">
                  <label className="ad-label">Platform</label>
                  <select className="ad-select" value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))}>
                    {platforms.map(p=><option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="ad-fgroup">
                  <label className="ad-label">Status</label>
                  <select className="ad-select" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
                <div className="ad-fgroup">
                  <label className="ad-label">Release Year</label>
                  <input className="ad-input" type="number" value={form.releaseYear||""} onChange={e=>setForm(f=>({...f,releaseYear:e.target.value}))} placeholder="e.g. 2024" />
                </div>
                <div className="ad-fgroup">
                  <label className="ad-label">Rating (0-10)</label>
                  <input className="ad-input" type="number" min="0" max="10" step="0.1" value={form.rating||""} onChange={e=>setForm(f=>({...f,rating:e.target.value}))} placeholder="e.g. 8.5" />
                </div>
              </div>
              <div className="ad-fgroup" style={{marginTop:14}}>
                <label className="ad-label">Poster URL</label>
                <input className="ad-input" value={form.img} onChange={e=>setForm(f=>({...f,img:e.target.value}))} placeholder="https://..." />
              </div>
              {form.img && <img src={form.img} alt="" onError={e=>e.target.style.display="none"} style={{width:"100%",height:140,objectFit:"cover",borderRadius:6,marginTop:10,border:"1px solid var(--border)"}} />}
              <div className="ad-fgroup" style={{marginTop:14}}>
                <label className="ad-label">Description</label>
                <textarea className="ad-input" rows={3} value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Short description..." style={{resize:"vertical"}} />
              </div>
              <VideoUploadField form={form} setForm={setForm} type={type} toast={toast} />
            </div>
            <div className="ad-modal-foot">
              <button className="ad-btn ad-btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="ad-btn ad-btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving…" : (modal==="add"?`Add ${label}`:"Save")}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirm && <ConfirmDel name={confirm.name} onConfirm={confirmDel} onCancel={()=>setConfirm(null)} />}
    </div>
  );
}

function ContentTable({ data, type, onEdit, onDelete, readOnly }) {
  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead><tr>
          <th>Poster</th><th>Title</th><th>Platform</th><th>Genre</th><th>Status</th>
          {!readOnly && <th>Actions</th>}
        </tr></thead>
        <tbody>
          {data.length===0
            ? <tr><td colSpan={6} style={{textAlign:"center",padding:"28px",color:"var(--t3)"}}>No results</td></tr>
            : data.map(item => (
              <tr key={item._id}>
                <td><img src={item.img} alt="" className="ad-thumb" onError={e=>e.target.style.opacity=0.15} /></td>
                <td><div className="ad-td-name">{item.name}</div></td>
                <td><span className={`ad-badge ${type==="movie"?"ad-badge-blue":"ad-badge-purple"}`}>{item.platform}</span></td>
                <td style={{fontSize:"0.75rem",color:"var(--t3)"}}>{item.genre || item.type}</td>
                <td><span className={`ad-badge ${item.status==="Active"?"ad-badge-green":"ad-badge-gray"}`}>{item.status}</span></td>
                {!readOnly && (
                  <td><div style={{display:"flex",gap:6}}>
                    <button className="ad-btn ad-btn-outline ad-btn-sm" onClick={()=>onEdit(item)}>✏️ Edit</button>
                    <button className="ad-btn ad-btn-danger ad-btn-sm" onClick={()=>onDelete(item._id,item.name,item._id)}>🗑️</button>
                  </div></td>
                )}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

function UsersManager({ users, setUsers, toast, onRefresh }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal,  setModal]  = useState(null);
  const [confirm,setConfirm]= useState(null);
  const [saving, setSaving] = useState(false);
  const blank = { username:"", email:"", role:"user", status:"active" };
  const [form, setForm] = useState(blank);

  const filtered = users.filter(u =>
    (filter==="All" || u.role===filter.toLowerCase()) &&
    ((u.username||"").toLowerCase().includes(search.toLowerCase()) ||
     (u.email||"").toLowerCase().includes(search.toLowerCase()))
  );

  const save = async () => {
    if (!form.username?.trim() || !form.email?.trim()) { toast.add("Username & email required","error"); return; }
    setSaving(true);
    try {
      await usersAPI.update(modal._id, {
        username: form.username,
        email: form.email,
        role: form.role,
        status: form.status,
      });
      toast.add(`User "${form.username}" updated`);
      setModal(null);
      onRefresh();
    } catch (err) {
      toast.add(err.message || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u) => {
    const next = u.status==="active" ? "suspended" : "active";
    try {
      await usersAPI.update(u._id, { status: next });
      toast.add(`${u.username} → ${next}`, next==="active"?"success":"info");
      onRefresh();
    } catch (err) {
      toast.add(err.message || "Update failed", "error");
    }
  };

  const confirmDel = async () => {
    try {
      await usersAPI.delete(confirm._id);
      toast.add(`"${confirm.username}" deleted`, "error");
      setConfirm(null);
      onRefresh();
    } catch (err) {
      toast.add(err.message || "Delete failed", "error");
      setConfirm(null);
    }
  };

  const roleBadge   = r => ({user:"ad-badge-gray",premium:"ad-badge-yellow",admin:"ad-badge-red"}[r]||"ad-badge-gray");
  const statusBadge = s => ({active:"ad-badge-green",suspended:"ad-badge-red",inactive:"ad-badge-gray"}[s]||"ad-badge-gray");

  return (
    <div className="ad-panel">
      <div className="ad-panel-head">
        <span>Users — {filtered.length} shown / {users.length} total</span>
      </div>
      <div className="ad-filter-bar">
        <input className="ad-input" placeholder="🔍 Search name or email..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1}} />
        <select className="ad-select" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option>All</option>{ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
        </select>
      </div>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} style={{textAlign:"center",padding:"28px",color:"var(--t3)"}}>No users found</td></tr>
              : filtered.map(u => (
              <tr key={u._id}>
                <td><div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div className="ad-avatar" style={{background:avatarColor(u.username),width:32,height:32,fontSize:"0.68rem"}}>{initials(u.username)}</div>
                  <span className="ad-td-name">{u.username}</span>
                </div></td>
                <td style={{fontFamily:"var(--mono)",fontSize:"0.72rem",color:"var(--t3)"}}>{u.email}</td>
                <td><span className={`ad-badge ${roleBadge(u.role)}`}>{u.role}</span></td>
                <td><span className={`ad-badge ${statusBadge(u.status)}`}>{u.status}</span></td>
                <td style={{fontFamily:"var(--mono)",fontSize:"0.72rem",color:"var(--t3)"}}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="ad-btn ad-btn-outline ad-btn-sm" onClick={()=>{setForm({...u});setModal(u)}}>✏️</button>
                  <button className={`ad-btn ad-btn-sm ${u.status==="active"?"ad-btn-danger":"ad-btn-success"}`} onClick={()=>toggleStatus(u)}>
                    {u.status==="active"?"🚫":"✅"}
                  </button>
                  <button className="ad-btn ad-btn-danger ad-btn-sm" onClick={()=>setConfirm({_id:u._id,username:u.username})}>🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="ad-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="ad-modal">
            <div className="ad-modal-head">
              <span>Edit — {modal.username}</span>
              <button className="ad-modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div className="ad-modal-body">
              <div className="ad-form-grid">
                <div className="ad-fgroup"><label className="ad-label">Username *</label>
                  <input className="ad-input" value={form.username||""} onChange={e=>setForm(f=>({...f,username:e.target.value}))} /></div>
                <div className="ad-fgroup"><label className="ad-label">Email *</label>
                  <input className="ad-input" type="email" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
                <div className="ad-fgroup"><label className="ad-label">Role</label>
                  <select className="ad-select" value={form.role||"user"} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                    {ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}</select></div>
                <div className="ad-fgroup"><label className="ad-label">Status</label>
                  <select className="ad-select" value={form.status||"active"} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    {STATUSES.map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></div>
              </div>
            </div>
            <div className="ad-modal-foot">
              <button className="ad-btn ad-btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="ad-btn ad-btn-primary" onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}
      {confirm && <ConfirmDel name={confirm.username} onConfirm={confirmDel} onCancel={()=>setConfirm(null)} />}
    </div>
  );
}

function Settings({ toast }) {
  const [site,  setSite]  = useState({ name:"KFLIX", tagline:"Your world of entertainment", maintenance:false });
  const [notif, setNotif] = useState({ newUser:true, newContent:true, errors:true });
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div className="ad-panel">
        <div className="ad-panel-head"><span>⚙️ Site Settings</span></div>
        <div className="ad-panel-body">
          <div className="ad-form-grid">
            <div className="ad-fgroup"><label className="ad-label">Site Name</label>
              <input className="ad-input" value={site.name} onChange={e=>setSite(s=>({...s,name:e.target.value}))} /></div>
            <div className="ad-fgroup"><label className="ad-label">Tagline</label>
              <input className="ad-input" value={site.tagline} onChange={e=>setSite(s=>({...s,tagline:e.target.value}))} /></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginTop:16}}>
            <div onClick={()=>setSite(s=>({...s,maintenance:!s.maintenance}))} className="ad-toggle" style={{background:site.maintenance?"var(--red)":"var(--panel3)"}}>
              <div className="ad-toggle-thumb" style={{left:site.maintenance?22:3}} />
            </div>
            <span style={{fontSize:"0.85rem",color:site.maintenance?"var(--red)":"var(--t3)"}}>
              Maintenance Mode — {site.maintenance?"ON (site offline)":"OFF (site live)"}
            </span>
          </div>
          <button className="ad-btn ad-btn-primary" style={{marginTop:16}} onClick={()=>toast.add("Saved!")}>Save Settings</button>
        </div>
      </div>

      <div className="ad-panel">
        <div className="ad-panel-head"><span>🔔 Notifications</span></div>
        <div className="ad-panel-body">
          {[{key:"newUser",label:"New User Signup"},{key:"newContent",label:"New Content Added"},{key:"errors",label:"Error Alerts"}].map(({key,label})=>(
            <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
              <span style={{fontSize:"0.88rem"}}>{label}</span>
              <div onClick={()=>setNotif(n=>({...n,[key]:!n[key]}))} className="ad-toggle" style={{background:notif[key]?"var(--green)":"var(--panel3)"}}>
                <div className="ad-toggle-thumb" style={{left:notif[key]?22:3}} />
              </div>
            </div>
          ))}
          <button className="ad-btn ad-btn-primary" style={{marginTop:16}} onClick={()=>toast.add("Preferences saved")}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDel({ name, onConfirm, onCancel }) {
  return (
    <div className="ad-overlay" onClick={e=>e.target===e.currentTarget&&onCancel()}>
      <div className="ad-confirm">
        <div style={{fontSize:"2.5rem",marginBottom:10}}>🗑️</div>
        <div style={{fontFamily:"var(--head)",fontSize:"1.2rem",fontWeight:700,marginBottom:8}}>Delete?</div>
        <div style={{fontSize:"0.87rem",color:"var(--t2)",marginBottom:20}}>"{name}" will be permanently removed.</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="ad-btn ad-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="ad-btn ad-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
:root{--bg:#0b0d14;--panel:#13151f;--panel2:#191c28;--panel3:#21253a;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);--red:#e50914;--blue:#3b82f6;--green:#22c55e;--yellow:#f59e0b;--purple:#a855f7;--text:#e8e6f0;--t2:#9896a8;--t3:#555570;--head:'Syne',sans-serif;--mono:'DM Mono',monospace;--body:'DM Sans',sans-serif;--r:7px}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;scrollbar-width:thin;scrollbar-color:var(--panel3) transparent}
body{background:var(--bg);color:var(--text);font-family:var(--body);-webkit-font-smoothing:antialiased}
.ad-shell{display:flex;height:100vh;overflow:hidden}
.ad-sidebar{width:220px;flex-shrink:0;background:var(--panel);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow-y:auto}
.ad-logo{display:flex;align-items:center;gap:10px;padding:20px 18px;border-bottom:1px solid var(--border)}
.ad-logo-icon{width:34px;height:34px;border-radius:8px;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
.ad-logo-name{font-family:var(--head);font-size:1.1rem;font-weight:800;letter-spacing:2px}
.ad-logo-sub{font-size:0.58rem;color:var(--t3);letter-spacing:2px;text-transform:uppercase;font-family:var(--mono)}
.ad-nav-item{display:flex;align-items:center;gap:11px;padding:10px 18px;cursor:pointer;border-left:3px solid transparent;transition:all 0.18s;font-size:0.87rem;font-weight:500;color:var(--t2)}
.ad-nav-item:hover{background:rgba(255,255,255,0.04);color:var(--text)}
.ad-nav-item.active{border-left-color:var(--red);background:rgba(229,9,20,0.08);color:var(--text)}
.ad-nav-label{flex:1}
.ad-nav-badge{background:var(--red);color:#fff;font-family:var(--mono);font-size:0.6rem;padding:2px 7px;border-radius:10px}
.ad-sidebar-footer{margin-top:auto;padding:14px 18px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px}
.ad-main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.ad-topbar{height:58px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:var(--panel);border-bottom:1px solid var(--border)}
.ad-topbar-title{font-family:var(--head);font-size:1.1rem;font-weight:700}
.ad-topbar-crumb{font-size:0.68rem;color:var(--t3);font-family:var(--mono)}
.ad-content{flex:1;overflow-y:auto;padding:22px 24px}
.ad-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0;color:#fff}
.ad-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px}
.ad-stat-card{background:var(--panel);border:1px solid var(--border);border-top:2px solid var(--ac,var(--red));border-radius:var(--r);padding:18px;transition:transform 0.2s}
.ad-stat-card:hover{transform:translateY(-2px)}
.ad-stat-icon{font-size:1.4rem;margin-bottom:10px}
.ad-stat-label{font-size:0.68rem;color:var(--t3);font-family:var(--mono);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px}
.ad-stat-value{font-family:var(--head);font-size:2rem;font-weight:800;line-height:1}
.ad-two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.ad-panel{background:var(--panel);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:20px}
.ad-panel-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);font-family:var(--head);font-size:0.95rem;font-weight:700}
.ad-panel-body{padding:18px}
.ad-filter-bar{display:flex;gap:10px;padding:12px 18px;border-bottom:1px solid var(--border)}
.ad-table-wrap{overflow-x:auto}
.ad-table{width:100%;border-collapse:collapse;font-size:0.82rem}
.ad-table thead tr{border-bottom:1px solid var(--border2)}
.ad-table th{text-align:left;padding:10px 14px;font-family:var(--mono);font-size:0.62rem;letter-spacing:2px;text-transform:uppercase;color:var(--t3);font-weight:400}
.ad-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:middle}
.ad-table tr:last-child td{border-bottom:none}
.ad-table tbody tr:hover td{background:rgba(255,255,255,0.02)}
.ad-thumb{width:44px;height:30px;object-fit:cover;border-radius:4px;display:block}
.ad-td-name{font-weight:500;color:var(--text)}
.ad-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-family:var(--mono);font-size:0.62rem;letter-spacing:0.5px;white-space:nowrap}
.ad-badge-green{background:rgba(34,197,94,0.12);color:#22c55e}
.ad-badge-red{background:rgba(229,9,20,0.12);color:#e50914}
.ad-badge-blue{background:rgba(59,130,246,0.12);color:#3b82f6}
.ad-badge-yellow{background:rgba(245,158,11,0.12);color:#f59e0b}
.ad-badge-purple{background:rgba(168,85,247,0.12);color:#a855f7}
.ad-badge-gray{background:rgba(255,255,255,0.07);color:var(--t2)}
.ad-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 15px;border-radius:var(--r);font-family:var(--body);font-size:0.82rem;font-weight:600;cursor:pointer;transition:all 0.18s;border:none;white-space:nowrap}
.ad-btn:disabled{opacity:0.5;cursor:not-allowed}
.ad-btn-primary{background:var(--red);color:#fff}.ad-btn-primary:hover:not(:disabled){background:#c4070f}
.ad-btn-outline{background:transparent;color:var(--t2);border:1px solid var(--border2)}.ad-btn-outline:hover{background:var(--panel3);color:var(--text)}
.ad-btn-ghost{background:transparent;color:var(--t2);border:none}.ad-btn-ghost:hover{background:var(--panel3);color:var(--text)}
.ad-btn-danger{background:rgba(229,9,20,0.1);color:var(--red);border:1px solid rgba(229,9,20,0.2)}.ad-btn-danger:hover{background:var(--red);color:#fff}
.ad-btn-success{background:rgba(34,197,94,0.1);color:#22c55e;border:1px solid rgba(34,197,94,0.2)}.ad-btn-success:hover{background:#22c55e;color:#fff}
.ad-btn-sm{padding:5px 10px;font-size:0.75rem;border-radius:5px}
.ad-input,.ad-select{background:var(--panel2);border:1px solid var(--border2);border-radius:var(--r);padding:8px 12px;color:var(--text);font-family:var(--body);font-size:0.84rem;outline:none;transition:border-color 0.2s;width:100%}
.ad-input:focus,.ad-select:focus{border-color:rgba(229,9,20,0.5);box-shadow:0 0 0 3px rgba(229,9,20,0.07)}
.ad-input::placeholder{color:var(--t3)}
.ad-select{cursor:pointer}.ad-select option{background:var(--panel2)}
.ad-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.ad-fgroup{display:flex;flex-direction:column;gap:6px}
.ad-label{font-family:var(--mono);font-size:0.62rem;letter-spacing:2px;text-transform:uppercase;color:var(--t3)}
.ad-bar-bg{height:5px;background:var(--panel3);border-radius:3px;overflow:hidden}
.ad-bar-fill{height:100%;border-radius:3px;transition:width 0.8s ease}
.ad-overlay{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.78);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;animation:adFade 0.18s ease}
@keyframes adFade{from{opacity:0}to{opacity:1}}
.ad-modal{background:var(--panel);border:1px solid var(--border2);border-radius:10px;width:100%;max-width:520px;box-shadow:0 40px 80px rgba(0,0,0,0.8);animation:adSlide 0.22s cubic-bezier(0.34,1.56,0.64,1);max-height:90vh;overflow-y:auto}
@keyframes adSlide{from{transform:translateY(20px) scale(0.97);opacity:0}to{transform:none;opacity:1}}
.ad-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--border);font-family:var(--head);font-size:1rem;font-weight:700}
.ad-modal-body{padding:22px}
.ad-modal-foot{padding:14px 22px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px}
.ad-modal-close{width:30px;height:30px;border-radius:50%;background:var(--panel2);border:1px solid var(--border);color:var(--t2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:0.85rem;transition:all 0.2s}
.ad-modal-close:hover{background:var(--red);color:#fff}
.ad-confirm{background:var(--panel);border:1px solid rgba(229,9,20,0.3);border-radius:10px;padding:28px;text-align:center;max-width:360px;box-shadow:0 40px 80px rgba(0,0,0,0.8);animation:adSlide 0.22s cubic-bezier(0.34,1.56,0.64,1)}
.ad-toggle{width:44px;height:24px;border-radius:12px;position:relative;cursor:pointer;transition:background 0.2s;flex-shrink:0}
.ad-toggle-thumb{width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:3px;transition:left 0.2s}
.ad-toasts{position:fixed;bottom:22px;right:22px;z-index:9999;display:flex;flex-direction:column;gap:8px}
.ad-toast{background:var(--panel2);border:1px solid var(--border2);border-radius:var(--r);padding:11px 16px;font-size:0.84rem;min-width:240px;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:adFade 0.2s ease}
.ad-toast-success{border-left:3px solid var(--green)}
.ad-toast-error{border-left:3px solid var(--red)}
.ad-toast-info{border-left:3px solid var(--blue)}
@media(max-width:1100px){.ad-stats{grid-template-columns:repeat(3,1fr)}}
@media(max-width:800px){.ad-sidebar{width:60px}.ad-nav-label,.ad-logo-name,.ad-logo-sub{display:none}.ad-stats{grid-template-columns:1fr 1fr}.ad-two-col{grid-template-columns:1fr}}
`;
