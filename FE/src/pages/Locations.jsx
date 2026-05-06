import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Plus, Search, Edit2, Trash2, MapPin, Navigation, X, Check, Activity, Crosshair } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIconRetina,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export function Locations() {
    const [locationsList, setLocationsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingLoc, setEditingLoc] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', address: '', lat: 21.0285, lng: 105.8542, radius: 200, isActive: true });
    const [mapSearch, setMapSearch] = useState('');
    const [isSearchingMap, setIsSearchingMap] = useState(false);

    // Component to handle map clicks
    function LocationPicker() {
        const map = useMap();
        useMapEvents({
            click(e) {
                setFormData(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
            },
        });
        
        useEffect(() => {
            map.setView([formData.lat, formData.lng], map.getZoom());
        }, [formData.lat, formData.lng]);
        
        return formData.lat && formData.lng ? (
            <Marker position={[formData.lat, formData.lng]} />
        ) : null;
    }

    const handleMapSearch = async (e) => {
        if (e) e.preventDefault();
        if (!mapSearch.trim()) return;

        setIsSearchingMap(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearch)}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                setFormData(prev => ({
                    ...prev,
                    lat: parseFloat(lat),
                    lng: parseFloat(lon),
                    address: display_name // Tự động gợi ý địa chỉ luôn
                }));
            } else {
                alert('Không tìm thấy địa điểm này trên bản đồ');
            }
        } catch (err) {
            console.error('Map search error:', err);
        } finally {
            setIsSearchingMap(false);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }));
                },
                (error) => {
                    alert('Không thể lấy vị trí: ' + error.message);
                }
            );
        } else {
            alert('Trình duyệt không hỗ trợ Geolocation');
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const data = await api.get('/locations');
            setLocationsList(data);
        } catch (err) {
            console.error('Failed to fetch locations:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = locationsList.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingLoc) {
                await api.put(`/locations/${editingLoc.id}`, formData);
            } else {
                await api.post('/locations', formData);
            }
            fetchLocations();
            setShowModal(false);
            setEditingLoc(null);
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    const openEdit = (l) => {
        setEditingLoc(l);
        setFormData(l);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Xóa vị trí này?')) {
            try {
                // Xóa tạm thời ở UI để người dùng thấy kết quả ngay
                setLocationsList(prev => prev.filter(l => l.id !== id));
                
                await api.delete(`/locations/${id}`);
                // Sau đó mới fetch lại để đồng bộ hoàn toàn
                fetchLocations();
            } catch (err) {
                alert('Lỗi khi xóa: ' + err.message);
                // Nếu lỗi thì fetch lại để khôi phục UI
                fetchLocations();
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm vị trí..."
                        className="input pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    className="btn-primary flex items-center gap-2"
                    onClick={() => { setEditingLoc(null); setFormData({ id: '', name: '', address: '', lat: 21.0285, lng: 105.8542, radius: 200, isActive: true }); setShowModal(true); }}
                >
                    <Plus size={18} /> Thiết lập vị trí mới
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Activity className="animate-spin text-indigo-600" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filtered.map(loc => (
                        <div key={loc.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative group overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{loc.name}</h3>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 font-medium mt-1">
                                            <Navigation size={12} /> {loc.address}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => openEdit(loc)} 
                                        className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-gray-100 shadow-sm transition-all bg-white"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(loc.id)} 
                                        className="p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl border border-gray-100 shadow-sm transition-all bg-white"
                                        title="Xóa vị trí"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
                                <div className="p-3 bg-gray-50 rounded-2xl text-center border-b-2 border-transparent group-hover:border-emerald-200 transition-all">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Vĩ độ (Lat)</p>
                                    <p className="text-sm font-bold text-gray-700">{loc.lat}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-2xl text-center border-b-2 border-transparent group-hover:border-emerald-200 transition-all">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Kinh độ (Lng)</p>
                                    <p className="text-sm font-bold text-gray-700">{loc.lng}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-2xl text-center border-b-2 border-transparent group-hover:border-emerald-200 transition-all text-emerald-600">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Bán kính (m)</p>
                                    <p className="text-sm font-bold">{loc.radius}m</p>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between relative z-10 px-1">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${loc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                    <Activity size={14} className={loc.isActive ? 'animate-pulse' : ''} /> {loc.isActive ? 'Đang hoạt động' : 'Đã tạm dừng'}
                                </span>
                                <span className="text-[10px] font-bold text-gray-300 tracking-tighter uppercase">{loc.id}</span>
                            </div>
                            
                            <div className="absolute top-1/2 right-0 w-48 h-48 bg-gray-100/50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-12 ring-1 shadow-inner ring-gray-100" />
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                            <h3 className="text-xl font-bold text-gray-800">Cấu hình vị trí điểm danh (GPS)</h3>
                            <button onClick={() => setShowModal(false)} className="hover:bg-white p-2 rounded-xl transition-all shadow-sm"><X /></button>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-600 mb-2">Tìm địa điểm trên bản đồ</label>
                                        <div className="flex gap-2 mb-3">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input 
                                                    placeholder="Nhập địa chỉ để tìm nhanh..." 
                                                    className="input pl-10 h-11 text-sm bg-slate-50"
                                                    value={mapSearch}
                                                    onChange={e => setMapSearch(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleMapSearch(e)}
                                                />
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={handleMapSearch}
                                                disabled={isSearchingMap}
                                                className="btn-secondary px-6 h-11 flex items-center gap-2 text-sm font-bold"
                                            >
                                                {isSearchingMap ? <Activity className="animate-spin" size={16} /> : <Navigation size={16} />}
                                                Tìm kiếm
                                            </button>
                                        </div>

                                        <div className="h-72 rounded-2xl overflow-hidden border border-gray-200 relative shadow-inner">
                                            <MapContainer center={[formData.lat, formData.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                />
                                                <LocationPicker />
                                            </MapContainer>
                                            <button 
                                                type="button"
                                                onClick={getCurrentLocation}
                                                className="absolute bottom-4 right-4 z-[1000] bg-white px-4 py-2.5 rounded-xl shadow-xl border border-gray-100 text-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider"
                                            >
                                                <Crosshair size={14} strokeWidth={3} /> Lấy vị trí của tôi
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 ml-1 font-medium italic">* Click trực tiếp lên bản đồ hoặc tìm kiếm địa chỉ để lấy tọa độ</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-600 mb-2">Mã vị trí (ID)</label>
                                            <input required placeholder="VD: LOC001" className="input h-12" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} disabled={!!editingLoc} />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-600 mb-2">Tên địa điểm</label>
                                            <input required placeholder="VD: Trường THPT Chuyên" className="input h-12" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-600 mb-2">Địa chỉ chi tiết</label>
                                            <textarea required placeholder="VD: 123 Đường ABC, Hà Nội" className="input min-h-[80px] py-3" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-600 mb-2">Vĩ độ (Lat)</label>
                                            <input required type="number" step="0.000001" className="input h-12" value={formData.lat} onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-600 mb-2">Kinh độ (Lng)</label>
                                            <input required type="number" step="0.000001" className="input h-12" value={formData.lng} onChange={e => setFormData({ ...formData, lng: parseFloat(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-600 mb-2">Bán kính quét (m)</label>
                                            <input required type="number" className="input h-12" value={formData.radius} onChange={e => setFormData({ ...formData, radius: parseInt(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-600 mb-2">Trạng thái</label>
                                            <select className="input h-12" value={formData.isActive.toString()} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}>
                                                <option value="true">Đang hoạt động</option>
                                                <option value="false">Tạm dừng</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-gray-100 flex-shrink-0">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-4 justify-center font-bold">Hủy bỏ</button>
                                    <button type="submit" className="btn-primary flex-1 py-4 flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 font-bold text-lg">
                                        <Check size={20} strokeWidth={3} /> {editingLoc ? 'LƯU CẬP NHẬT' : 'KÍCH HOẠT VỊ TRÍ'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

