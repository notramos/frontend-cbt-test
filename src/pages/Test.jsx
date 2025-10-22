// src/pages/Test.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  List,
  X as XIcon,
} from "lucide-react";

const Test = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token, API_URL, setShowLogin, isLoggedIn } = useAuth();

  const [examSession, setExamSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuestionList, setShowQuestionList] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }

    const startExam = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/exams/${examId}/start`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Gagal memulai ujian");
        }
        const data = await res.json();
        setExamSession(data);
        setTimeLeft(data.exam.duration_minutes * 60);
      } catch (err) {
        alert(err.message || "Gagal memulai ujian");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    startExam();
  }, [examId, token, API_URL, isLoggedIn, setShowLogin, navigate]);

  // Timer
  useEffect(() => {
    let timer;
    if (examSession && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && examSession) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timeLeft, examSession]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleAnswerChange = (qid, index) => {
    setAnswers((prev) => ({ ...prev, [qid]: index }));
  };

  const handleSubmit = async () => {
    if (submitting || !examSession) return;

    const unanswered = examSession.questions.some(
      (q) => answers[q.id] === undefined
    );
    if (unanswered) {
      if (
        !window.confirm("Masih ada soal yang belum dijawab. Tetap kumpulkan?")
      ) {
        return;
      }
    }

    setSubmitting(true);

    const answersArray = examSession.questions.map((q) => {
      const userAnswerIndex = answers[q.id] ?? 0;
      const safeIndex = Math.max(0, Math.min(3, parseInt(userAnswerIndex)));
      const answerLetter = String.fromCharCode(65 + safeIndex); // A-D

      return {
        question_id: q.id,
        answer: answerLetter,
      };
    });

    try {
      const res = await fetch(
        `${API_URL}/exam-sessions/${examSession.session_id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers: answersArray }),
        }
      );

      if (res.ok) {
        const result = await res.json();
        navigate(`/result/${examSession.session_id}`);
      } else {
        const err = await res.json();
        alert(err.message || "Gagal mengirim jawaban");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat mengirim jawaban");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Memulai ujian...</p>
        </div>
      </div>
    );
  }

  if (!examSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center text-gray-600">Ujian tidak ditemukan</div>
      </div>
    );
  }

  const currentQ = examSession.questions[currentQuestion];
  const optionsArray = currentQ.options ? Object.values(currentQ.options) : [];

  const QuestionListModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
        <button
          onClick={() => setShowQuestionList(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          Daftar Soal
        </h2>
        <p className="text-gray-600 text-center mb-4">
          Klik nomor soal untuk berpindah
        </p>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {examSession.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => {
                setCurrentQuestion(idx);
                setShowQuestionList(false);
              }}
              className={`w-10 h-10 rounded flex items-center justify-center font-medium ${
                answers[q.id] !== undefined
                  ? "bg-blue-500 text-white" // Sudah dijawab → biru
                  : "bg-gray-200 text-gray-700" // Belum dijawab → abu-abu
              } hover:opacity-90 transition`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-500 text-center">
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>{" "}
          Sudah dijawab
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {examSession.exam.title}
              </h1>
              <p className="text-sm text-gray-600">
                Soal {currentQuestion + 1} dari {examSession.questions.length}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-blue-100 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4 text-blue-600 mr-1" />
                <span className="font-medium text-blue-700 text-sm">
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={() => setShowQuestionList(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              >
                <List className="w-4 h-4" />
                <span className="text-sm">Soal</span>
              </button>
            </div>
          </div>

          {/* Soal */}
          {currentQ.type === "text" && (
            <div className="mb-6">
              <p className="text-lg font-medium text-gray-800 mb-4">
                {currentQ.question_text}
              </p>
              <div className="space-y-2">
                {optionsArray.map((opt, idx) => (
                  <div key={idx} className="flex items-center">
                    <input
                      type="radio"
                      id={`q-${currentQ.id}-opt-${idx}`}
                      name={`question-${currentQ.id}`}
                      checked={answers[currentQ.id] === idx}
                      onChange={() => handleAnswerChange(currentQ.id, idx)}
                      className="mr-3 h-5 w-5 text-orange-500 focus:ring-orange-500"
                    />
                    <label
                      htmlFor={`q-${currentQ.id}-opt-${idx}`}
                      className="text-gray-700"
                    >
                      {opt}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentQ.type === "image" && (
            <div className="mb-6">
              <p className="text-lg font-medium text-gray-800 mb-4">
                {currentQ.question_text}
              </p>
              <div className="mb-4">
                <img
                  src={currentQ.image_url}
                  alt="Ilustrasi soal"
                  className="w-full h-auto rounded-lg object-cover border"
                />
              </div>
              <div className="space-y-2">
                {optionsArray.map((opt, idx) => (
                  <div key={idx} className="flex items-center">
                    <input
                      type="radio"
                      id={`q-${currentQ.id}-opt-${idx}`}
                      name={`question-${currentQ.id}`}
                      checked={answers[currentQ.id] === idx}
                      onChange={() => handleAnswerChange(currentQ.id, idx)}
                      className="mr-3 h-5 w-5 text-orange-500 focus:ring-orange-500"
                    />
                    <label
                      htmlFor={`q-${currentQ.id}-opt-${idx}`}
                      className="text-gray-700"
                    >
                      {typeof opt === "string" && opt.startsWith("http") ? (
                        <img
                          src={opt}
                          alt={`Opsi ${String.fromCharCode(65 + idx)}`}
                          className="h-12 inline-block ml-2 border rounded"
                        />
                      ) : (
                        opt
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigasi */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8">
            <button
              onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))}
              disabled={currentQuestion === 0}
              className={`px-4 py-2 rounded-full font-medium flex items-center justify-center ${
                currentQuestion === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Sebelumnya
            </button>

            {currentQuestion === examSession.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`px-4 py-2 rounded-full font-medium flex items-center justify-center ${
                  submitting
                    ? "bg-orange-400 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                <CheckCircle className="w-5 h-5 mr-1" />
                {submitting ? "Mengirim..." : "Kumpulkan"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion((q) => q + 1)}
                className="px-4 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 flex items-center justify-center"
              >
                Selanjutnya
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Daftar Soal */}
      {showQuestionList && <QuestionListModal />}
    </div>
  );
};

export default Test;
