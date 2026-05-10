import os, send2trash
from PIL import Image
import glob
import argparse
import subprocess
import sys


def resource_path(relative):
    base = getattr(sys, '_MEIPASS', os.path.abspath("."))
    return os.path.join(base, relative)


def compile(dirname, base_dir=None, fps: float = 30, video_duration=None, delete_imgs=False):
    current_dir = os.path.dirname(os.path.abspath(__file__)) if base_dir is None else base_dir
    output_dir = os.path.join(current_dir, dirname)
    if not os.path.exists(output_dir):
        print(f"\033[31mFatal error: directory {dirname} [FULL PATH: {output_dir}] does not exist.\033[0m")
        return

    output_path = os.path.join(output_dir, f"{dirname}.mp4")

    png_paths = glob.glob(os.path.join(output_dir, "*.png"))

    if not png_paths:
        print("No PNG files found.")
        return

    png_paths.sort(key=lambda p: int(os.path.splitext(os.path.basename(p))[0]))

    if video_duration is not None:
        fps=len(png_paths)/(video_duration*60)

    first_frame = Image.open(png_paths[0])
    if first_frame is None:
        print(f"\033[31mFatal error: could not read {png_paths[0]}.\033[0m")
        return
    else:
        width, height = first_frame.size

    #flags to prevent console window
    startupinfo = None
    creationflags = 0

    # Resolve FFmpeg path (bundled or system)
    if sys.platform == "win32":

        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        creationflags = subprocess.CREATE_NO_WINDOW

        ffmpeg_path = resource_path("ffmpeg/ffmpeg.exe")
    else:
        ffmpeg_path = resource_path("ffmpeg/ffmpeg")

    # FFmpeg command — H.264 (avc1), browser‑compatible
    cmd = [
        ffmpeg_path,
        "-y",
        "-framerate", str(fps),
        "-i", os.path.join(output_dir, "%d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        output_path
    ]

    print("Running FFmpeg:", " ".join(cmd))

    try:
        subprocess.run(
            cmd,
            check=True,
            startupinfo=startupinfo,
            creationflags=creationflags
        )
    except Exception as e:
        print(f"\033[31mFFmpeg failed: {e}\033[0m")
        return

    print(f"\033[32mVideo successfully saved to {output_path}.\033[0m")

    if delete_imgs:
        for path in png_paths[1:]:
            send2trash.send2trash(path)
        print("Deleted source PNGs.")

def main():
    parser = argparse.ArgumentParser(description="Compile PNG images into a video.")
    parser.add_argument('--dirname', type=str, required=True, help='Directory name containing PNG images')
    parser.add_argument('--fps', type=float, default=None, help='Frames per second for the video')
    parser.add_argument('--video_duration', type=float, default=5, help='Duration of the video in minutes')
    parser.add_argument('--delete_imgs', action='store_true', help='Delete images after compiling video')
    args = parser.parse_args()

    compile(args.dirname, fps=args.fps, video_duration=args.video_duration, delete_imgs=args.delete_imgs)