import { useState, useEffect } from "react";
import { getDiagnosticTests } from "../../services/api.js";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  Input,
  EmptyStateCard,
  PageLoader,
} from "../../components/ui/index.js";

export default function DiagnosticCatalogPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await getDiagnosticTests({ limit: 100 });
      if (res.success) {
        setTests(res.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const filtered = tests.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q);
  });

  const categoryColors = {
    Pathology: "bg-purple-50 text-purple-700 border border-purple-200",
    Radiology: "bg-sky-50 text-sky-700 border border-sky-200",
  };

  if (loading) {
    return <PageLoader message="Loading diagnostic catalog…" />;
  }

  if (error) {
    return (
      <Card title="Catalog Load Error" subtitle={error} className="border-rose-200 bg-rose-50">
        <div className="flex items-center justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={fetchCatalog}>Retry</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostic Catalog & Formulary"
        subtitle="Centralized pharmaceutical master catalog with real-time stock balances, reorder points, and unit pricing."
      />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs ring-1 ring-slate-200/80 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <Input placeholder="Search by brand, generic, category…" value={search} onChange={(e) => setSearch(e.target.value)} id="catalog-search" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <Card key={t._id || t.name} title={t.name} subtitle={t.category || "General"} className={`cursor-pointer hover:border-teal-300 hover:bg-amber-50/50 transition border ${categoryColors[t.category] || "border-slate-200/80 bg-slate-50/60"}`}>
            <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{t.name}</span>
                  <Badge status="normal">${t.price}</Badge>
                <Badge status="normal">${t.price}</Badge>
              </div>
              <p className="text-xs text-slate-500">{t.dosageForm || "Tablet"} • {t.strength || "Standard"} • {t.manufacturer || "Cipla"}</p>
              {t.genericName && (
                <p className="text-xs text-slate-600 font-medium mt-0.5">{t.genericName}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
