import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  listAllOrders,
  listAllSubscriptions,
  listAllInquiries,
  updateInquiryStatus,
} from "@/utils/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin — AscendantWeb" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminPage,
});

type Tab = "orders" | "subscriptions" | "inquiries";

function AdminPage() {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate({ to: "/account", replace: true });
    }
  }, [isLoading, isAdmin, navigate]);

  const load = () => {
    setLoading(true);
    Promise.all([listAllOrders(), listAllSubscriptions(), listAllInquiries()])
      .then(([o, s, i]) => {
        setOrders(o);
        setSubs(s);
        setInquiries(i);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) return null;

  const mrrCents = subs
    .filter((s: any) => s.status === "active" || s.status === "trialing")
    .reduce((sum: number, s: any) => {
      const p = s.price_id || "";
      if (p === "basic_monthly") return sum + 15000;
      if (p === "advanced_monthly") return sum + 20000;
      if (p === "ascendant_monthly") return sum + 25000;
      return sum;
    }, 0);

  const activeSubs = subs.filter(
    (s: any) => s.status === "active" || s.status === "trialing",
  ).length;
  const newLeads = inquiries.filter((i: any) => i.status === "new").length;

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/account" className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            ← My account
          </Link>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight">Admin</h1>
        <p className="mt-2 text-foreground/60">Everything happening on AscendantWeb.</p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="MRR" value={`$${(mrrCents / 100).toFixed(0)}`} />
          <Stat label="Active subs" value={activeSubs} />
          <Stat label="Total orders" value={orders.length} />
          <Stat label="New leads" value={newLeads} />
        </div>

        <div className="mt-8 flex gap-2 border-b border-glass-border">
          {(["orders", "subscriptions", "inquiries"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize ${
                tab === t
                  ? "border-b-2 border-primary text-foreground"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 text-foreground/60">Loading…</div>
        ) : error ? (
          <div className="mt-8 text-red-400">{error}</div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-glass-border bg-glass">
            {tab === "orders" && <OrdersTable rows={orders} />}
            {tab === "subscriptions" && <SubsTable rows={subs} />}
            {tab === "inquiries" && (
              <InquiriesTable
                rows={inquiries}
                onUpdate={async (id, status) => {
                  await updateInquiryStatus({ data: { id, status } });
                  load();
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-glass-border bg-glass p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">
        {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

function OrdersTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <Empty label="No orders yet." />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-white/5 text-left">
        <tr>
          <Th>Date</Th>
          <Th>Email</Th>
          <Th>Tier</Th>
          <Th>Amount</Th>
          <Th>Status</Th>
          <Th>Env</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => (
          <tr key={o.id} className="border-t border-glass-border/60">
            <Td>{new Date(o.created_at).toLocaleString()}</Td>
            <Td>{o.email ?? "—"}</Td>
            <Td className="capitalize">{o.tier}</Td>
            <Td>
              ${(o.amount_cents / 100).toFixed(2)} {o.currency?.toUpperCase()}
            </Td>
            <Td>{o.status}</Td>
            <Td>{o.environment}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SubsTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <Empty label="No subscriptions yet." />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-white/5 text-left">
        <tr>
          <Th>Created</Th>
          <Th>Customer</Th>
          <Th>Tier</Th>
          <Th>Status</Th>
          <Th>Renews</Th>
          <Th>Env</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.id} className="border-t border-glass-border/60">
            <Td>{new Date(s.created_at).toLocaleDateString()}</Td>
            <Td>{s.profiles?.email ?? s.stripe_customer_id?.slice(0, 14) ?? "—"}</Td>
            <Td className="capitalize">{(s.price_id ?? "").replace("_monthly", "")}</Td>
            <Td>
              {s.status}
              {s.cancel_at_period_end ? " (cancels)" : ""}
            </Td>
            <Td>
              {s.current_period_end
                ? new Date(s.current_period_end).toLocaleDateString()
                : "—"}
            </Td>
            <Td>{s.environment}</Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InquiriesTable({
  rows,
  onUpdate,
}: {
  rows: any[];
  onUpdate: (id: string, status: "new" | "contacted" | "archived") => void;
}) {
  if (!rows.length) return <Empty label="No inquiries yet." />;
  return (
    <table className="w-full text-sm">
      <thead className="bg-white/5 text-left">
        <tr>
          <Th>Date</Th>
          <Th>Source</Th>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Detail</Th>
          <Th>Status</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((i) => (
          <tr key={i.id} className="border-t border-glass-border/60">
            <Td>{new Date(i.created_at).toLocaleDateString()}</Td>
            <Td className="capitalize">{i.source}</Td>
            <Td>{i.name}</Td>
            <Td>{i.email}</Td>
            <Td className="max-w-xs">
              {i.budget && <div className="text-xs text-foreground/50">{i.budget}</div>}
              {i.website_url && (
                <a
                  href={i.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline"
                >
                  {i.website_url}
                </a>
              )}
              {i.message && <div className="mt-1 line-clamp-2">{i.message}</div>}
            </Td>
            <Td>{i.status}</Td>
            <Td>
              <div className="flex gap-1">
                {i.status !== "contacted" && (
                  <button
                    onClick={() => onUpdate(i.id, "contacted")}
                    className="rounded border border-glass-border px-2 py-1 text-xs hover:bg-white/5"
                  >
                    ✓
                  </button>
                )}
                {i.status !== "archived" && (
                  <button
                    onClick={() => onUpdate(i.id, "archived")}
                    className="rounded border border-glass-border px-2 py-1 text-xs hover:bg-white/5"
                  >
                    Archive
                  </button>
                )}
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-foreground/60">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
function Empty({ label }: { label: string }) {
  return <div className="p-10 text-center text-foreground/50">{label}</div>;
}
