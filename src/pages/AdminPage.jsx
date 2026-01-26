import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://o3kk3hlbwd.execute-api.eu-central-1.amazonaws.com/dev";

export default function AdminPage({ idToken, onLogout }) {
  const navigate = useNavigate();

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const createPoll = () => {
    navigate("/admin/create-poll");
  };

  useEffect(() => {
    async function fetchPolls() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API}/poll`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load polls");

        const pollsWithResults = await Promise.all(
          data.map(async (poll) => {
            try {
              const r = await fetch(`${API}/poll/${poll.poll_id}/result`, {
                headers: { Authorization: `Bearer ${idToken}` },
              });
              const d = await r.json();
              return { ...poll, counts: d.counts || {} };
            } catch {
              return { ...poll, counts: {} };
            }
          })
        );

        setPolls(pollsWithResults);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPolls();
  }, [idToken]);

  return (
    <div style={{ fontFamily: "system-ui", padding: 30 }}>
      <h2>Admin Dashboard</h2>
      <p>You are logged in as <b>ADMIN</b>.</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={onLogout}>Logout</button>
        <button onClick={createPoll}>Create new poll</button>
      </div>

      <hr />

      {loading && <p>Loading polls…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
        {polls.map((poll) => (
          <div
            key={poll.poll_id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
              cursor: "pointer",
            }}
onClick={() => {
  if (poll.status === "open") {
    navigate(`/admin/poll/${poll.poll_id}/live`);
  }
}}
          >
            <h3 style={{ margin: "0 0 6px 0" }}>{poll.title}</h3>
            <small>Status: <b>{poll.status}</b></small>

            <div style={{ marginTop: 10 }}>
              {Object.keys(poll.counts || {}).length === 0 ? (
                <p style={{ color: "#777" }}>No votes yet</p>
              ) : (
                Object.entries(poll.counts).map(([opt, count]) => (
                  <div key={opt} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{opt}</span>
                    <b>{count}</b>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
