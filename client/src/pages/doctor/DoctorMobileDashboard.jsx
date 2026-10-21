import { useCallback, useEffect, useState } from "react";
import { getMyAppointments, getMyPatients, getMyTelemedicine, startTeleconsult, endTeleconsult } from "../../services/api.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";

const DoctorMobileDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [teleconsults, setTeleconsults] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [onCallSchedule, setOnCallSchedule] = useState([]);
  const [refillRequests, setRefillRequests] = useState([]);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [appts, myPatients, tele] = await Promise.all([
          getMyAppointments(),
          getMyPatients(),
          getMyTelemedicine(),
        ]);
        setAppointments(appts.appointments || []);
        setPatients(myPatients.patients || []);
        setTeleconsults(tele.teleconsults || []);
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }

      // Mock data for demo
      setQuickActions([
        { id: "qa1", label: "Start Teleconsult", icon: "📹", color: "blue", action: "teleconsult", count: teleconsults.filter(t => t.telemedicine?.status === "scheduled").length },
        { id: "qa2", label: "Write Prescription", icon: "💊", color: "violet", action: "prescribe", count: 0 },
        { id: "qa3", label: "Order Labs", icon: "🧪", color: "emerald", action: "labs", count: 0 },
        { id: "qa4", label: "Review Results", icon: "📋", color: "amber", action: "results", count: 3 },
        { id: "qa5", label: "Dictate Note", icon: "🎙️", color: "rose", action: "dictate", count: 0 },
        { id: "qa6", label: "Refill Requests", icon: "🔄", color: "orange", action: "refills", count: refillRequests.length },
        { id: "qa7", label: "On-Call Schedule", icon: "📅", color: "indigo", action: "oncall", count: onCallSchedule.filter(s => s.active).length },
        { id: "qa8", label: "Patient Messages", icon: "💬", color: "teal", action: "messages", count: 2 },
      ]);
      setOnCallSchedule([
        { day: "Today", date: new Date().toISOString().split("T")[0], shift: "18:00-06:00", active: true, backup: "Dr. Patel" },
        { day: "Tomorrow", date: new Date(Date.now() + 86400000).toISOString().split("T")[0], shift: "08:00-16:00", active: false, backup: "Dr. Singh" },
        { day: "Fri", date: new Date(Date.now() + 2*86400000).toISOString().split("T")[0], shift: "22:00-08:00", active: false, backup: "Dr. Gupta" },
      ]);
      setRefillRequests([
        { patient: "Rahul Sharma", drug: "Metformin 500mg", daysLeft: 2, requestDate: "2024-01-14", id: "rr1" },
        { patient: "Priya Patel", drug: "Amlodipine 5mg", daysLeft: 5, requestDate: "2024-01-13", id: "rr2" },
      ]);
    };
    loadAll();
  }, []);

  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) return alert("Not supported");
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new R(); r.continuous = true; r.lang = "en-IN";
    r.onresult = e => { let t = ""; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript; setVoiceTranscript(t); };
    r.onend = () => setVoiceActive(false);
    r.start(); setVoiceActive(true);
  };

  const todayAppts = appointments.filter(a => new Date(a.appointmentDate).toDateString() === new Date().toDateString());
  const upcomingTele = teleconsults.filter(t => t.telemedicine?.status === "scheduled" || t.telemedicine?.status === "live");
  const pendingResults = 3; // mock

  if (isLoading) return <div className="py-12 text-center text-slate-500">Loading mobile dashboard...</div>;

  return (
    <section className="space-y-4 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Dr. Dashboard</h1>
            <p className="text-xs text-slate-500">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {todayAppts.length} appointments · {upcomingTele.length} teleconsults</p>
          </div>
          <button onClick={voiceActive ? () => {} : startVoice} disabled={voiceActive} className={`rounded-full p-3 transition ${voiceActive ? "bg-red-500 text-white animate-pulse" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
            {voiceActive ? "🛑" : "🎙️"}
          </button>
        </div>
        {voiceActive && <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700 font-mono">{voiceTranscript || "Listening..."}</div>}
      </div>

      {/* Quick Actions Grid */}
      <div className="px-4 grid grid-cols-4 gap-2">
        {quickActions.map(qa => (
          <button key={qa.id} className={`rounded-xl p-3 text-center shadow-xs border ${qa.color === "blue" ? "bg-blue-50 border-blue-200" : qa.color === "violet" ? "bg-violet-50 border-violet-200" : qa.color === "emerald" ? "bg-emerald-50 border-emerald-200" : qa.color === "amber" ? "bg-amber-50 border-amber-200" : qa.color === "rose" ? "bg-rose-50 border-rose-200" : qa.color === "orange" ? "bg-orange-50 border-orange-200" : qa.color === "indigo" ? "bg-indigo-50 border-indigo-200" : "bg-teal-50 border-teal-200"}`}
            onClick={() => { /* navigate */ }}>
            <p className="text-2xl mb-1">{qa.icon}</p>
            <p className="text-[10px] font-bold text-slate-700">{qa.label}</p>
            {qa.count > 0 && <span className="inline-flex items-center rounded-full bg-red-500 text-white px-1.5 py-0.5 text-[9px] font-bold -mt-1">{qa.count}</span>}
          </button>
        ))}
      </div>

      {/* Today's Schedule */}
      <div className="px-4">
        <h2 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">📅 Today's Schedule <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold">{todayAppts.length}</span></h2>
        <div className="space-y-2">
          {todayAppts.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">No appointments today</div>
          ) : (
            todayAppts.slice(0, 5).map(a => (
              <div key={a._id} className="rounded-xl bg-white border border-slate-200 p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-xl">🩺</div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{a.patient?.name || "Patient"}</p>
                    <p className="text-xs text-slate-500">{a.timeSlot} · {a.appointmentType}</p>
                  </div>
                </div>
                <ActionMenu triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
                  items={[
                    { label: "Open Chart", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, primary: true },
                    { label: "Start Teleconsult", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>, disabled: a.appointmentType !== "teleconsultation" },
                    { label: "Message Patient", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h4M8 12l-2-2m2 2l2-2m-4 4v6M8 12V4m-2 8l4-4m-4 4l4 4" /></svg> },
                  ]} align="right" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Active Teleconsults */}
      {upcomingTele.length > 0 && (
        <div className="px-4">
          <h2 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">📹 Active Teleconsults <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-bold">{upcomingTele.length}</span></h2>
          <div className="space-y-2">
            {upcomingTele.map(t => (
              <div key={t._id} className="rounded-xl bg-teal-50 border border-teal-200 p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-teal-100 p-2 text-xl">📹</div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t.patient?.name}</p>
                    <p className="text-xs text-slate-500">{t.telemedicine?.status === "live" ? "LIVE NOW" : "Scheduled"} · {t.telemedicine?.joinCode}</p>
                  </div>
                </div>
                {t.telemedicine?.status === "live" ? (
                  <button className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white">End Call</button>
                ) : (
                  <button className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white">Join Now</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Results */}
      {pendingResults > 0 && (
        <div className="px-4">
          <h2 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">📋 Pending Results <span className="rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-bold">{pendingResults}</span></h2>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm font-bold text-amber-800">{pendingResults} critical/abnormal results need review</p>
            <p className="text-xs text-amber-700 mt-1">Tap to review in workbench</p>
          </div>
        </div>
      )}

      {/* Refill Requests */}
      {refillRequests.length > 0 && (
        <div className="px-4">
          <h2 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">🔄 Refill Requests <span className="rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-[10px] font-bold">{refillRequests.length}</span></h2>
          <div className="space-y-2">
            {refillRequests.map(r => (
              <div key={r.id} className="rounded-xl bg-white border border-slate-200 p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-50 p-2 text-xl">💊</div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{r.patient}</p>
                    <p className="text-xs text-slate-500">{r.drug} · {r.daysLeft}d left</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">Approve</button>
                  <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-600">Modify</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* On-Call Schedule */}
      <div className="px-4">
        <h2 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">📅 On-Call Schedule</h2>
        <div className="space-y-2">
          {onCallSchedule.map(s => (
            <div key={s.day} className={`rounded-xl p-3 ${s.active ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200"} border`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${s.active ? "animate-pulse" : ""}`}>🏥</span>
                  <div>
                    <p className="font-bold text-slate-800">{s.day} ({s.date})</p>
                    <p className="text-xs text-slate-500">{s.shift} · Backup: {s.backup}</p>
                  </div>
                </div>
                {s.active && <span className="rounded-full bg-indigo-600 text-white px-2 py-0.5 text-[10px] font-bold">ACTIVE</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Prescribe (Mock) */}
      <div className="px-4">
        <h2 className="text-sm font-bold text-slate-700 mb-2">⚡ Quick Prescribe</h2>
        <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 space-y-2">
          <p className="text-sm font-bold text-violet-800">Common prescriptions for quick access</p>
          <div className="flex flex-wrap gap-1">
            {["Metformin 500mg BD", "Amlodipine 5mg OD", "Atorvastatin 20mg ON", "Pantoprazole 40mg OD", "Paracetamol 650mg SOS", "Vitamin D3 60k IU weekly"].map((d, i) => (
              <button key={i} className="rounded-full bg-white border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100">{d}</button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorMobileDashboard;