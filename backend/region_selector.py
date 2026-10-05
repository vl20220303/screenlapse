from ctypes import wintypes
import ctypes
from backend import screenlapse


def get_screen_layout():
    class LUID(ctypes.Structure):
        _fields_ = [("LowPart", wintypes.DWORD), ("HighPart", wintypes.LONG)]

    class DISPLAYCONFIG_RATIONAL(ctypes.Structure):
        _fields_ = [("Numerator", wintypes.UINT), ("Denominator", wintypes.UINT)]

    class DISPLAYCONFIG_2DREGION(ctypes.Structure):
        _fields_ = [("cx", wintypes.LONG), ("cy", wintypes.LONG)]

    class DISPLAYCONFIG_VIDEO_SIGNAL_INFO(ctypes.Structure):
        _fields_ = [
            ("pixelRate", ctypes.c_ulonglong),
            ("hSyncFreq", DISPLAYCONFIG_RATIONAL),
            ("vSyncFreq", DISPLAYCONFIG_RATIONAL),
            ("activeSize", DISPLAYCONFIG_2DREGION),
            ("totalSize", DISPLAYCONFIG_2DREGION),
            ("videoStandard", wintypes.UINT),
            ("scanLineOrdering", wintypes.UINT),
        ]

    class DISPLAYCONFIG_TARGET_MODE(ctypes.Structure):
        _fields_ = [("targetVideoSignalInfo", DISPLAYCONFIG_VIDEO_SIGNAL_INFO)]

    class POINTL(ctypes.Structure):
        _fields_ = [("x", wintypes.LONG), ("y", wintypes.LONG)]

    class DISPLAYCONFIG_SOURCE_MODE(ctypes.Structure):
        _fields_ = [
            ("width", wintypes.UINT),
            ("height", wintypes.UINT),
            ("pixelFormat", wintypes.UINT),
            ("position", POINTL),
        ]

    class DISPLAYCONFIG_DESKTOP_IMAGE_INFO(ctypes.Structure):
        _fields_ = [
            ("PathSourceSize", POINTL),
            ("DesktopImageRegion", wintypes.RECT),
            ("DesktopImageClip", wintypes.RECT),
        ]

    class DISPLAYCONFIG_MODE_UNION(ctypes.Union):
        _fields_ = [
            ("targetMode", DISPLAYCONFIG_TARGET_MODE),
            ("sourceMode", DISPLAYCONFIG_SOURCE_MODE),
            ("desktopImageInfo", DISPLAYCONFIG_DESKTOP_IMAGE_INFO),
        ]

    class DISPLAYCONFIG_MODE_INFO(ctypes.Structure):
        _fields_ = [
            ("infoType", wintypes.UINT),
            ("id", wintypes.UINT),
            ("adapterId", LUID),
            ("modeInfo", DISPLAYCONFIG_MODE_UNION),
        ]

    class DISPLAYCONFIG_PATH_SOURCE_INFO(ctypes.Structure):
        _fields_ = [
            ("adapterId", LUID),
            ("id", wintypes.UINT),
            ("modeInfoIdx", wintypes.UINT),
            ("statusFlags", wintypes.UINT),
        ]

    class DISPLAYCONFIG_PATH_TARGET_INFO(ctypes.Structure):
        _fields_ = [
            ("adapterId", LUID),
            ("id", wintypes.UINT),
            ("modeInfoIdx", wintypes.UINT),
            ("outputTechnology", wintypes.UINT),
            ("rotation", wintypes.UINT),
            ("scaling", wintypes.UINT),
            ("refreshRate", DISPLAYCONFIG_RATIONAL),
            ("scanLineOrdering", wintypes.UINT),
            ("targetAvailable", wintypes.BOOL),
            ("statusFlags", wintypes.UINT),
        ]

    class DISPLAYCONFIG_PATH_INFO(ctypes.Structure):
        _fields_ = [
            ("sourceInfo", DISPLAYCONFIG_PATH_SOURCE_INFO),
            ("targetInfo", DISPLAYCONFIG_PATH_TARGET_INFO),
            ("flags", wintypes.UINT),
        ]

    with screenlapse.per_monitor_dpi_awareness():
        user32 = ctypes.windll.user32
        virtual_left = user32.GetSystemMetrics(76)
        virtual_top = user32.GetSystemMetrics(77)
        virtual_width = user32.GetSystemMetrics(78)
        virtual_height = user32.GetSystemMetrics(79)
        primary_width = user32.GetSystemMetrics(0)
        primary_height = user32.GetSystemMetrics(1)
        if min(virtual_width, virtual_height, primary_width, primary_height) <= 0:
            raise RuntimeError("Could not determine the virtual desktop dimensions.")

        get_buffer_sizes = user32.GetDisplayConfigBufferSizes
        get_buffer_sizes.argtypes = (wintypes.UINT, ctypes.POINTER(wintypes.UINT), ctypes.POINTER(wintypes.UINT),)
        get_buffer_sizes.restype = wintypes.LONG
        query_display_config = user32.QueryDisplayConfig
        query_display_config.argtypes = (
            wintypes.UINT,
            ctypes.POINTER(wintypes.UINT),
            ctypes.POINTER(DISPLAYCONFIG_PATH_INFO),
            ctypes.POINTER(wintypes.UINT),
            ctypes.POINTER(DISPLAYCONFIG_MODE_INFO),
            ctypes.c_void_p,
        )
        query_display_config.restype = wintypes.LONG

        path_count = wintypes.UINT()
        mode_count = wintypes.UINT()
        status = get_buffer_sizes(2, ctypes.byref(path_count), ctypes.byref(mode_count))
        if status != 0:
            raise ctypes.WinError(status)
        paths = (DISPLAYCONFIG_PATH_INFO * path_count.value)()
        modes = (DISPLAYCONFIG_MODE_INFO * mode_count.value)()
        status = query_display_config(
            2,
            ctypes.byref(path_count),
            paths,
            ctypes.byref(mode_count),
            modes,
            None,
        )
        if status != 0:
            raise ctypes.WinError(status)

        preferred_region = [
            -virtual_left,
            -virtual_top,
            primary_width,
            primary_height,
        ]
        preferred_is_internal = False
        internal_technologies = {6, 11, 13, 0x80000000}
        for path in paths[:path_count.value]:
            source_index = path.sourceInfo.modeInfoIdx
            if path.targetInfo.outputTechnology not in internal_technologies:
                continue
            if source_index >= mode_count.value or modes[source_index].infoType != 1:
                continue
            source = modes[source_index].modeInfo.sourceMode
            preferred_region = [
                source.position.x - virtual_left,
                source.position.y - virtual_top,
                source.width,
                source.height,
            ]
            preferred_is_internal = True
            if source.position.x == 0 and source.position.y == 0:
                break

        return {
            "virtualSize": [virtual_width, virtual_height],
            "preferredRegion": preferred_region,
            "preferredIsInternal": preferred_is_internal,
        }

def choose_screen_region():
    import tkinter as tk

    with screenlapse.per_monitor_dpi_awareness():
        user32 = ctypes.windll.user32
        virtual_left = user32.GetSystemMetrics(76)
        virtual_top = user32.GetSystemMetrics(77)
        virtual_width = user32.GetSystemMetrics(78)
        virtual_height = user32.GetSystemMetrics(79)
        if virtual_width <= 0 or virtual_height <= 0:
            raise RuntimeError("Could not determine the virtual desktop dimensions.")

        result = []
        root = tk.Tk()
        root.overrideredirect(True)
        root.attributes("-topmost", True)
        root.attributes("-alpha", 0.35)
        root.configure(background="#000000")
        root.geometry(f"{virtual_width}x{virtual_height}+0+0")
        root.update_idletasks()
        set_window_pos = user32.SetWindowPos
        set_window_pos.argtypes = (
            wintypes.HWND,
            wintypes.HWND,
            ctypes.c_int,
            ctypes.c_int,
            ctypes.c_int,
            ctypes.c_int,
            wintypes.UINT,
        )
        set_window_pos.restype = wintypes.BOOL
        get_ancestor = user32.GetAncestor
        get_ancestor.argtypes = (wintypes.HWND, wintypes.UINT)
        get_ancestor.restype = wintypes.HWND
        overlay_window = get_ancestor(root.winfo_id(), 2)
        if not overlay_window or not set_window_pos(
            overlay_window,
            wintypes.HWND(-1),
            virtual_left,
            virtual_top,
            virtual_width,
            virtual_height,
            0x0040 | 0x0010,
        ):
            root.destroy()
            raise ctypes.WinError()

        canvas = tk.Canvas(root, background="#000000", highlightthickness=0, cursor="crosshair")
        canvas.pack(fill="both", expand=True)
        canvas.create_text(
            virtual_width // 2,
            32,
            text="Drag to select a screen region",
            fill="white",
            font=("Segoe UI", 16),
        )
        selection = {"start": None, "rectangle": None}

        def pointer_down(event):
            selection["start"] = (event.x, event.y)
            if selection["rectangle"] is not None:
                canvas.delete(selection["rectangle"])
            selection["rectangle"] = canvas.create_rectangle(
                event.x, event.y, event.x, event.y,
                outline="white",
                width=2,
                fill="#ffffff",
                stipple="gray50",
            )

        def pointer_move(event):
            if selection["start"] is None:
                return
            start_x, start_y = selection["start"]
            canvas.coords(selection["rectangle"], start_x, start_y, event.x, event.y)

        def pointer_up(event):
            if selection["start"] is None:
                return
            start_x, start_y = selection["start"]
            left = min(start_x, event.x)
            top = min(start_y, event.y)
            width = abs(event.x - start_x)
            height = abs(event.y - start_y)
            if width > 0 and height > 0:
                result.extend((left, top, width, height))
            root.destroy()

        canvas.bind("<ButtonPress-1>", pointer_down)
        canvas.bind("<B1-Motion>", pointer_move)
        canvas.bind("<ButtonRelease-1>", pointer_up)
        root.focus_force()
        root.mainloop()
        return result or None