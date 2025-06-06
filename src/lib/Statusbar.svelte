<script lang="ts">
    import { isfile } from "./EditorTabList.svelte";
    import { line_info, language, encoding, spaces } from "./Editor.svelte";
    import { getVersion } from '@tauri-apps/api/app';
    import { onMount } from "svelte";
    import { Terminal as TerminalIcon, Notification as NotificationIcon, TrashCan } from "carbon-icons-svelte";
    import { invoke } from "@tauri-apps/api";
    import Terminal, { clearTerminal, closeTerminal } from "./Terminal.svelte";
    import { workingDir } from "./File";
    import NotificationList from "./Notifications/NotificationList.svelte";
    import { clearNotifications, markAllRead, unreadnotifications } from "./Notifications/notifications";

    let appVersion = "";
    onMount(async () => {
        appVersion = await getVersion();
    })

    const tools = [
        {name: "Terminal", content: Terminal, icon: TerminalIcon, action: (t) => {spawnTerminal(t)}, options: [
            {name: "Clear Terminal", action: () => {clearTerminal();}}, 
            {name: "Close Terminal", action: () => {
                closeBottomPanel();
                closeTerminal();
            }}
        ]},
        {name: "Notifications", content: NotificationList, icon: NotificationIcon, action: (t) => {toggleBottomPanel(t)}, options: [
            {name: "Mark all as Read", action: () => {markAllRead()}}], 
            buttons: [
                {icon: TrashCan, title: "Clear Notifications", action: () => {clearNotifications()}}
        ]}
    ]

    async function spawnTerminal(t) {
        if ($externalTerminal) {
            invoke("open_terminal", {path: $workingDir});
        }
        else {
            toggleBottomPanel(t);
        }
    }
</script>
<script lang="ts" context="module">
    import { get, writable } from "svelte/store";
    export let showBottomPanel = writable(false);
    export let externalTerminal = writable(false);
    let lastTool = writable({tool: null, element: null});
    let activeTools: {tool: any, element: any}[] = [];
    let show = false;

    export let editortool = writable({name: "", options: [], buttons: []});

    export function toggleBottomPanel(tool = null) {
        let last = get(lastTool);
        if (tool === last.tool) {
            show = !show;
            showBottomPanel.set(show);
            return;
        }
        if (activeTools.length === 0) {
            let element = new tool.content({target: document.getElementById("toolview-container")});
            lastTool.set({tool: tool, element: element});
            activeTools = [...activeTools, {tool: tool, element: element}];
            show = true;
            showBottomPanel.set(true);
        }
        else {
            let mountedTool = activeTools.find(f => f.tool === tool);
            if (!mountedTool) {
                if (last.element) {
                    last.element.$set({hidden: true});
                }
                let element = new tool.content({target: document.getElementById("toolview-container")});
                lastTool.set({tool: tool, element: element});
                activeTools = [...activeTools, {tool: tool, element: element}];
                show = true;
                showBottomPanel.set(true);
            }
            else {
                if (last.element) {
                    last.element.$set({hidden: true});
                    mountedTool.element.$set({hidden: false});
                    lastTool.set(mountedTool);
                    showBottomPanel.set(true);
                }
            }
        }

        if (tool) {
            editortool.set({name: tool.name, options: tool.options, buttons: tool.buttons});
        }
    }
    export function hideBottomPanel() {
        show = false;
        showBottomPanel.set(false);
    }
    export function closeBottomPanel() {
        show = false;
        showBottomPanel.set(false);
        let current = activeTools.find(t => t.tool.name === get(editortool).name);
        if (current) current.element.$destroy();
        activeTools = activeTools.filter(t => t.tool.name !== get(editortool).name);
        editortool.set({name: "", options: [], buttons: []});
        lastTool.set({tool: null, element: null});
    }
    export function setTerminalState(value) {
        let v = value === true ? true : false;
        externalTerminal.set(v);
    }
</script>

<div id="statusbar">
    <div id="title">
        <span>Svara <span id="version">v{appVersion}-alpha</span></span>
        <div class="divider"></div>
    </div>
    <div class="editor-tools">
        {#each tools as tool}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <span class="tool" title={tool.name} on:click={() => {tool.action(tool)}} class:updated={$unreadnotifications}>
                <svelte:component this={tool.icon}></svelte:component>
                {#if tool.name === "Notifications"}
                    <span class="notification"></span>
                {/if}
            </span>
        {/each}
    </div>
    {#if $isfile}
        <div class="editor-info">
            <span title="Indentation">Spaces: {$spaces}</span>
            <div class="divider"></div>
            <span title="Ln: {$line_info.line}, Col: {$line_info.column}">{$line_info.line} : {$line_info.column}</span>
            <div class="divider"></div>
            <span>{$encoding.value} {$encoding.hasBom === true ? " with BOM" : ""}</span>
            <div class="divider"></div>
            <span>{$language}</span>
        </div>
    {/if}
</div>

<style lang="scss">
    #statusbar {
        z-index: 8000;
        width: -webkit-fill-available;
        display: flex;
        align-items: center;
        font-size: 0.9rem;
        :global(span svg) {
            width: 20px;
            height: 20px;
        }
    }
    #title {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        height: 100%;
        span {
            height: 100%;
            padding: 0 10px;
        }
    }
    .divider {
        width: 0.0625rem;
		height: 1rem;
    }
    .editor-tools {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding-left: 10px;
        .tool {
            height: 100%;
            padding: 0 5px;
            position: relative;
            &:hover {
                cursor: pointer;
            }
            &.updated {
                .notification {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    display: block;
                    background-color: #4589ff;
                    border-radius: 50%;
                    top: 5px;
                    right: 5px;
                    border: none;
                }
            }
        }
        span {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
    .editor-info {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        flex-grow: 1;
        font-size: 13px;
        height: 100%;
        span {
            padding: 0 7px;
            height: 100%;
            display: flex;
            align-items: center;
        }
    }
    #version {
        font-size: 0.7rem;
        padding: 0 !important;
        color: #6d6d6d;
    }
</style>
