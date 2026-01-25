/**
 * Auth Sync Module
 * Sincroniza dados com o servidor usando autenticação JWT
 */

const AUTH_SYNC = (() => {
  const API_URL = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : '';

  /**
   * Get the JWT token from session storage
   */
  function getToken() {
    return sessionStorage.getItem('aw_token');
  }

  /**
   * Get current user from session storage
   */
  function getCurrentUser() {
    const userStr = sessionStorage.getItem('loggedInUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Sync data with server
   */
  async function syncData(key, data) {
    try {
      const token = getToken();
      if (!token) {
        console.warn('[Auth Sync] No token found, skipping server sync');
        return false;
      }

      const fetchUrl = API_URL ? `${API_URL}/api/sync` : '/api/sync';

      const resp = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ key, data }),
      });

      if (resp.ok) {
        console.log(`[Auth Sync] Data synced: ${key}`);
        return true;
      } else if (resp.status === 401) {
        console.warn('[Auth Sync] Token expired, redirecting to login');
        sessionStorage.clear();
        window.location.href = '/pages/login.html';
        return false;
      } else {
        console.error('[Auth Sync] Sync failed:', resp.status);
        return false;
      }
    } catch (error) {
      console.error('[Auth Sync] Error syncing data:', error);
      return false;
    }
  }

  /**
   * Get all data from server
   */
  async function getAllData() {
    try {
      const token = getToken();
      if (!token) {
        console.warn('[Auth Sync] No token found, skipping server sync');
        return null;
      }

      const fetchUrl = API_URL ? `${API_URL}/api/sync` : '/api/sync';

      const resp = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (resp.ok) {
        const data = await resp.json();
        console.log('[Auth Sync] Data retrieved from server');
        return data;
      } else if (resp.status === 401) {
        console.warn('[Auth Sync] Token expired, redirecting to login');
        sessionStorage.clear();
        window.location.href = '/pages/login.html';
        return null;
      } else {
        console.error('[Auth Sync] Failed to get data:', resp.status);
        return null;
      }
    } catch (error) {
      console.error('[Auth Sync] Error getting data:', error);
      return null;
    }
  }

  /**
   * Restore all data to server (admin only)
   */
  async function restoreData(fullData) {
    try {
      const token = getToken();
      if (!token) {
        console.warn('[Auth Sync] No token found, skipping restore');
        return false;
      }

      const fetchUrl = API_URL ? `${API_URL}/api/restore` : '/api/restore';

      const resp = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(fullData),
      });

      if (resp.ok) {
        console.log('[Auth Sync] Data restored');
        return true;
      } else if (resp.status === 403) {
        alert('Apenas administradores podem restaurar dados.');
        return false;
      } else if (resp.status === 401) {
        console.warn('[Auth Sync] Token expired, redirecting to login');
        sessionStorage.clear();
        window.location.href = '/pages/login.html';
        return false;
      } else {
        console.error('[Auth Sync] Restore failed:', resp.status);
        return false;
      }
    } catch (error) {
      console.error('[Auth Sync] Error restoring data:', error);
      return false;
    }
  }

  /**
   * Reset all data (admin only)
   */
  async function resetData() {
    try {
      const token = getToken();
      if (!token) {
        console.warn('[Auth Sync] No token found, skipping reset');
        return false;
      }

      const fetchUrl = API_URL ? `${API_URL}/api/reset` : '/api/reset';

      const resp = await fetch(fetchUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (resp.ok) {
        console.log('[Auth Sync] Data reset');
        return true;
      } else if (resp.status === 403) {
        alert('Apenas administradores podem resetar dados.');
        return false;
      } else if (resp.status === 401) {
        console.warn('[Auth Sync] Token expired, redirecting to login');
        sessionStorage.clear();
        window.location.href = '/pages/login.html';
        return false;
      } else {
        console.error('[Auth Sync] Reset failed:', resp.status);
        return false;
      }
    } catch (error) {
      console.error('[Auth Sync] Error resetting data:', error);
      return false;
    }
  }

  /**
   * Logout user
   */
  async function logout() {
    try {
      const token = getToken();
      if (!token) {
        sessionStorage.clear();
        window.location.href = '/pages/login.html';
        return;
      }

      const fetchUrl = API_URL ? `${API_URL}/api/auth/logout` : '/api/auth/logout';

      await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      sessionStorage.clear();
      window.location.href = '/pages/login.html';
    } catch (error) {
      console.error('[Auth Sync] Error logging out:', error);
      sessionStorage.clear();
      window.location.href = '/pages/login.html';
    }
  }

  // Public API
  return {
    getToken,
    getCurrentUser,
    syncData,
    getAllData,
    restoreData,
    resetData,
    logout,
  };
})();
