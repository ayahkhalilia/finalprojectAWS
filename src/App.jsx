import React, { useEffect, useMemo, useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import UserPage from "./pages/UserPage";
import CreatePollPage from "./pages/CreatePollPage";
import AdminLivePollPage from "./pages/AdminLivePollPage";


const COGNITO_DOMAIN = "https://eu-central-1ubvthcgwi.auth.eu-central-1.amazoncognito.com";
const CLIENT_ID = "2i93ovq6dpjrhq0ngram0g8ndk";
const REDIRECT_URI = "http://localhost:3000";//window.location.origin;

function buildAuthorizeUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: "openid email phone",
    redirect_uri: REDIRECT_URI,
  });
  return `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

function buildTokenUrl() {
  return `${COGNITO_DOMAIN}/oauth2/token`;
}

function buildLogoutUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: REDIRECT_URI,
  });
  return `${COGNITO_DOMAIN}/logout?${params.toString()}`;
}

function parseJwtPayload(jwt) {
  const base64Url = jwt.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);
  return JSON.parse(atob(padded));
}

function isAdminFromIdToken(idToken) {
  const payload = parseJwtPayload(idToken);
  const groups = payload["cognito:groups"] || [];
  return Array.isArray(groups)
    ? groups.includes("admin")
    : String(groups).split(",").map(s => s.trim()).includes("admin");
}

async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch(buildTokenUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error_description || data?.error || "Token exchange failed");
  }
  return data; 
}

function AppInner() {
  const navigate = useNavigate();
  const authorizeUrl = useMemo(() => buildAuthorizeUrl(), []);

  const [status, setStatus] = useState("Not logged in");
  const [tokens, setTokens] = useState(null);

  const handledRef = useRef(false);

  const idToken = tokens?.id_token || null;
  const isAdmin = useMemo(() => (idToken ? isAdminFromIdToken(idToken) : false), [idToken]);

  useEffect(() => {
    if (handledRef.current) return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (code && !tokens) {
      handledRef.current = true;

      url.searchParams.delete("code");
      window.history.replaceState({}, "", url.toString());

      (async () => {
        try {
          setStatus("Exchanging code for tokens...");
          const data = await exchangeCodeForTokens(code);
          setTokens(data);
          setStatus("Logged in");

          const admin = isAdminFromIdToken(data.id_token);
          navigate(admin ? "/admin" : "/user", { replace: true });
        } catch (e) {
          console.error(e);
          setStatus(`Login failed: ${e.message}`);
          window.location.href = authorizeUrl;
        }
      })();

      return;
    }

    if (!tokens && !code) {
      handledRef.current = true;
      window.location.href = authorizeUrl;
    }
  }, [navigate, authorizeUrl, tokens]);

  const logout = () => {
    setTokens(null);
    setStatus("Not logged in");

    
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      logout_uri: REDIRECT_URI,
    });
    console.log(COGNITO_DOMAIN);
    console.log(params);
    window.location.href = `${COGNITO_DOMAIN}/logout?${params.toString()}`;
  };

  if (!tokens) return null;

  return (
    <Routes>
      <Route
        path="/admin"
        element={
          isAdmin ? (
            <AdminPage tokens={tokens} onLogout={logout} idToken={idToken}/>
          ) : (
            <Navigate to="/user" replace />
          )
        }
      />
      <Route
        path="/user"
        element={
          !isAdmin ? (
            <UserPage tokens={tokens} onLogout={logout} idToken={idToken}/>
          ) : (
            <Navigate to="/admin" replace />
          )
        }
      />
      <Route path="/" element={<Navigate to={isAdmin ? "/admin" : "/user"} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
        <Route
    path="/admin/create-poll"
    element={
      isAdmin ? (
        <CreatePollPage idToken={idToken} />
      ) : (
        <Navigate to="/user" replace />
      )
    }
  />

  <Route
  path="/admin/poll/:pollId/live"
  element={
    isAdmin ? (
      <AdminLivePollPage idToken={idToken} />
    ) : (
      <Navigate to="/user" replace />
    )
  }
/>

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
