"use strict";

import { navigate } from "../app.js";
import { getCurPage } from "../utils.js";

export async function init(sessionName){
    const controlContainer = document.getElementById("control-container");
    controlContainer.textContent = '←';
    function goBack() {
        cleanupAndNavigate("session", sessionName);
    }
    controlContainer.addEventListener('click', goBack, {once: true});

    const videoDisplay = document.getElementById("video-display");
    videoDisplay.src = await window.pywebview.api.get_video(sessionName);
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

    document.getElementById('delete-button').addEventListener('click', function() {
        const deleteDialog = document.getElementById("delete-dialog");
        deleteDialog.showModal();
        document.getElementById("delete-confirm").addEventListener('click', () => {
            window.pywebview.api.delete_video(sessionName);
            cleanupAndNavigate("session", sessionName);
        })
        document.getElementById("delete-cancel").addEventListener('click', () => {
            deleteDialog.close();
        })
    });

    function cleanupAndNavigate(route, params){
        controlContainer.removeEventListener('click', goBack);
        navigate(route, params);
    }
}