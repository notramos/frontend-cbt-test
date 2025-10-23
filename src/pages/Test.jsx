import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  List,
  Home as HomeIcon,
  X as XIcon,
} from "lucide-react";

const Test = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token, API_URL, setShowLogin, isLoggedIn, authChecked } = useAuth();

  const [examSession, setExamSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuestionList, setShowQuestionList] = useState(false);

  // 🔑 Fungsi untuk memulihkan timer dari localStorage
  const restoreTimer = () => {
    const saved = localStorage.getItem(`cbt_timer_${examId}`);
    if (!saved) return null;

    try {
      const { startTime, durationSeconds, sessionId } = JSON.parse(saved);
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const timeLeft = Math.max(0, durationSeconds - elapsedSeconds);
      return { timeLeft, sessionId };
    } catch (e) {
      console.warn("Gagal memulihkan timer:", e);
      return null;
    }
  };

  useEffect(() => {
    if (!authChecked) return;
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }

    const initializeTest = async () => {
      setLoading(true);

      const restored = restoreTimer();
      const savedAnswers = restored?.sessionId
        ? localStorage.getItem(`cbt_answers_${restored.sessionId}`)
        : null;
      if (restored && restored.timeLeft > 0) {
        try {
          // Fetch soal tanpa start ulang
          const res = await fetch(`${API_URL}/exams/${examId}/questions`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Gagal memuat soal");
          const questions = await res.json();

          const savedExam = localStorage.getItem(`cbt_exam_${examId}`);
          const examTitle = savedExam ? JSON.parse(savedExam).title : "Ujian";

          setExamSession({
            exam: {
              title: examTitle,
              duration_minutes: Math.ceil(restored.durationSeconds / 60),
            },
            questions,
            session_id: restored.sessionId,
          });

          const savedAnswers = localStorage.getItem(
            `cbt_answers_${restored.sessionId}`
          );
          setAnswers(savedAnswers ? JSON.parse(savedAnswers) : {});
          setTimeLeft(restored.timeLeft);
          setLoading(false);
          return;
        } catch (err) {
          console.warn("Gagal lanjutkan sesi:", err.message);
        }
      }

      // Mulai ujian baru
      try {
        const res = await fetch(`${API_URL}/exams/${examId}/start`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Gagal memulai ujian");
        }
        const data = await res.json();

        // 🔑 Simpan exam dan timer
        localStorage.setItem(`cbt_exam_${examId}`, JSON.stringify(data.exam));
        localStorage.setItem(
          `cbt_timer_${examId}`,
          JSON.stringify({
            startTime: Date.now(),
            durationSeconds: data.exam.duration_minutes * 60,
            sessionId: data.session_id,
          })
        );

        setExamSession(data);
        const saved = localStorage.getItem(`cbt_answers_${data.session_id}`);
        setAnswers(saved ? JSON.parse(saved) : {});
        setTimeLeft(data.exam.duration_minutes * 60);
      } catch (err) {
        Swal.fire({
          /* ... */
        }).then(() => navigate("/"));
      } finally {
        setLoading(false);
      }
    };

    initializeTest();
  }, [examId, token, API_URL, isLoggedIn, authChecked, setShowLogin, navigate]);

  // ⏱️ Timer berjalan
  useEffect(() => {
    let timer;
    if (examSession && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && examSession) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timeLeft, examSession]);

  // 💾 Simpan jawaban
  useEffect(() => {
    if (examSession?.session_id && Object.keys(answers).length > 0) {
      localStorage.setItem(
        `cbt_answers_${examSession.session_id}`,
        JSON.stringify(answers)
      );
    }
  }, [answers, examSession?.session_id]);

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

  const handleSubmit = useCallback(async () => {
    if (submitting || !examSession) return;

    const unanswered = examSession.questions.some(
      (q) => answers[q.id] === undefined
    );
    if (unanswered) {
      Swal.fire({
        icon: "warning",
        title: "Masih Ada Soal Belum Dijawab!",
        text: "Harap jawab semua soal sebelum mengumpulkan.",
        confirmButtonText: "Oke",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    setSubmitting(true);

    const answersArray = examSession.questions.map((q) => {
      const userAnswerIndex = answers[q.id] ?? 0;
      const safeIndex = Math.max(0, Math.min(3, parseInt(userAnswerIndex)));
      const answerLetter = String.fromCharCode(65 + safeIndex);
      return { question_id: q.id, answer: answerLetter };
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
        // 🔑 Hapus data lokal setelah sukses
        localStorage.removeItem(`cbt_timer_${examId}`);
        localStorage.removeItem(`cbt_answers_${examSession.session_id}`);
        navigate(`/result/${examSession.session_id}`);
      } else {
        const err = await res.json();
        Swal.fire({
          icon: "error",
          title: "Gagal Mengirim Jawaban",
          text: err.message || "Terjadi kesalahan. Silakan coba lagi.",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Kesalahan Jaringan",
        text: "Tidak dapat menghubungi server. Periksa koneksi Anda.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [answers, examSession, submitting, token, API_URL, examId, navigate]);

  const handleGoHome = () => {
    Swal.fire({
      title: "Yakin Ingin Keluar?",
      text: "Progress ujian akan disimpan sementara, tapi Anda belum menyelesaikan ujian.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Kembali ke Home",
      cancelButtonText: "Tetap di Sini",
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/");
      }
    });
  };

  // 🌀 Loading
  if (!authChecked || loading) {
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

  // Modal Daftar Soal (Responsif)
  const QuestionListModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
        <button
          onClick={() => setShowQuestionList(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
          Daftar Soal
        </h2>
        <p className="text-gray-600 text-center mb-4 text-sm">
          Klik nomor soal untuk berpindah
        </p>
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {examSession.questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => {
                setCurrentQuestion(idx);
                setShowQuestionList(false);
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
                answers[q.id] !== undefined
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              } hover:opacity-90 transition`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 text-center">
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
          Sudah dijawab
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoHome}
              className="p-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-full"
              title="Kembali ke Beranda"
            >
              <HomeIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800 line-clamp-1">
                {examSession.exam.title}
              </h1>
              <p className="text-xs text-gray-600">
                Soal {currentQuestion + 1} dari {examSession.questions.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-red-100 px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4 text-red-600 mr-1" />
              <span className="font-bold text-red-700 text-sm">
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={() => setShowQuestionList(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 text-sm"
            >
              <List className="w-4 h-4" />
              Soal
            </button>
          </div>
        </div>

        {/* Konten Soal */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {currentQ.type === "text" && (
            <div>
              <p className="text-lg font-medium text-gray-800 mb-6">
                {currentQuestion + 1}. {currentQ.question_text}
              </p>
              <div className="space-y-3">
                {optionsArray.map((opt, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start p-3 rounded-lg border cursor-pointer transition ${
                      answers[currentQ.id] === idx
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ.id}`}
                      checked={answers[currentQ.id] === idx}
                      onChange={() => handleAnswerChange(currentQ.id, idx)}
                      className="mt-1 mr-3 h-4 w-4 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-gray-700">
                      <strong>{String.fromCharCode(65 + idx)}.</strong> {opt}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentQ.type === "image" && (
            <div>
              <p className="text-lg font-medium text-gray-800 mb-4">
                {currentQuestion + 1}. {currentQ.question_text}
              </p>
              <div className="mb-6">
                <img
                  src={currentQ.image}
                  alt="Ilustrasi soal"
                  className="w-full max-h-80 object-contain rounded-lg border"
                />
              </div>
              <div className="space-y-3">
                {optionsArray.map((opt, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start p-3 rounded-lg border cursor-pointer transition ${
                      answers[currentQ.id] === idx
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ.id}`}
                      checked={answers[currentQ.id] === idx}
                      onChange={() => handleAnswerChange(currentQ.id, idx)}
                      className="mt-1 mr-3 h-4 w-4 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-gray-700">
                      <strong>{String.fromCharCode(65 + idx)}.</strong>{" "}
                      {typeof opt === "string" && opt.startsWith("http") ? (
                        <img
                          src={opt}
                          alt={`Opsi ${String.fromCharCode(65 + idx)}`}
                          className="h-10 inline-block ml-2 border rounded"
                        />
                      ) : (
                        opt
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Navigasi */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))}
              disabled={currentQuestion === 0}
              className={`px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-1 ${
                currentQuestion === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>

            {currentQuestion === examSession.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-1 ${
                  submitting
                    ? "bg-orange-400 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? "Mengirim..." : "Kumpulkan Semua"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion((q) => q + 1)}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 flex items-center justify-center gap-1"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showQuestionList && <QuestionListModal />}
    </div>
  );
};

export default Test;
