import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function otomatis membaca .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Hanya izinkan method POST dari ESP32
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Hanya menerima method POST' });
  }

  try {
    // 1. Cek Password rahasia ESP32
    const token = req.headers['x-iot-token'];
    if (token !== process.env.VITE_IOT_SECRET_TOKEN) {
      return res.status(401).json({ error: 'Akses Ditolak! Token tidak valid.' });
    }

    // 2. Ambil data dari ESP32
    const { volume, weight, status } = req.body;

    // 3. Hitung Densitas (Asumsi tong 50 Liter)
    const volumeInLiter = (volume / 100) * 50; 
    const density = volumeInLiter > 0 ? (weight / volumeInLiter) : 0;

    // 4. Masukkan ke Supabase
    const { error } = await supabase
      .from('bin_logs')
      .insert([{ 
        volume_percent: volume, 
        weight_kg: weight, 
        bin_density: density,
        servo_status: status 
      }]);

    if (error) throw error;

    // 5. Kirim balasan sukses ke ESP32
    return res.status(200).json({ message: 'Data masuk via Vercel!', density: density });

  } catch (error) {
    // Memunculkan detail error asli ke Thunder Client
    return res.status(500).json({ 
      error: 'Terjadi kesalahan server',
      detail: error.message || error
    });
  }
}