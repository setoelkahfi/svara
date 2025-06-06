<script lang="ts">
    import { onMount } from "svelte";
    import { appSettings } from "../config/config";
    import Input from "./utility/Input.svelte";
    import Select from "./utility/Select.svelte";
    import FileTreeView from "./FileTree/FileTreeView.svelte";
    import { getThemes } from "../config/themehandler";
    import { addEditorTab } from "./EditorTabList.svelte";

    export let hidden = true;
 
    let editorFontSize;
    let editorFontFamily;
    let editorLineHeight;
    let editorTabSize;
    let svaraTheme;
    let editorAutosave;
    let externalTerminal;
    let terminalOptions = {"fontWeight": "", "fontSize": "", "fontFamily": "", "lineHeight": "", "cursorStyle": ""};
    onMount(async () => {
        editorFontSize = await appSettings.get("editor.fontSize");
        editorFontFamily = await appSettings.get("editor.fontFamily");
        editorLineHeight = await appSettings.get("editor.lineHeight");
        editorTabSize = await appSettings.get("editor.tabSize");
        editorAutosave = await appSettings.get("editor.autosave");
        svaraTheme = await appSettings.get("svara.theme");
        externalTerminal = await appSettings.get("svara.useExternalTerminal");
        terminalOptions = await appSettings.get("terminal.internal");
    })

    async function handleAutosaveSelect(e) {
        await appSettings.set("editor.autosave", e.detail.selection);
        await appSettings.save();
    }
    async function handleThemeSelect(e) {
        await appSettings.set("svara.theme", e.detail.selection.name);
        await appSettings.save();
    }
    async function handleEditorFontSize(e) {
        await appSettings.set("editor.fontSize", e.detail.value);
        await appSettings.save();
    }
    async function handleEditorFontFamily(e) {
        await appSettings.set("editor.fontFamily", e.detail.value);
        await appSettings.save();
    }
    async function handleEditorLineHeight(e) {
        await appSettings.set("editor.lineHeight", e.detail.value);
        await appSettings.save();
    }
    async function handleEditorTabSize(e) {
        await appSettings.set("editor.tabSize", e.detail.value);
        await appSettings.save();
    }
    async function handleTerminal(e) {
        await appSettings.set("svara.useExternalTerminal", e.detail.selection.name);
        await appSettings.save();
    }
    async function handleTerminalFontSize(e) {
        terminalOptions.fontSize = e.detail.value;
        await appSettings.set("terminal.internal", terminalOptions);
        await appSettings.save();
    }
    async function handleTerminalFontFamily(e) {
        terminalOptions.fontFamily = e.detail.value;
        await appSettings.set("terminal.internal", terminalOptions);
        await appSettings.save();
    }
    async function handleTerminalFontWeight(e) {
        terminalOptions.fontWeight = e.detail.value;
        await appSettings.set("terminal.internal", terminalOptions);
        await appSettings.save();
    }
    async function handleTerminalLineHeight(e) {
        terminalOptions.lineHeight = e.detail.value;
        await appSettings.set("terminal.internal", terminalOptions);
        await appSettings.save();
    }
    async function handleTerminalCursorStyle(e) {
        terminalOptions.cursorStyle = e.detail.selection.name;
        await appSettings.set("terminal.internal", terminalOptions);
        await appSettings.save();

    }
</script>

<div class="settings-container" class:hidden>
    <div class="settings-directory">
        <FileTreeView isExpanded iconsEnabled={false} tree={[
            {id: 0, path: "", name: "General", children: [
                {id: 1, path: "", name: "Theme"},
                {id: 2, path: "", name: "Editor", children: [
                    {id: 3, path: "", name: "Autosave"},
                    {id: 4, path: "", name: "Font Size"},
                    {id: 5, path: "", name: "Font Family"}
                ]},
                {id: 6, path: "", name: "Terminal"},
            ]},
        ]}></FileTreeView>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <span id="json" on:click={() => {addEditorTab(appSettings.path, "settings.json")}}>open settings.json</span>
    </div>
    <div class="settings">
        <div class="settings-list">
            <div class="settings-category">
                <div class="heading">General</div>
                <div class="content">
                    <Select label="Theme" items={getThemes()} selected={svaraTheme} on:select={handleThemeSelect}></Select>
                </div>
            </div>
            <div class="settings-category">
                <div class="heading">Editor</div>
                <div class="content">
                    <Select label="Autosave" items={[{id: 0, name: "false"}, {id: 1, name: "true"}]} selected={editorAutosave} on:select={handleAutosaveSelect}></Select>
                    <Input _class="settings-input" placeholder="default: 14" value={editorFontSize} extra_small label="Font Size" on:d_input={handleEditorFontSize} />
                    <Input _class="settings-input" placeholder="monospace" value={editorFontFamily} medium label="Font Family" on:d_input={handleEditorFontFamily} />
                    <Input _class="settings-input" placeholder="default: 1.3" value={editorLineHeight} medium label="Line Height" on:d_input={handleEditorLineHeight} />
                    <Input _class="settings-input" placeholder="default: 4" value={editorTabSize} medium label="Tab Size" on:d_input={handleEditorTabSize} />
                </div>
            </div>
            <div class="settings-category">
                <div class="heading">Terminal</div>
                <div class="content">
                    <Select label="Use External Terminal" items={[{id: 0, name: "false"}, {id: 1, name: "true"}]} selected={externalTerminal} on:select={handleTerminal} />
                    <Input label="Font Weight" _class="settings-input" placeholder="Cascadia Mono" value={terminalOptions.fontWeight} medium on:d_input={handleTerminalFontWeight} hintText="Values: normal, bold, or 100-900" />
                    <Input label="Font Size" _class="settings-input" placeholder="default: 14" value={terminalOptions.fontSize} extra_small on:d_input={handleTerminalFontSize} />
                    <Input label="Font Family" _class="settings-input" placeholder="Cascadia Mono" value={terminalOptions.fontFamily} medium on:d_input={handleTerminalFontFamily} />
                    <Input label="Line Height" _class="settings-input" placeholder="default: 1.2" value={terminalOptions.lineHeight} medium on:d_input={handleTerminalLineHeight} />
                    <Select label="Cursor Style" items={[{id: 0, name: "bar"}, {id: 1, name: "block"}, {id: 2, name: "underline"}]} selected={terminalOptions.cursorStyle} on:select={handleTerminalCursorStyle} />
                </div>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .hidden {
        display: none !important;
    }
    .settings-container {
        height: 100%;
        display: flex;
    }
    .settings {
        width: 100%;
        height: 100%;
        overflow: auto;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .settings-list {
        padding: 0 20px;
        display: flex;
        flex-direction: column;
    }
    .settings-directory {
        min-width: 13rem;
        height: 100%;
        overflow: auto;
        display: flex;
        align-items: center;
        flex-direction: column;
        #json {
            font-size: 0.9rem;
            color: #939393;
            cursor: pointer;
            text-decoration: underline;
            &:hover {
                color: #4d73ad;
            }
            padding: 10px 0;
        }
    }
    .settings-category {
        padding: 10px 0;
    }
    .heading {
        font-weight: 600;
        font-size: 20px;
        &::after {
            height: 0.05rem;
            width: 100%;
            content: "";
            display: block;
            margin-top: 10px;
        }
    }
    :global(.settings-input) {
        margin: 10px 0;
    }
</style>