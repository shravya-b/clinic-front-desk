import type { Doctor } from '../types/domain';
import { readDb } from './db';
import { request } from './request';

export const doctorService = {
  list(): Promise<Doctor[]> {
    return request(() => readDb().doctors);
  },
};
