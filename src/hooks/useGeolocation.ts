import { useState, useEffect } from 'react';

interface GeolocationData {
  region: string;
  city: string;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [data, setData] = useState<GeolocationData>({
    region: '',
    city: '',
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchLocation() {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
          throw new Error('Falha ao buscar localização');
        }
        const result = await response.json();
        setData({
          region: result.region || 'seu estado',
          city: result.city || 'sua cidade',
          loading: false,
          error: null,
        });
      } catch (error) {
        setData((prev) => ({
          ...prev,
          loading: false,
          error: 'Erro de localização',
          region: 'todo o Brasil', // Fallback default
        }));
      }
    }

    fetchLocation();
  }, []);

  return data;
}
