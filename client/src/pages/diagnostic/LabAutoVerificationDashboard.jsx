import { useState, useEffect } from "react";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

export default function LabAutoVerificationDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) {
    return <PageLoader message="Loading auto-verification dashboard…" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lab Auto-Verification Workbench"
        subtitle="Automated verification of laboratory results against predefined rules"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Auto-Verified Results" subtitle="No manual intervention required">
          <div className="mt-2 text-2xl font-black text-emerald-800">124</div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-2">87% auto-verified</p>
        </Card>
        <Card title="Manual Review Required" subtitle="Pending specialist sign-off" className="border-amber-200 bg-amber-50/50">
          <div className="mt-2 text-2xl font-black text-amber-800">18</div>
          <p className="text-[10px] text-amber-700 font-semibold mt-2">Critical values flagged</p>
        </Card>
        <Card title="Critical Alerts" subtitle="Requires immediate attention" className="border-rose-200 bg-rose-50/50">
          <div className="mt-2 text-2xl font-black text-rose-800">3</div>
          <p className="text-[10px] text-rose-700 font-semibold mt-2">Critical values flagged</p>
        </Card>
      </div>

      <Card title="Auto-Verification Rules" subtitle="Rules engine for automated result validation">
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">Hemoglobin Range Validation</span>
              <Badge status="normal">Active</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">Auto-approve results within 13.0-17.0 g/dL</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">Glucose Range Validation</span>
              <Badge status="normal">Active</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">Auto-approve results within 70-140 mg/dL</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">Critical Value Escalation</span>
              <Badge status="normal">Active</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">Auto-flag results outside critical thresholds</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
