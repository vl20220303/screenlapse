"use strict";

export function setTheme(theme){
    const root = document.documentElement;
    root.style.setProperty('color-scheme', theme);
}

export function getTheme(){
    const root = document.documentElement;
    return getComputedStyle(root).getPropertyValue('color-scheme');
}

export function getCurPage(){
    const root = document.documentElement;
    return(root.getAttribute('current-page'));
}

export function setCurPage(pageName){
    const root = document.documentElement;
    root.setAttribute('current-page', pageName);
}