"use strict";

import { navigate, loadPath } from './app.js';

if(console.error("Implement check on previous init.")==null){
    navigate("setup", null);
} else{
    navigate("home", null);
}
const closeButton = document.getElementById("close");
const maximizeButton = document.getElementById("maximize");
const minimizeButton = document.getElementById("minimize");

closeButton.onclick = function() {
    console.error("Implement window close.");
}

maximizeButton.onclick = function() {
    this.textContent = this.textContent=='🗖' ? '🗗' : '🗖';
    console.error("Implement window maximize / change size.");
}

minimizeButton.onclick = function() {
    console.error("Implement window minimize.");
}