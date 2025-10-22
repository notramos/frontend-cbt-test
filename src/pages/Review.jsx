import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  X as XIcon,
} from "lucide-react";

const Review = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { token, loading: authLoading } = useAuth();

  const [reviewData, setReviewData] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔒 Tunggu sampai AuthContext selesai memuat
    if (authLoading) return;

    // 🔒 Jika tidak login, redirect ke home
    if (!token) {
      alert("Silakan login untuk melihat pembahasan.");
      navigate("/");
      return;
    }
    const fetchReview = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
        const res = await fetch(
          `${API_URL}/exam-sessions/${sessionId}/review`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("API Error:", errorData);
          alert(
            "Tidak dapat mengakses pembahasan. Pastikan Anda telah menyelesaikan ujian ini."
          );
          navigate("/"); // redirect jika tidak punya akses
          return;
        }

        const data = await res.json();
        setReviewData(data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch review error:", err);
        alert("Gagal memuat pembahasan.");
        navigate("/");
      }
    };

    fetchReview();
  }, [sessionId, token, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memuat pembahasan...</p>
        </div>
      </div>
    );
  }

  if (!reviewData) return null;

  const currentQ = reviewData.questions[selectedQuestion];
  const isCorrect = currentQ.is_correct;
  const userAnswer = currentQ.user_answer;
  const correctAnswer = currentQ.correct_answer;

  // Fungsi untuk mendapatkan label opsi
  const getOptionLabel = (key) => {
    const options = currentQ.options || {};
    return options[key] || key;
  };

  // Status warna tombol daftar soal
  const getStatusColor = (q) => {
    if (q.is_correct) return "bg-green-500";
    if (q.user_answer === undefined) return "bg-gray-300";
    return "bg-red-500";
  };

  const getStatusText = (q) => {
    if (q.is_correct) return "Benar";
    if (q.user_answer === undefined) return "Tidak Menjawab";
    return "Salah";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <h1 className="text-xl font-bold text-gray-800 text-center">
            Pembahasan Soal
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Daftar Soal (Kiri) */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h2 className="font-bold text-gray-800 mb-4">Daftar Soal</h2>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {reviewData.questions.map((q, idx) => (
                <button
                  key={q.question_id}
                  onClick={() => setSelectedQuestion(idx)}
                  className={`w-10 h-10 rounded flex items-center justify-center font-medium text-white ${getStatusColor(
                    q
                  )} hover:opacity-90 transition`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                <span>Benar</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                <span>Salah</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-300 rounded mr-1"></div>
                <span>Tidak Menjawab</span>
              </div>
            </div>
          </div>

          {/* Pembahasan Soal (Kanan) */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Soal No. {selectedQuestion + 1}
            </h2>

            {/* Gambar */}
            {currentQ.image_url && (
              <div className="mb-4">
                <img
                  src={currentQ.image_url}
                  alt="Ilustrasi soal"
                  className="w-full h-auto rounded-lg object-cover border"
                />
              </div>
            )}

            {/* Soal */}
            <p className="text-gray-800 mb-4">{currentQ.question_text}</p>

            {/* Opsi Jawaban */}
            <div className="space-y-2 mb-4">
              {Object.keys(currentQ.options || {}).map((key) => (
                <div
                  key={key}
                  className={`p-3 rounded-lg border ${
                    key === userAnswer
                      ? key === correctAnswer
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                >
                  <span className="font-medium">{key}. </span>
                  <span>{getOptionLabel(key)}</span>
                  {key === correctAnswer && (
                    <CheckCircle className="inline ml-2 w-4 h-4 text-green-500" />
                  )}
                </div>
              ))}
            </div>

            {/* Jawaban User */}
            <div className="mb-4">
              <p className="font-medium text-gray-700">Jawaban kamu:</p>
              <div
                className={`inline-block px-3 py-1 rounded-full font-medium ${
                  isCorrect
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {userAnswer
                  ? `${userAnswer}. ${getOptionLabel(userAnswer)}`
                  : "Belum menjawab"}
              </div>
              {!isCorrect && userAnswer && (
                <div className="mt-1 text-sm text-red-600">
                  Kunci Jawaban:{" "}
                  <strong>
                    {correctAnswer}. {getOptionLabel(correctAnswer)}
                  </strong>
                </div>
              )}
            </div>

            {/* Pembahasan */}
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Pembahasan:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-line">
                  {currentQ.explanation}
                </p>
              </div>
            </div>

            {/* Tombol Kembali */}
            <div className="mt-6">
              <button
                onClick={() => navigate(`/result/${sessionId}`)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              >
                Kembali ke Hasil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Review;
