import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../AdminPage.css";

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
    <div className="apage">
      <div className="ashell">
        <header className="atopbar">
          <div>
            <div className="akicker">Voting System</div>
            <h2 className="atitle">Admin Dashboard</h2>
            <p className="asub">
              You are logged in as <span className="apill">ADMIN</span>.
            </p>
                        <button className="abtn primary" onClick={createPoll}>
              + Create new poll
            </button>
          </div>

          <div className="aactions">
            <button className="abtn ghost" onClick={onLogout}>
              Logout
            </button>

          </div>
        </header>

        {loading && (
          <div className="acard astate">
            <div className="aspinner" />
            <div>
              <h3>Loading polls</h3>
              <p>Please wait…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="acard astate error">
            
            <h3>Couldn’t load polls</h3>
            <p className="amono">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="agrid">
            {polls.map((poll) => {
              const isOpen = poll.status === "open";
              const hasVotes = Object.keys(poll.counts || {}).length > 0;

              return (
                <div
                  key={poll.poll_id}
                  className={`acard apollCard ${isOpen ? "clickable" : "disabled"}`}
                  onClick={() => {
                    if (isOpen) navigate(`/admin/poll/${poll.poll_id}/live`);
                  }}
                  role={isOpen ? "button" : undefined}
                  tabIndex={isOpen ? 0 : -1}
                >
                  <div className="apollHead">
                    <div>
                      <div className={`abadge ${isOpen ? "ok" : "muted"}`}>
                        {isOpen ? "Open" : "Closed"}
                      </div>
                      <h3 className="apollTitle">{poll.title}</h3>
                      <div className="ameta">
                        Status: <b>{poll.status}</b>
                        {isOpen ? (
                          <span className="ahint">• Click to open live view</span>
                        ) : (
                          <span className="ahint">• Poll ended</span>
                        )}
                      </div>
                    </div>

                    <div className="acountChip">
                      <div className="acountLabel">Votes</div>
                      <div className="acountValue">
                        {hasVotes
                          ? Object.values(poll.counts).reduce((a, b) => a + b, 0)
                          : 0}
                      </div>
                    </div>
                  </div>

                  <div className="aresults">
                    {!hasVotes ? (
                      <p className="amutetext">No votes yet</p>
                    ) : (
                      Object.entries(poll.counts).map(([opt, count]) => (
                        <div key={opt} className="arow">
                          <span className="aopt">{opt}</span>
                          <b className="anum">{count}</b>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
