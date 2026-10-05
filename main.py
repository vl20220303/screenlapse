import webview
import os, send2trash
import datetime
import json
from pathlib import Path
from flask import Flask, request, send_file, send_from_directory, abort
from waitress import serve
import threading
import socket
import secrets

from backend import screenlapse
from backend import compiler

from functools import lru_cache, wraps
from PIL import Image, ImageOps
import io, base64

class API:
    def __init__(self):
        self._settings_path = Path.cwd() / ".screenlapse-settings.json"
        self.inited, self.settings = self.load_settings()
        self.active_recordings = []
        self.active_jobs = {'r':{}, 'c':{}, 'd':{}}
        self.refresh_token = secrets.token_hex(16); self.refresh_token_reads = 0
        self.access_token = secrets.token_hex(16); self.access_token_creation = datetime.datetime.now()

    # init
    def setup_required(self):
        return not self.inited

    def get_exec_dir(self):
        return str(Path.cwd())
        
    def get_recordings_dir(self):
        return self.settings.get("recordings_dir", "")
    
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
        get_thumbnail.cache_clear()
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
        images = sorted(base.glob("*.png"), key=int_keyed_file)
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
    
    def get_active_recordings(self):
        return list(self.active_jobs['r'].values())
    def get_active_compilations(self):
        return list(self.active_jobs['c'].values())
    def get_active_deletions(self):
        return list(self.active_jobs['d'].values())

    # checks
    def get_num_images(self, session_name):
        base = Path(self.settings["recordings_dir"]) / session_name
        return sum(1 for _ in base.glob("*.png"))

    def video_already_compiled(self, session_name):
        base = Path(self.settings["recordings_dir"]) / session_name
        return next(base.glob("*.mp4"), None) is not None
    
    def recording_active(self, session_name):
        return session_name in self.active_recordings
    
    # actions
    def start_recording(self, interval, duration, name, region, compression, compile, access_token):
        if access_token != self.access_token: return
        
        if interval is not None: interval = float(interval)
        else: return
        if duration is not None: duration = float(duration)
        else: return
        if region is not None: region = tuple(region)
        if compression is not None: compression = float(compression)

        def recorderFunction():
            new_name = str(name)
            proposed_dir = Path(self.get_recordings_dir()) / new_name
            version = 1
            while proposed_dir.exists():
                new_name = f'{str(name)}({version})'
                proposed_dir = Path(self.get_recordings_dir()) / f"{name}({version})"
                version += 1

            self.active_recordings.append(new_name)
            self.active_jobs['r'][name] = f"Writing screenshots to {new_name} every {interval} minutes for {duration} hours (Started {datetime.datetime.now().strftime("%B %d, %Y, %I:%M:%S %p")})"
            screenlapse.run(
                interval_minutes=interval, 
                base_dir=self.get_recordings_dir(), 
                runtime_hours=duration, 
                dirname=new_name, 
                screen_region=region, 
                compression_scale=compression
            )
            self.active_jobs['r'].pop(name, None)
            self.active_recordings.remove(new_name)

            if(compile):
                self.start_compiling(new_name, 20, 1, False, self.get_access_token(self.refresh_token))
            
        recorderThread = threading.Thread(target = recorderFunction, daemon=True)
        recorderThread.start()
        return True
    
    def start_compiling(self, session_name, fps, duration, delete_gallery, access_token):
        if access_token != self.access_token: return
        
        if fps is not None: fps = float(fps)
        else: return
        def compilerFunction():
            self.active_jobs['c'][session_name] = f"Compiling video for {session_name} (Started {datetime.datetime.now().strftime("%B %d, %Y, %I:%M:%S %p")})"
            if(delete_gallery):
                self.active_jobs['d'][session_name] = f"Deleting gallery of {session_name} (Started {datetime.datetime.now().strftime("%B %d, %Y, %I:%M:%S %p")})"
            compiler.compile(
                dirname=session_name,
                base_dir=self.get_recordings_dir(),
                fps=fps,
                delete_imgs=delete_gallery
            )
            self.active_jobs['c'].pop(session_name, None)
            self.active_jobs['d'].pop(session_name, None)
        compilerThread = threading.Thread(target = compilerFunction, daemon = True)
        compilerThread.start()
        return True

    
    def delete_session(self, session_name, access_token):
        if access_token != self.access_token: return False
        
        folder = Path(self.settings["recordings_dir"]) / session_name
        try:
            send2trash.send2trash(folder); return True
        except:
            return False

    def delete_gallery(self, session_name, access_token):
        if access_token != self.access_token: return
        
        base = Path(self.settings["recordings_dir"]) / session_name
        self.active_jobs['d'][session_name] = f"Deleting gallery of {session_name} (Started {datetime.datetime.now().strftime("%B %d, %Y, %I:%M:%S %p")})"
        for idx, image in enumerate(base.glob("*.png")):
            if(idx==0): continue
            send2trash.send2trash(image)
        self.active_jobs['d'].pop(session_name, None)
    
    def delete_video(self, session_name, access_token):
        if access_token != self.access_token: return
        
        base = Path(self.settings["recordings_dir"]) / session_name
        video = next(base.glob("*.mp4"), None)
        if video is not None:
            send2trash.send2trash(video)

    # auth
    def get_refresh_token(self):
        self.refresh_token_reads+=1
        return self.refresh_token if self.refresh_token_reads == 1 else None
    
    def get_access_token(self, refresh_token):
        if datetime.datetime.now() - self.access_token_creation > datetime.timedelta(minutes=5):
            self.access_token = secrets.token_hex(16)
            self.access_token_creation = datetime.datetime.now()
        return self.access_token if refresh_token == self.refresh_token else None

# utils

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]
    
def int_keyed_file(filename):
    basename = os.path.basename(filename)
    basename = basename[:-4]
    return int(basename)

def get_cached_thumbnail(recordings_dir, session, filename, size=(100, 100)):
    try:
        return get_thumbnail(recordings_dir, session, filename, size=size)
    except Exception:
        return None

@lru_cache(maxsize=100)
def get_thumbnail(recordings_dir, session, filename, size=(100, 100)):
    file_path = resolve_recording_file(recordings_dir, session, Path(recordings_dir) / session / filename)

    with Image.open(file_path) as img:
        img = ImageOps.fit(img, size, Image.Resampling.BICUBIC)
        buffer = io.BytesIO()
        img.save(buffer, format="WEBP", quality=90)
        return buffer.getvalue()

def resolve_recording_file(recordings_dir, session, filename):
    try:
        root = Path(recordings_dir).resolve(strict=True)
        candidate = (root / session / filename).resolve(strict=True)
        candidate.relative_to(root)
    except (OSError, RuntimeError, ValueError):
        abort(404)

    if not candidate.is_file():
        abort(404)

    return candidate

def start():

    api = API()
    app = Flask(__name__)

    port = get_free_port()
    url = f"http://127.0.0.1:{port}/"

    session_token = secrets.token_hex(16)

    def require_access_token(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            token = request.cookies.get("LONG_LIVED_TOKEN")
            if token != session_token:
                abort(401)
            return func(*args, **kwargs)
        return wrapper

    @app.route('/media/<session>/<filename>')
    @require_access_token
    def serve_media(session, filename):
        recordings_dir = api.get_recordings_dir()
        if not recordings_dir:
            abort(404)
        session_path = Path(recordings_dir) / session
        if not session_path.exists():
            abort(404)
        filename = resolve_recording_file(recordings_dir, session, filename)
        return send_file(filename, conditional=True)
    
    @app.route('/media/<session>/<filename>/thumbnail')
    @require_access_token
    def serve_thumbnails(session, filename):
        width = min(request.args.get('width', 100, type=int), 300); height = min(request.args.get('height', 100, type=int), 300)
        img_bytes = get_cached_thumbnail(api.get_recordings_dir(), session, filename, size=(width, height))
        if not img_bytes:
            abort(404)
        return send_file(io.BytesIO(img_bytes), mimetype='image/webp')

    @app.route('/')
    def index():
        frontend_dir = Path(__file__).parent / "frontend"
        response = send_from_directory(frontend_dir, "index.html")
        response.set_cookie("LONG_LIVED_TOKEN", session_token, httponly=True)
        return response

    @app.route('/<path:filename>')
    @require_access_token
    def static_files(filename):
        frontend_dir = Path(__file__).parent / "frontend"
        return send_from_directory(frontend_dir, filename)

    def run_server():
        serve(app, host='127.0.0.1', port=port, threads=4)

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