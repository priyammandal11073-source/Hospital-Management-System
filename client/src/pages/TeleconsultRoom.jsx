import { useParams } from "react-router-dom";

const TeleconsultRoom = () => {
  const { joinCode } = useParams();

  const jitsiUrl = `https://meet.jit.si/NivoraCare${encodeURIComponent(joinCode || "room")}`;
  const copyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert("Video consult link copied. Share it with the patient."))
        .catch(() => {});
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <header className="flex items-center justify-between gap-3 bg-slate-900 border-b border-white/10 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-white text-sm font-bold truncate">Nivora Care · Secure Video Consult</span>
          <span className="hidden sm:inline-flex rounded bg-white/10 px-2 py-0.5 text-[11px] font-mono text-emerald-300">
            Room {joinCode}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
          >
            Copy link
          </button>
          <a
            href="/dashboard"
            className="rounded-lg bg-rose-500 hover:bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition"
          >
            Leave room
          </a>
        </div>
      </header>
      <iframe
        title="Teleconsultation room"
        src={`${jitsiUrl}#config.prejoinPageEnabled=false`}
        className="w-full flex-1 border-0"
        allow="camera; microphone; display-capture; autoplay; fullscreen; clipboard-write"
        allowFullScreen
      />
    </div>
  );
};

export default TeleconsultRoom;