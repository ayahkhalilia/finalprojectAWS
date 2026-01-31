import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CreatePollPage.css";

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
      if (!res.ok) throw new Error(data.message || "Failed to create poll");

      navigate(`/admin/poll/${data.poll_id}/live`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cpage">
      <div className="cshell">
        <header className="ctopbar">
          <div>
            <div className="ckicker">Admin</div>
            <h2 className="ctitle">Create New Poll</h2>
            <p className="csub">
              Define the poll question and its options
            </p>
          </div>

          <button className="cbtn ghost" onClick={() => navigate("/admin")}>
            Back
          </button>
        </header>

        <form className="ccard cform" onSubmit={submit}>
          <div className="cfield">
            <label className="clabel">Poll title</label>
            <input
              className="cinput"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. What is your favorite color?"
              required
            />
          </div>

          <div className="cfield">
            <label className="clabel">Options</label>

            <div className="coptions">
              {options.map((opt, i) => (
                <input
                  key={i}
                  className="cinput"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  required
                />
              ))}
            </div>

            <button
              type="button"
              className="cbtn soft"
              onClick={addOption}
            >
              + Add option
            </button>
          </div>

          {error && (
            <div className="cerror">
              {error}
            </div>
          )}

          <div className="cactions">
            <button
              type="submit"
              className="cbtn primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
