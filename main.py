import webview
import os, send2trash
import datetime
import json
from pathlib import Path
from flask import Flask, send_from_directory, abort
from waitress import serve
import threading
import socket

from backend import screenlapse
from backend import compiler

class API:
    def __init__(self):
        self._settings_path = Path.cwd() / ".screenlapse-settings.json"
        self.inited, self.settings = self.load_settings()
        self.active_recordings = []

    # init
    def setup_required(self):
        return not self.inited

    def get_exec_dir(self):
        return str(Path.cwd())
        
    def get_recordings_dir(self):
        return self.settings.get("recordings_dir", None)
    
    def get_theme(self):
        return self.settings.get("theme", None)

    # settings
    def load_settings(self):
        if self._settings_path.exists():
            return (True, json.loads(self._settings_path.read_text()))
        return (False, {})

    def save_settings(self):
        self._settings_path.write_text(json.dumps(self.settings, indent=2))

    def save_recordings_dir(self, path):
        self.settings["recordings_dir"] = path
        self.save_settings()
        return True
    
    def save_preferred_theme(self, theme):
        self.settings["theme"] = theme
        self.save_settings()
        return True

    # native folder selection
    def choose_directory(self):
        result = webview.windows[0].create_file_dialog(webview.FileDialog.FOLDER)
        if result:
            return result[0]
        return None

    # session data
    def get_sessions(self):
        base = self.settings.get("recordings_dir")
        if not base:
            return []

        base = Path(base)
        sessions = []
        for folder in base.iterdir():
            if folder.is_dir():
                sessions.append({
                    "sessionName": folder.name,
                    "sessionDate": datetime.datetime.fromtimestamp(os.path.getmtime(folder)).strftime("%m/%d/%Y"),
                    "sessionImg": self.get_media_url(folder.name, "0.png")
                })
        return sessions

    def get_images(self, session_name):
        base = Path(self.settings["recordings_dir"]) / session_name
        images = sorted(base.glob("*.png"))
        return [self.get_media_url(session_name, img.name) for img in images]
    
    def get_thumbnail(self, session_name):
        base = Path(self.settings["recordings_dir"]) / session_name
        thumbnail = next(base.glob("*.png"), None)
        return self.get_media_url(session_name, thumbnail.name) if thumbnail else None

    def get_video(self, session_name):
        base = Path(self.settings["recordings_dir"]) / session_name
        mp4 = next(base.glob("*.mp4"), None)
        return self.get_media_url(session_name, mp4.name) if mp4 else None

    def get_media_url(self, session_name, filename):
        return f"/media/{session_name}/{filename}"

    # checks
    def get_num_images(self, session_name):
        base = Path(self.settings["recordings_dir"]) / session_name
        images = base.glob("*.png")
        return len(list(images))

    def video_already_compiled(self, session_name):
        base = Path(self.settings["recordings_dir"]) / session_name
        return next(base.glob("*.mp4"), None) is not None
    
    def recording_active(self, session_name):
        return session_name in self.active_recordings
    
    # actions
    def start_recording(self, interval, duration, name, region, compression, compile):
        if interval is not None: interval = float(interval)
        else: return
        if duration is not None: duration = float(duration)
        else: return
        if region is not None: region = tuple(region)
        if compression is not None: compression = float(compression)

        def recorderFunction():
            self.active_recordings.append(name)
            screenlapse.run(
                interval_minutes=interval, 
                base_dir=self.get_recordings_dir(), 
                runtime_hours=duration, 
                dirname=name, 
                screen_region=region, 
                compression_scale=compression, 
                compile_on_completion=compile
            )
            self.active_recordings.remove(name)
            
        recorderThread = threading.Thread(
            target = recorderFunction, daemon=True
        )
        recorderThread.start()
        return True
    
    def start_compiling(self, session_name, fps, duration, delete_gallery):
        if fps is not None: fps = float(fps)
        else: return
        if duration is not None: duration = float(duration)
        else: return
        compilerThread = threading.Thread(
            target =
            compiler.compile(
                dirname=session_name, 
                base_dir=self.get_recordings_dir(),
                fps=fps, video_duration=duration,
                delete_imgs=delete_gallery
            ), daemon = True
        )
        compilerThread.start()
        return True

    
    def delete_session(self, session_name):
        folder = Path(self.settings["recordings_dir"]) / session_name
        try:
            send2trash.send2trash(folder); return True
        except:
            return False

    def delete_gallery(self, session_name):
        base = Path(self.settings["recordings_dir"]) / session_name
        for image in base.glob("*.png"):
            send2trash.send2trash(image)
    
    def delete_video(self, session_name):
        base = Path(self.settings["recordings_dir"]) / session_name
        video = next(base.glob("*.mp4"), None)
        if video is not None:
            send2trash.send2trash(video)


def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def start():

    api = API()
    app = Flask(__name__)

    port = get_free_port()
    url = f"http://127.0.0.1:{port}/"

    @app.route('/media/<session>/<filename>')
    def serve_media(session, filename):
        recordings_dir = api.get_recordings_dir()
        if not recordings_dir:
            abort(404)
        session_path = Path(recordings_dir) / session
        if not session_path.exists():
            abort(404)
        return send_from_directory(session_path, filename)

    @app.route('/')
    def index():
        frontend_dir = Path(__file__).parent / "frontend"
        return send_from_directory(frontend_dir, "index.html")

    @app.route('/<path:filename>')
    def static_files(filename):
        frontend_dir = Path(__file__).parent / "frontend"
        return send_from_directory(frontend_dir, filename)

    def run_server():
        serve(app, host='127.0.0.1', port=port, threads=2)

    window = webview.create_window(
        title="Screenlapse",
        url=url,
        js_api=api,
        min_size=(750, 350),
        width=830, height=500,
        resizable=True, easy_drag=False
    )

    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    webview.start(gui="gtk", debug=False)

if __name__ == "__main__":
    start()