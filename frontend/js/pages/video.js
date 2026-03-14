"use strict";

import { navigate } from "../app.js";
import { getCurPage } from "../utils.js";

export function init(sessionName){
    const controlContainer = document.getElementById("control-container");
    controlContainer.textContent = '←';
    controlContainer.addEventListener('click', function() {
        if(getCurPage().substring(0,5)!='video') return;
        navigate("session", sessionName);
    })

    const videoDisplay = document.getElementById("video-display");
    const seekBar = document.getElementById("seek-bar");
    const seekLength = 1000;
    videoDisplay.addEventListener('timeupdate', function() {
        const value = (seekLength/videoDisplay.duration) * videoDisplay.currentTime;
        seekBar.value = value;
        if(value==seekLength){
            playButton.textContent = "▶";
        }
    })
    seekBar.addEventListener("input", function() {
        const time = videoDisplay.duration * (seekBar.value/seekLength);
        videoDisplay.currentTime = time;
    })

    const skipBackButton = document.getElementById("back");
    const playButton = document.getElementById("play");
    const skipForwardButton = document.getElementById("forward");

    skipBackButton.addEventListener('click', () => {videoDisplay.currentTime=Math.max(0, videoDisplay.currentTime-5);});
    skipForwardButton.addEventListener('click', () => {
        videoDisplay.currentTime=Math.min(videoDisplay.duration, videoDisplay.currentTime+5);
        if(videoDisplay.currentTime==videoDisplay.duration) { playButton.textContent = "▶"; }
    });
    playButton.addEventListener('click', function() {
        if(this.textContent=="▶"){
            videoDisplay.play();
            this.textContent = "⏸";
        } else{
            videoDisplay.pause();
            this.textContent = "▶";
        }
    })

    document.getElementById('path-display').addEventListener('click', function() {
        console.error('Implement path renaming.');
    })

    document.getElementById('delete-button').addEventListener('click', function() {
        const deleteDialog = document.getElementById("delete-dialog");
        deleteDialog.showModal();
        document.getElementById("delete-confirm").addEventListener('click', () => {
            console.error('Implement video deletion.');
            navigate("session", sessionName);
        })
        document.getElementById("delete-cancel").addEventListener('click', () => {
            deleteDialog.close();
        })
    });
}