import axios from 'axios';
import type { 
  Batch, 
  Inspection, 
  Certificate, 
  Notification, 
  BatchDraft,
  VerificationResult,
  ApiResponse,
  PaginatedResponse,
  User 
} from '@/types';
import { 
  mockBatches, 
  mockInspections, 
  mockCertificates, 
  mockNotifications 
} from './mockData';

// Create axios instance (for future real API integration)
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simulated network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API implementations
export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string): Promise<ApiResponse<User>> => {
      await delay(800);
      return {
        success: true,
        data: {
          id: 'user-001',
          email,
          name: 'Demo User',
          role: 'farmer',
          createdAt: new Date().toISOString(),
        },
      };
    },
    
    logout: async (): Promise<void> => {
      await delay(300);
    },
  },

  // Batches
  batches: {
    list: async (filters?: { status?: string; farmerId?: string }): Promise<PaginatedResponse<Batch>> => {
      await delay(600);
      let filtered = [...mockBatches];
      
      if (filters?.status) {
        filtered = filtered.filter(b => b.status === filters.status);
      }
      if (filters?.farmerId) {
        filtered = filtered.filter(b => b.farmerId === filters.farmerId);
      }
      
      return {
        data: filtered,
        total: filtered.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
    },

    get: async (id: string): Promise<ApiResponse<Batch>> => {
      await delay(400);
      const batch = mockBatches.find(b => b.id === id);
      if (!batch) {
        throw new Error('Batch not found');
      }
      return { success: true, data: batch };
    },

    create: async (data: Partial<Batch>): Promise<ApiResponse<Batch>> => {
      await delay(1000);
      const newBatch: Batch = {
        id: `BATCH-${Date.now()}`,
        farmerId: 'farmer-001',
        farmerName: 'Maria Santos',
        productType: data.productType || '',
        productName: data.productName || '',
        quantity: data.quantity || 0,
        unit: data.unit || 'kg',
        harvestDate: data.harvestDate || '',
        location: data.location || { latitude: 0, longitude: 0, address: '', region: '' },
        status: 'draft',
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockBatches.push(newBatch);
      return { success: true, data: newBatch };
    },

    submit: async (id: string): Promise<ApiResponse<Batch>> => {
      await delay(800);
      const batch = mockBatches.find(b => b.id === id);
      if (!batch) {
        throw new Error('Batch not found');
      }
      batch.status = 'submitted';
      batch.submittedAt = new Date().toISOString();
      batch.updatedAt = new Date().toISOString();
      return { success: true, data: batch };
    },
  },

  // Drafts
  drafts: {
    save: async (draft: BatchDraft): Promise<ApiResponse<BatchDraft>> => {
      await delay(300);
      localStorage.setItem(`draft_${draft.id}`, JSON.stringify(draft));
      return { success: true, data: draft };
    },

    get: async (id: string): Promise<ApiResponse<BatchDraft | null>> => {
      await delay(200);
      const stored = localStorage.getItem(`draft_${id}`);
      return { 
        success: true, 
        data: stored ? JSON.parse(stored) : null 
      };
    },

    delete: async (id: string): Promise<void> => {
      await delay(200);
      localStorage.removeItem(`draft_${id}`);
    },

    list: async (): Promise<BatchDraft[]> => {
      await delay(300);
      const drafts: BatchDraft[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('draft_')) {
          const draft = localStorage.getItem(key);
          if (draft) {
            drafts.push(JSON.parse(draft));
          }
        }
      }
      return drafts;
    },
  },

  // Inspections
  inspections: {
    list: async (batchId?: string): Promise<PaginatedResponse<Inspection>> => {
      await delay(500);
      let filtered = [...mockInspections];
      if (batchId) {
        filtered = filtered.filter(i => i.batchId === batchId);
      }
      return {
        data: filtered,
        total: filtered.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
    },

    get: async (id: string): Promise<ApiResponse<Inspection>> => {
      await delay(400);
      const inspection = mockInspections.find(i => i.id === id);
      if (!inspection) {
        throw new Error('Inspection not found');
      }
      return { success: true, data: inspection };
    },

    create: async (batchId: string, data: Partial<Inspection>): Promise<ApiResponse<Inspection>> => {
      await delay(1000);
      const newInspection: Inspection = {
        id: `INSP-${Date.now()}`,
        batchId,
        inspectorId: 'inspector-001',
        inspectorName: 'Carlos Rodriguez',
        status: 'pending',
        readings: data.readings || [],
        photos: data.photos || [],
        geolocation: data.geolocation || { latitude: 0, longitude: 0, accuracy: 0, timestamp: '' },
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        overallResult: 'pending',
      };
      mockInspections.push(newInspection);
      return { success: true, data: newInspection };
    },

    submit: async (id: string, data: Partial<Inspection>): Promise<ApiResponse<Inspection>> => {
      await delay(800);
      const inspection = mockInspections.find(i => i.id === id);
      if (!inspection) {
        throw new Error('Inspection not found');
      }
      
      Object.assign(inspection, {
        ...data,
        status: 'completed',
        completedAt: new Date().toISOString(),
        overallResult: data.readings?.every(r => r.passed) ? 'pass' : 'fail',
      });
      
      return { success: true, data: inspection };
    },
  },

  // Certificates
  certificates: {
    list: async (): Promise<PaginatedResponse<Certificate>> => {
      await delay(500);
      return {
        data: mockCertificates,
        total: mockCertificates.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
    },

    get: async (id: string): Promise<ApiResponse<Certificate>> => {
      await delay(400);
      const cert = mockCertificates.find(c => c.id === id);
      if (!cert) {
        throw new Error('Certificate not found');
      }
      return { success: true, data: cert };
    },

    issue: async (batchId: string): Promise<ApiResponse<Certificate>> => {
      await delay(1500);
      // This would normally be a complex VC issuance process
      const cert = mockCertificates[0]; // Return existing mock for demo
      return { success: true, data: cert };
    },

    revoke: async (id: string, reason: string): Promise<ApiResponse<Certificate>> => {
      await delay(800);
      const cert = mockCertificates.find(c => c.id === id);
      if (!cert) {
        throw new Error('Certificate not found');
      }
      cert.status = 'revoked';
      cert.revokedAt = new Date().toISOString();
      cert.revocationReason = reason;
      return { success: true, data: cert };
    },
  },

  // Verification
  verify: {
    byId: async (certId: string): Promise<ApiResponse<VerificationResult>> => {
      await delay(1000);
      const cert = mockCertificates.find(c => c.id === certId);
      const batch = mockBatches.find(b => b.id === cert?.batchId);
      const inspection = mockInspections.find(i => i.batchId === cert?.batchId);
      
      if (!cert) {
        return {
          success: true,
          data: {
            isValid: false,
            errors: ['Certificate not found'],
            verifiedAt: new Date().toISOString(),
            timeline: [],
          },
        };
      }

      return {
        success: true,
        data: {
          isValid: cert.status === 'active',
          certificate: cert,
          batch,
          inspection,
          verifiedAt: new Date().toISOString(),
          timeline: [
            { event: 'Batch Created', date: batch?.createdAt || '', actor: batch?.farmerName || '', status: 'completed' },
            { event: 'Batch Submitted', date: batch?.submittedAt || '', actor: batch?.farmerName || '', status: 'completed' },
            { event: 'Inspection Completed', date: inspection?.completedAt || '', actor: inspection?.inspectorName || '', status: 'completed' },
            { event: 'Certificate Issued', date: cert.issuedAt, actor: 'AgriQCert Authority', status: 'completed' },
            { event: 'Certificate Valid Until', date: cert.expiresAt || '', actor: '', status: 'pending' },
          ],
        },
      };
    },

    byQR: async (qrData: string): Promise<ApiResponse<VerificationResult>> => {
      await delay(800);
      try {
        const parsed = JSON.parse(qrData);
        return api.verify.byId(parsed.certId);
      } catch {
        return {
          success: true,
          data: {
            isValid: false,
            errors: ['Invalid QR code data'],
            verifiedAt: new Date().toISOString(),
            timeline: [],
          },
        };
      }
    },
  },

  // Notifications
  notifications: {
    list: async (userId: string): Promise<PaginatedResponse<Notification>> => {
      await delay(400);
      const filtered = mockNotifications.filter(n => n.userId === userId);
      return {
        data: filtered,
        total: filtered.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };
    },

    markRead: async (id: string): Promise<void> => {
      await delay(200);
      const notif = mockNotifications.find(n => n.id === id);
      if (notif) {
        notif.read = true;
      }
    },
  },

  // File uploads
  uploads: {
    getPresignedUrl: async (filename: string, contentType: string): Promise<{ uploadUrl: string; publicUrl: string }> => {
      await delay(300);
      // In production, this would return actual presigned URLs
      return {
        uploadUrl: `/api/upload/${filename}`,
        publicUrl: `https://storage.agriqcert.com/${filename}`,
      };
    },

    upload: async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
      // Simulate upload with progress
      for (let i = 0; i <= 100; i += 10) {
        await delay(100);
        onProgress?.(i);
      }
      return `https://storage.agriqcert.com/${file.name}`;
    },
  },
};
