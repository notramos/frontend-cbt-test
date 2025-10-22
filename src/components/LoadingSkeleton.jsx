export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto animate-pulse">
          <div className="flex justify-center mb-6">
            <div className="bg-gray-200 rounded-full w-12 h-12 mb-4"></div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="flex-1 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 h-12 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
