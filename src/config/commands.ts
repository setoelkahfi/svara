import {  path as p } from "@tauri-apps/api";
import { openInputModal, openRenameModal } from "../App.svelte";
import { addEditorTab, closeAllTabs } from "../lib/EditorTabList.svelte";
import { saveFile, openFile, openFolderDialog, openInExplorer, renameFile, createFolder, createFile } from "../lib/File";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { info, warn } from "tauri-plugin-log-api";
import { fitTerminal } from "../lib/Terminal.svelte";
import { exit } from "@tauri-apps/plugin-process";
import * as fs from "@tauri-apps/plugin-fs"
const appWindow = getCurrentWebviewWindow()

export const commands = {
    "addEditorTab": {
        "keybind": "Control+N",
        "command": () => {
            addEditorTab();
        }
    },
    "openFile": {
        "keybind": "Control+O",
        "command": async () => {
            await openFile();
        }
    },
    "openFolder": {
        "keybind": "Control+K",
        "command": async () => {
            await openFolderDialog();
        }
    },
    "saveFile": {
        "keybind": "Control+S",
        "command": async () => {
            await saveFile();
        }
    },
    "saveFileAs": {
        "keybind": "Control+Shift+S",
        "command": async () => {
            await saveFile(true);
        }
    },
    "undo": {
        "keybind": "Control+Z",
        "disabled": "true",
        "command": async () => {
            //
        }
    },
    "redo": {
        "keybind": "Control+Shift+Z",
        "disabled": "true",
        "command": async () => {
            //
        }
    },
    "cut": {
        "keybind": "Control+X",
        "disabled": "true",
        "command": async () => {
            //
        }
    },
    "copy": {
        "keybind": "Control+C",
        "disabled": "true",
        "command": async () => {
            //
        }
    },
    "paste": {
        "keybind": "Control+V",
        "disabled": "true",
        "command": async () => {
            //
        }
    },
    "pasteFromHistory": {
        "keybind": "Control+Shift+V",
        "command": () => {
            //
        }
    },
    "delete": {
        "keybind": "Delete",
        "disabled": "true",
        "command": async () => {
            return;
        }
    },
    "find": {
        "keybind": "Control+F",
        "command": () => {
            //
        }
    },
    "replace": {
        "keybind": "Control+H",
        "command": () => {
            //
        }
    },
    "openCommandPallete": {
        "keybind": "Control+Shift+P",
        "command": () => {
            //
        }
    },
    "zoomIn": {
        "keybind": "Control +",
        "command": () => {
            //
        }
    },
    "zoomOut": {
        "keybind": "Control -",
        "command": () => {
            //
        }
    },
    "fullscreen": {
        "keybind": "F11",
        "disabled": "true",
        "command": async () => {
            if (await appWindow.isFullscreen()) {
                appWindow.setFullscreen(false);
            }
            else {
                appWindow.setFullscreen(true);
            }
        }
    },
    "runFile": {
        "keybind": "F5",
        "command": () => {
            //
        }
    },
    "debugFile": {
        "keybind": "Control+F5",
        "command": () => {
            //
        }
    },
    "stopFile": {
        "keybind": "Shift+F5",
        "command": () => {
            //
        }
    },
    "openNewWindow": {
        "keybind": "Control+Shift+N",
        "command": () => {
            //
        }
    },
    "minimizeWindow": {
        "keybind": "",
        "command": () => {
            appWindow.minimize()
        }
    },
    "maximizeWindow": {
        "keybind": "",
        "command": async () => {
            if (await appWindow.isFullscreen()) {
                return;
            }
            if (await appWindow.isMaximized()) {
                appWindow.unmaximize();
            }
            else {
                appWindow.maximize()
            }
            fitTerminal();
        }
    },
    "closeWindow": {
        "keybind": "Alt+F4",
        "command": async () => {
            await exit();
        }
    },
    "closeTab": {
        "keybind": "Control+F4",
        "command": () => {}
    },
    "closeAllTabs": {
        "keybind": "",
        "command": () => {
            closeAllTabs();
        }
    },
    "renameFile": {
        "keybind": "F2",
        "command": async (filename, oldpath) => {
            if (!await fs.exists(oldpath)) {
                warn(`Unable to rename file. ${oldpath} does not exist.`, {file: "commands.ts", line: 193});
                return;
            }
            openRenameModal(`Rename ${filename}`,
                `Give a new name to ${filename}`, 
                [
                    {name: "Rename", action: async (name) => {await renameFile(name, oldpath)}},
                    {name: "Cancel", cancel: true, style: "danger", action: () => {}}
                ],
                oldpath
            )
        }
    },
    "createFolder": {
        "keybind": "",
        "command": (path) => {
            openInputModal("Create New Folder", 
            `Create a new folder in ${path}`, 
            [
                {name: "Create Folder", action: async (name) => { await createFolder(`${path}${p.sep}${name}`)}},
                {name: "Cancel", cancel: true, action: () => {}}
            ], 
            {label: "Folder Name"}, path)
        }
    },
    "createFile": {
        "keybind": "",
        "command": (path) => {
            openInputModal("Create New File", 
            `Create a new file in ${path}`, 
            [
                {name: "Create File", action: (name) => {createFile(`${path}${p.sep}${name}`)}},
                {name: "Cancel", cancel: true, action: () => {}}
            ], 
            {label: "File Name"}, path)
        }
    },
    "openInExplorer": {
        "keybind": "",
        "command": async (path) => {
            if (!await fs.exists(path)) return;
            openInExplorer(path);
        }
    }
}

export function registerCommand(name: string, keybind: string, command: () => void) {
    if (commands[name]) {
        info(`Command "${name}" already exists, skipping...`, {file: "commands.ts", line: 214});
        return;
    }
    commands[name] = { "keybind": keybind, "command": command }
}

let keybinds = []
export function getKeybinds() {
    for (const value of Object.values(commands)) {
        if (!keybinds.includes(value)) {
            keybinds = [...keybinds, value];
        }
    }
    return keybinds;
}
