import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

/** Referencia permanente a un archivo de Storage: `sb://<bucket>/<ruta>`. Se guarda en la base de datos en lugar de
 *  una URL firmada (que caduca en 1 h) y se convierte en URL firmada solo al mostrarla. */
const PREFIX = 'sb://';

export const toStorageRef = (bucket: string, path: string) => `${PREFIX}${bucket}/${path}`;

/** Convierte una referencia `sb://…` en URL firmada. Las URLs antiguas (http…) se devuelven tal cual. */
export async function resolveStorageUrl(ref?: string | null): Promise<string> {
  if (!ref) return '';
  if (!ref.startsWith(PREFIX)) return ref;
  const rest = ref.slice(PREFIX.length);
  const i = rest.indexOf('/');
  const { data, error } = await supabase.storage.from(rest.slice(0, i)).createSignedUrl(rest.slice(i + 1), 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export function useStorageUrl(ref?: string | null): string {
  const { data } = useQuery({
    queryKey: ['storage-url', ref],
    queryFn: () => resolveStorageUrl(ref),
    enabled: !!ref,
    staleTime: 50 * 60 * 1000,
  });
  return data ?? (ref && !ref.startsWith(PREFIX) ? ref : '');
}
