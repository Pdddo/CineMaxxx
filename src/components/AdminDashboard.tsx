import { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { formatRupiah } from '../lib/utils';
import { ShieldAlert, Film, LayoutGrid, Calendar, Users, BarChart3, Plus, Trash2 } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'movies' | 'studios' | 'shows' | 'users' | 'reports'>('movies');

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2 sticky top-24">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            <h2 className="font-bold text-gray-900">Admin Control</h2>
          </div>
          
          <TabButton active={activeTab === 'movies'} onClick={() => setActiveTab('movies')} icon={<Film className="w-5 h-5"/>} label="Movies" />
          <TabButton active={activeTab === 'studios'} onClick={() => setActiveTab('studios')} icon={<LayoutGrid className="w-5 h-5"/>} label="Studios & Seats" />
          <TabButton active={activeTab === 'shows'} onClick={() => setActiveTab('shows')} icon={<Calendar className="w-5 h-5"/>} label="Shows" />
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users className="w-5 h-5"/>} label="Users" />
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<BarChart3 className="w-5 h-5"/>} label="Reports" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[60vh]">
        {activeTab === 'movies' && <ManageMovies />}
        {activeTab === 'studios' && <ManageStudios />}
        {activeTab === 'shows' && <ManageShows />}
        {activeTab === 'users' && <ManageUsers />}
        {activeTab === 'reports' && <Reports />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
        active 
          ? 'bg-indigo-50 text-indigo-700' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// --- Tab Components ---

function ManageMovies() {
  const [movies, setMovies] = useState<any[]>([]);
  const [newMovie, setNewMovie] = useState({ judul: '', durasi_menit: 120, sinopsis: '' });

  useEffect(() => {
    fetchApi('/admin/movies').then(setMovies).catch(console.error);
  }, []);

  const addMovie = async (e: any) => {
    e.preventDefault();
    try {
      const added = await fetchApi('/admin/movies', { method: 'POST', body: JSON.stringify(newMovie) });
      setMovies([...movies, added]);
      setNewMovie({ judul: '', durasi_menit: 120, sinopsis: '' });
    } catch (err) {
      alert("Failed adding movie");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <h3 className="text-2xl font-bold text-gray-900">Manage Movies</h3>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <form className="lg:col-span-1 space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100 h-fit" onSubmit={addMovie}>
          <h4 className="font-bold text-gray-900 mb-4">Add New Movie</h4>
          <input required type="text" placeholder="Movie Title" className="w-full px-4 py-2 border rounded-xl" value={newMovie.judul} onChange={(e)=>setNewMovie({...newMovie, judul: e.target.value})} />
          <input required type="number" placeholder="Duration (Minutes)" className="w-full px-4 py-2 border rounded-xl" value={newMovie.durasi_menit} onChange={(e)=>setNewMovie({...newMovie, durasi_menit: parseInt(e.target.value, 10)})} />
          <textarea required placeholder="Synopsis" className="w-full px-4 py-2 border rounded-xl h-32 resize-none" value={newMovie.sinopsis} onChange={(e)=>setNewMovie({...newMovie, sinopsis: e.target.value})} />
          <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition flex justify-center items-center gap-2">
            <Plus className="w-5 h-5" /> Add Movie
          </button>
        </form>

        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
          {movies.map(m => (
            <div key={m.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-lg text-gray-900 line-clamp-1">{m.judul}</span>
                <button 
                  onClick={async () => {
                    await fetchApi(`/admin/movies/${m.id}`, { method: 'DELETE' });
                    setMovies(movies.filter(x => x.id !== m.id));
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm font-medium text-indigo-600 bg-indigo-50 w-fit px-2 py-1 rounded-md mb-3">{m.durasi_menit} mins</span>
              <p className="text-sm text-gray-500 line-clamp-3 mb-4">{m.sinopsis}</p>
            </div>
          ))}
          {movies.length === 0 && <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">No movies available. Add one to get started.</div>}
        </div>
      </div>
    </div>
  );
}

function ManageStudios() {
  const [studios, setStudios] = useState<any[]>([]);
  const [newStudio, setNewStudio] = useState({ nama_studio: '' });
  const [newSeat, setNewSeat] = useState({ studio_id: '', nomor_kursi: '' });

  useEffect(() => {
    fetchApi('/admin/studios').then(setStudios).catch(console.error);
  }, []);

  const addStudio = async (e: any) => {
    e.preventDefault();
    try {
      const added = await fetchApi('/admin/studios', { method: 'POST', body: JSON.stringify(newStudio) });
      setStudios([...studios, added]);
      setNewStudio({ nama_studio: '' });
    } catch (err) { alert("Failed adding studio"); }
  };

  const addSeat = async (e: any) => {
    e.preventDefault();
    try {
      await fetchApi('/admin/seats', { method: 'POST', body: JSON.stringify({
        studio_id: parseInt(newSeat.studio_id),
        nomor_kursi: newSeat.nomor_kursi
      }) });
      setNewSeat({ studio_id: '', nomor_kursi: '' });
      alert("Seat added successfully!");
    } catch (err) { alert("Failed adding seat"); }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <h3 className="text-2xl font-bold text-gray-900">Manage Studios & Seats</h3>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <form className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100" onSubmit={addStudio}>
          <h4 className="font-bold text-gray-900 mb-2">Add New Studio</h4>
          <input required type="text" placeholder="Studio Name (e.g., Studio 1)" className="w-full px-4 py-2 border rounded-xl" value={newStudio.nama_studio} onChange={(e)=>setNewStudio({nama_studio: e.target.value})} />
          <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">Add Studio</button>
        </form>

        <form className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100" onSubmit={addSeat}>
          <h4 className="font-bold text-gray-900 mb-2">Add Seat to Studio</h4>
          <select required className="w-full px-4 py-2 border rounded-xl" value={newSeat.studio_id} onChange={(e)=>setNewSeat({...newSeat, studio_id: e.target.value})}>
            <option value="">Select Studio</option>
            {studios.map(s => <option key={s.id} value={s.id}>{s.nama_studio}</option>)}
          </select>
          <input required type="text" placeholder="Seat Number (e.g., A1, B2)" className="w-full px-4 py-2 border rounded-xl" value={newSeat.nomor_kursi} onChange={(e)=>setNewSeat({...newSeat, nomor_kursi: e.target.value})} />
          <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">Add Seat</button>
        </form>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mb-4">Existing Studios</h4>
        <div className="flex flex-wrap gap-4">
          {studios.map(s => (
            <div key={s.id} className="bg-white px-5 py-3 rounded-xl border border-gray-200 font-medium text-gray-700">
              {s.nama_studio} (ID: {s.id})
            </div>
          ))}
          {studios.length === 0 && <span className="text-gray-500">No studios created.</span>}
        </div>
      </div>
    </div>
  );
}

function ManageShows() {
  const [shows, setShows] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [studios, setStudios] = useState<any[]>([]);
  const [newShow, setNewShow] = useState({ movie_id: '', studio_id: '', jam_tayang: '' });

  useEffect(() => {
    fetchApi('/admin/shows').then(setShows).catch(console.error);
    fetchApi('/admin/movies').then(setMovies).catch(console.error);
    fetchApi('/admin/studios').then(setStudios).catch(console.error);
  }, []);

  const addShow = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        movie_id: parseInt(newShow.movie_id),
        studio_id: parseInt(newShow.studio_id),
        jam_tayang: new Date(newShow.jam_tayang).toISOString()
      };
      await fetchApi('/admin/shows', { method: 'POST', body: JSON.stringify(payload) });
      fetchApi('/admin/shows').then(setShows); // reload fully formatted shows
      setNewShow({ movie_id: '', studio_id: '', jam_tayang: '' });
    } catch (err) { alert("Failed adding show"); }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <h3 className="text-2xl font-bold text-gray-900">Manage Shows</h3>
      
      <form className="grid sm:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100" onSubmit={addShow}>
        <select required className="w-full px-4 py-2 border rounded-xl" value={newShow.movie_id} onChange={(e)=>setNewShow({...newShow, movie_id: e.target.value})}>
          <option value="">Select Movie</option>
          {movies.map(m => <option key={m.id} value={m.id}>{m.judul}</option>)}
        </select>
        <select required className="w-full px-4 py-2 border rounded-xl" value={newShow.studio_id} onChange={(e)=>setNewShow({...newShow, studio_id: e.target.value})}>
          <option value="">Select Studio</option>
          {studios.map(s => <option key={s.id} value={s.id}>{s.nama_studio}</option>)}
        </select>
        <input required type="datetime-local" className="w-full px-4 py-2 border rounded-xl" value={newShow.jam_tayang} onChange={(e)=>setNewShow({...newShow, jam_tayang: e.target.value})} />
        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">Add Show</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">Movie</th>
              <th className="px-6 py-4">Studio</th>
              <th className="px-6 py-4">Showtime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shows.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-gray-900">{s.movie_judul}</td>
                <td className="px-6 py-4 text-gray-600">{s.nama_studio}</td>
                <td className="px-6 py-4 text-indigo-600 font-medium">{new Date(s.jam_tayang).toLocaleString()}</td>
              </tr>
            ))}
            {shows.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No shows scheduled.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchApi('/admin/users').then(setUsers).catch(console.error);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h3 className="text-2xl font-bold text-gray-900">User Directory</h3>
      <div className="overflow-hidden rounded-2xl border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-500">#{u.id}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{u.nama}</td>
                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={async () => {
                      if(confirm('Are you sure you want to delete this user?')) {
                        await fetchApi(`/admin/users/${u.id}`, { method: 'DELETE' });
                        setUsers(users.filter(x => x.id !== u.id));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Reports() {
  const [report, setReport] = useState<any>({ total_pendapatan: 0, tiket_terjual_per_film: [] });

  useEffect(() => {
    fetchApi('/admin/reports').then(setReport).catch(console.error);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in">
      <h3 className="text-2xl font-bold text-gray-900">Sales Reports</h3>
      
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-lg">
        <span className="text-indigo-100 font-medium mb-2 block">Total Revenue</span>
        <span className="text-5xl font-extrabold tracking-tight">{formatRupiah(report.total_pendapatan)}</span>
      </div>

      <div>
        <h4 className="font-bold text-gray-900 mb-4 text-lg">Tickets Sold per Movie</h4>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {report.tiket_terjual_per_film.map((item: any, idx: number) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 flex justify-between items-center shadow-sm">
              <span className="font-bold text-gray-700 line-clamp-1 mr-4">{item.judul}</span>
              <span className="bg-indigo-50 text-indigo-700 font-bold px-3 py-1 rounded-lg">
                {item.total_tiket} Tickets
              </span>
            </div>
          ))}
          {report.tiket_terjual_per_film.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 rounded-2xl">
              No sales data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
