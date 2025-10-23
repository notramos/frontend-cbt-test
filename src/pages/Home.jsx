import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookOpen, ClipboardList, PlayCircle, ArrowLeft } from "lucide-react";

// Skeleton card — lebar maksimal dibatasi agar tidak terlalu lebar saat hanya 1 item
const ExamSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 animate-pulse max-w-xs w-full mx-auto">
    <div className="flex items-start mb-4">
      <div className="bg-gray-200 w-10 h-10 rounded-full mr-3 flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="flex gap-2 mt-4">
      <div className="flex-1 h-8 bg-gray-200 rounded"></div>
      <div className="flex-1 h-8 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const Home = () => {
  const { isLoggedIn, token, API_URL, setShowLogin, authChecked } = useAuth(); // 🔑 ambil authChecked
  const [examList, setExamList] = useState([]);
  const [selectedExamIdForHistory, setSelectedExamIdForHistory] =
    useState(null);
  const navigate = useNavigate();

  // Fetch exams hanya jika sudah selesai pengecekan auth
  useEffect(() => {
    if (!authChecked) return;

    if (!isLoggedIn || !token || typeof token !== "string" || !token.trim()) {
      return;
    }

    const fetchExams = async () => {
      try {
        const res = await fetch(`${API_URL}/exams`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            console.warn("Token tidak valid");
            setShowLogin(false);
          }
          return;
        }

        const data = await res.json();
        setExamList(data.exams || []);
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchExams();
  }, [authChecked, isLoggedIn, token, API_URL, setShowLogin]);

  const handleStartTest = (examId) => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    navigate(`/test/${examId}`);
  };

  const handleViewHistory = (examId) => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    setSelectedExamIdForHistory(examId);
  };

  const goBackToExams = () => {
    setSelectedExamIdForHistory(null);
  };

  const selectedExam = selectedExamIdForHistory
    ? examList.find((exam) => exam.id === selectedExamIdForHistory)
    : null;

  // 🔁 Selama auth belum selesai dicek → tampilkan skeleton (bahkan sebelum tahu login atau tidak)
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500 mb-3"></div>
          <p className="text-gray-600">Memeriksa sesi...</p>
        </div>
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <ExamSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-2">
        <div className="text-center max-w-md">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Selamat Datang!
          </h2>
          <p className="text-gray-600 mb-6">
            Silakan login untuk mengakses ujian.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="px-6 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition"
          >
            Login Sekarang
          </button>
        </div>
      </div>
    );
  }

  if (selectedExamIdForHistory && selectedExam) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-800">
            Riwayat Nilai: {selectedExam.title}
          </h1>
        </div>
        <button
          onClick={goBackToExams}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali ke Daftar Ujian
        </button>

        {selectedExam.history && selectedExam.history.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedExam.history.map((attempt) => (
              <div
                key={attempt.id}
                className="bg-orange-50 rounded-xl p-5 border border-orange-200"
              >
                <div className="text-3xl font-bold text-orange-600 mb-3">
                  {attempt.score}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>🕒 Mulai: {attempt.started_at}</div>
                  {attempt.ended_at ? (
                    <div>✅ Selesai: {attempt.ended_at}</div>
                  ) : (
                    <div className="text-orange-600">⏳ Belum selesai</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-center py-8">
            Belum ada percobaan.
          </p>
        )}
      </div>
    );
  }

  // 🎯 Daftar Ujian — gunakan grid yang responsif & batasi lebar card
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Daftar Ujian
      </h1>

      {examList.length > 0 ? (
        // Gunakan flex + wrap + justify-center agar card tetap rapi meski hanya 1
        <div className="flex flex-wrap justify-center gap-6">
          {examList.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition max-w-xs w-full"
            >
              <div className="flex items-start mb-4">
                <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-800 line-clamp-2">
                    {exam.title}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    {exam.total_questions} soal • {exam.duration_minutes} menit
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleStartTest(exam.id)}
                  className="flex-1 px-2.5 py-2 bg-orange-500 text-white text-xs rounded font-medium hover:bg-orange-600 transition"
                >
                  <PlayCircle className="w-3.5 h-3.5 mr-1 inline" />
                  Mulai
                </button>
                <button
                  onClick={() => handleViewHistory(exam.id)}
                  className="flex-1 px-2.5 py-2 bg-orange-100 text-orange-700 text-xs rounded font-medium hover:bg-orange-200 transition"
                >
                  <ClipboardList className="w-3.5 h-3.5 mr-1 inline" />
                  Riwayat
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada ujian tersedia.</p>
        </div>
      )}
    </div>
  );
};

export default Home;
