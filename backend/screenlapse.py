import pyautogui
import time
import os
import argparse
try:
    from . import compiler
except ImportError:
    import compiler


def run(interval_minutes, base_dir=None, runtime_hours=5.0, dirname="output", screen_region:tuple[int,int,int,int]|None=None, compression_scale:float=1, compile_on_completion=False):
    compression_scale = min(max(compression_scale, 0), 1)
    
    current_dir = os.path.dirname(os.path.abspath(__file__)) if base_dir is None else base_dir
    target_output_dir = os.path.join(current_dir, dirname)
    output_dir = target_output_dir
    version = 1

    while os.path.exists(output_dir):
        output_dir = f"{target_output_dir}({version})"
        version += 1

    os.mkdir(output_dir)

    print(f"Begin writing screenshots to {output_dir} every {interval_minutes} minutes for {runtime_hours} hours...")

    start_time = time.time()
    current_time = start_time
    previous_interval = -1

    while (current_time - start_time) / 3600 < runtime_hours:
        current_time = time.time()
        current_interval = int((current_time - start_time) / (60 * interval_minutes))

        if current_interval > previous_interval:
            file_name = os.path.join(output_dir, f"{current_interval}.png")
            image = pyautogui.screenshot(file_name, region=screen_region)
            width, height = image.size
            print(width, height)
            image = image.resize((int(width * compression_scale), int(height * compression_scale)))
            image.save(file_name)
            previous_interval = current_interval
            print(f"Successfully wrote screenshot {file_name} to {output_dir}.")

        time.sleep(interval_minutes * 3)

    print(f"\033[32mFinished recording timelapse. {previous_interval + 1} screenshots taken.\033[0m")

    if compile_on_completion:
        compiler.compile(os.path.dirname(output_dir), base_dir=base_dir)


def main():
    parser = argparse.ArgumentParser(description="Screenlapse: Take screenshots at intervals.")
    parser.add_argument('--dirname', type=str, default="output", help='Directory name to save screenshots')
    parser.add_argument('--interval_minutes', type=float, default=1, help='Interval between screenshots in minutes')
    parser.add_argument('--runtime_hours', type=float, default=5.0, help='Total runtime in hours')
    parser.add_argument('--delete_imgs', action='store_true', help='Delete images after processing (flag only, not used in run)')
    args = parser.parse_args()

    run(interval_minutes=args.interval_minutes, runtime_hours=args.runtime_hours, dirname=args.dirname)


if __name__ == "__main__":
    main()