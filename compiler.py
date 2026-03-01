import os
import cv2
import glob


def compile(dirname, fps=None, video_duration=5, delete_imgs=False):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(current_dir, dirname)
    output_path = os.path.join(output_dir, f"{dirname}.mp4")

    png_paths = glob.glob(os.path.join(output_dir, "*.png"))

    if not png_paths:
        print("No PNG files found.")
        return

    png_paths.sort(key=lambda p: int(os.path.splitext(os.path.basename(p))[0]))

    if fps is None:
        fps=len(png_paths)/(video_duration*60)

    first_frame = cv2.imread(png_paths[0])
    if first_frame is None:
        print(f"Fatal error: could not read {png_paths[0]}.")
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
    print(f"Video successfully saved to {output_path}.")

    if delete_imgs:
        for path in png_paths:
            os.remove(path)
        print("Deleted source PNGs.")