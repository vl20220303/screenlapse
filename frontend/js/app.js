"use strict";

import { setCurPage } from "./utils.js";

const routes = {
    setup: () => {loadPageWithTransition("setup"); loadPath("setup", "setup")},
    home: () => {loadPageWithTransition("home"); loadPath("home", "home")},
    jobs: () => {loadPageWithTransition("jobs"); loadPath("jobs", "jobs")},
    session: (sessionName) => {loadPageWithTransition("session", sessionName ); loadPath(sessionName)},
    gallery: (sessionName) => {loadPageWithTransition("gallery", sessionName); loadPath(sessionName)},
    video: (sessionName) => {loadPageWithTransition("video", sessionName); loadPath(sessionName)}
};

export async function loadPageWithTransition(name, params = {}) {
    if(!document.startViewTransition){ loadPage(name, params); return; }
    else{ document.startViewTransition(() => loadPage(name, params)); }
}

async function loadPage(name, params={}) {
    const html = await fetch(`pages/${name}.html`).then(r => r.text());
    document.getElementById("app").innerHTML = html;

    import(`./pages/${name}.js`).then(module => {
        module.init(params);
    });

    setCurPage(name);
}

export async function loadPath(name, type='directory') {
    let fullPath = "none";

    if(type==="setup"){
        name="setup";
        fullPath = await window.pywebview.api.get_exec_dir();
    } else if(type==="home"){
        fullPath = await window.pywebview.api.get_recordings_dir();
        name = fullPath.substring(fullPath.lastIndexOf('/')+1);
    } else if(type=="jobs"){
        name="jobs"
        fullPath = await window.pywebview.api.get_recordings_dir();
    } else{
        fullPath = await window.pywebview.api.get_recordings_dir(); + name;
    }

    if(name.length > 14){
        document.getElementById("dir-name").setAttribute("title", name);
        document.getElementById("dir-name").textContent = name.substring(0, 11) + "...";
    } else{
        document.getElementById("dir-name").textContent = name;
    }
    
    document.getElementById("full-path").textContent = fullPath;
    document.getElementById("full-path").setAttribute("title", fullPath);
}

export function navigate(route, params) {
    routes[route](params);
}