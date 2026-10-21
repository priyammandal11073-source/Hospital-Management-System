import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f7f4] via-[#f4f4f1] to-[#eef1f6] p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/70 shadow-2xl p-8 text-center">
        <p className="text-6xl font-black text-slate-200">404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-800">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you're looking for doesn't exist, was moved, or you may not have access to it.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/dashboard"
            className="rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-slate-300 bg-white/70 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Switch Portal / Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;