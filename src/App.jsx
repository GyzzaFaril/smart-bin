import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Memanggil Environment Variables di Vite menggunakan import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [binData, setBinData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fungsi mengambil data awal saat web pertama kali dimuat
    const fetchInitialData = async () => {
      const { data, error } = await supabase
        .from('bin_logs')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (!error) {
        setBinData(data);
      } else {
        console.error("Gagal mengambil data:", error);
      }
      setLoading(false);
    };

    fetchInitialData();

    // 2. Fungsi mendengarkan perubahan data secara REAL-TIME
    const channel = supabase
      .channel('realtime-bin')
      .on(
        'postgres_changes',
        {
          event: '*', // Hanya dengarkan event UPDATE
          schema: 'public',
          table: 'bin_logs',
          filter: 'id=eq.1', // Hanya dengarkan perubahan pada baris ID 1
        },
        (payload) => {
          console.log('Data baru masuk!', payload.new);
          // Langsung ubah angka di layar tanpa refresh!
          setBinData(payload.new); 
        }
      )
      .subscribe();

    // Bersihkan pendengar saat komponen ditutup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Menghubungkan ke Tong Sampah... ♻️</h2>;
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Dashboard Smart Bin 🚮</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
        
        <div style={cardStyle}>
          <h3 style={{ margin: 0, color: '#666' }}>Kapasitas Sampah</h3>
          <p style={valueStyle}>{binData?.volume_percent || 0} %</p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: 0, color: '#666' }}>Berat Sampah</h3>
          <p style={valueStyle}>{binData?.weight_kg || 0} kg</p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: 0, color: '#666' }}>Kepadatan (Densitas)</h3>
          <p style={valueStyle}>{binData?.bin_density?.toFixed(2) || 0} g/L</p>
        </div>

        <div style={cardStyle}>
          <h3 style={{ margin: 0, color: '#666' }}>Status Penutup</h3>
          <p style={{ ...valueStyle, color: binData?.servo_status === 'open' ? '#28a745' : '#dc3545' }}>
            {binData?.servo_status?.toUpperCase() || 'UNKNOWN'}
          </p>
        </div>

      </div>

      <p style={{ textAlign: 'center', marginTop: '40px', fontSize: '14px', color: '#999' }}>
        Pembaruan Terakhir: {binData?.created_at ? new Date(binData.created_at).toLocaleTimeString('id-ID') : '-'}
      </p>
    </div>
  );
}

// Desain Card sederhana menggunakan Inline Style
const cardStyle = {
  padding: '25px',
  borderRadius: '12px',
  backgroundColor: '#f8f9fa',
  border: '1px solid #dee2e6',
  textAlign: 'center',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
};

const valueStyle = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: '#212529',
  margin: '15px 0 0 0'
};

export default App;