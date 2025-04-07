import { writable } from "svelte/store";
import Mousetrap  from "mousetrap";
import { getKeybinds } from "./commands";
import { path } from "@tauri-apps/api";
import { loadTheme } from "./themehandler";
import { load, Store } from "@tauri-apps/plugin-store";
import { setEditorFontFamily, setEditorFontSize, setEditorLineHeight, setEditorTabSize } from "../lib/Editor.svelte";
import { watch } from "@tauri-apps/plugin-fs";
import { info } from "tauri-plugin-log-api";
import { setTerminalState } from "../lib/Statusbar.svelte";
import { termOptions, updateTermOptions } from "../lib/Terminal.svelte";
import * as fs from "@tauri-apps/plugin-fs"
import { invoke } from "@tauri-apps/api/core";

export const systemfonts = writable([]);
export const editorfont = writable("");
export const windowtheme = writable("");
export const autosave = writable(false);

// mousetrap is outdated and i hate the lowercase keymaps but cba to go into the code and fix everything so this will do
function parseKeybind(keybind: string) {
    const keys = keybind.split("+");
    const keymap = {
        "Shift": "shift",
        "Control": "ctrl",
        "Alt": "alt",
        "Meta": "meta",
        "Backspace": "backspace",
        "Tab": "tab",
        "Enter": "enter",
        "Capslock": "capslock",
        "Escape": "escape",
        "Space": "space",
        "Pageup": "pageup",
        "Pagedown": "pagedown",
        "Home": "home",
        "Delete": "del",
        "End": "end",
        "+": "up",
        "-": "down"
    }
    for (const key of keys) {
        if (keymap[key]) {
            keybind = keybind.replace(key, keymap[key]);
        }
        else {
            keybind = keybind.replace(key, key.toLowerCase());
        }
    }
    return keybind;
}

export async function getShortcuts() {
    info("Intializing shortcut bindings...", {file: "config.ts", line: 50});
    const shortcuts = getKeybinds();
    for (const shortcut of shortcuts) {
        // skip binding shorcuts that are disabled
        if (shortcut.disabled === "true") {
            info(`The keybind "${shortcut.keybind}" is disabled. Skipping and/or falling back to default...`, {file: "config.ts", line: 55});
            continue;
        }
        const keybind = parseKeybind(shortcut.keybind);
        Mousetrap.bind(keybind, async (e) => {
            e.preventDefault();
            await fireAction(shortcut.command);
        });
    }
    info("Shortcuts loaded successfully.", {file: "config.ts", line: 64});
}

async function fireAction(callback: () => Promise<void>, args = []) {
    await callback();
    return false;
}

export let appSettings: Store;

export async function loadDefaultSettings() {
    const appdataLocal = await path.appLocalDataDir();
    appSettings = await load(`${appdataLocal}default_settings.json`);

    await watch(
        `${appdataLocal}default_settings.json`,
        () => {
            appSettings;
        }
    )

    await getShortcuts();
    await loadTheme(await appSettings.get("svara.theme"));

    appSettings.onKeyChange("editor.fontSize", (value: number) => {
        setEditorFontSize(value);
    })
    appSettings.onKeyChange("editor.fontFamily", (value: string) => {
        setEditorFontFamily(value);
    })
    appSettings.onKeyChange("editor.lineHeight", (value: string) => {
        setEditorLineHeight(value);
    })
    appSettings.onKeyChange("editor.tabSize", (value: number) => {
        setEditorTabSize(value);
    })
    appSettings.onKeyChange("svara.theme", (value: string) => {
        loadTheme(value);
    })
    appSettings.onKeyChange("svara.useExternalTerminal", (value: string) => {
        setTerminalState(value);
    })
    appSettings.onKeyChange("terminal.internal", (value: any) => {
        termOptions.set(value);
        updateTermOptions();
    })
    setTerminalState(await appSettings.get("svara.useExternalTerminal"))
    termOptions.set(await appSettings.get("terminal.internal"));
    info("Settings initialized", {file: "config.ts", line: 97});
}

export async function openLogFiles() {
    const log_dir = await path.appConfigDir();
    let recent_log = (await fs.readDir(`${log_dir}logs`)).at(-1);
    await invoke("open_in_explorer", {path: `${log_dir}logs${path.sep}${recent_log.name}`});
}

export function getTime() {
    let time = new Intl.DateTimeFormat('en-US', {dateStyle: "short", timeStyle: "long"}).format();
    return time;
}
