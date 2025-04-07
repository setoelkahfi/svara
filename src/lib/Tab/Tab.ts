import { writable } from "svelte/store";
import Editor from "../Editor.svelte";
import {  invoke } from "@tauri-apps/api/core";
import { saveFile } from "../File";
import { warn } from "tauri-plugin-log-api";
import { appSettings } from "../../config/config";
import * as dialog from "@tauri-apps/plugin-dialog"

export class Tab {
    id = 0;
    activeid = this.id;
    tablist = [];
    Tab; // Tab class
    activeTab = null;
    hidden = writable(true);
    isfile = writable(false);
    tabs = writable([]);
    constructor (Tab) {
        this.Tab = Tab;
    }

    setActive(id: number) {
        for (let tab of this.tablist) {
            if (tab.id === id) {
                this.activeid = id;
                tab.active = true;
                if (tab.isfile) {
                    this.isfile.set(true);
                    tab.content.focus();
                }
                else {
                    this.isfile.set(false);
                }
                this.activeTab = tab;
            }
            else {
                tab.active = false;
            }
        }
        this.tabs.set(this.tablist);
        this.updateView();
    }
    updateTabs() {
        if (this.tablist.length > 0) {
            this.hidden.set(false);
        }

        this.tabs.set(this.tablist);
        this.setActive(this.id);
        this.id++;
    }
    tabOpen(path: string) {
        for (const tab of this.tablist) {
            if (tab.path === path) {
                this.setActive(tab.id);
                return true;
            }
        }
        return false;
    }
    addTab(path: string = "", label: string = "", content = null) {
        // dont add tabs that are already open
        if (this.tabOpen(path)) {
            return;
        }
        
        let tab = new this.Tab(this.id, label, content, path);
        this.tablist = [...this.tablist, tab];

        this.updateTabs();
    }
    async addEditorTab(path: string, label: string = "") {
        if (this.tabOpen(path)) {
            return;
        }
        let fileData = {text: "", encoding: "UTF-8", extension: "", bom: false, spaces: await appSettings.get("editor.tabSize")};
        try {
            fileData = await invoke("read_file", {path: path});
            if (fileData.spaces === 0) {
                fileData.spaces = await appSettings.get("editor.tabSize")
            }
        } catch (error) {
            warn(`Can't read file content in ${path}. Setting to empty string. Error: ${error}`, {file: "Tab.ts", line: 79});
        }
        let content = new Editor({target: document.getElementById("tabview"), props: {content: fileData.text}});
        let tab = new this.Tab(this.id, label, content, path);
        tab.isfile = true;
        tab.saved = true;

        content.updateFileInfo({
            "filename": tab.label,
            "path": tab.path,
            "fileType": fileData.extension,
            "language": await content.getLang(fileData.extension),
            "encoding": fileData.encoding,
            "hasBom": fileData.bom,
            "spaces": fileData.spaces,
            "readonly": false,
        });
        this.tablist = [...this.tablist, tab];

        this.updateView();

        this.updateTabs();
    }
    async closeTab(tabid: number) {
        if (this.activeid === tabid) {
            for (let i = 0; i <= this.tablist.length - 1; i++) {
                if (this.tablist[i].id === tabid && !this.tablist[i].saved) {
                    if (await dialog.ask(`Do you want to save ${this.tablist[i].label} before closing?`, {type: "warning"})) {
                        await saveFile();
                    }
                }
                // set right tab active
                if (this.tablist[i].id === tabid && this.tablist[i + 1]) {
                    this.setActive(this.tablist[i + 1].id);
                    break;
                }
                // set left tab active
                else if (this.tablist[i].id === tabid && this.tablist[i - 1]) {
                    this.setActive(this.tablist[i - 1].id);
                    break;
                }
            }
        }
        
        this.tablist.find(t => t.id === tabid).content.$destroy();
        this.tablist = this.tablist.filter(t => t.id !== tabid);
        this.tabs.set(this.tablist);
        
        if (this.tablist.length === 0) {
            this.hidden.set(true);
            this.isfile.set(false);
            this.id = 0;
        }
    }
    async closeAllTabs() {
        await this.closeTab(this.activeid);
        const temp = [...this.tablist].reverse(); // js just loves to be inconsistent with its array functions innit
        for (const tab of temp) {
            await this.closeTab(tab.id);
        }
    }
    updateView() {
        for (let tab of this.tablist) {
            tab.updateView(this.activeid);
        }
    }
    refreshTabList() {
        this.tabs.set(this.tablist);
    }
}
