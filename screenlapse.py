import pyautogui
import time
import os


def run(interval_minutes, runtime_hours=5.0, dirname="output"):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    target_output_dir = os.path.join(current_dir, dirname)
    output_dir = target_output_dir
    version = 1

    while os.path.exists(output_dir):
        output_dir = f"{target_output_dir}{version}"
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
            pyautogui.screenshot(file_name)
            previous_interval = current_interval
            print(f"Successfully wrote screenshot {file_name} to {output_dir}.")

        time.sleep(10)

    print(f"Finished recording timelapse. {previous_interval + 1} screenshots taken.")


def main():
    run(1, dirname="zombs.io")


if __name__ == "__main__":
    main()