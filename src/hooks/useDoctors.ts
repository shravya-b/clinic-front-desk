import { doctorService } from '../services/doctorService';
import { useQuery } from './useQuery';

export function useDoctors() {
  return useQuery('doctors', doctorService.list, { refetchOnDataChange: false });
}
