import os
import cv2
import glob
import argparse


def compile(dirname, base_dir=None, fps=30, video_duration=None, delete_imgs=False):
    current_dir = os.path.dirname(os.path.abspath(__file__)) if base_dir is None else base_dir
    output_dir = os.path.join(current_dir, dirname)
    if not os.path.exists(output_dir):
        print(f"\033[31mFatal error: directory {dirname} [FULL PATH: {output_dir}] does not exist.\033[0m")

    output_path = os.path.join(output_dir, f"{dirname}.mp4")

    png_paths = glob.glob(os.path.join(output_dir, "*.png"))

    if not png_paths:
        print("No PNG files found.")
        return

    png_paths.sort(key=lambda p: int(os.path.splitext(os.path.basename(p))[0]))

    if video_duration is not None:
        fps=len(png_paths)/(video_duration*60)

    first_frame = cv2.imread(png_paths[0])
    if first_frame is None:
        print(f"\033[31mFatal error: could not read {png_paths[0]}.\033[0m")
        return
    else:
        height, width, _ = first_frame.shape

    fourcc = cv2.VideoWriter.fourcc(*'avc1')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    for path in png_paths:
        frame = cv2.imread(path)
        if frame is None:
            print(f"Warning: could not read {path}.")
            continue
        out.write(frame)

    out.release()
    print(f"\033[32mVideo successfully saved to {output_path}.\033[0m")

    if delete_imgs:
        for path in png_paths:
            os.remove(path)
        print("Deleted source PNGs.")

def main():
    parser = argparse.ArgumentParser(description="Compile PNG images into a video.")
    parser.add_argument('--dirname', type=str, required=True, help='Directory name containing PNG images')
    parser.add_argument('--fps', type=float, default=None, help='Frames per second for the video')
    parser.add_argument('--video_duration', type=float, default=5, help='Duration of the video in minutes')
    parser.add_argument('--delete_imgs', action='store_true', help='Delete images after compiling video')
    args = parser.parse_args()

    compile(args.dirname, args.fps, args.video_duration, args.delete_imgs)