import { API_BASE_URL } from './apiConfig';

export interface HealthResponse {
  status: string;
  message: string;
  database: string;
  databaseProduct?: string;
  databaseVersion?: string;
  databaseError?: string;
  service?: string;
  version?: string;
}

export const healthService = {
  /**
   * Real HTTP request to Spring Boot backend health endpoint:
   * GET /api/health
   */
  async checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return (await res.json()) as HealthResponse;
  },
};
