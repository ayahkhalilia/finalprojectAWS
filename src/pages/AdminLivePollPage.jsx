import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = "https://o3kk3hlbwd.execute-api.eu-central-1.amazonaws.com/dev";

const resultUrl = (pollId) => `${API}/poll/${pollId}/result`;
const closeUrl  = (pollId) => `${API}/poll/${pollId}/close`; 

export default function AdminLivePollPage({ idToken }) {
  const { pollId } = useParams();
  const navigate = useNavigate();

  const [counts, setCounts] = useState(null);    
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState(null);

  const totalVotes = useMemo(() => {
    if (!counts) return 0;
    return Object.values(counts).reduce((a, b) => a + Number(b || 0), 0);
  }, [counts]);

  useEffect(() => {
    let alive = true;

    async function fetchResults() {
      try {
        setError(null);
        const res = await fetch(resultUrl(pollId), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load results");

        if (!alive) return;
        setCounts(data.counts || {});
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setError(e.message);
        setLoading(false);
      }
    }

    fetchResults();
    const t = setInterval(fetchResults, 2000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pollId, idToken]);

  const endPoll = async () => {
    try {
      setEnding(true);
      setError(null);


      const res = await fetch(closeUrl(pollId), {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: "closed" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to end poll");

      navigate("/admin", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setEnding(false);
    }
  };

  return (
    <div style={{ padding: 30, fontFamily: "system-ui", maxWidth: 700 }}>
      <h2>Live Poll Results</h2>
      <p><b>Poll ID:</b> {pollId}</p>

      {error && (
        <p style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading live votes…</p>
      ) : (
        <>
          <p><b>Total votes:</b> {totalVotes}</p>

          <div style={{ display: "grid", gap: 10 }}>
            {Object.entries(counts || {}).map(([optionId, value]) => {
              const v = Number(value || 0);
              const pct = totalVotes > 0 ? Math.round((v / totalVotes) * 100) : 0;

              return (
                <div
                  key={optionId}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <b>{optionId}</b>
                    <span>{v} ({pct}%)</span>
                  </div>

                  <div style={{ height: 10, background: "#eee", borderRadius: 999, marginTop: 8 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: "#333",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={() => navigate("/admin")}
        >
          Back
        </button>

        <button
          type="button"
          onClick={endPoll}
          disabled={ending}
          style={{ marginLeft: "auto" }}
        >
          {ending ? "Ending..." : "End poll"}
        </button>
      </div>
    </div>
  );
}
