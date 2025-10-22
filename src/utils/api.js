const API_URL = import.meta.env.VITE_API_URL;

export const api = {
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },

  logout: async (token) => {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getExams: async (token) => {
    const res = await fetch(`${API_URL}/exams`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  startExam: async (examId, token) => {
    const res = await fetch(`${API_URL}/exams/${examId}/start`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },
};
