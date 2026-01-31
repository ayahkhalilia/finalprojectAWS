import { useEffect, useState } from "react";
import "../index.css";

const API = "https://o3kk3hlbwd.execute-api.eu-central-1.amazonaws.com/dev";

export default function UserPage({ idToken, onLogout }) {
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [votedOption, setVotedOption] = useState(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    const fetchActivePoll = async () => {
      if (!idToken) {
        setError("No authentication idToken found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API}/poll/active`, {
          headers: { Authorization: `Bearer ${idToken}` },
          cache: "no-store",
        });

        const text = await res.text();
        console.log("RAW RESPONSE:", text);

        if (!res.ok) {
          setError(`API error ${res.status}: ${text}`);
          setPoll(null);
          return;
        }

        setPoll(text ? JSON.parse(text) : null);
        setVotedOption(null);
      } catch (err) {
        console.error("Error fetching active poll:", err);
        setError("Failed to fetch active poll.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivePoll();
  }, [idToken]);

  async function vote(option) {
    if (!poll) return;
    if (votedOption) return;
    if (voting) return;

    const pollId = poll.poll_id ?? poll.pollId ?? poll.id;
    if (!pollId) {
      setError("Poll id missing from response.");
      return;
    }

    try {
      setVoting(true);
      setError(null);

      const res = await fetch(`${API}/poll/${pollId}/vapi`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId: option }),
      });

      const text = await res.text();
      if (!res.ok) {
        setError(`Vote failed ${res.status}: ${text}`);
        return;
      }

      setVotedOption(option);
    } catch (err) {
      console.error("Vote error:", err);
      setError("Vote failed (network error).");
    } finally {
      setVoting(false);
    }
  }

  // Loading / error / empty states styled
  if (loading)
    return (
      <div className="page">
        <div className="shell">
          <div className="card state">
            <div className="spinner" />
            <div>
              <h3>Loading</h3>
              <p>Fetching the active poll…</p>
            </div>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="page">
        <div className="shell">
          <div className="card state error">
            <div className="badge">Error</div>
            <h3>Something went wrong</h3>
            <p className="mono">{error}</p>
            <button className="btn ghost" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    );

  if (!poll)
    return (
      <div className="page">
        <div className="shell">
          <header className="topbar">
            <div>
              <div className="kicker">Voting System</div>
              <h2 className="title">User Dashboard</h2>
            </div>
            <button className="btn ghost" onClick={onLogout}>
              Logout
            </button>
          </header>

          <div className="card state">
            <div className="badge">No poll</div>
            <h3>No active poll</h3>
            <p>There isn’t an open poll right now. Check back soon.</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="page">
      <div className="shell">
        <header className="topbar">
          <div>
            <div className="kicker">Voting System</div>
            <h2 className="title">User Dashboard</h2>
          </div>

          <button className="btn ghost" onClick={onLogout}>
            Logout
          </button>
        </header>

        <main className="grid">
          <section className="card pollCard">
            <div className="pollHead">
              <div>
                <div className="badge">Active poll</div>
                <h3 className="pollTitle">{poll.title}</h3>
                <p className="sub">
                  Pick one option. Your vote is sent securely using your token.
                </p>
              </div>
            </div>

            {votedOption ? (
              <div className="votedBox">
                <div className="check" aria-hidden="true">✓</div>
                <div>
                  <h4>Vote received</h4>
                  <p>
                    You voted for: <span className="pill">{votedOption}</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="options">
                {(poll.options || []).map((o) => (
                  <button
                    key={o}
                    onClick={() => vote(o)}
                    disabled={voting}
                    className="optionBtn"
                  >
                    <span className="optionText">{o}</span>
                    <span className="optionMeta">
                      {voting ? "Voting…" : "Vote"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="card sideCard">
            <h4 className="sideTitle">Tips</h4>
            <ul className="sideList">
              <li>Make sure you select the correct option.</li>
              <li>If you refresh, you might see the poll again (depends on backend rules).</li>
              <li>When the admin closes the poll, it will disappear here.</li>
            </ul>

            <div className="divider" />

            <div className="mini">
              <div className="miniLabel">Status</div>
              <div className="miniValue">{votedOption ? "Voted" : "Not voted yet"}</div>
            </div>

            <button className="btn danger" onClick={onLogout}>
              Logout
            </button>
          </aside>
        </main>
      </div>
    </div>
  );
}
