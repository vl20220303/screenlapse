"use strict";

import { navigate, loadPath } from './app.js';

window.addEventListener('pywebviewready', async () => {
    const needsSetup = await window.pywebview.api.setup_required();
    if(needsSetup){
        navigate("setup", null);
    } else{
        navigate("home", null);
    }
})