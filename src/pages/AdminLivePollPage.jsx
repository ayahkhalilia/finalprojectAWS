import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../AdminLivePollPage.css";

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
          headers: { Authorization: `Bearer ${idToken}` },
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
    <div className="lpage">
      <div className="lshell">
        <header className="ltopbar">
          <div>
            <div className="lkicker">Admin</div>
            <h2 className="ltitle">Live Poll Results</h2>
            <p className="lmeta">
              <span className="lbadge">Poll ID</span> <span className="lmono">{pollId}</span>
            </p>
          </div>

          <div className="lactions">
            <button className="lbtn ghost" onClick={() => navigate("/admin")}>
              Back
            </button>

            <button className="lbtn danger" onClick={endPoll} disabled={ending}>
              {ending ? "Ending..." : "End poll"}
            </button>
          </div>
        </header>

        {error && (
          <div className="lcard lstate error">
            <div className="lbadge danger">Error</div>
            <p className="lmono">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="lcard lstate">
            <div className="lspinner" />
            <div>
              <h3>Loading live votes</h3>
              <p>Updating every 2 seconds…</p>
            </div>
          </div>
        ) : (
          <>
            <div className="lsummary">
              <div className="lcard lsummaryCard">
                <div className="lsumLabel">Total votes</div>
                <div className="lsumValue">{totalVotes}</div>
                <div className="lsumHint">Live updates are enabled</div>
              </div>
            </div>

            <div className="lgrid">
              {Object.entries(counts || {}).map(([optionId, value]) => {
                const v = Number(value || 0);
                const pct =
                  totalVotes > 0 ? Math.round((v / totalVotes) * 100) : 0;

                return (
                  <div key={optionId} className="lcard loptionCard">
                    <div className="lrow">
                      <div className="loptName">{optionId}</div>
                      <div className="loptStats">
                        <b>{v}</b> <span className="lmuted">({pct}%)</span>
                      </div>
                    </div>

                    <div className="lbar">
                      <div className="lfill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
