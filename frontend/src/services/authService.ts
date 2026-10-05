import { User, UserRole } from '../types';
import { API_BASE_URL, setAuthToken, removeAuthToken, getAuthToken, getAuthHeaders } from './apiConfig';

const USER_STORAGE_KEY = 'fras_current_user';

export const authService = {
  /**
   * Log in user against the real Spring Boot REST API
   * POST /api/auth/login
   */
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const cleanUsername = username.trim();

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: cleanUsername,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || 'Invalid credentials. Check your username and password.';
      throw new Error(errorMsg);
    }

    const token = data.token;
    const user: User = data.user || {
      id: data.username,
      username: data.username,
      name: data.name || data.username,
      email: data.email || `${data.username}@college.edu`,
      role: (data.role || 'ADMIN') as UserRole,
    };

    setAuthToken(token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    return { token, user };
  },

  /**
   * Check if a username is already taken via Spring Boot API
   * GET /api/users/check-username/:username
   */
  async isUsernameTaken(username: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/check-username/${encodeURIComponent(username.trim())}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.taken === true;
    } catch {
      // fallback: check reserved names
      const reserved = ['admin', 'teacher', 'student'];
      return reserved.includes(username.trim().toLowerCase());
    }
  },

  /**
   * Register a new user in Spring Boot + PostgreSQL
   * POST /api/auth/register
   */
  async registerUser(account: {
    username: string;
    password: string;
    role: UserRole;
    name: string;
    email: string;
    student_id?: string;
    teacher_id?: string;
    class_id?: string;
    class_name?: string;
    department?: string;
    phone?: string;
  }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: account.username.trim(),
        password: account.password,
        role: account.role,
        name: account.name,
        email: account.email,
        student_id: account.student_id,
        teacher_id: account.teacher_id,
        class_id: account.class_id,
        class_name: account.class_name,
        department: account.department,
        phone: account.phone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || 'Registration failed. Please check the provided information.';
      throw new Error(errorMsg);
    }

    return data as User;
  },

  /**
   * Verify and refresh current user profile from Spring Boot JWT
   * GET /api/auth/me
   */
  async fetchCurrentUser(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
        }
        return null;
      }

      const user: User = await response.json();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return user;
    } catch {
      return this.getCurrentUser();
    }
  },

  /**
   * Log out current user and clear local JWT session
   */
  logout(): void {
    removeAuthToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem('fras_admin_user');
  },

  /**
   * Get cached user profile from storage
   */
  getCurrentUser(): User | null {
    const token = getAuthToken();
    if (!token) return null;

    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }

    return null;
  },

  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  /**
   * Change user password via Spring Boot
   * POST /api/auth/change-password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    if (!currentPassword || !newPassword) {
      throw new Error('Please fill in both current and new passwords.');
    }
    if (newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters long.');
    }

    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || 'Failed to change password.');
    }

    return true;
  },

  async updateProfile(profileData: Partial<User>): Promise<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const updatedUser: User = { ...currentUser, ...profileData };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    return true;
  },
};
