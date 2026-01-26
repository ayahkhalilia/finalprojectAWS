import { useEffect, useState } from "react";

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
    console.log(pollId);
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

  if (loading) return <div style={{ padding: 30 }}>Loading...</div>;
  if (error) return <div style={{ padding: 30, color: "crimson" }}>{error}</div>;
  if (!poll) return <div style={{ padding: 30 }}>No active poll</div>;

  return (
    <div style={{ padding: 30 }}>
      <button onClick={onLogout}>Logout</button>

      <h2>{poll.title}</h2>

      {votedOption ? (
        <p style={{ marginTop: 12 }}>
          You voted for: <b>{votedOption}</b>
        </p>
      ) : (
        <div style={{ marginTop: 12 }}>
          {(poll.options || []).map((o) => (
            <button
              key={o}
              onClick={() => vote(o)}
              disabled={voting}
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              {voting ? "Voting..." : o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
