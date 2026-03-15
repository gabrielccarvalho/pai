use std::net::TcpStream;
use std::process::{Command, Stdio};
use std::time::Duration;
use tauri::Manager;
use tauri_plugin_deep_link::DeepLinkExt;

/// Poll localhost:3000 until the server accepts TCP connections.
fn wait_for_server(max_tries: u32) -> bool {
    for _ in 0..max_tries {
        if TcpStream::connect("127.0.0.1:3000").is_ok() {
            return true;
        }
        std::thread::sleep(Duration::from_millis(200));
    }
    false
}

/// Parse a .env file and return key=value pairs (skips comments and blanks).
fn parse_dotenv(content: &str) -> Vec<(String, String)> {
    content
        .lines()
        .filter_map(|line| {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                return None;
            }
            let (key, val) = line.split_once('=')?;
            let val = val.trim().trim_matches('"').trim_matches('\'');
            Some((key.trim().to_string(), val.to_string()))
        })
        .collect()
}

/// Resolve the node binary to use.
/// Reads the path embedded at build time; falls back to common locations.
fn resolve_node_bin(server_dir: &std::path::Path) -> String {
    // Try the path captured at build time first
    let embedded = server_dir.join(".node-path");
    if embedded.exists() {
        if let Ok(path) = std::fs::read_to_string(&embedded) {
            let path = path.trim().to_string();
            if std::path::Path::new(&path).exists() {
                return path;
            }
        }
    }
    // Fall back to common macOS locations (Homebrew, nvm, volta, system)
    let candidates = [
        "/opt/homebrew/bin/node",
        "/usr/local/bin/node",
        "/usr/bin/node",
        "node",
    ];
    for candidate in candidates {
        if std::path::Path::new(candidate).exists() {
            return candidate.to_string();
        }
    }
    "node".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            // ── Deep-link handler (OAuth callback) ─────────────────────────
            let dl_handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                for url in event.urls() {
                    if url.scheme() == "pai" {
                        if let Some(query) = url.query() {
                            let callback = format!(
                                "http://localhost:3000/api/auth/desktop-callback?{}",
                                query
                            );
                            if let Some(window) = dl_handle.get_webview_window("main") {
                                let _ = window.eval(&format!(
                                    "window.location.href = '{}'",
                                    callback
                                ));
                            }
                        }
                    }
                }
            });

            // ── Production: spawn the bundled Next.js server ────────────────
            #[cfg(not(debug_assertions))]
            {
                let server_handle = app.handle().clone();
                std::thread::spawn(move || {
                    let resource_dir = server_handle
                        .path()
                        .resource_dir()
                        .expect("failed to resolve resource dir");

                    let server_dir = resource_dir.join("server");
                    let server_js = server_dir.join("server.js");
                    let env_file = server_dir.join(".env");

                    let node_bin = resolve_node_bin(&server_dir);

                    // Extend PATH so any child processes node spawns can also
                    // find binaries (e.g. prisma query engine wrappers)
                    let existing_path = std::env::var("PATH").unwrap_or_default();
                    let extended_path = format!(
                        "/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:{}",
                        existing_path
                    );

                    let mut cmd = Command::new(&node_bin);
                    cmd.arg(&server_js);
                    cmd.env("PORT", "3000");
                    cmd.env("HOSTNAME", "127.0.0.1");
                    cmd.env("NODE_ENV", "production");
                    cmd.env("PATH", &extended_path);
                    // Pipe output so it doesn't interfere with the app
                    cmd.stdout(Stdio::null());
                    cmd.stderr(Stdio::null());

                    // Load bundled .env if present
                    if env_file.exists() {
                        if let Ok(content) = std::fs::read_to_string(&env_file) {
                            for (key, val) in parse_dotenv(&content) {
                                cmd.env(key, val);
                            }
                        }
                    }

                    match cmd.spawn() {
                        Ok(_) => {}
                        Err(e) => {
                            eprintln!("[pai] failed to spawn server ({node_bin}): {e}");
                            return;
                        }
                    }

                    // Wait up to 60 s for the server to be ready (cold start can be slow)
                    if wait_for_server(300) {
                        if let Some(window) = server_handle.get_webview_window("main") {
                            let _ =
                                window.eval("window.location.replace('http://localhost:3000')");
                        }
                    } else {
                        eprintln!("[pai] server did not become ready within 60s");
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
