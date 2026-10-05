# About Screenlapse
Screenlapse is designed to replace Window's built-in screen recorders when high FPS is not necessary and recordings need to take place over a long time period. <br><br>
Its main function is to take screenshots of the screen at continuous intervals, save them to a recording folder, and stitch the screenshots together after the recording period into a timelapse. It is not a typical screen recorder and is not designed to be used as such, and will probably be less efficient than the standard screen recorder if you try to use it at 30-60FPS. <br><br>
The app also features an image viewer and video player so you can monitor and view your recordings in real-time.
# Setup
Setup is pretty simple: just download the .zip, extract it to a folder, and run screenlapse.exe. <br><br>
This will bring up a one-time setup page where you can select the home directory for recordings and theme (these can both be changed later). <br><br>
Once you're done, click 'Finish Setup'. This will bring you to the home page. <br><br>
# Usage
## Changing your home directory
Clicking on the text box in the top-left corner (that displays the directory path) will bring up a dialog to select a different folder.
## Changing your theme
Clicking on the button in the top-left corner will toggle the theme. <br><br>
The letter of the button represents the current theme: L -> light theme, S -> system theme, D -> dark theme.
## Starting a recording
Click the '+' button in the bottom-right corner to start a recording. <br><br>
Specify the time between shots, the recording duration, the compression factor (which should be less than 1; for example, a compression factor of 0.5 results in a image compressed to half the length and width of the screen) and the name. <br><br>
Click the virtual desktop preview to drag a selection over the actual desktop. The selector spans all connected displays, so a region can include parts of multiple monitors. The dialog previews the selected region against the desktop layout. By default, Screenlapse selects the computer's internal display when one is detected; on a desktop without an internal panel, it uses the Windows primary display. Choose **Use computer display** to restore that default selection. <br><br>
The actual time between shots may differ by about 5% (the app wakes up 20x per interval to check if a screenshot should be taken to conserve CPU usage and prevent drift). <br><br>
You can also make the app compile a timelapse after the recording period; it will use 20FPS by default. <br><br>
**Note:** Closing the app while a job is running will cancel it automatically. Any screenshots taken during that time will be preserved, but the app will not take any more screenshots and will not compile a timelapse even if 'Compile on Completion' was enabled.
## Viewing active jobs
Clicking the button left of the 'Sort by...' drop-down in the home page will take you to the 'active jobs' viewer.
## Viewing your recording data
Click into a recording session to view the contents; you'll be able to see the image gallery and video (if it's been compiled). <br><br>
Clicking the back arrow in the top-right corner in the top-right will take you from the session folder back to the home page.
## Compiling a recording into a timelapse
Click the 'Compile' button within a session to compile that session's screenshots into a timelapse. <br><br>
Enter your preferred FPS or video duration; Screnlapse will automatically calculate the other value for you. <br><br>
You can also delete the image gallery on-completion, although this is not recommended (there is always the risk the video ends up corrupted). The recommended method is to generate the timelapse without deleting the gallery, then manually delete the gallery through the in-app method after verifying the video is satisfactory.
## Deleting data
Click the 'x' button in the bottom-right corner of a page to delete the respective data. <br><br>
