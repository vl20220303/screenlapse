# About Screenlapse
Screenlapse is designed to replace Window's built-in screen recorders in a specific use case: when high FPS is not necessary and recordings need to take place over a long time period. <br><br>
It's main function is to take screenshots of your screen at continuous intervals, save them to a recording folder, and stitch the screenshots together after the recording period into a timelapse. <br><br>
It is not a typical screen recorder and is not designed to be used as such, and will probably be less efficient than the standard screen recorder at 30-60FPS.
# Setup
Setup is pretty simple: just download the .zip and extract it to any folder. <br><br>
Then, run screenlapse.exe. <br><br>
This will bring up a one-time setup page where you can select the home directory for recordings and theme (these can both be changed later). <br><br>
Once you're done, click 'Finish Setup'. This will bring you to the home page. <br><br>
# Usage
## Changing your home directory
Clicking on the text box in the top-left corner (that displays the directory path) will bring up a dialog to select a different folder.
## Changing your theme
Clicking on the button in the top-left corner will toggle the theme. <br><br>
The letter of the button also represents the current theme: L means light theme, S means system theme, and D means dark theme.
## Starting a recording
Click the '+' button in the bottom-right corner to start a recording. <br><br>
Specify the time between shots, the recording duration, the compression factor (which should be less than 1; for example, a compression factor of 0.5 results in a image compressed to half the length and width of the screen) and the name. <br><br>
The actual time between shots may differ by about 5% (the app wakes up 20x per interval to check if a screenshot should be taken to save CPU consumption and prevent drift) <br><br>
