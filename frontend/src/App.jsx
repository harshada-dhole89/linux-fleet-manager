import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:4000";

function MetricLineChart({ title, points, color }) {
  const width = 600;
  const height = 220;
  const padding = 35;

  if (!points || points.length < 2) {
    return (
      <div className="panel">
        <h3>{title}</h3>
        <p className="muted">Historical data is not available yet.</p>
      </div>
    );
  }
  //data received then mathematical part jo graph banata hai
  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const coordinates = points.map((point, index) => {
    const x =
      padding +
      (index / (points.length - 1)) * (width - padding * 2);

    const y =
      height -
      padding -
      ((point.value - minValue) / range) * (height - padding * 2);

    return `${x},${y}`;
  });

  return (
    <div className="panel">
      <h3>{title}</h3>
      <p className="muted">Last 15 minutes · Prometheus</p>

      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title} over the last 15 minutes`}
          style={{ width: "100%", minWidth: "300px" }}
        >
          {[0, 1, 2, 3].map((line) => {
            const y =
              padding + (line / 3) * (height - padding * 2);

            return (
              <line
                key={line}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#334155"
                strokeDasharray="4 4"
              />
            );
          })}

          <polyline
            points={coordinates.join(" ")}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <text
            x={padding}
            y={height - 8}
            fill="currentColor"
            fontSize="12"
          >
            {new Date(points[0].time * 1000).toLocaleTimeString()}
          </text>

          <text
            x={width - padding}
            y={height - 8}
            fill="currentColor"
            fontSize="12"
            textAnchor="end"
          >
            {new Date(
              points[points.length - 1].time * 1000
            ).toLocaleTimeString()}
          </text>
        </svg>
      </div>

      <p className="muted">
        Latest: {values[values.length - 1].toFixed(2)}%
        {" · "}Range: {minValue.toFixed(2)}%–{maxValue.toFixed(2)}%
      </p>
    </div>
  );
}
//mathematical part done
//main control room
function App() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [token, setToken] = useState(
    () => sessionStorage.getItem("fleet_token") || ""
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(
    () => !!sessionStorage.getItem("fleet_token")
  );

  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Onboarding state variables
  const [newHostname, setNewHostname] = useState("");
  const [newIp, setNewIp] = useState("");
  const [newSshUser, setNewSshUser] = useState("root");
  const [newSshKeyRef, setNewSshKeyRef] = useState("");
  const [onboardMessage, setOnboardMessage] = useState("");

  // Command Execution state variables
  const [execNodeId, setExecNodeId] = useState("");
  const [selectedCommand, setSelectedCommand] = useState("uptime");
  const [execResult, setExecResult] = useState(null);
  const [execLoading, setExecLoading] = useState(false);

  const [commandLogs, setCommandLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");

  const [metrics, setMetrics] = useState({
    cpu: null,
    memory: null,
    disk: null,
  });
  const [metricsHistory, setMetricsHistory] = useState({
    cpu: [],
    memory: [],
    disk: [],
  });

  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState("");
  const [metricsByNode, setMetricsByNode] = useState([]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setError(
          response.status === 401
            ? "Invalid username or password."
            : `Login failed (${response.status}).`
        );
        return;
      }

      const data = await response.json();

      if (!data.token) {
        setError("Login response did not contain a token.");
        return;
      }

      sessionStorage.setItem("fleet_token", data.token);
      setToken(data.token);
      setPassword("");
      setLoggedIn(true);
      setActiveTab("Overview");
      setError("");

      await fetchNodes(data.token);
    } catch {
      setError("Cannot connect to backend. Check if the server is running.");
    }
  }

  async function fetchNodes(authToken = token) {
    if (!authToken.trim()) {
      setError("Please log in first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/nodes`, {
        headers: {
          Authorization: `Bearer ${authToken.trim()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem("fleet_token");
          setToken("");
          setLoggedIn(false);
          throw new Error("Session expired. Please log in again.");
        }

        throw new Error(
          response.status === 403
            ? "Access denied. Check your account role."
            : `Request failed (${response.status}).`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected API response format.");
      }

      setNodes(data);
      setLoaded(true);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Backend connection failed. Check port 4000."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  // PRD Requirement: Node Onboarding function
  async function handleOnboard(e) {
    e.preventDefault();
    setOnboardMessage("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/nodes/onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hostname: newHostname,
          ip_address: newIp,
          port: 9100,
          ssh_user: newSshUser,
          ssh_key_ref: newSshKeyRef,
          monitoringType: "node_exporter",
        }),
      });

      if (!response.ok) {
        throw new Error(`Onboarding failed (${response.status})`);
      }

      setOnboardMessage("Node successfully onboarded!");
      setNewHostname("");
      setNewIp("");
      setNewSshKeyRef("");
      fetchNodes();
    } catch (err) {
      setError(err.message || "Failed to onboard node.");
    }
  }

  // PRD Requirement: Controlled Remote Command Execution
  async function handleExecuteCommand(e) {
    e.preventDefault();
    if (!execNodeId) {
      setError("Please select a target node for command execution.");
      return;
    }

    setExecLoading(true);
    setExecResult(null);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/nodes/${execNodeId}/command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command: selectedCommand }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Command execution failed (${response.status}): ${message}`);
      }


      const data = await response.text();

      setExecResult({
        status: "success",
        output: data
      });

    } catch (err) {
      setError(err.message || "Could not execute command.");
    } finally {
      setExecLoading(false);
    }
  }

  async function fetchCommandHistory(nodeId) {
    if (!token) {
      setHistoryError("Please log in first.");
      return;
    }

    if (!nodeId) {
      setHistoryError("Please select a node.");
      return;
    }

    setSelectedNodeId(nodeId);
    setHistoryLoading(true);
    setHistoryError("");
    setCommandLogs([]);

    try {
      const response = await fetch(
        `${API_URL}/api/nodes/${nodeId}/commands`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem("fleet_token");
          setToken("");
          setLoggedIn(false);
          throw new Error("Session expired. Please log in again.");
        }

        throw new Error(
          response.status === 403
            ? "Admin access required."
            : `Request failed (${response.status}).`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Unexpected command history response.");
      }

      setCommandLogs(data);
    } catch (err) {
      setHistoryError(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend."
          : err.message
      );
    } finally {
      setHistoryLoading(false);
    }
  }
  //prometheus metric function
  async function fetchMetric(query) {
    const response = await fetch(
      `/prometheus/api/v1/query?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Prometheus request failed (${response.status})`);
    }

    const data = await response.json();

    if (data.status !== "success") {
      throw new Error("Prometheus query failed.");
    }

    return data.data.result;
  }

  async function fetchMetricRange(query) {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 15 * 60;

    const params = new URLSearchParams({
      query,
      start: String(start),
      end: String(end),
      step: "15s",
    });

    const response = await fetch(
      `/prometheus/api/v1/query_range?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        `Prometheus history request failed (${response.status})`
      );
    }

    const data = await response.json();

    if (data.status !== "success") {
      throw new Error("Prometheus history query failed.");
    }

    const series = data.data.result[0];

    if (!series || !Array.isArray(series.values)) {
      return [];
    }

    return series.values
      .map(([timestamp, rawValue]) => ({
        time: Number(timestamp),
        value: Number(rawValue),
      }))
      .filter(
        (point) =>
          Number.isFinite(point.time) &&
          Number.isFinite(point.value)
      );
  }



  async function fetchMetrics() {
    setMetricsLoading(true);
    setMetricsError("");

    try {
      const instances = [
        "16.4.100.81:9100",
        "16.4.42.48:9100",
      ];

      const results = await Promise.all(
        instances.map(async (instance) => {
          const cpuQuery =
            `100 * (1 - avg by (instance) (` +
            `rate(node_cpu_seconds_total{instance="${instance}",mode="idle"}[5m])))`;

          const memoryQuery =
            `(1 - node_memory_MemAvailable_bytes{instance="${instance}"}` +
            ` / node_memory_MemTotal_bytes{instance="${instance}"}) * 100`;

          const diskQuery =
            `(1 - node_filesystem_avail_bytes{instance="${instance}",mountpoint="/",fstype!="rootfs"}` +
            ` / node_filesystem_size_bytes{instance="${instance}",mountpoint="/",fstype!="rootfs"}) * 100`;

          const [cpu, memory, disk] = await Promise.all([
            fetchMetric(cpuQuery),
            fetchMetric(memoryQuery),
            fetchMetric(diskQuery),
          ]);

          return { instance, cpu, memory, disk };
        })
      );

      setMetricsByNode(results);

      const getValue = (data) => {
        const rawValue = data?.[0]?.value?.[1];
        if (rawValue == null) return null;

        const value = Number(rawValue);
        return Number.isFinite(value) ? value : null;
      };

      const timestamp = Date.now();

      const average = (key) => {
        const values = results
          .map((node) => getValue(node[key]))
          .filter((value) => value !== null);

        if (values.length === 0) return null;

        return values.reduce((sum, value) => sum + value, 0) / values.length;
      };

      setMetricsHistory((previous) => {
        const next = { ...previous };

        ["cpu", "memory", "disk"].forEach((key) => {
          const value = average(key);

          if (value !== null) {
            next[key] = [
              ...previous[key],
              { timestamp, value },
            ].slice(-60);
          }
        });

        return next;
      });
    } catch (err) {
      setMetricsError(
        err.message || "Could not load monitoring metrics."
      );
    } finally {
      setMetricsLoading(false);
    }
  }


  useEffect(() => {
    if (!loggedIn || !token) return;

    fetchNodes(token);
    fetchMetrics();

    const intervalId = setInterval(() => {
      fetchNodes(token);
      fetchMetrics();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [loggedIn, token]);

  function handleLogout() {
    sessionStorage.removeItem("fleet_token");
    setToken("");
    setLoggedIn(false);
    setUsername("");
    setPassword("");
    setNodes([]);
    setCommandLogs([]);
    setSelectedNodeId("");
    setLoaded(false);
    setError("");
    setHistoryError("");
    setActiveTab("Overview");
  }

  function monitoringName(node) {
    return node.monitoringType === "node_exporter"
      ? "Node Exporter"
      : "Heartbeat";
  }

  const onlineNodes = nodes.filter(
    (node) => node.status === "online"
  ).length;

  const offlineNodes = nodes.length - onlineNodes;

  if (!loggedIn) {
    return (
      <div className="app">
        <main
          className="main"
          style={{
            maxWidth: "480px",
            width: "100%",
            margin: "auto",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <section className="panel">
            <h1>🖥️ Fleet Manager</h1>
            <p className="muted">
              Sign in to manage your Linux infrastructure.
            </p>

            <form onSubmit={handleLogin}>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
                style={inputStyle}
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                style={inputStyle}
              />

              {error && (
                <p style={{ color: "#d84455" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={buttonStyle}
              >
                Sign In
              </button>
            </form>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>🖥️ FleetManager</h2>
        <p className="subtitle">LINUX INFRASTRUCTURE</p>

        {["Overview", "Nodes", "Onboard Node", "Execute Command", "Command History", "Monitoring"].map(
          (tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "nav active" : "nav"}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          )
        )}

        <div className="sidebar-bottom">
          <span>Fleet Manager v1.0</span>
          <button className="nav" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </aside>

      <main className="main">
        <header>
          <div>
            <h1>{activeTab}</h1>
            <p>Monitor and manage your Linux infrastructure.</p>
          </div>
          <span className="admin">● Admin</span>
        </header>

        {error && (
          <p style={{ color: "#d84455" }}>{error}</p>
        )}

        {activeTab === "Overview" && (
          <>
            <section className="welcome">
              <div>
                <h2>Infrastructure Overview</h2>
                <p>Welcome to your Linux Fleet Manager dashboard.</p>
              </div>
              <span>LIVE MONITORING</span>
            </section>

            <section className="cards">
              <div className="card">
                <p>Total Nodes</p>
                <h2>{nodes.length}</h2>
                <span>Registered nodes</span>
              </div>
              <div className="card">
                <p>Online Nodes</p>
                <h2 className="green">{onlineNodes}</h2>
                <span>Nodes responding</span>
              </div>
              <div className="card">
                <p>Offline Nodes</p>
                <h2 className="red">{offlineNodes}</h2>
                <span>Nodes needing attention</span>
              </div>
              <div className="card">
                <p>Monitoring</p>
                <h2 className="blue">Active</h2>
                <span>Prometheus + Grafana</span>
              </div>
            </section>

            <section className="panel">
              <h2>Fleet Status</h2>
              <button
                onClick={() => fetchNodes()}
                disabled={loading}
                style={buttonStyle}
              >
                {loading ? "Loading..." : "Refresh Nodes"}
              </button>
            </section>
          </>
        )}

        {activeTab === "Nodes" && (
          <section className="panel">
            <h2>Fleet Nodes</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>HOSTNAME</th>
                    <th>IP ADDRESS</th>
                    <th>MONITORING</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node) => (
                    <tr key={node._id}>
                      <td>{node.hostname}</td>
                      <td>{node.ip_address || "—"}</td>
                      <td>{monitoringName(node)}</td>
                      <td>
                        <span className={`status ${node.status === "online" ? "online" : "offline"}`}>
                          ● {node.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PRD Requirement: Onboarding Tab */}
        {activeTab === "Onboard Node" && (
          <section className="panel">
            <h2>Onboard New Linux Node</h2>
            <p className="muted">Register a remote node with SSH credentials.</p>

            <form onSubmit={handleOnboard}>
              <label>Hostname</label>
              <input
                type="text"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                placeholder="e.g. node-02"
                required
                style={inputStyle}
              />

              <label>IP Address</label>
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="e.g. 192.168.1.50"
                required
                style={inputStyle}
              />

              <label>SSH User</label>
              <input
                type="text"
                value={newSshUser}
                onChange={(e) => setNewSshUser(e.target.value)}
                required
                style={inputStyle}
              />

              <label>SSH Key Reference</label>
              <input
                type="text"
                value={newSshKeyRef}
                onChange={(e) => setNewSshKeyRef(e.target.value)}
                placeholder="e.g. /keys/id_rsa"
                required
                style={inputStyle}
              />

              {onboardMessage && <p style={{ color: "#22c55e" }}>{onboardMessage}</p>}

              <button type="submit" style={buttonStyle}>
                Onboard Node
              </button>
            </form>
          </section>
        )}

        {/* PRD Requirement: Execute Command Tab */}
        {activeTab === "Execute Command" && (
          <section className="panel">
            <h2>Remote Command Execution</h2>
            <p className="muted">Run allowlisted commands securely over SSH.</p>

            <form onSubmit={handleExecuteCommand}>
              <label>Select Target Node:</label>
              <select
                value={execNodeId}
                onChange={(e) => setExecNodeId(e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">-- Choose Node --</option>
                {nodes.map((n) => (
                  <option key={n._id} value={n._id}>
                    {n.hostname} ({n.ip_address || n.ip})
                  </option>
                ))}
              </select>

              <label>Select Allowlisted Command:</label>
              <select
                value={selectedCommand}
                onChange={(e) => setSelectedCommand(e.target.value)}
                style={inputStyle}
              >
                <option value="uptime">uptime</option>
                <option value="df -h">df -h</option>
                <option value="free -m">free -m</option>
              </select>

              <button type="submit" disabled={execLoading} style={buttonStyle}>
                {execLoading ? "Executing..." : "Run Command"}
              </button>
            </form>

            {execResult && (
              <div style={{
                marginTop: "20px",
                background: "#f1f5f9",
                color: "#1e293b",
                padding: "12px",
                borderRadius: "8px",
                overflowX: "auto",
                maxWidth: "100%",
                boxSizing: "border-box"
              }}>
                <h4>Execution Result:</h4>
                <p>Status: <strong>{execResult.status}</strong></p>
                <pre style={{
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  color: "#1e293b",
                  margin: 0
                }}>{execResult.output || execResult.result}</pre>
              </div>
            )}
          </section>
        )}

        {activeTab === "Command History" && (
          <section className="panel">
            <h2>Command History</h2>
            {nodes.length > 0 && (
              <div style={{ margin: "16px 0" }}>
                <label>Select Node:</label>
                <select
                  value={selectedNodeId}
                  onChange={(e) => fetchCommandHistory(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Choose a node</option>
                  {nodes.map((node) => (
                    <option key={node._id} value={node._id}>
                      {node.hostname}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {historyLoading && <p>Loading command history...</p>}

            {selectedNodeId && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>COMMAND</th>
                      <th>STATUS</th>
                      <th>OUTPUT</th>
                      <th>EXECUTED AT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commandLogs.map((log) => (
                      <tr key={log._id}>
                        <td>{log.command}</td>
                        <td>{log.status}</td>
                        <td>{log.output || "—"}</td>
                        <td>{log.executedAt ? new Date(log.executedAt).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "Monitoring" && (
          <section className="panel" >
            <h2>System Monitoring</h2>
            <button onClick={fetchMetrics} disabled={metricsLoading} style={buttonStyle} >
              {metricsLoading ? "Loading metrics..." : "Refresh Metrics"}
            </button>
            <button
              onClick={() => window.open("http://localhost:3000", "_blank", "noopener,noreferrer") }
              style={{ ...buttonStyle, marginLeft: "10px", marginBottom:"24px"}}
            >
              Open Grafana Dashboard
            </button>

            <div className="cards" style={{ marginTop: "24px" }}>
              {metricsByNode.length === 0 && !metricsLoading && (
                <p>No node metrics available. Click Refresh Metrics.</p>
              )}

              {metricsByNode.map((node) => {
                const getValue = (data) => {
                  const rawValue = data?.[0]?.value?.[1];

                  if (rawValue === undefined || rawValue === null) {
                    return null;
                  }

                  const parsed = Number(rawValue);
                  return Number.isFinite(parsed) ? parsed : null;
                };

                return (
                  <div className="card" key={node.instance}>
                    <h3>Linux Node: {node.instance}</h3>

                    <p>CPU Usage</p>
                    <h2>
                      {getValue(node.cpu) !== null
                        ? `${getValue(node.cpu).toFixed(2)}%`
                        : "--"}
                    </h2>

                    <p>Memory Usage</p>
                    <h2>
                      {getValue(node.memory) !== null
                        ? `${getValue(node.memory).toFixed(2)}%`
                        : "--"}
                    </h2>

                    <p>Disk Usage</p>
                    <h2>
                      {getValue(node.disk) !== null
                        ? `${getValue(node.disk).toFixed(2)}%`
                        : "--"}
                    </h2>
                  </div>
                );
              })}
            </div>





          </section>
        )}

        <footer>
          Linux Fleet Manager · Secure infrastructure monitoring
        </footer>
      </main>
    </div>
  );
}

const inputStyle = {
  display: "block",
  boxSizing: "border-box",
  width: "100%",
  padding: "12px",
  margin: "10px 0 18px",
  border: "1px solid #cbd5e4",
  borderRadius: "8px",
  background: "#f8faff",
  color: "#243650",
};

const buttonStyle = {
  padding: "11px 18px",
  border: "none",
  borderRadius: "8px",
  background: "#2867ce",
  color: "white",
  cursor: "pointer",
};

export default App;