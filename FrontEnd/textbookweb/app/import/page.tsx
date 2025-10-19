import Image from "next/image";
import ImportButton from "@/components/import";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
      </div>

      <div className="relative font-sans grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
        <main className="flex flex-col gap-8 row-start-2 items-center text-center max-w-2xl">
          {/* Main heading with gradient */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Import Your Data
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-xl">
              Upload and transform your files with ease. Support for CSV, Excel, and more.
            </p>
          </div>

          {/* Import button container with card styling */}
          <div className="w-full max-w-md">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3 text-gray-700">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="font-semibold">Ready to upload</span>
                </div>
                <ImportButton />
              </div>
            </div>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-3 justify-center mt-4">
            <span className="px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200">
              🚀 Fast Processing
            </span>
            <span className="px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200">
              🔒 Secure
            </span>
            <span className="px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200">
              ✨ Easy to Use
            </span>
          </div>
        </main>

        <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
          <a
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm hover:bg-white transition-all duration-200 text-gray-700 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300"
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
            />
            Learn
          </a>
          <a
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm hover:bg-white transition-all duration-200 text-gray-700 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300"
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
            />
            Examples
          </a>
          <a
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm hover:bg-white transition-all duration-200 text-gray-700 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300"
            href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              aria-hidden
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
            />
            Go to nextjs.org →
          </a>
        </footer>
      </div>
    </div>
  );
}