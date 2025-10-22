// src/pages/Results.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

const Results = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      navigate("/");
      return;
    }

    const fetchResult = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
          }/exam-sessions/${sessionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setResult(data);
          setLoading(false);
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error("Fetch result error:", err);
        navigate("/");
      }
    };

    fetchResult();
  }, [sessionId, token, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading hasil...
      </div>
    );
  }

  if (!result) return null;

  const { score, correct, total_questions, wrong } = result;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Tes Selesai!</h1>
          <div className="bg-blue-50 p-6 rounded-lg mb-6 inline-block">
            <div className="text-4xl font-bold text-blue-600">{score}%</div>
            <div className="text-gray-600">Skor Anda</div>
            <div className="mt-2 text-sm text-gray-500">
              {correct} dari {total_questions} soal benar
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-700">{correct}</div>
            <div className="text-sm text-gray-600">Benar</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-700">{wrong}</div>
            <div className="text-sm text-gray-600">Salah</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-700">–</div>
            <div className="text-sm text-gray-600">Waktu Digunakan</div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600"
          >
            Kembali ke Halaman Utama
          </button>
        </div>
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => navigate(`/review/${sessionId}`)}
            className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors"
          >
            Lihat Pembahasan Soal
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
