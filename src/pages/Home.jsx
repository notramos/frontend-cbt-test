import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookOpen, ClipboardList, PlayCircle, ArrowLeft } from "lucide-react";

const Home = () => {
  const { isLoggedIn, token, API_URL, setShowLogin } = useAuth();
  const [examList, setExamList] = useState([]);
  const [selectedExamIdForHistory, setSelectedExamIdForHistory] =
    useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (
      isLoggedIn &&
      token &&
      typeof token === "string" &&
      token.trim() !== ""
    ) {
      fetch(`${API_URL}/exams`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 401) {
              console.warn("Token tidak valid, logout otomatis");
              setShowLogin(false);
            }
            throw new Error("Gagal mengambil data");
          }
          return res.json();
        })
        .then((data) => {
          setExamList(data.exams || []);
        })
        .catch((err) => {
          console.error("Error fetching exams:", err);
        });
    }
  }, [isLoggedIn, token, API_URL]);

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

  // Jika belum login dan tidak ada ujian
  if (!isLoggedIn && examList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Silakan login untuk melihat ujian.
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-full"
          >
            Login Sekarang
          </button>
        </div>
      </div>
    );
  }

  // Temukan ujian yang sedang dilihat riwayatnya
  const selectedExam = selectedExamIdForHistory
    ? examList.find((exam) => exam.id === selectedExamIdForHistory)
    : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {selectedExamIdForHistory && selectedExam ? (
        /* 📜 Tampilan Riwayat untuk Satu Ujian */
        <>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h1 className="text-xl font-bold text-center text-gray-800">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedExam.history.map((attempt) => (
                <div
                  key={attempt.id}
                  className="bg-orange-50 rounded-xl p-5 border border-orange-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-xs rounded-bl-lg font-medium">
                    Nilai CBT
                  </div>
                  <div className="text-3xl font-bold text-orange-600 mt-6 mb-3">
                    {attempt.score}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <span className="mr-2">🕒</span>
                      <span>Mulai: {attempt.started_at}</span>
                    </div>
                    {attempt.ended_at ? (
                      <div className="flex items-center">
                        <span className="mr-2">✅</span>
                        <span>Selesai: {attempt.ended_at}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-orange-600">
                        <span className="mr-2">⏳</span>
                        <span>Belum selesai</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              Belum ada percobaan untuk ujian ini.
            </p>
          )}
        </>
      ) : (
        /* 🎯 Tampilan Daftar Semua Ujian */
        <>
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Daftar Ujian
          </h1>

          {examList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {examList.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
                >
                  <div className="flex items-start mb-4">
                    <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center mr-4">
                      <BookOpen className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">
                        {exam.title}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {exam.total_questions} soal • {exam.duration_minutes}{" "}
                        menit
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleStartTest(exam.id)}
                      className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 flex items-center justify-center text-sm"
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Mulai
                    </button>
                    <button
                      onClick={() => handleViewHistory(exam.id)}
                      className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 flex items-center justify-center text-sm"
                    >
                      <ClipboardList className="w-4 h-4 mr-1" />
                      Riwayat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Tidak ada ujian tersedia.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
