use std::net::TcpStream;
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

            // ── Production: wait for the Docker-hosted web server ───────────
            #[cfg(not(debug_assertions))]
            {
                let server_handle = app.handle().clone();
                std::thread::spawn(move || {
                    // Wait up to 60 s for the Docker server to be ready
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
