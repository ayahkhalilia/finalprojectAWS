import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://o3kk3hlbwd.execute-api.eu-central-1.amazonaws.com/dev";

export default function CreatePollPage({ idToken }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addOption = () => setOptions([...options, ""]);

  const updateOption = (i, value) => {
    const copy = [...options];
    copy[i] = value;
    setOptions(copy);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanOptions = options.map(o => o.trim()).filter(Boolean);

    if (cleanOptions.length < 2) {
      setError("Please provide at least 2 options.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/poll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`, 
        },
        body: JSON.stringify({
          title,
          options: cleanOptions,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create poll");
      }

      console.log("Created poll:", data);

      navigate(`/admin/poll/${data.poll_id}/live`);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30, maxWidth: 500 }}>
      <h2>Create New Poll</h2>

      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label>Poll title</label><br />
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <label>Options</label>
        {options.map((opt, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <input
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
              required
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        ))}

        <button type="button" onClick={addOption}>
          + Add option
        </button>

        <br /><br />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create poll"}
        </button>
      </form>
    </div>
  );
}
