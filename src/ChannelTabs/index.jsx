//#region Module/Variable Definitions

let pluginMeta;

const { ContextMenu, Patcher, Webpack, React, DOM, ReactUtils, UI } = new BdApi(
	"ChannelTabs",
);
const { Data } = BdApi;

function getModule(filter, options = {}) {
	const foundModule = options.fail
		? undefined
		: Webpack.getModule(filter, options);

	if (!foundModule) {
		options.name ??= filter?.__filter;
		missingModule(options);
		if (options.onFail) options.onFail(options);
	}

	return foundModule;
}

function getStack() {
	const original = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stackTraces) => stackTraces;

	const stack = new Error().stack.slice(1);

	Error.prepareStackTrace = original;
	return stack;
}

if (this.dismissWarning) this.dismissWarning();
this.dismissWarning = null;
let missingFeatures = [];
function missingModule({ name = "<unnamed>", feature, fatal = false }) {
	const stack = getStack();
	const index = stack.findIndex(
		(site) => site.getFunctionName() === "getModule",
	);
	const trace = stack.filter((_, i) => i > index).join("\n");
	console.warn(`Could not find '${name}' module.\n${trace}`);
	if (fatal) throw `Could not find '${name}' module.`;
	if (feature != null) {
		missingFeatures.push(feature);

		if (dismissWarning) dismissWarning();
		const content = BdApi.DOM.parseHTML(
			`<span style="background: white; color: var(--color); padding: 1px 3px; margin-right: 3px; border-radius: 5px;">ChannelTabs</span> These features are unavailable: ${missingFeatures.join(", ")}`,
			true,
		);
		dismissWarning = BdApi.UI.showNotice(content, {
			type: "warning",
		});
	}
}

class FakeUnreadStateStore extends require("events").EventEmitter {
	getUnreadCount() {
		return 0;
	}
	getMentionCount() {
		return 0;
	}
	isEstimated() {
		return false;
	}
	hasUnread() {
		return false;
	}
}

// Hack in some useful debug information into filters
const Filters = {};
for (const [key, value] of Object.entries(Webpack.Filters)) {
	Filters[key] = function (...args) {
		const result = value(...args);
		result.__filter = `${key}(${args.map((a) => JSON.stringify(a)).join(", ")})`;
		return result;
	};
}

const { byKeys, byStrings, byStoreName, bySource } = Filters;
const NavigationUtils = {
	transitionToGuild: getModule(byKeys("transitionToGuildSync"))
		?.transitionToGuildSync,
	transitionTo: getModule(byStrings(`"transitionTo - Transitioning to "`), {
		searchExports: true,
	}),
};
const Permissions = getModule(byKeys("computePermissions"));
const SelectedChannelStore = getModule(byStoreName("SelectedChannelStore"));
const SelectedGuildStore = getModule(byStoreName("SelectedGuildStore"));
const ChannelStore = getModule(byStoreName("ChannelStore"));
const UserStore = getModule(byStoreName("UserStore"));
const UserTypingStore = getModule(byStoreName("TypingStore"));
const RelationshipStore = getModule(byStoreName("RelationshipStore"));
const GuildStore = getModule(byStoreName("GuildStore"));
const DiscordConstants = {
	ChannelTypes: getModule(byKeys("GUILD_TEXT"), {
		searchExports: true,
	}),
};
const Textbox = (props) => (
	<div className="channelTabs-input">
		<BdApi.Components.TextInput {...props} />
	</div>
);
const UnreadStateStore =
	getModule((m) => m.isEstimated, {
		feature: "Unread/Mention Indicators",
	}) ?? new FakeUnreadStateStore();
const Flux = getModule(byKeys("connectStores"), {
	name: "Flux",
	fatal: true,
});
const MutedStore = getModule(byKeys("isMuted", "isChannelMuted"));
const PermissionUtils = getModule(byKeys("can", "canManageUser"));
const UserStatusStore = getModule(byStoreName("PresenceStore"));
const Spinner = getModule((m) => m.Type?.SPINNING_CIRCLE, {
	searchExports: true,
	feature: "Typing Indicators",
});
const Tooltip = BdApi.Components.Tooltip;
const Slider = getModule(
	byStrings(
		`"[UIKit]Slider.handleMouseDown(): assert failed: domNode nodeType !== Element"`,
	),
	{ searchExports: true },
);
const NavShortcuts = getModule(byKeys("NAVIGATE_BACK", "NAVIGATE_FORWARD"));
const [TitleBar, TitleBarKey] = Webpack.getWithKey(
	byStrings(".PlatformTypes.WINDOWS&&(0,", "title"),
);
if (!TitleBar) missingModule({ name: "TitleBar", fatal: true });
const IconUtilities = getModule(byKeys("getChannelIconURL"));

const standardSidebarView =
	BdApi.Webpack.getByKeys("standardSidebarView")?.standardSidebarView ?? "";
const backdropClasses = getModule(byKeys("backdrop", "withLayer"));
const noDragClasses = [
	standardSidebarView, // Settings view
	backdropClasses?.backdrop, // Anything that has a backdrop
].filter((x) => x);

const Icons = {
	XSmallIcon: () => (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="var(--interactive-normal)"
				d="M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1 1 0 0 0-1.42-1.4L12 10.58l-5.3-5.3a1 1 0 0 0-1.4 1.42L10.58 12l-5.3 5.3a1 1 0 1 0 1.42 1.4L12 13.42l5.3 5.3Z"
				class=""
			></path>
		</svg>
	),
	PlusSmallIcon: () => (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="var(--interactive-normal)"
				d="M13 6a1 1 0 1 0-2 0v5H6a1 1 0 1 0 0 2h5v5a1 1 0 1 0 2 0v-5h5a1 1 0 1 0 0-2h-5V6Z"
				class=""
			></path>
		</svg>
	),
	ChevronLargeLeftIcon: () => (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="var(--interactive-normal)"
				d="M15.7 3.3a1 1 0 0 1 0 1.4L8.42 12l7.3 7.3a1 1 0 0 1-1.42 1.4l-8-8a1 1 0 0 1 0-1.4l8-8a1 1 0 0 1 1.42 0Z"
			></path>
		</svg>
	),
	ChevronLargeRightIcon: () => (
		<svg
			aria-hidden="true"
			role="img"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				fill="var(--interactive-normal)"
				d="M8.3 3.3a1 1 0 0 0 0 1.4l7.29 7.3-7.3 7.3a1 1 0 1 0 1.42 1.4l8-8a1 1 0 0 0 0-1.4l-8-8a1 1 0 0 0-1.42 0Z"
			></path>
		</svg>
	),
};
const Close =
	Icons?.XSmallIcon ??
	(() => <div style={{ width: "16px", "text-align": "center" }}>⨯</div>);
const PlusAlt = Icons?.PlusSmallIcon ?? (() => <b>＋</b>);
const LeftCaret = Icons?.ChevronLargeLeftIcon ?? (() => <b>{"<"}</b>);
const RightCaret = Icons?.ChevronLargeRightIcon ?? (() => <b>{">"}</b>);

const DefaultUserIconGrey = "https://cdn.discordapp.com/embed/avatars/0.png";
const DefaultUserIconGreen = "https://cdn.discordapp.com/embed/avatars/1.png";
const DefaultUserIconBlue = "https://cdn.discordapp.com/embed/avatars/2.png";
const DefaultUserIconRed = "https://cdn.discordapp.com/embed/avatars/3.png";
const DefaultUserIconYellow = "https://cdn.discordapp.com/embed/avatars/4.png";

const SettingsMenuIcon = (
	<svg class="channelTabs-settingsIcon" aria-hidden="false" viewBox="0 0 80 80">
		<rect
			fill="var(--interactive-normal)"
			x="20"
			y="15"
			width="50"
			height="10"
		/>
		<rect
			fill="var(--interactive-normal)"
			x="20"
			y="35"
			width="50"
			height="10"
		/>
		<rect
			fill="var(--interactive-normal)"
			x="20"
			y="55"
			width="50"
			height="10"
		/>
	</svg>
);

var switching = false;
var patches = [];

var currentTabDragIndex = -1;
var currentTabDragDestinationIndex = -1;

var currentFavDragIndex = -1;
var currentFavDragDestinationIndex = -1;

var currentGroupDragIndex = -1;
var currentGroupDragDestinationIndex = -1;

var currentGroupOpened = -1;

//#endregion

//#region Context Menu Constructors

function CreateGuildContextMenuChildren(instance, props, channel) {
	return ContextMenu.buildMenuChildren([
		{
			type: "group",
			items: [
				{
					type: "submenu",
					label: "ChannelTabs",
					items: instance.mergeItems(
						[
							{
								label: "Open channel in new tab",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.saveChannel(
										props.guild.id,
										channel.id,
										"#" + channel.name,
									),
							},
							{
								label: "Save channel as bookmark",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.addToFavs(
										"#" + channel.name,
										`/channels/${props.guild.id}/${channel.id}`,
										channel.id,
									),
							},
						],
						[
							{
								label: "Save guild as bookmark",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.addToFavs(
										props.guild.name,
										`/channels/${props.guild.id}`,
										undefined,
										props.guild.id,
									),
							},
						],
					),
				},
			],
		},
	]);
}

function CreateTextChannelContextMenuChildren(instance, props) {
	return ContextMenu.buildMenuChildren([
		{
			type: "group",
			items: [
				{
					type: "submenu",
					label: "ChannelTabs",
					items: instance.mergeItems(
						[
							{
								label: "Open in new tab",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.saveChannel(
										props.guild.id,
										props.channel.id,
										"#" + props.channel.name,
									),
							},
						],
						[
							{
								label: "Save channel as bookmark",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.addToFavs(
										"#" + props.channel.name,
										`/channels/${props.guild.id}/${props.channel.id}`,
										props.channel.id,
									),
							},
						],
					),
				},
			],
		},
	]);
}

function CreateThreadChannelContextMenuChildren(instance, props) {
	return ContextMenu.buildMenuChildren([
		{
			type: "group",
			items: [
				{
					type: "submenu",
					label: "ChannelTabs",
					items: instance.mergeItems(
						[
							{
								label: "Open in new tab",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.saveChannel(
										props.channel.guild_id,
										props.channel.id,
										"#" + props.channel.name,
									),
							},
						],
						[
							{
								label: "Save thread as bookmark",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.addToFavs(
										"#" + props.channel.name,
										`/channels/${props.channel.guild_id}/${props.channel.id}`,
										props.channel.id,
									),
							},
						],
					),
				},
			],
		},
	]);
}

function CreateDMContextMenuChildren(instance, props) {
	return ContextMenu.buildMenuChildren([
		{
			type: "group",
			items: [
				{
					type: "submenu",
					label: "ChannelTabs",
					items: instance.mergeItems(
						[
							{
								label: "Open in new tab",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.saveChannel(
										props.channel.guild_id,
										props.channel.id,
										props.channel.name ||
											RelationshipStore.getNickname(props.user.id) ||
											props.user.globalName,
									),
							},
						],
						[
							{
								label: "Save DM as bookmark",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.addToFavs(
										props.channel.name ||
											RelationshipStore.getNickname(props.user.id) ||
											props.user.globalName,
										`/channels/@me/${props.channel.id}`,
										props.channel.id,
									),
							},
						],
					),
				},
			],
		},
	]);
}

function CreateGroupContextMenuChildren(instance, props) {
	return ContextMenu.buildMenuChildren([
		{
			type: "group",
			items: [
				{
					type: "submenu",
					label: "ChannelTabs",
					items: instance.mergeItems(
						[
							{
								label: "Open in new tab",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.saveChannel(
										props.channel.guild_id,
										props.channel.id,
										props.channel.name ||
											props.channel.rawRecipients
												.map(
													(u) =>
														RelationshipStore.getNickname(u.id) || u.globalName,
												)
												.join(", "),
									),
							},
						],
						[
							{
								label: "Save bookmark",
								action: () =>
									TopBarRef.current &&
									TopBarRef.current.addToFavs(
										props.channel.name ||
											props.channel.rawRecipients
												.map(
													(u) =>
														RelationshipStore.getNickname(u.id) || u.globalName,
												)
												.join(", "),
										`/channels/@me/${props.channel.id}`,
										props.channel.id,
									),
							},
						],
					),
				},
			],
		},
	]);
}

function CreateTabContextMenu(props, e) {
	ContextMenu.open(
		e,
		ContextMenu.buildMenu([
			{
				type: "group",
				items: mergeLists(
					{
						values: [
							{
								label: "Duplicate",
								action: props.openInNewTab,
							},
							{
								label: "Add to favourites",
								action: () =>
									props.addToFavs(props.name, props.url, props.channelId),
							},
							{
								label: "Minimize tab",
								type: "toggle",
								checked: () => props.minimized,
								action: () => props.minimizeTab(props.tabIndex),
							},
						],
					},
					{
						include: props.tabCount > 1,
						values: [
							{
								type: "separator",
							},
							{
								label: "Move left",
								action: props.moveLeft,
							},
							{
								label: "Move right",
								action: props.moveRight,
							},
						],
					},
					{
						include: props.tabCount > 1,
						values: [
							{
								type: "separator",
							},
							{
								type: "submenu",
								label: "Close...",
								id: "closeMenu",
								color: "danger",
								action: () => props.closeTab(props.tabIndex, "single"),
								items: mergeLists(
									{
										values: [
											{
												label: "Close tab",
												action: () => props.closeTab(props.tabIndex, "single"),
												color: "danger",
											},
											{
												label: "Close all other tabs",
												action: () => props.closeTab(props.tabIndex, "other"),
												color: "danger",
											},
										],
									},
									{
										include: props.tabIndex != props.tabCount - 1,
										values: [
											{
												label: "Close all tabs to right",
												action: () => props.closeTab(props.tabIndex, "right"),
												color: "danger",
											},
										],
									},
									{
										include: props.tabIndex != 0,
										values: [
											{
												label: "Close all tabs to left",
												action: () => props.closeTab(props.tabIndex, "left"),
												color: "danger",
											},
										],
									},
								),
							},
						],
					},
				),
			},
		]),
		{
			position: "right",
			align: "top",
		},
	);
}

function CreateFavContextMenu(props, e) {
	ContextMenu.open(
		e,
		ContextMenu.buildMenu([
			{
				type: "group",
				items: mergeLists(
					{
						values: [
							{
								label: "Open in new tab",
								action: props.openInNewTab,
							},
							{
								label: "Rename",
								action: props.rename,
							},
							{
								label: "Minimize favourite",
								type: "toggle",
								checked: () => props.minimized,
								action: () => props.minimizeFav(props.favIndex),
							},
							{
								type: "separator",
							},
						],
					},
					{
						include: props.favCount > 1,
						values: [
							{
								label: "Move left",
								action: props.moveLeft,
							},
							{
								label: "Move right",
								action: props.moveRight,
							},
							{
								type: "separator",
							},
						],
					},
					{
						values: [
							{
								label: "Move To...",
								id: "groupMoveTo",
								type: "submenu",
								items: mergeLists(
									{
										values: [
											{
												label: "Favorites Bar",
												id: "entryNone",
												color: "danger",
												action: () => props.moveToFavGroup(props.favIndex, -1),
											},
											{
												type: "separator",
											},
										],
									},
									{
										values: FavMoveToGroupList({
											favIndex: props.favIndex,
											...props,
										}),
									},
								),
							},
							{
								type: "separator",
							},
						],
					},
					{
						values: [
							{
								label: "Delete",
								action: props.delete,
								color: "danger",
							},
						],
					},
				),
			},
		]),
		{
			position: "right",
			align: "top",
		},
	);
}

function CreateFavGroupContextMenu(props, e) {
	ContextMenu.open(
		e,
		ContextMenu.buildMenu([
			{
				type: "group",
				items: mergeLists(
					{
						values: [
							{
								label: "Open all",
								action: () =>
									props.openFavGroupInNewTab(props.favGroup.groupId),
							},
							{
								type: "separator",
							},
						],
					},
					{
						include: props.groupCount > 1,
						values: [
							{
								label: "Move left",
								action: () =>
									props.moveFavGroup(
										props.groupIndex,
										(props.groupIndex + props.groupCount - 1) %
											props.groupCount,
									),
							},
							{
								label: "Move right",
								action: () =>
									props.moveFavGroup(
										props.groupIndex,
										(props.groupIndex + 1) % props.groupCount,
									),
							},
							{
								type: "separator",
							},
						],
					},
					{
						values: [
							{
								label: "Rename",
								id: "renameGroup",
								action: () =>
									props.renameFavGroup(
										props.favGroup.name,
										props.favGroup.groupId,
									),
							},
							{
								type: "separator",
							},
							{
								label: "Delete",
								id: "deleteGroup",
								action: () => props.removeFavGroup(props.favGroup.groupId),
								color: "danger",
							},
						],
					},
				),
			},
		]),
		{
			position: "right",
			align: "top",
		},
	);
}

function CreateFavBarContextMenu(props, e) {
	ContextMenu.open(
		e,
		ContextMenu.buildMenu([
			{
				type: "group",
				items: [
					{
						label: "Add current tab as favourite",
						action: () =>
							props.addToFavs(
								getCurrentName(),
								location.pathname,
								SelectedChannelStore.getChannelId(),
							),
					},
					{
						label: "Create a new group...",
						action: props.addFavGroup,
					},
					{
						type: "separator",
					},
					{
						label: "Hide Favorites",
						action: props.hideFavBar,
						color: "danger",
					},
				],
			},
		]),
		{
			position: "right",
			align: "top",
		},
	);
}

function CreateSettingsContextMenu(instance, e) {
	ContextMenu.open(
		e,
		ContextMenu.buildMenu([
			{
				type: "group",
				items: mergeLists({
					values: [
						{
							label: pluginMeta.name,
							subtext: "Version " + pluginMeta.version,
							// action: () => {
							// 	UI.showChangelogModal(
							// 		pluginMeta.name,
							// 		pluginMeta.version,
							// 		config.changelog,
							// 	);
							// },
						},
						{
							type: "separator",
						},
						{
							id: "shortcutLabel",
							disabled: true,
							label: "Shortcuts:",
						},
						{
							id: "shortcutLabelKeys",
							disabled: true,
							render: () => {
								return (
									<div
										style={{
											color: "var(--text-muted)",
											padding: "8px",
											"font-size": "12px",
											"white-space": "pre-wrap",
										}}
									>
										{`Ctrl + W - Close Current Tab\n` +
											`Ctrl + PgUp - Navigate to Left Tab\n` +
											`Ctrl + PgDn - Navigate to Right Tab\n`}
									</div>
								);
							},
						},
						{
							type: "separator",
						},
						{
							label: "Settings:",
							id: "settingHeader",
							disabled: true,
						},
						{
							type: "separator",
						},
						{
							type: "submenu",
							label: "Startup",
							items: [
								{
									label: "Reopen Last Channel on Startup",
									type: "toggle",
									id: "reopenLastChannel",
									checked: () => TopBarRef.current.state.reopenLastChannel,
									action: () => {
										instance.setState(
											{
												reopenLastChannel: !instance.state.reopenLastChannel,
											},
											() => {
												instance.props.plugin.settings.reopenLastChannel =
													!instance.props.plugin.settings.reopenLastChannel;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
							],
						},
						{
							type: "submenu",
							label: "Appearance",
							items: [
								{
									label: "Use Compact Appearance",
									type: "toggle",
									id: "useCompactLook",
									checked: () => TopBarRef.current.state.compactStyle,
									action: () => {
										instance.setState(
											{
												compactStyle: !instance.state.compactStyle,
											},
											() => {
												instance.props.plugin.settings.compactStyle =
													!instance.props.plugin.settings.compactStyle;
												instance.props.plugin.removeStyle();
												instance.props.plugin.applyStyle();
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Privacy Mode",
									type: "toggle",
									id: "privacyMode",
									checked: () => TopBarRef.current.state.privacyMode,
									action: () => {
										instance.setState(
											{
												privacyMode: !instance.state.privacyMode,
											},
											() => {
												instance.props.plugin.settings.privacyMode =
													!instance.props.plugin.settings.privacyMode;
												instance.props.plugin.removeStyle();
												instance.props.plugin.applyStyle();
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Radial Status Indicators",
									type: "toggle",
									id: "radialStatusMode",
									checked: () => TopBarRef.current.state.radialStatusMode,
									action: () => {
										instance.setState(
											{
												radialStatusMode: !instance.state.radialStatusMode,
											},
											() => {
												instance.props.plugin.settings.radialStatusMode =
													!instance.props.plugin.settings.radialStatusMode;
												instance.props.plugin.removeStyle();
												instance.props.plugin.applyStyle();
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									type: "separator",
								},
								{
									label: "Minimum Tab Width",
									style: { "pointer-events": "none" },
								},
								{
									id: "tabWidthMin",
									render: () => {
										return (
											<div className="channelTabs-sliderContainer">
												<Slider
													aria-label="Minimum Tab Width"
													className="channelTabs-slider"
													mini={true}
													orientation="horizontal"
													disabled={false}
													initialValue={
														instance.props.plugin.settings.tabWidthMin
													}
													minValue={50}
													maxValue={220}
													onValueRender={(value) =>
														Math.floor(value / 10) * 10 + "px"
													}
													onValueChange={(value) => {
														(value = Math.floor(value / 10) * 10),
															(instance.props.plugin.settings.tabWidthMin =
																value),
															instance.props.plugin.saveSettings(),
															instance.props.plugin.applyStyle(
																"channelTabs-style-constants",
															);
													}}
												/>
											</div>
										);
									},
								},
								{
									type: "separator",
								},
								{
									label: "Show Tab Bar",
									type: "toggle",
									id: "showTabBar",
									color: "danger",
									checked: () => TopBarRef.current.state.showTabBar,
									action: () => {
										instance.setState(
											{
												showTabBar: !instance.state.showTabBar,
											},
											() => {
												instance.props.plugin.settings.showTabBar =
													!instance.props.plugin.settings.showTabBar;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Fav Bar",
									type: "toggle",
									id: "showFavBar",
									color: "danger",
									checked: () => TopBarRef.current.state.showFavBar,
									action: () => {
										instance.setState(
											{
												showFavBar: !instance.state.showFavBar,
											},
											() => {
												instance.props.plugin.settings.showFavBar =
													!instance.props.plugin.settings.showFavBar;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Quick Settings",
									type: "toggle",
									id: "showQuickSettings",
									color: "danger",
									checked: () => TopBarRef.current.state.showQuickSettings,
									action: () => {
										instance.setState(
											{
												showQuickSettings: !instance.state.showQuickSettings,
											},
											() => {
												instance.props.plugin.settings.showQuickSettings =
													!instance.props.plugin.settings.showQuickSettings;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Navigation Buttons",
									type: "toggle",
									id: "showNavButtons",
									checked: () => TopBarRef.current.state.showNavButtons,
									action: () => {
										instance.setState(
											{
												showNavButtons: !instance.state.showNavButtons,
											},
											() => {
												instance.props.plugin.settings.showNavButtons =
													!instance.props.plugin.settings.showNavButtons;
												instance.props.plugin.removeStyle();
												instance.props.plugin.applyStyle();
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
							],
						},
						{
							type: "submenu",
							label: "Behavior",
							items: [
								{
									label: "Always Focus New Tabs",
									type: "toggle",
									id: "alwaysFocusNewTabs",
									checked: () => TopBarRef.current.state.alwaysFocusNewTabs,
									action: () => {
										instance.setState(
											{
												alwaysFocusNewTabs: !instance.state.alwaysFocusNewTabs,
											},
											() => {
												instance.props.plugin.settings.alwaysFocusNewTabs =
													!instance.props.plugin.settings.alwaysFocusNewTabs;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Primary Forward/Back Navigation",
									type: "toggle",
									id: "useStandardNav",
									checked: () => TopBarRef.current.state.useStandardNav,
									action: () => {
										instance.setState(
											{
												useStandardNav: !instance.state.useStandardNav,
											},
											() => {
												instance.props.plugin.settings.useStandardNav =
													!instance.props.plugin.settings.useStandardNav;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
							],
						},
						{
							type: "submenu",
							label: "Badge Visibility",
							items: [
								{
									type: "separator",
									id: "header1_1",
								},
								{
									label: "Favs:",
									id: "header1_2",
									disabled: true,
								},
								{
									type: "separator",
									id: "header1_3",
								},
								{
									label: "Show Mentions",
									type: "toggle",
									id: "favs_Mentions",
									checked: () => TopBarRef.current.state.showFavMentionBadges,
									action: () => {
										instance.setState(
											{
												showFavMentionBadges:
													!instance.state.showFavMentionBadges,
											},
											() => {
												instance.props.plugin.settings.showFavMentionBadges =
													!instance.props.plugin.settings.showFavMentionBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Unreads",
									type: "toggle",
									id: "favs_Unreads",
									checked: () => TopBarRef.current.state.showFavUnreadBadges,
									action: () => {
										instance.setState(
											{
												showFavUnreadBadges:
													!instance.state.showFavUnreadBadges,
											},
											() => {
												instance.props.plugin.settings.showFavUnreadBadges =
													!instance.props.plugin.settings.showFavUnreadBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Typing",
									type: "toggle",
									id: "favs_Typing",
									checked: () => TopBarRef.current.state.showFavTypingBadge,
									action: () => {
										instance.setState(
											{
												showFavTypingBadge: !instance.state.showFavTypingBadge,
											},
											() => {
												instance.props.plugin.settings.showFavTypingBadge =
													!instance.props.plugin.settings.showFavTypingBadge;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Empty Mentions/Unreads",
									type: "toggle",
									id: "favs_Empty",
									checked: () => TopBarRef.current.state.showEmptyFavBadges,
									action: () => {
										instance.setState(
											{
												showEmptyFavBadges: !instance.state.showEmptyFavBadges,
											},
											() => {
												instance.props.plugin.settings.showEmptyFavBadges =
													!instance.props.plugin.settings.showEmptyFavBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									type: "separator",
									id: "header4_1",
								},
								{
									label: "Fav Groups:",
									id: "header4_2",
									disabled: true,
								},
								{
									type: "separator",
									id: "header4_3",
								},
								{
									label: "Show Mentions",
									type: "toggle",
									id: "favGroups_Mentions",
									checked: () =>
										TopBarRef.current.state.showFavGroupMentionBadges,
									action: () => {
										instance.setState(
											{
												showFavGroupMentionBadges:
													!instance.state.showFavGroupMentionBadges,
											},
											() => {
												instance.props.plugin.settings.showFavGroupMentionBadges =
													!instance.props.plugin.settings
														.showFavGroupMentionBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Unreads",
									type: "toggle",
									id: "favGroups_Unreads",
									checked: () =>
										TopBarRef.current.state.showFavGroupUnreadBadges,
									action: () => {
										instance.setState(
											{
												showFavGroupUnreadBadges:
													!instance.state.showFavGroupUnreadBadges,
											},
											() => {
												instance.props.plugin.settings.showFavGroupUnreadBadges =
													!instance.props.plugin.settings
														.showFavGroupUnreadBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Typing",
									type: "toggle",
									id: "favGroups_Typing",
									checked: () =>
										TopBarRef.current.state.showFavGroupTypingBadge,
									action: () => {
										instance.setState(
											{
												showFavGroupTypingBadge:
													!instance.state.showFavGroupTypingBadge,
											},
											() => {
												instance.props.plugin.settings.showFavGroupTypingBadge =
													!instance.props.plugin.settings
														.showFavGroupTypingBadge;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Empty Mentions/Unreads",
									type: "toggle",
									id: "favGroups_Empty",
									checked: () =>
										TopBarRef.current.state.showEmptyFavGroupBadges,
									action: () => {
										instance.setState(
											{
												showEmptyFavGroupBadges:
													!instance.state.showEmptyFavGroupBadges,
											},
											() => {
												instance.props.plugin.settings.showEmptyFavGroupBadges =
													!instance.props.plugin.settings
														.showEmptyFavGroupBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									type: "separator",
									id: "header2_1",
								},
								{
									label: "Tabs:",
									id: "header2_2",
									disabled: true,
								},
								{
									type: "separator",
									id: "header2_3",
								},
								{
									label: "Show Mentions",
									type: "toggle",
									id: "tabs_Mentions",
									checked: () => TopBarRef.current.state.showTabMentionBadges,
									action: () => {
										instance.setState(
											{
												showTabMentionBadges:
													!instance.state.showTabMentionBadges,
											},
											() => {
												instance.props.plugin.settings.showTabMentionBadges =
													!instance.props.plugin.settings.showTabMentionBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Unreads",
									type: "toggle",
									id: "tabs_Unreads",
									checked: () => TopBarRef.current.state.showTabUnreadBadges,
									action: () => {
										instance.setState(
											{
												showTabUnreadBadges:
													!instance.state.showTabUnreadBadges,
											},
											() => {
												instance.props.plugin.settings.showTabUnreadBadges =
													!instance.props.plugin.settings.showTabUnreadBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Typing",
									type: "toggle",
									id: "tabs_Typing",
									checked: () => TopBarRef.current.state.showTabTypingBadge,
									action: () => {
										instance.setState(
											{
												showTabTypingBadge: !instance.state.showTabTypingBadge,
											},
											() => {
												instance.props.plugin.settings.showTabTypingBadge =
													!instance.props.plugin.settings.showTabTypingBadge;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Empty Mentions/Unreads",
									type: "toggle",
									id: "tabs_Empty",
									checked: () => TopBarRef.current.state.showEmptyTabBadges,
									action: () => {
										instance.setState(
											{
												showEmptyTabBadges: !instance.state.showEmptyTabBadges,
											},
											() => {
												instance.props.plugin.settings.showEmptyTabBadges =
													!instance.props.plugin.settings.showEmptyTabBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									type: "separator",
									id: "header3_1",
								},
								{
									label: "Active Tabs:",
									id: "header3_2",
									disabled: true,
								},
								{
									type: "separator",
									id: "header3_3",
								},
								{
									label: "Show Mentions",
									type: "toggle",
									id: "activeTabs_Mentions",
									checked: () =>
										TopBarRef.current.state.showActiveTabMentionBadges,
									action: () => {
										instance.setState(
											{
												showActiveTabMentionBadges:
													!instance.state.showActiveTabMentionBadges,
											},
											() => {
												instance.props.plugin.settings.showActiveTabMentionBadges =
													!instance.props.plugin.settings
														.showActiveTabMentionBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Unreads",
									type: "toggle",
									id: "activeTabs_Unreads",
									checked: () =>
										TopBarRef.current.state.showActiveTabUnreadBadges,
									action: () => {
										instance.setState(
											{
												showActiveTabUnreadBadges:
													!instance.state.showActiveTabUnreadBadges,
											},
											() => {
												instance.props.plugin.settings.showActiveTabUnreadBadges =
													!instance.props.plugin.settings
														.showActiveTabUnreadBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Typing",
									type: "toggle",
									id: "activeTabs_Typing",
									checked: () =>
										TopBarRef.current.state.showActiveTabTypingBadge,
									action: () => {
										instance.setState(
											{
												showActiveTabTypingBadge:
													!instance.state.showActiveTabTypingBadge,
											},
											() => {
												instance.props.plugin.settings.showActiveTabTypingBadge =
													!instance.props.plugin.settings
														.showActiveTabTypingBadge;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
								{
									label: "Show Empty Mentions/Unreads",
									type: "toggle",
									id: "activeTabs_Empty",
									checked: () =>
										TopBarRef.current.state.showEmptyActiveTabBadges,
									action: () => {
										instance.setState(
											{
												showEmptyActiveTabBadges:
													!instance.state.showEmptyActiveTabBadges,
											},
											() => {
												instance.props.plugin.settings.showEmptyActiveTabBadges =
													!instance.props.plugin.settings
														.showEmptyActiveTabBadges;
												instance.props.plugin.saveSettings();
											},
										);
									},
								},
							],
						},
					],
				}),
			},
		]),
		{
			position: "right",
			align: "top",
		},
	);
}

//#endregion

//#region Global Common Functions

const closeAllDropdowns = () => {
	var dropdowns = document.getElementsByClassName(
		"channelTabs-favGroup-content",
	);
	var i;
	for (i = 0; i < dropdowns.length; i++) {
		var openDropdown = dropdowns[i];
		if (openDropdown.classList.contains("channelTabs-favGroupShow")) {
			openDropdown.classList.remove("channelTabs-favGroupShow");
		}
	}
	currentGroupOpened = -1;
};

const mergeLists = (...items) => {
	return items
		.filter((item) => item.include === undefined || item.include)
		.flatMap((item) => item.values);
};

const getGuildChannels = (...guildIds) => {
	const channels = ChannelStore.getGuildChannels
		? Object.values(ChannelStore.getGuildChannels())
		: ChannelStore.getMutableGuildChannels
			? Object.values(ChannelStore.getMutableGuildChannels())
			: [];
	return channels.filter(
		(c) =>
			guildIds.includes(c.guild_id) &&
			c.type !== DiscordConstants.ChannelTypes.GUILD_VOICE &&
			c.type !== DiscordConstants.ChannelTypes.GUILD_CATEGORY,
	);
};

const updateFavEntry = (fav) => {
	if (fav.guildId) {
		const channelIds = getGuildChannels(fav.guildId)
			.filter(
				(channel) =>
					PermissionUtils.can(Permissions.VIEW_CHANNEL, channel) &&
					!MutedStore.isChannelMuted(channel.guild_id, channel.id),
			)
			.map((channel) => channel.id);
		return {
			unreadCount: channelIds
				.map(
					(id) =>
						UnreadStateStore.getUnreadCount(id) ||
						UnreadStateStore.getMentionCount(id) ||
						(UnreadStateStore.hasUnread(id) ? 1 : 0),
				)
				.reduce((a, b) => a + b, 0),
			unreadEstimated:
				channelIds.some((id) => UnreadStateStore.isEstimated(id)) ||
				channelIds.some(
					(id) =>
						UnreadStateStore.getUnreadCount(id) === 0 &&
						UnreadStateStore.hasUnread(id),
				),
			hasUnread: channelIds.some((id) => UnreadStateStore.hasUnread(id)),
			mentionCount: channelIds
				.map((id) => UnreadStateStore.getMentionCount(id) || 0)
				.reduce((a, b) => a + b, 0),
			selected: SelectedGuildStore.getGuildId() === fav.guildId,
			isTyping: isChannelTyping(fav.channelId),
			currentStatus: getCurrentUserStatus(fav.url),
		};
	} else {
		return {
			unreadCount:
				UnreadStateStore.getUnreadCount(fav.channelId) ||
				UnreadStateStore.getMentionCount(fav.channelId) ||
				(UnreadStateStore.hasUnread(fav.channelId) ? 1 : 0),
			unreadEstimated:
				UnreadStateStore.isEstimated(fav.channelId) ||
				(UnreadStateStore.hasUnread(fav.channelId) &&
					UnreadStateStore.getUnreadCount(fav.channelId) === 0),
			hasUnread: UnreadStateStore.hasUnread(fav.channelId),
			mentionCount: UnreadStateStore.getMentionCount(fav.channelId),
			selected: SelectedChannelStore.getChannelId() === fav.channelId,
			isTyping: isChannelTyping(fav.channelId),
			currentStatus: getCurrentUserStatus(fav.url),
		};
	}
};

const getCurrentUserStatus = (pathname = location.pathname) => {
	const cId = (pathname.match(/^\/channels\/(\d+|@me|@favorites)\/(\d+)/) ||
		[])[2];
	if (cId) {
		const channel = ChannelStore.getChannel(cId);
		if (channel?.guild_id) {
			return "none";
		} else if (channel?.isDM()) {
			const user = UserStore.getUser(channel.getRecipientId());
			const status = UserStatusStore.getStatus(user.id);
			return status;
		} else if (channel?.isGroupDM()) {
			return "none";
		}
	}
	return "none";
};

const getChannelTypingTooltipText = (userIds) => {
	if (userIds) {
		const usernames = userIds
			.map((userId) => UserStore.getUser(userId))
			.filter((user) => user)
			.map((user) => user.tag);
		const remainingUserCount = userIds.length - usernames.length;
		const text = (() => {
			if (usernames.length === 0) {
				return `${remainingUserCount} user${remainingUserCount > 1 ? "s" : ""}`;
			} else if (userIds.length > 2) {
				const otherCount = usernames.length - 1 + remainingUserCount;
				return `${usernames[0]} and ${otherCount} other${otherCount > 1 ? "s" : ""}`;
			} else if (remainingUserCount === 0) {
				return usernames.join(", ");
			} else {
				return `${usernames.join(", ")} and ${remainingUserCount} other${remainingUserCount > 1 ? "s" : ""}`;
			}
		})();
		return text;
	}
	return "Someone is Typing...";
};

const getChannelTypingUsers = (channel_id) => {
	const channel = ChannelStore.getChannel(channel_id);
	const selfId = UserStore.getCurrentUser()?.id;
	if (channel) {
		const userIds = Object.keys(
			UserTypingStore.getTypingUsers(channel_id),
		).filter((uId) => uId !== selfId);
		const typingUsers = [...new Set(userIds)];
		return typingUsers;
	}
	return null;
};

const isChannelTyping = (channel_id) => {
	const channel = ChannelStore.getChannel(channel_id);
	const selfId = UserStore.getCurrentUser()?.id;
	if (channel) {
		const userIds = Object.keys(
			UserTypingStore.getTypingUsers(channel_id),
		).filter((uId) => uId !== selfId);
		const typingUsers = [...new Set(userIds)];
		if (typingUsers) return typingUsers.length === 0 ? false : true;
	}
	return false;
};

const isChannelDM = (channel_id) => {
	return (() => {
		const c = ChannelStore.getChannel(channel_id);
		return c && (c.isDM() || c.isGroupDM());
	})();
};

const getCurrentName = (pathname = location.pathname) => {
	const [_, gId, cId] =
		pathname.match(/^\/channels\/(\d+|@me|@favorites)\/\b(\d+|\w+(-\w+)*)\b/) ||
		[];
	if (cId) {
		const channel = ChannelStore.getChannel(cId);
		const guild = GuildStore.getGuild(gId);
		if (channel?.name) return (channel.guildId ? "@" : "#") + channel.name;
		else if (guild?.name) return guild.name;
		else if (channel?.rawRecipients)
			return (
				channel.rawRecipients
					.map((u) =>
						!u.display_name && !u.global_name && u.bot
							? `BOT (@${u.username})`
							: RelationshipStore.getNickname(u.id) ||
								u.display_name ||
								u.global_name ||
								u.username,
					)
					.join(", ") ||
				`${channel.rawRecipients[0].display_name || channel.rawRecipients[0].global_name || channel.rawRecipients[0].username} (@${channel.rawRecipients[0].username})`
			);
		else return pathname;
	} else {
		if (pathname === "/channels/@me") return "Friends";
		else if (pathname.match(/^\/[a-z\-]+$/))
			return pathname
				.substr(1)
				.split("-")
				.map((part) => part.substr(0, 1).toUpperCase() + part.substr(1))
				.join(" ");
		else return pathname;
	}
};

const getCurrentIconUrl = (pathname = location.pathname) => {
	try {
		const [_, gId, cId] =
			pathname.match(
				/^\/channels\/(\d+|@me|@favorites)(?:\/\b(\d+|\w+(-\w+)*)\b)?/,
			) || [];
		if (gId) {
			if (cId && gId.startsWith("@")) {
				const channel = ChannelStore.getChannel(cId);
				if (channel.isDM())
					return UserStore.getUser(channel.getRecipientId()).getAvatarURL();
				return IconUtilities.getChannelIconURL(channel);
			} else if (!gId.startsWith("@")) {
				return (
					IconUtilities.getGuildIconURL(GuildStore.getGuild(gId)) ??
					DefaultUserIconGrey
				);
			}
		}
	} catch (error) {
		console.error("Error in getCurrentIconUrl:", error);
	}

	return DefaultUserIconGrey;
};
//#endregion

//#region Tab Definitions

const GetTabStyles = (viewMode, item) => {
	if (item === "unreadBadge") {
		if (viewMode === "classic") return " channelTabs-classicBadgeAlignment";
		else if (viewMode === "alt") return " channelTabs-badgeAlignLeft";
	} else if (item === "mentionBadge") {
		if (viewMode === "classic") return " channelTabs-classicBadgeAlignment";
		else if (viewMode === "alt") return " channelTabs-badgeAlignRight";
	} else if (item === "typingBadge") {
		if (viewMode === "classic") return " channelTabs-classicBadgeAlignment";
		else if (viewMode === "alt") return " channelTabs-typingBadgeAlignment";
	}
	return "";
};

const TabIcon = (props) => (
	<img className="channelTabs-tabIcon" src={getCurrentIconUrl(props.url)} />
);

const TabStatus = (props) => (
	<rect
		width={6}
		height={6}
		x={14}
		y={14}
		className={
			"channelTabs-tabStatus" +
			(props.currentStatus == "online" ? " channelTabs-onlineIcon" : "") +
			(props.currentStatus == "idle" ? " channelTabs-idleIcon" : "") +
			(props.currentStatus == "dnd" ? " channelTabs-doNotDisturbIcon" : "") +
			(props.currentStatus == "offline" ? " channelTabs-offlineIcon" : "") +
			(props.currentStatus == "none" ? " channelTabs-noneIcon" : "")
		}
	/>
);

const TabName = (props) => (
	<span className="channelTabs-tabName">{props.name}</span>
);

const TabClose = (props) =>
	props.tabCount < 2 ? null : (
		<div
			className="channelTabs-closeTab"
			onClick={(e) => {
				e.stopPropagation();
				props.closeTab();
			}}
		>
			<Close />
		</div>
	);

const TabUnreadBadge = (props) => (
	<div
		className={
			"channelTabs-unreadBadge" +
			(!props.hasUnread ? " channelTabs-noUnread" : "") +
			GetTabStyles(props.viewMode, "unreadBadge")
		}
	>
		{props.unreadCount + (props.unreadEstimated ? "+" : "")}
	</div>
);

const TabMentionBadge = (props) => (
	<div
		className={
			"channelTabs-mentionBadge" +
			(props.mentionCount === 0 ? " channelTabs-noMention" : "") +
			GetTabStyles(props.viewMode, "mentionBadge")
		}
	>
		{props.mentionCount}
	</div>
);

const TabTypingBadge = ({ viewMode, isTyping, userIds }) => {
	if (isTyping === false || !Spinner) return null;
	const text = getChannelTypingTooltipText(userIds);
	return (
		<div
			className={
				"channelTabs-TypingContainer" + GetTabStyles(viewMode, "typingBadge")
			}
		>
			<Tooltip text={text} position="bottom">
				{(tooltipProps) => (
					<Spinner
						{...tooltipProps}
						type="pulsingEllipsis"
						className={`channelTabs-typingBadge`}
						animated={isTyping}
						style={{
							opacity: 0.7,
						}}
					/>
				)}
			</Tooltip>
		</div>
	);
};

const CozyTab = (props) => {
	return (
		<div>
			<svg
				className="channelTabs-tabIconWrapper"
				width="20"
				height="20"
				viewBox="0 0 20 20"
			>
				{props.currentStatus === "none" ? (
					<foreignObject x={0} y={0} width={20} height={20}>
						<TabIcon url={props.url} />
					</foreignObject>
				) : (
					<foreignObject x={0} y={0} width={20} height={20}>
						<TabIcon url={props.url} />
					</foreignObject>
				)}
				{props.currentStatus === "none" ? null : (
					<TabStatus currentStatus={props.currentStatus} />
				)}
			</svg>
			<TabName name={props.name} />
			<div className="channelTabs-gridContainer">
				<div className="channelTabs-gridItemBR">
					{!(props.selected
						? props.showActiveTabTypingBadge
						: props.showTabTypingBadge) ? null : (
						<TabTypingBadge
							viewMode="alt"
							isTyping={props.hasUsersTyping}
							userIds={getChannelTypingUsers(props.channelId)}
						/>
					)}
				</div>
				<div className="channelTabs-gridItemTL">
					{!(props.selected
						? props.showActiveTabUnreadBadges
						: props.showTabUnreadBadges) ? null : !props.channelId ||
					  (ChannelStore.getChannel(props.channelId)?.isPrivate() ??
							true) ? null : !(props.selected
							? props.showEmptyActiveTabBadges
							: props.showEmptyTabBadges) && !props.hasUnread ? null : (
						<TabUnreadBadge
							viewMode="alt"
							unreadCount={props.unreadCount}
							unreadEstimated={props.unreadEstimated}
							hasUnread={props.hasUnread}
							mentionCount={props.mentionCount}
						/>
					)}
				</div>
				<div className="channelTabs-gridItemTR">
					{!(props.selected
						? props.showActiveTabMentionBadges
						: props.showTabMentionBadges) ? null : !(props.selected
							? props.showEmptyActiveTabBadges
							: props.showEmptyTabBadges) && props.mentionCount === 0 ? null : (
						<TabMentionBadge viewMode="alt" mentionCount={props.mentionCount} />
					)}
				</div>
				<div className="channelTabs-gridItemBL" />
			</div>
		</div>
	);
};

const CompactTab = (props) => {
	return (
		<div>
			<svg
				className="channelTabs-tabIconWrapper"
				width="20"
				height="20"
				viewBox="0 0 20 20"
			>
				{props.currentStatus === "none" ? (
					<foreignObject x={0} y={0} width={20} height={20}>
						<TabIcon url={props.url} />
					</foreignObject>
				) : (
					<foreignObject x={0} y={0} width={20} height={20}>
						<TabIcon url={props.url} />
					</foreignObject>
				)}
				{props.currentStatus === "none" ? null : (
					<TabStatus currentStatus={props.currentStatus} />
				)}
			</svg>
			<TabName name={props.name} />
			{!(props.selected
				? props.showActiveTabTypingBadge
				: props.showTabTypingBadge) ? null : (
				<React.Fragment>
					<TabTypingBadge
						viewMode="classic"
						isTyping={props.hasUsersTyping}
						userIds={getChannelTypingUsers(props.channelId)}
					/>
				</React.Fragment>
			)}
			{!(props.selected
				? props.showActiveTabUnreadBadges
				: props.showTabUnreadBadges) ? null : (
				<React.Fragment>
					{!props.channelId ||
					(ChannelStore.getChannel(props.channelId)?.isPrivate() ??
						true) ? null : !(props.selected
							? props.showEmptyActiveTabBadges
							: props.showEmptyTabBadges) && !props.hasUnread ? null : (
						<TabUnreadBadge
							viewMode="classic"
							unreadCount={props.unreadCount}
							unreadEstimated={props.unreadEstimated}
							hasUnread={props.hasUnread}
							mentionCount={props.mentionCount}
						/>
					)}
				</React.Fragment>
			)}
			{!(props.selected
				? props.showActiveTabMentionBadges
				: props.showTabMentionBadges) ? null : (
				<React.Fragment>
					{!(props.selected
						? props.showEmptyActiveTabBadges
						: props.showEmptyTabBadges) && props.mentionCount === 0 ? null : (
						<TabMentionBadge
							viewMode="classic"
							mentionCount={props.mentionCount}
						/>
					)}
				</React.Fragment>
			)}
		</div>
	);
};

const Tab = (props) => (
	<div
		className={
			"channelTabs-tab" +
			(props.selected ? " channelTabs-selected" : "") +
			(props.minimized ? " channelTabs-minimized" : "") +
			(props.hasUnread ? " channelTabs-unread" : "") +
			(props.mentionCount > 0 ? " channelTabs-mention" : "")
		}
		data-mention-count={props.mentionCount}
		data-unread-count={props.unreadCount}
		data-unread-estimated={props.unreadEstimated}
		onClick={() => {
			if (!props.selected) props.switchToTab(props.tabIndex);
		}}
		onMouseUp={(e) => {
			if (e.button !== 1) return;
			e.preventDefault();
			props.closeTab(props.tabIndex);
		}}
		onContextMenu={(e) => {
			CreateTabContextMenu(props, e);
		}}
		onMouseOver={(e) => {
			if (currentTabDragIndex == props.tabIndex || currentTabDragIndex == -1)
				return;
			currentTabDragDestinationIndex = props.tabIndex;
		}}
		onMouseDown={(e) => {
			let mouseMove = (e2) => {
				if (
					Math.sqrt((e.pageX - e2.pageX) ** 2) > 20 ||
					Math.sqrt((e.pageY - e2.pageY) ** 2) > 20
				) {
					currentTabDragIndex = props.tabIndex;
					document.removeEventListener("mousemove", mouseMove);
					document.removeEventListener("mouseup", mouseUp);
					let dragging = (e3) => {
						if (currentTabDragIndex != currentTabDragDestinationIndex) {
							if (currentTabDragDestinationIndex != -1) {
								props.moveTab(
									currentTabDragIndex,
									currentTabDragDestinationIndex,
								);
								currentTabDragDestinationIndex = currentTabDragDestinationIndex;
								currentTabDragIndex = currentTabDragDestinationIndex;
							}
						}
					};
					let releasing = (e3) => {
						document.removeEventListener("mousemove", dragging);
						document.removeEventListener("mouseup", releasing);
						currentTabDragIndex = -1;
						currentTabDragDestinationIndex = -1;
					};
					document.addEventListener("mousemove", dragging);
					document.addEventListener("mouseup", releasing);
				}
			};
			let mouseUp = (_) => {
				document.removeEventListener("mousemove", mouseMove);
				document.removeEventListener("mouseup", mouseUp);
			};
			document.addEventListener("mousemove", mouseMove);
			document.addEventListener("mouseup", mouseUp);
		}}
	>
		{props.compactStyle ? CompactTab(props) : CozyTab(props)}
		<TabClose
			tabCount={props.tabCount}
			closeTab={() => props.closeTab(props.tabIndex)}
		/>
	</div>
);

//#endregion

//#region Fav Definitions

const FavMoveToGroupList = (props) => {
	var groups = props.favGroups.map((group, index) => {
		var entry = {
			label: group.name,
			id: "entry" + index,
			action: () => props.moveToFavGroup(props.favIndex, group.groupId),
		};

		return entry;
	});

	if (groups.length === 0) {
		return [
			{
				label: "No groups",
				disabled: true,
			},
		];
	}

	return groups;
};

const FavIcon = (props) => (
	<img className="channelTabs-favIcon" src={getCurrentIconUrl(props.url)} />
);

const FavStatus = (props) => (
	<rect
		width={6}
		height={6}
		x={14}
		y={14}
		className={
			"channelTabs-favStatus" +
			(props.currentStatus == "online" ? " channelTabs-onlineIcon" : "") +
			(props.currentStatus == "idle" ? " channelTabs-idleIcon" : "") +
			(props.currentStatus == "dnd" ? " channelTabs-doNotDisturbIcon" : "") +
			(props.currentStatus == "offline" ? " channelTabs-offlineIcon" : "") +
			(props.currentStatus == "none" ? " channelTabs-noneIcon" : "")
		}
	/>
);

const FavName = (props) => (
	<span className="channelTabs-favName">{props.name}</span>
);

const FavUnreadBadge = (props) => (
	<div
		className={
			"channelTabs-unreadBadge" +
			(!props.hasUnread ? " channelTabs-noUnread" : "")
		}
	>
		{props.unreadCount + (props.unreadEstimated ? "+" : "")}
	</div>
);

const FavMentionBadge = (props) => (
	<div
		className={
			"channelTabs-mentionBadge" +
			(props.mentionCount === 0 ? " channelTabs-noMention" : "")
		}
	>
		{props.mentionCount}
	</div>
);

const FavTypingBadge = ({ isTyping, userIds }) => {
	if (!Spinner) return null;
	const text = getChannelTypingTooltipText(userIds);
	return (
		<Tooltip text={text} position="bottom">
			{(tooltipProps) => (
				<div
					{...tooltipProps}
					className={
						"channelTabs-typingBadge" +
						(!isTyping ? " channelTabs-noTyping" : "")
					}
				>
					<Spinner type="pulsingEllipsis" animated={!isTyping ? false : true} />
				</div>
			)}
		</Tooltip>
	);
};

const Fav = (props) => (
	<div
		className={
			"channelTabs-fav" +
			(props.channelId
				? " channelTabs-channel"
				: props.guildId
					? " channelTabs-guild"
					: "") +
			(props.selected ? " channelTabs-selected" : "") +
			(props.minimized ? " channelTabs-minimized" : "") +
			(props.hasUnread ? " channelTabs-unread" : "") +
			(props.mentionCount > 0 ? " channelTabs-mention" : "")
		}
		data-mention-count={props.mentionCount}
		data-unread-count={props.unreadCount}
		data-unread-estimated={props.unreadEstimated}
		onClick={() =>
			props.guildId
				? NavigationUtils.transitionToGuild(
						props.guildId,
						SelectedChannelStore.getChannelId(props.guildId),
					)
				: NavigationUtils.transitionTo(props.url)
		}
		onMouseUp={(e) => {
			if (e.button !== 1) return;
			e.preventDefault();
			props.openInNewTab();
		}}
		onContextMenu={(e) => {
			CreateFavContextMenu(props, e);
		}}
		onMouseOver={(e) => {
			if (currentFavDragIndex == props.favIndex || currentFavDragIndex == -1)
				return;
			currentFavDragDestinationIndex = props.favIndex;
		}}
		onMouseDown={(e) => {
			let mouseMove = (e2) => {
				if (
					Math.sqrt((e.pageX - e2.pageX) ** 2) > 20 ||
					Math.sqrt((e.pageY - e2.pageY) ** 2) > 20
				) {
					currentFavDragIndex = props.favIndex;
					document.removeEventListener("mousemove", mouseMove);
					document.removeEventListener("mouseup", mouseUp);
					let dragging = (e3) => {
						if (currentFavDragIndex != currentFavDragDestinationIndex) {
							if (currentFavDragDestinationIndex != -1) {
								props.moveFav(
									currentFavDragIndex,
									currentFavDragDestinationIndex,
								);
								currentFavDragDestinationIndex = currentFavDragDestinationIndex;
								currentFavDragIndex = currentFavDragDestinationIndex;
							}
						}
					};
					let releasing = (e3) => {
						document.removeEventListener("mousemove", dragging);
						document.removeEventListener("mouseup", releasing);
						currentFavDragIndex = -1;
						currentFavDragDestinationIndex = -1;
					};
					document.addEventListener("mousemove", dragging);
					document.addEventListener("mouseup", releasing);
				}
			};
			let mouseUp = (_) => {
				document.removeEventListener("mousemove", mouseMove);
				document.removeEventListener("mouseup", mouseUp);
			};
			document.addEventListener("mousemove", mouseMove);
			document.addEventListener("mouseup", mouseUp);
		}}
	>
		<svg
			className="channelTabs-favIconWrapper"
			width="20"
			height="20"
			viewBox="0 0 20 20"
		>
			{props.currentStatus === "none" ? (
				<foreignObject x={0} y={0} width={20} height={20}>
					<FavIcon url={props.url} />
				</foreignObject>
			) : (
				<foreignObject x={0} y={0} width={20} height={20}>
					<FavIcon url={props.url} />
				</foreignObject>
			)}
			{props.currentStatus === "none" ? null : (
				<FavStatus currentStatus={props.currentStatus} />
			)}
		</svg>
		<FavName name={props.name} />
		{!(
			props.showFavUnreadBadges &&
			(props.channelId || props.guildId)
		) ? null : (
			<React.Fragment>
				{isChannelDM(props.channelId) ? null : !props.showEmptyFavBadges &&
				  props.unreadCount === 0 ? null : (
					<FavUnreadBadge
						unreadCount={props.unreadCount}
						unreadEstimated={props.unreadEstimated}
						hasUnread={props.hasUnread}
					/>
				)}
			</React.Fragment>
		)}
		{!(
			props.showFavMentionBadges &&
			(props.channelId || props.guildId)
		) ? null : (
			<React.Fragment>
				{!props.showEmptyFavBadges && props.mentionCount === 0 ? null : (
					<FavMentionBadge mentionCount={props.mentionCount} />
				)}
			</React.Fragment>
		)}
		{!(
			props.showFavTypingBadge &&
			(props.channelId || props.guildId)
		) ? null : (
			<React.Fragment>
				<FavTypingBadge
					isTyping={props.isTyping}
					userIds={getChannelTypingUsers(props.channelId)}
				/>
			</React.Fragment>
		)}
	</div>
);

//#endregion

//#region Misc. Definitions

const NewTab = (props) => (
	<div className="channelTabs-newTab" onClick={props.openNewTab}>
		<PlusAlt />
	</div>
);

//#endregion

//#region FavItems/FavFolders Definitions

const NoFavItemsPlaceholder = (props) => (
	<span className="channelTabs-noFavNotice">
		You don't have any favs yet. Right click a tab to mark it as favourite. You
		can disable this bar in the settings.
	</span>
);

const FavItems = (props) => {
	var isDefault = props.group === null;

	return props.favs
		.filter((item) => item)
		.map((fav, favIndex) => {
			var canCreate = isDefault
				? fav.groupId === -1
				: fav.groupId === props.group.groupId;
			return canCreate
				? React.createElement(
						Flux.connectStores(
							[UnreadStateStore, UserTypingStore, SelectedChannelStore],
							() => updateFavEntry(fav),
						)((result) => (
							<Fav
								name={fav.name}
								url={fav.url}
								favCount={props.favs.length}
								favGroups={props.favGroups}
								rename={() => props.rename(fav.name, favIndex)}
								delete={() => props.delete(favIndex)}
								openInNewTab={() => props.openInNewTab(fav)}
								moveLeft={() =>
									props.move(
										favIndex,
										(favIndex + props.favs.length - 1) % props.favs.length,
									)
								}
								moveRight={() =>
									props.move(favIndex, (favIndex + 1) % props.favs.length)
								}
								minimizeFav={props.minimizeFav}
								minimized={fav.minimized}
								moveToFavGroup={props.moveToFavGroup}
								moveFav={props.move}
								favIndex={favIndex}
								channelId={fav.channelId}
								guildId={fav.guildId}
								groupId={fav.groupId}
								showFavUnreadBadges={props.showFavUnreadBadges}
								showFavMentionBadges={props.showFavMentionBadges}
								showFavTypingBadge={props.showFavTypingBadge}
								showEmptyFavBadges={props.showEmptyFavBadges}
								isTyping={isChannelTyping(fav.channelId)}
								currentStatus={getCurrentUserStatus(fav.url)}
								{...result}
							/>
						)),
					)
				: null;
		});
};

const FavFolder = (props) => (
	<div
		className="channelTabs-favGroup"
		onContextMenu={(e) => {
			CreateFavGroupContextMenu(props, e);
		}}
		onMouseOver={(e) => {
			if (
				currentGroupDragIndex == props.groupIndex ||
				currentGroupDragIndex == -1
			)
				return;
			currentGroupDragDestinationIndex = props.groupIndex;
		}}
		onMouseDown={(e) => {
			let mouseMove = (e2) => {
				if (
					Math.sqrt((e.pageX - e2.pageX) ** 2) > 20 ||
					Math.sqrt((e.pageY - e2.pageY) ** 2) > 20
				) {
					currentGroupDragIndex = props.groupIndex;
					document.removeEventListener("mousemove", mouseMove);
					document.removeEventListener("mouseup", mouseUp);
					let dragging = (e3) => {
						if (currentGroupDragIndex != currentGroupDragDestinationIndex) {
							if (currentGroupDragDestinationIndex != -1) {
								props.moveFavGroup(
									currentGroupDragIndex,
									currentGroupDragDestinationIndex,
								);
								currentGroupDragDestinationIndex =
									currentGroupDragDestinationIndex;
								currentGroupDragIndex = currentGroupDragDestinationIndex;
							}
						}
					};
					let releasing = (e3) => {
						document.removeEventListener("mousemove", dragging);
						document.removeEventListener("mouseup", releasing);
						currentGroupDragIndex = -1;
						currentGroupDragDestinationIndex = -1;
					};
					document.addEventListener("mousemove", dragging);
					document.addEventListener("mouseup", releasing);
				}
			};
			let mouseUp = (_) => {
				document.removeEventListener("mousemove", mouseMove);
				document.removeEventListener("mouseup", mouseUp);
			};
			document.addEventListener("mousemove", mouseMove);
			document.addEventListener("mouseup", mouseUp);
		}}
	>
		<div
			className="channelTabs-favGroupBtn"
			onClick={() => {
				closeAllDropdowns();
				document
					.getElementById("favGroup-content-" + props.groupIndex)
					.classList.toggle("channelTabs-favGroupShow");
				currentGroupOpened = props.groupIndex;
			}}
		>
			{props.favGroup.name}
			{props.showFavGroupMentionBadges ? (
				props.mentionCountGroup == 0 &&
				!props.showEmptyFavGroupBadges ? null : (
					<FavMentionBadge mentionCount={props.mentionCountGroup} />
				)
			) : null}
			{props.showFavGroupUnreadBadges ? (
				props.unreadCountGroup == 0 && !props.showEmptyFavGroupBadges ? null : (
					<FavUnreadBadge
						unreadCount={props.unreadCountGroup}
						unreadEstimated={props.unreadEstimatedGroup}
						hasUnread={props.hasUnreadGroup}
					/>
				)
			) : null}
			{props.showFavGroupTypingBadge && props.isTypingGroup ? (
				<FavTypingBadge isTyping={props.isTypingGroup} userIds={null} />
			) : null}
		</div>
		<div
			className={
				"channelTabs-favGroup-content" +
				(currentGroupOpened === props.groupIndex
					? " channelTabs-favGroupShow"
					: "")
			}
			id={"favGroup-content-" + props.groupIndex}
		>
			<FavItems group={props.favGroup} {...props} />
		</div>
	</div>
);

const FavFolders = (props) => {
	return props.favGroups.map((favGroup, index) => {
		return React.createElement(
			Flux.connectStores(
				[UnreadStateStore, SelectedChannelStore, UserTypingStore],
				() => {
					var unreadCount = 0;
					var unreadEstimated = 0;
					var hasUnread = false;
					var mentionCount = 0;
					var isTyping = false;

					props.favs
						.filter((item) => item)
						.forEach((fav, favIndex) => {
							var canCreate = fav.groupId === favGroup.groupId;
							if (canCreate) {
								var hasUnreads = isChannelDM(fav.channelId);
								var result = updateFavEntry(fav);
								if (!hasUnreads) unreadCount += result.unreadCount;
								mentionCount += result.mentionCount;
								if (!hasUnreads) unreadEstimated += result.unreadEstimated;
								if (!hasUnreads)
									hasUnread = result.hasUnread ? true : hasUnread;
								isTyping = result.isTyping ? true : isTyping;
							}
						});
					return {
						unreadCount,
						mentionCount,
						unreadEstimated,
						hasUnread,
						isTyping,
					};
				},
			)((result) => {
				return (
					<FavFolder
						groupIndex={index}
						groupCount={props.favGroups.length}
						favGroup={favGroup}
						unreadCountGroup={result.unreadCount}
						unreadEstimatedGroup={result.unreadEstimated}
						mentionCountGroup={result.mentionCount}
						hasUnreadGroup={result.hasUnread}
						isTypingGroup={result.isTyping}
						showFavGroupUnreadBadges={props.showFavGroupUnreadBadges}
						showFavGroupMentionBadges={props.showFavGroupMentionBadges}
						showFavGroupTypingBadge={props.showFavGroupTypingBadge}
						showEmptyFavGroupBadges={props.showEmptyFavGroupBadges}
						{...props}
					/>
				);
			}),
		);
	});
};

//#endregion

//#region FavBar/TopBar/TabBar Definitions

function nextTab() {
	if (TopBarRef.current)
		TopBarRef.current.switchToTab(
			(TopBarRef.current.state.selectedTabIndex + 1) %
				TopBarRef.current.state.tabs.length,
		);
}

function previousTab() {
	if (TopBarRef.current)
		TopBarRef.current.switchToTab(
			(TopBarRef.current.state.selectedTabIndex -
				1 +
				TopBarRef.current.state.tabs.length) %
				TopBarRef.current.state.tabs.length,
		);
}

function closeCurrentTab() {
	if (TopBarRef.current)
		TopBarRef.current.closeTab(TopBarRef.current.state.selectedTabIndex);
}

async function* animate(duration) {
	const start = Date.now();
	let last = 0;
	while (true) {
		const now = Date.now();
		const elapsed = now - start;
		const progress = Math.min(elapsed / duration, 1);
		yield progress - last;
		last = progress;
		if (progress === 1) break;
		await new Promise((resolve) => requestAnimationFrame(resolve));
	}
}

// This component allows users to smoothly scroll horizontally using the mouse wheel.
function HorizontalScroll(props) {
	const container = React.useRef(null);

	let target = 0;
	function expDecay(a, b, decay, dt) {
		return b + (a - b) * Math.exp((-decay * dt) / 1000);
	}

	let last = Date.now();
	function update() {
		container.current.scrollLeft = expDecay(
			container.current.scrollLeft,
			target,
			10,
			Date.now() - last,
		);
		last = Date.now();

		if (Math.abs(container.current.scrollLeft - target) > 1) {
			requestAnimationFrame(update);
		}
	}

	return (
		<div
			ref={container}
			onWheel={async (event) => {
				target += event.deltaY;
				target = Math.max(
					0,
					Math.min(
						target,
						container.current.scrollWidth - container.current.clientWidth,
					),
				);
				update();
			}}
			{...props}
		>
			{props.children}
		</div>
	);
}

const TabBar = (props) => (
	<div className="channelTabs-tabContainer" data-tab-count={props.tabs.length}>
		{props.leading}
		<div className="channelTabs-tabNav">
			<div
				className="channelTabs-tabNavLeft"
				onClick={() => {
					TopBarRef.current.state.useStandardNav
						? NavShortcuts.NAVIGATE_BACK.action()
						: previousTab();
				}}
				onContextMenu={() => {
					!TopBarRef.current.state.useStandardNav
						? NavShortcuts.NAVIGATE_BACK.action()
						: previousTab();
				}}
			>
				<LeftCaret />
			</div>
			<div
				className="channelTabs-tabNavRight"
				onClick={() => {
					TopBarRef.current.state.useStandardNav
						? NavShortcuts.NAVIGATE_FORWARD.action()
						: nextTab();
				}}
				onContextMenu={() => {
					!TopBarRef.current.state.useStandardNav
						? NavShortcuts.NAVIGATE_FORWARD.action()
						: nextTab();
				}}
			>
				<RightCaret />
			</div>
			<div
				className="channelTabs-tabNavClose"
				onClick={() => {
					closeCurrentTab();
				}}
				onContextMenu={props.openNewTab}
			>
				<Close />
			</div>
		</div>
		<HorizontalScroll
			style={{
				display: "flex",
				overflowX: "auto",
				scrollbarWidth: "none",
			}}
		>
			{props.tabs.map((tab, tabIndex) =>
				React.createElement(
					Flux.connectStores(
						[UnreadStateStore, UserTypingStore, UserStatusStore],
						() => ({
							unreadCount: UnreadStateStore.getUnreadCount(tab.channelId),
							unreadEstimated: UnreadStateStore.isEstimated(tab.channelId),
							hasUnread: UnreadStateStore.hasUnread(tab.channelId),
							mentionCount: UnreadStateStore.getMentionCount(tab.channelId),
							hasUsersTyping: isChannelTyping(tab.channelId),
							currentStatus: getCurrentUserStatus(tab.url),
						}),
					)((result) => (
						<Tab
							switchToTab={props.switchToTab}
							closeTab={props.closeTab}
							addToFavs={props.addToFavs}
							minimizeTab={props.minimizeTab}
							moveLeft={() =>
								props.move(
									tabIndex,
									(tabIndex + props.tabs.length - 1) % props.tabs.length,
								)
							}
							moveRight={() =>
								props.move(tabIndex, (tabIndex + 1) % props.tabs.length)
							}
							openInNewTab={() => props.openInNewTab(tab)}
							moveTab={props.move}
							tabCount={props.tabs.length}
							tabIndex={tabIndex}
							name={tab.name}
							currentStatus={result.currentStatus}
							url={tab.url}
							selected={tab.selected}
							minimized={tab.minimized}
							channelId={tab.channelId}
							unreadCount={result.unreadCount}
							unreadEstimated={result.unreadEstimated}
							hasUnread={result.hasUnread}
							mentionCount={result.mentionCount}
							hasUsersTyping={result.hasUsersTyping}
							showTabUnreadBadges={props.showTabUnreadBadges}
							showTabMentionBadges={props.showTabMentionBadges}
							showTabTypingBadge={props.showTabTypingBadge}
							showEmptyTabBadges={props.showEmptyTabBadges}
							showActiveTabUnreadBadges={props.showActiveTabUnreadBadges}
							showActiveTabMentionBadges={props.showActiveTabMentionBadges}
							showActiveTabTypingBadge={props.showActiveTabTypingBadge}
							showEmptyActiveTabBadges={props.showEmptyActiveTabBadges}
							compactStyle={props.compactStyle}
						/>
					)),
				),
			)}
		</HorizontalScroll>
		<NewTab openNewTab={props.openNewTab} />
		{props.trailing}
	</div>
);

const FavBar = (props) => (
	<div
		className={
			"channelTabs-favContainer" +
			(props.favs.length == 0 ? " channelTabs-noFavs" : "")
		}
		data-fav-count={props.favs.length}
		onContextMenu={(e) => {
			CreateFavBarContextMenu(props, e);
		}}
	>
		{props.leading}
		<FavFolders {...props} />
		{props.favs.length > 0 ? (
			<FavItems group={null} {...props} />
		) : (
			<NoFavItemsPlaceholder />
		)}
		<div className="channelTabs-newTab" onClick={() => props.addFavGroup()}>
			<PlusAlt />
		</div>
		{props.trailing}
	</div>
);

const TopBar = class TopBar extends React.Component {
	//#region Constructor

	constructor(props) {
		super(props);
		this.state = {
			selectedTabIndex: Math.max(
				props.tabs.findIndex((tab) => tab.selected),
				0,
			),
			tabs: props.tabs,
			favs: props.favs,
			favGroups: props.favGroups,
			reopenLastChannel: props.reopenLastChannel,
			showTabBar: props.showTabBar,
			showFavBar: props.showFavBar,
			showFavUnreadBadges: props.showFavUnreadBadges,
			showFavMentionBadges: props.showFavMentionBadges,
			showFavTypingBadge: props.showFavTypingBadge,
			showEmptyFavBadges: props.showEmptyFavBadges,
			showTabUnreadBadges: props.showTabUnreadBadges,
			showTabMentionBadges: props.showTabMentionBadges,
			showTabTypingBadge: props.showTabTypingBadge,
			showEmptyTabBadges: props.showEmptyTabBadges,
			showActiveTabUnreadBadges: props.showActiveTabUnreadBadges,
			showActiveTabMentionBadges: props.showActiveTabMentionBadges,
			showActiveTabTypingBadge: props.showActiveTabTypingBadge,
			showEmptyActiveTabBadges: props.showEmptyActiveTabBadges,
			showFavGroupUnreadBadges: props.showFavGroupUnreadBadges,
			showFavGroupMentionBadges: props.showFavGroupMentionBadges,
			showFavGroupTypingBadge: props.showFavGroupTypingBadge,
			showEmptyFavGroupBadges: props.showEmptyFavGroupBadges,
			addFavGroup: props.addFavGroup,
			compactStyle: props.compactStyle,
			showQuickSettings: props.showQuickSettings,
			showNavButtons: props.showNavButtons,
			alwaysFocusNewTabs: props.alwaysFocusNewTabs,
			useStandardNav: props.useStandardNav,
		};
		this.switchToTab = this.switchToTab.bind(this);
		this.closeTab = this.closeTab.bind(this);
		this.saveChannel = this.saveChannel.bind(this);
		this.renameFav = this.renameFav.bind(this);
		this.deleteFav = this.deleteFav.bind(this);
		this.addToFavs = this.addToFavs.bind(this);
		this.minimizeTab = this.minimizeTab.bind(this);
		this.minimizeFav = this.minimizeFav.bind(this);
		this.moveTab = this.moveTab.bind(this);
		this.moveFav = this.moveFav.bind(this);
		this.addFavGroup = this.addFavGroup.bind(this);
		this.moveToFavGroup = this.moveToFavGroup.bind(this);
		this.renameFavGroup = this.renameFavGroup.bind(this);
		this.removeFavGroup = this.removeFavGroup.bind(this);
		this.moveFavGroup = this.moveFavGroup.bind(this);
		this.openNewTab = this.openNewTab.bind(this);
		this.openTabInNewTab = this.openTabInNewTab.bind(this);
		this.openFavInNewTab = this.openFavInNewTab.bind(this);
		this.openFavGroupInNewTab = this.openFavGroupInNewTab.bind(this);
		this.hideFavBar = this.hideFavBar.bind(this);
	}

	//#endregion

	//#region Tab Functions

	minimizeTab(tabIndex) {
		this.setState(
			{
				tabs: this.state.tabs.map((tab, index) => {
					if (index == tabIndex)
						return Object.assign({}, tab, {
							minimized: !tab.minimized,
						});
					else return Object.assign({}, tab); // or return tab;
				}),
			},
			this.props.plugin.saveSettings,
		);
	}

	switchToTab(tabIndex) {
		this.setState(
			{
				tabs: this.state.tabs.map((tab, index) => {
					if (index === tabIndex) {
						return Object.assign({}, tab, { selected: true });
					} else {
						return Object.assign({}, tab, { selected: false });
					}
				}),
				selectedTabIndex: tabIndex,
			},
			this.props.plugin.saveSettings,
		);
		switching = true;
		NavigationUtils.transitionTo(this.state.tabs[tabIndex].url);
		switching = false;
	}

	closeTab(tabIndex, mode) {
		if (this.state.tabs.length === 1) return;
		if (mode === "single" || mode == null) {
			this.setState(
				{
					tabs: this.state.tabs.filter((tab, index) => index !== tabIndex),
					selectedTabIndex: Math.max(
						0,
						this.state.selectedTabIndex -
							(this.state.selectedTabIndex >= tabIndex ? 1 : 0),
					),
				},
				() => {
					if (!this.state.tabs[this.state.selectedTabIndex].selected) {
						this.switchToTab(this.state.selectedTabIndex);
					}
					this.props.plugin.saveSettings();
				},
			);
		} else if (mode == "other") {
			this.setState(
				{
					tabs: this.state.tabs.filter((tab, index) => index === tabIndex),
					selectedTabIndex: 0,
				},
				() => {
					if (!this.state.tabs[0].selected) {
						this.switchToTab(this.state.selectedTabIndex);
					}
					this.props.plugin.saveSettings();
				},
			);
		} else if (mode === "left") {
			this.setState(
				{
					tabs: this.state.tabs.filter((tab, index) => index >= tabIndex),
					selectedTabIndex: 0,
				},
				() => {
					if (!this.state.tabs[this.state.selectedTabIndex].selected) {
						this.switchToTab(this.state.selectedTabIndex);
					}
					this.props.plugin.saveSettings();
				},
			);
		} else if (mode === "right") {
			this.setState(
				{
					tabs: this.state.tabs.filter((tab, index) => index <= tabIndex),
					selectedTabIndex: tabIndex,
				},
				() => {
					if (!this.state.tabs[this.state.selectedTabIndex].selected) {
						this.switchToTab(this.state.selectedTabIndex);
					}
					this.props.plugin.saveSettings();
				},
			);
		}
	}

	moveTab(fromIndex, toIndex) {
		if (fromIndex === toIndex) return;
		const tabs = this.state.tabs.filter((tab, index) => index !== fromIndex);
		tabs.splice(toIndex, 0, this.state.tabs[fromIndex]);
		this.setState(
			{
				tabs,
				selectedTabIndex: tabs.findIndex((tab) => tab.selected),
			},
			this.props.plugin.saveSettings,
		);
	}

	//#endregion

	//#region Fav Functions

	hideFavBar() {
		this.setState(
			{
				showFavBar: false,
			},
			() => {
				this.props.plugin.settings.showFavBar = false;
				this.props.plugin.saveSettings();
			},
		);
	}

	renameFav(currentName, favIndex) {
		let name = currentName;
		BdApi.showConfirmationModal(
			"What should the new name be?",
			<Textbox onChange={(newContent) => (name = newContent.trim())} />,
			{
				onConfirm: () => {
					if (!name) return;
					this.setState(
						{
							favs: this.state.favs.map((fav, index) => {
								if (index === favIndex) return Object.assign({}, fav, { name });
								else return Object.assign({}, fav);
							}),
						},
						this.props.plugin.saveSettings,
					);
				},
			},
		);
	}

	minimizeFav(favIndex) {
		this.setState(
			{
				favs: this.state.favs.map((fav, index) => {
					if (index == favIndex)
						return Object.assign({}, fav, {
							minimized: !fav.minimized,
						});
					else return Object.assign({}, fav); // or return tab;
				}),
			},
			this.props.plugin.saveSettings,
		);
	}

	deleteFav(favIndex) {
		this.setState(
			{
				favs: this.state.favs.filter((fav, index) => index !== favIndex),
			},
			this.props.plugin.saveSettings,
		);
	}

	/**
	 * The guildId parameter is only passed when the guild is saved and not the channel alone.
	 * This indicates that the currently selected channel needs to get selected instead of the
	 * provided channel id (which should be empty when a guildId is provided)
	 */
	addToFavs(name, url, channelId, guildId) {
		var groupId = -1;
		this.setState(
			{
				favs: [...this.state.favs, { name, url, channelId, guildId, groupId }],
			},
			this.props.plugin.saveSettings,
		);
	}

	moveFav(fromIndex, toIndex) {
		if (fromIndex === toIndex) return;
		const favs = this.state.favs.filter((fav, index) => index !== fromIndex);
		favs.splice(toIndex, 0, this.state.favs[fromIndex]);
		this.setState({ favs }, this.props.plugin.saveSettings);
	}

	//#endregion

	//#region Fav Group Functions

	createFavGroupId() {
		var generatedId = this.state.favGroups.length;
		var isUnique = false;
		var duplicateFound = false;

		while (!isUnique) {
			for (var i = 0; i < this.state.favGroups.length; i++) {
				var group = this.state.favGroups[i];
				if (generatedId === group.groupId) duplicateFound = true;
			}
			if (!duplicateFound) isUnique = true;
			else {
				generatedId++;
				duplicateFound = false;
			}
		}
		return generatedId;
	}

	addFavGroup() {
		let name = "New Group";
		BdApi.showConfirmationModal(
			"What should the new name be?",
			<Textbox onChange={(newContent) => (name = newContent.trim())} />,
			{
				onConfirm: () => {
					if (!name) return;
					this.setState(
						{
							favGroups: [
								...this.state.favGroups,
								{ name: name, groupId: this.createFavGroupId() },
							],
						},
						this.props.plugin.saveSettings,
					);
				},
			},
		);
	}

	renameFavGroup(currentName, groupId) {
		let name = currentName;
		BdApi.showConfirmationModal(
			"What should the new name be?",
			<Textbox onChange={(newContent) => (name = newContent.trim())} />,
			{
				onConfirm: () => {
					if (!name) return;
					this.setState(
						{
							favGroups: this.state.favGroups.map((group, index) => {
								if (group.groupId === groupId)
									return Object.assign({}, group, { name });
								else return Object.assign({}, group);
							}),
						},
						this.props.plugin.saveSettings,
					);
				},
			},
		);
	}

	removeFavGroup(groupId) {
		this.setState(
			{
				favGroups: this.state.favGroups.filter(
					(group, index) => group.groupId !== groupId,
				),
			},
			this.props.plugin.saveSettings,
		);

		this.setState(
			{
				favs: this.state.favs.map((fav, index) => {
					if (fav.groupId === groupId)
						return Object.assign({}, fav, { groupId: -1 });
					else return Object.assign({}, fav);
				}),
			},
			this.props.plugin.saveSettings,
		);
	}

	moveToFavGroup(favIndex, groupId) {
		this.setState(
			{
				favs: this.state.favs.map((fav, index) => {
					if (index === favIndex) {
						return Object.assign({}, fav, { groupId: groupId });
					} else {
						return Object.assign({}, fav);
					}
				}),
			},
			this.props.plugin.saveSettings,
		);
	}

	moveFavGroup(fromIndex, toIndex) {
		if (fromIndex === toIndex) return;
		const favGroups = this.state.favGroups.filter(
			(group, index) => index !== fromIndex,
		);
		favGroups.splice(toIndex, 0, this.state.favGroups[fromIndex]);
		this.setState({ favGroups: favGroups }, this.props.plugin.saveSettings);
	}

	//#endregion

	//#region New Tab Functions

	saveChannel(guildId, channelId, name) {
		if (this.state.alwaysFocusNewTabs) {
			//Open and Focus New Tab
			const newTabIndex = this.state.tabs.length;
			this.setState(
				{
					tabs: [
						...this.state.tabs.map((tab) =>
							Object.assign(tab, { selected: false }),
						),
						{
							url: `/channels/${guildId || "@me"}/${channelId}`,
							name,
							channelId,
							minimized: false,
							groupId: -1,
						},
					],
					selectedTabIndex: newTabIndex,
				},
				() => {
					this.props.plugin.saveSettings();
					this.switchToTab(newTabIndex);
				},
			);
		} else {
			//Open New Tab
			this.setState(
				{
					tabs: [
						...this.state.tabs,
						{
							url: `/channels/${guildId || "@me"}/${channelId}`,
							name,
							channelId,
							minimized: false,
							groupId: -1,
						},
					],
				},
				this.props.plugin.saveSettings,
			);
		}
	}

	openNewTab() {
		const newTabIndex = this.state.tabs.length;
		this.setState(
			{
				tabs: [
					...this.state.tabs.map((tab) =>
						Object.assign(tab, { selected: false }),
					),
					{
						url: "/channels/@me",
						name: "Friends",
						selected: true,
						channelId: undefined,
					},
				],
				selectedTabIndex: newTabIndex,
			},
			() => {
				this.props.plugin.saveSettings();
				this.switchToTab(newTabIndex);
			},
		);
	}

	openTabInNewTab(tab) {
		//Used to Duplicate Tabs
		this.setState(
			{
				tabs: [...this.state.tabs, Object.assign({}, tab, { selected: false })],
			},
			this.props.plugin.saveSettings,
		);
	}

	openFavInNewTab(fav) {
		if (!Array.isArray(fav)) fav = [fav];
		//Opens and Focuses New Tab
		const newTabIndex = this.state.tabs.length + fav.length - 1;
		this.setState(
			{
				tabs: [
					...this.state.tabs,
					...fav.map((fav) => {
						const url = fav.url + (fav.guildId ? `/${fav.guildId}` : "");
						return {
							url,
							selected: false,
							name: getCurrentName(url),
							currentStatus: getCurrentUserStatus(url),
							channelId:
								fav.channelId || SelectedChannelStore.getChannelId(fav.guildId),
						};
					}),
				],
			},
			() => {
				this.props.plugin.saveSettings();
				if (this.state.alwaysFocusNewTabs) this.switchToTab(newTabIndex);
			},
		);
	}

	openFavGroupInNewTab(groupId) {
		this.openFavInNewTab(
			this.state.favs.filter((fav) => fav && fav.groupId === groupId),
		);
	}

	//#endregion

	//#region Other Functions

	render() {
		const trailing = (
			<div className="channelTabs-trailing">
				{this.state.showQuickSettings && (
					<div
						id="channelTabs-settingsMenu"
						onClick={(e) => {
							CreateSettingsContextMenu(this, e);
						}}
					>
						{SettingsMenuIcon}
					</div>
				)}
				{this.props.trailing}
			</div>
		);

		return (
			<div id="channelTabs-container">
				{!this.state.showTabBar ? null : (
					<TabBar
						leading={this.props.leading}
						trailing={trailing}
						tabs={this.state.tabs}
						showTabUnreadBadges={this.state.showTabUnreadBadges}
						showTabMentionBadges={this.state.showTabMentionBadges}
						showTabTypingBadge={this.state.showTabTypingBadge}
						showEmptyTabBadges={this.state.showEmptyTabBadges}
						showActiveTabUnreadBadges={this.state.showActiveTabUnreadBadges}
						showActiveTabMentionBadges={this.state.showActiveTabMentionBadges}
						showActiveTabTypingBadge={this.state.showActiveTabTypingBadge}
						showEmptyActiveTabBadges={this.state.showEmptyActiveTabBadges}
						compactStyle={this.state.compactStyle}
						privacyMode={this.state.privacyMode}
						radialStatusMode={this.state.radialStatusMode}
						tabWidthMin={this.state.tabWidthMin}
						closeTab={this.closeTab}
						switchToTab={this.switchToTab}
						openNewTab={this.openNewTab}
						openInNewTab={this.openTabInNewTab}
						addToFavs={this.addToFavs}
						minimizeTab={this.minimizeTab}
						move={this.moveTab}
					/>
				)}
				{!this.state.showFavBar ? null : (
					<FavBar
						leading={this.state.showTabBar ? null : this.props.leading}
						trailing={this.state.showTabBar ? null : trailing}
						favs={this.state.favs}
						favGroups={this.state.favGroups}
						showFavUnreadBadges={this.state.showFavUnreadBadges}
						showFavMentionBadges={this.state.showFavMentionBadges}
						showFavTypingBadge={this.state.showFavTypingBadge}
						showEmptyFavBadges={this.state.showEmptyFavBadges}
						privacyMode={this.state.privacyMode}
						radialStatusMode={this.state.radialStatusMode}
						showFavGroupUnreadBadges={this.state.showFavGroupUnreadBadges}
						showFavGroupMentionBadges={this.state.showFavGroupMentionBadges}
						showFavGroupTypingBadge={this.state.showFavGroupTypingBadge}
						showEmptyFavGroupBadges={this.state.showEmptyFavGroupBadges}
						rename={this.renameFav}
						delete={this.deleteFav}
						addToFavs={this.addToFavs}
						minimizeFav={this.minimizeFav}
						openInNewTab={this.openFavInNewTab}
						move={this.moveFav}
						moveFavGroup={this.moveFavGroup}
						addFavGroup={this.addFavGroup}
						moveToFavGroup={this.moveToFavGroup}
						removeFavGroup={this.removeFavGroup}
						renameFavGroup={this.renameFavGroup}
						openFavGroupInNewTab={this.openFavGroupInNewTab}
						hideFavBar={this.hideFavBar}
					/>
				)}
			</div>
		);
	}

	//#endregion
};

const TopBarRef = React.createRef();

//#endregion

//#region Plugin Decleration

module.exports = class ChannelTabs {
	//#region Start/Stop Functions

	constructor(meta) {
		this.meta = meta;
		pluginMeta = meta;
	}

	start(isRetry = false) {
		//console.warn("CT Start");
		if (isRetry && !BdApi.Plugins.isEnabled(config.info.name)) return;
		if (!UserStore.getCurrentUser())
			return setTimeout(() => this.start(true), 1000);
		//console.warn(UserStore.getCurrentUser());
		patches = [];
		this.loadSettings();
		this.applyStyle();
		this.ifNoTabsExist();
		this.promises = {
			state: { cancelled: false },
			cancel() {
				this.state.cancelled = true;
			},
		};
		this.saveSettings = this.saveSettings.bind(this);
		this.keybindHandler = this.keybindHandler.bind(this);
		this.onSwitch();
		this.patchTitleBar(this.promises.state);
		this.patchContextMenus();
		this.ifReopenLastChannelDefault();
		document.addEventListener("keydown", this.keybindHandler);
		window.onclick = (event) => this.clickHandler(event);
		this.showChangelog();
	}

	stop() {
		this.removeStyle();
		document.removeEventListener("keydown", this.keybindHandler);
		window.onclick = null;
		Patcher.unpatchAll();
		this.promises.cancel();
		patches.forEach((patch) => patch());
	}

	showChangelog() {
		const { Data } = new BdApi("ChannelTabs");
		const lastVersion = Data.load("lastVersion");
		if (!lastVersion || !(lastVersion in CHANGES)) {
			Data.save("lastVersion", this.meta.version);
			return;
		}

		const titles = {
			fixed: "Fixes",
			added: "Features",
			progress: "Progress",
			improved: "Improvements",
		};
		const changes = [];
		for (const [version, changelog] of Object.entries(CHANGES)) {
			if (lastVersion === version) break;

			for (const [type, messages] of Object.entries(changelog)) {
				let change = changes.find((x) => x.type === type);
				if (!change) {
					change = {
						title: titles[type],
						type,
						items: [],
					};
					changes.push(change);
				}

				change.items.push(...messages);
			}
		}

		if (changes.length === 0) return;

		UI.showChangelogModal({
			title: this.meta.name,
			subtitle: "Version " + this.meta.version,
			blurb: `Here's what's been changed since version ${lastVersion}.`,
			changes,
		});
		Data.save("lastVersion", this.meta.version);
	}

	//#endregion

	//#region Styles

	applyStyle() {
		const CompactVariables = `
	:root {	
		--channelTabs-tabHeight: 22px;
		--channelTabs-favHeight: 22px;
		--channelTabs-tabNameFontSize: 12px;
		--channelTabs-openTabSize: 18px;
	}
`;

		const CozyVariables = `
	:root {	
		--channelTabs-tabHeight: 32px;
		--channelTabs-favHeight: 28px;
		--channelTabs-tabNameFontSize: 13px;
		--channelTabs-openTabSize: 24px;
	}
`;

		const ConstantVariables = `
	:root {	
		--channelTabs-tabWidth: 220px;
		--channelTabs-tabWidthMin: ${this.settings.tabWidthMin}px;
	}
`;

		const PrivacyStyle = `
	#app-mount .channelTabs-favGroupBtn {
		color: transparent !important;
	}

	#app-mount .channelTabs-tabName {
		color: transparent;
		background-color: var(--interactive-normal);
		opacity: 0.5;
	}
	
	#app-mount .channelTabs-selected .channelTabs-tabName {
		background-color: var(--interactive-active);
	}
	
	#app-mount .channelTabs-favName {
		color: transparent;
		background-color: var(--interactive-normal);
		opacity: 0.5;
	}
`;

		const RadialStatusStyle = `
	.channelTabs-tabIconWrapper,
	.channelTabs-favIconWrapper {
		overflow: visible;
	}

	.channelTabs-tabIconWrapper img[src*="com/avatars/"],
	.channelTabs-favIconWrapper img[src*="com/avatars/"] {
		-webkit-clip-path: inset(1px round 50%);
		clip-path: inset(2px round 50%);
	}
	
	.channelTabs-tabIconWrapper rect,
	.channelTabs-favIconWrapper rect {
		x: 0;
		y: 0;
		rx: 50%;
		ry: 50%;
		-webkit-mask: none;
		mask: none;
		fill: none;
		height: 20px;
		width: 20px;
		stroke-width: 2px;
	}
	
	.channelTabs-onlineIcon {
		stroke: hsl(139, calc(var(--saturation-factor, 1) * 47.3%), 43.9%);
	}
	
	.channelTabs-idleIcon {
		stroke: hsl(38, calc(var(--saturation-factor, 1) * 95.7%), 54.1%);
	}
	
	.channelTabs-doNotDisturbIcon {
		stroke: hsl(359, calc(var(--saturation-factor, 1) * 82.6%), 59.4%);
	}
	
	.channelTabs-offlineIcon {
		stroke: hsl(214, calc(var(--saturation-factor, 1) * 9.9%), 50.4%);
	}
`;

		const tabNavStyle = `
	.channelTabs-tabContainer .channelTabs-tabNav {
		display:flex;
		margin: 0 6px 3px 0;
	}
	
	.channelTabs-tabNavClose svg {
		transform: scale(0.75);
	}
	
	.channelTabs-tabNavLeft svg,
	.channelTabs-tabNavRight svg {
		transform: scale(0.6);
	}
	
	/* if clickable */
	.channelTabs-tabContainer .channelTabs-tabNav>div:hover {
		color: var(--interactive-hover);
		background-color: var(--background-modifier-hover);
	}
	
	.channelTabs-tabContainer .channelTabs-tabNav>div:active {
		color: var(--interactive-active);
		background-color: var(--background-modifier-active);
	}
	
	/* if only 1 tab */
	.channelTabs-tabContainer[data-tab-count="1"] .channelTabs-tabNav>.channelTabs-tabNavClose {
		color: var(--interactive-muted);
		background: none;
	}
	
	.channelTabs-tabNav>div {
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--channelTabs-tabHeight);
		width: 32px;
		border-radius: 4px;
		margin-right: 3px;
		color: var(--interactive-normal);
	}
`;

		const BaseStyle = `

/* 
//#region Tab Base/Container
*/

.channelTabs-input .bd-text-input {
  border: 1px solid var(--input-border);
  width: 100%;
}

.channelTabs-tabNav {
	display:none;
}

div:has(> div > #channelTabs-container) {
	grid-template-rows: [top] auto [titleBarEnd] min-content [noticeEnd] 1fr [end];
}

${noDragClasses.map((x) => `.${x}`).join(", ")} {
	-webkit-app-region: no-drag;
}

/*
//#endregion
*/

#channelTabs-container {
	z-index: 1000;
	background: none;
	flex: 1;
	max-width: 100vw;
}

.channelTabs-tabContainer {
	display: flex;
	align-items: center;
}

.channelTabs-trailing {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-left: auto;
}

.channelTabs-tabContainer > *, .channelTabs-favContainer > * {
    -webkit-app-region: no-drag;
}

#channelTabs-container>:not(#channelTabs-settingsMenu)+div {
	padding-top: 4px;
	border-top: 1px solid var(--background-modifier-accent);
}

.channelTabs-tab {
	display: flex;
	align-items: center;
	height: var(--channelTabs-tabHeight);
	background: none;
	border-radius: 4px;
	max-width: var(--channelTabs-tabWidth);
	min-width: var(--channelTabs-tabWidthMin);
	flex: 1 1 var(--channelTabs-tabWidthMin);
	margin-bottom: 3px;
}

.channelTabs-tab>div:first-child {
	display: flex;
	width: calc(100% - 16px);
	align-items: center;
}

.channelTabs-tab:not(.channelTabs-selected):hover {
	background: var(--background-modifier-hover);
}

.channelTabs-tab:not(.channelTabs-selected):active {
	background: var(--background-modifier-active);
}

.channelTabs-tab.channelTabs-selected {
	background: var(--background-modifier-selected);
}

.channelTabs-tab.channelTabs-unread:not(.channelTabs-selected),
.channelTabs-tab.channelTabs-unread:not(.channelTabs-selected),
.channelTabs-tab.channelTabs-mention:not(.channelTabs-selected) {
	color: var(--interactive-hover);
}
.channelTabs-tab.channelTabs-unread:not(.channelTabs-selected):hover,
.channelTabs-tab.channelTabs-mention:not(.channelTabs-selected):hover {
	color: var(--interactive-active);
}

/*
//#endregion
*/

/*
//#region Quick Settings
*/

html:not(.platform-win) #channelTabs-settingsMenu {
	margin-right: 0;
}

#channelTabs-settingsMenu {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 32px;
	height: 32px;
	z-index: 1000;
	cursor: pointer;
}

#channelTabs-settingsMenu:hover {
	background: var(--background-modifier-hover);
}

.channelTabs-settingsIcon {
	width: 20px;
	height: 20px;
}

/*
//#endregion
*/

/*
//#region Tab Name
*/

.channelTabs-tab .channelTabs-tabName {
	margin-right: 6px;
	font-size: var(--channelTabs-tabNameFontSize);
	line-height: normal;
	color: var(--interactive-normal);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.channelTabs-tab:not(.channelTabs-selected):hover .channelTabs-tabName {
	color: var(--interactive-hover);
}

.channelTabs-tab:not(.channelTabs-selected):active .channelTabs-tabName,
.channelTabs-tab.channelTabs-selected .channelTabs-tabName {
	color: var(--interactive-active);
}

/*
//#endregion
*/

/*
//#region Tab Icon
*/

.channelTabs-tabIcon {
	height: 20px;
	border-radius: 50%;
	-webkit-user-drag: none;
}

.channelTabs-tabIconWrapper {
	margin: 0 6px;
	flex-shrink: 0;
}

.channelTabs-onlineIcon {
	fill: hsl(139, calc(var(--saturation-factor, 1) * 47.3%), 43.9%);
	mask: url(#svg-mask-status-online);
}

.channelTabs-idleIcon {
	fill: hsl(38, calc(var(--saturation-factor, 1) * 95.7%), 54.1%);
	mask: url(#svg-mask-status-idle);
}

.channelTabs-doNotDisturbIcon {
	fill: hsl(359, calc(var(--saturation-factor, 1) * 82.6%), 59.4%);
	mask: url(#svg-mask-status-dnd);
}

.channelTabs-offlineIcon {
	fill: hsl(214, calc(var(--saturation-factor, 1) * 9.9%), 50.4%);
	mask: url(#svg-mask-status-offline);
}

/*
//#endregion
*/

/*
//#region Close Tab / New Tab
*/

.channelTabs-closeTab {
	position: relative;
	height: 16px;
	width: 16px;
	flex-shrink: 0;
	right: 6px;
	border-radius: 4px;
	color: var(--interactive-normal);
	cursor: pointer;
}

.channelTabs-closeTab svg {
	height: 100%;
	width: 100%;
	transform: scale(0.85);
}

.channelTabs-newTab {
	display:flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	height: var(--channelTabs-openTabSize);
	width: 24px;
	margin: 0 6px 3px 6px;
	border-radius: 4px;
	cursor: pointer;
	color: var(--interactive-normal);
	margin-right: 64px;
}

.channelTabs-newTab:hover {
	background: var(--background-modifier-hover);
	color: var(--interactive-hover);
}

.channelTabs-newTab:active {
	background: var(--background-modifier-active);
	color: var(--interactive-active);
}

.channelTabs-closeTab:hover {
	background: hsl(359,calc(var(--saturation-factor, 1)*82.6%),59.4%);
	color: white;
}

/*
//#endregion
*/

/*
//#region Badges
*/

.channelTabs-gridContainer {
	display: flex;
	margin-right: 6px;
}

.channelTabs-mentionBadge,
.channelTabs-unreadBadge {
	border-radius: 8px;
	padding: 0 4px;
	min-width: 8px;
	width: fit-content;
	height: 16px;
	font-size: 12px;
	line-height: 16px;
	font-weight: 600;
	text-align: center;
	color: #fff;
}

.channelTabs-typingBadge {
	border-radius: 8px;
	padding-left: 4px;
	padding-right: 4px;
	min-width: 8px;
	width: fit-content;
	height: 16px;
	font-size: 12px;
	line-height: 16px;
	font-weight: 600;
	text-align: center;
	color: #fff;
}

.channelTabs-mentionBadge {
	background-color: hsl(359, calc(var(--saturation-factor, 1) * 82.6%), 59.4%);
}
.channelTabs-unreadBadge {
	background-color: hsl(235, calc(var(--saturation-factor, 1) * 86%), 65%);
}

.channelTabs-classicBadgeAlignment {
	margin-right: 6px;
	display: inline-block;
	float: right;
}

.channelTabs-badgeAlignLeft {
	float: left;
}

.channelTabs-badgeAlignRight {
	float: right;
}

.channelTabs-tab .channelTabs-mentionBadge,
.channelTabs-tab .channelTabs-unreadBadge,
.channelTabs-tab .channelTabs-typingBadge {
	height: 16px;
}

.channelTabs-tab .channelTabs-noMention,
.channelTabs-tab .channelTabs-noUnread {
	background-color: var(--background-primary);
	color: var(--text-muted);
}

.channelTabs-fav .channelTabs-mentionBadge,
.channelTabs-fav .channelTabs-unreadBadge {
	display: inline-block;
	vertical-align: bottom;
	float: right;
	margin-left: 2px;
}

.channelTabs-fav .channelTabs-typingBadge {
	display: inline-flex;
	vertical-align: bottom;
	float: right;
	margin-left: 2px;
	margin-right: 6px;
}

.channelTabs-fav .channelTabs-noMention,
.channelTabs-fav .channelTabs-noUnread {
	background-color: var(--background-primary);
	color: var(--text-muted);
}
.channelTabs-fav .channelTabs-noTyping {
	display: none;
}

.channelTabs-fav .channelTabs-favName + div {
	margin-left: 6px;
}

.channelTabs-favGroupBtn .channelTabs-noMention,
.channelTabs-favGroupBtn .channelTabs-noUnread {
	background-color: var(--background-primary);
	color: var(--text-muted);
}

.channelTabs-favGroupBtn .channelTabs-typingBadge {
	display: inline-flex;
	vertical-align: bottom;
	float: right;
	margin-left: 2px;
}

.channelTabs-favGroupBtn .channelTabs-mentionBadge,
.channelTabs-favGroupBtn .channelTabs-unreadBadge {
	display: inline-block;
	vertical-align: bottom;
	float: right;
	margin-left: 2px;
}

.channelTabs-favGroupBtn .channelTabs-noTyping {
	display: none;
}

/*
//#endregion
*/

/*
//#region Favs
*/

.channelTabs-favContainer {
	display: flex;
	align-items: center;
	flex-wrap:wrap;
    -webkit-app-region: drag;
}

.channelTabs-fav {
	display: flex;
	align-items: center;
	min-width: 0;
	border-radius: 4px;
	height: var(--channelTabs-favHeight);
	background: none;
	flex: 0 0 1;
	max-width: var(--channelTabs-tabWidth);
	margin-bottom: 3px;
	padding-left: 6px;
	padding-right: 6px;
}

.channelTabs-fav:hover {
	background: var(--background-modifier-hover);
}

.channelTabs-fav:active {
	background: var(--background-modifier-active);
}

.channelTabs-favIcon {
	height: 20px;
	border-radius: 50%;
	-webkit-user-drag: none;
}

.channelTabs-favName {
	margin-left: 6px;
	font-size: var(--channelTabs-tabNameFontSize);
	line-height: normal;
	color: var(--interactive-normal);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.channelTabs-fav:hover .channelTabs-favName {
	color: var(--interactive-hover);
}

.channelTabs-fav:active .channelTabs-favName {
	color: var(--interactive-active);
}

.channelTabs-noFavNotice {
	color: var(--text-muted);
	font-size: 14px;
	padding: 3px;
}

/*
//#endregion 
*/

/*
//#region Fav Folders
*/

.channelTabs-favGroupBtn {
	display: flex;
	align-items: center;
	min-width: 0;
	border-radius: 4px;
	height: var(--channelTabs-favHeight);
	flex: 0 1 1;
	max-width: var(--channelTabs-tabWidth);
	padding: 0 6px;
	font-size: 12px;
	color: var(--interactive-normal);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	margin-bottom: 3px;
}

.channelTabs-favGroupBtn>:first-child {
	margin-left: 6px;
}

.channelTabs-favGroup:hover .channelTabs-favGroupBtn {
	background: var(--background-modifier-hover);
}

.channelTabs-favGroup-content {
	z-index: 1001;
	display: none;
	position: absolute;
	min-width: max-content;
	background-color: var(--background-surface-high);
	-webkit-box-shadow: var(--elevation-high);
	box-shadow: var(--elevation-high);
	border-radius: 4px;
	padding: 4px;
}

.channelTabs-favGroup-content>:last-child {
	margin-bottom: 0;
}

.channelTabs-favGroupShow {
	display:block;
}

.channelTabs-sliderContainer {
	display: flex;
	justify-content: center;
	padding: 4px 8px;
	margin: 2px 6px 12px 6px;
	background: var(--slider-background-normal);
	border-radius: var(--slider-background-radius);
}

.channelTabs-slider {
	position: relative;
	top: -14px;
}

.channelTabs-minimized {
	--channelTabs-tabWidth: fit-content;
	--channelTabs-tabWidthMin: fit-content;
}

.channelTabs-tab.channelTabs-minimized>div>:first-child~*,
.channelTabs-fav.channelTabs-minimized>svg:first-child~*,
.channelTabs-tab.channelTabs-minimized>.channelTabs-closeTab {
	display:none;
}

/*
//#endregion
*/
`;

		if (this.settings.compactStyle === true)
			DOM.addStyle("channelTabs-style-compact", CompactVariables);
		if (this.settings.compactStyle === false)
			DOM.addStyle("channelTabs-style-cozy", CozyVariables);
		if (this.settings.privacyMode === true)
			DOM.addStyle("channelTabs-style-private", PrivacyStyle);
		if (this.settings.radialStatusMode === true)
			DOM.addStyle("channelTabs-style-radialstatus", RadialStatusStyle);
		if (this.settings.showNavButtons === true)
			DOM.addStyle("channelTabs-style-tabnav", tabNavStyle);
		DOM.addStyle("channelTabs-style-constants", ConstantVariables);
		DOM.addStyle("channelTabs-style", BaseStyle);
	}

	removeStyle() {
		DOM.removeStyle("channelTabs-style-compact");
		DOM.removeStyle("channelTabs-style-cozy");
		DOM.removeStyle("channelTabs-style-private");
		DOM.removeStyle("channelTabs-style-radialstatus");
		DOM.removeStyle("channelTabs-style-tabnav");
		DOM.removeStyle("channelTabs-style-constants");
		DOM.removeStyle("channelTabs-style");
	}

	//#endregion

	//#region Init/Default Functions

	ifNoTabsExist() {
		if (this.settings.tabs.length == 0)
			this.settings.tabs = [
				{
					name: getCurrentName(),
					url: location.pathname,
					selected: true,
				},
			];
	}

	ifReopenLastChannelDefault() {
		if (this.settings.reopenLastChannel) {
			switching = true;
			NavigationUtils.transitionTo(
				(
					this.settings.tabs.find((tab) => tab.selected) ||
					this.settings.tabs[0]
				).url,
			);
			switching = false;
		}
	}

	//#endregion

	//#region Patches

	patchTitleBar(promiseState) {
		if (promiseState.cancelled) return;
		Patcher.after(TitleBar, TitleBarKey, (thisObject, [props], returnValue) => {
			// Only patch if this is the main window.
			if (props.windowKey !== undefined) return;

			returnValue.props.style = { paddingLeft: 0 };
			returnValue.props.children = (
				<TopBar
					leading={returnValue.props.children[1]}
					trailing={returnValue.props.children[2]}
					reopenLastChannel={this.settings.reopenLastChannel}
					showTabBar={this.settings.showTabBar}
					showFavBar={this.settings.showFavBar}
					showFavUnreadBadges={this.settings.showFavUnreadBadges}
					showFavMentionBadges={this.settings.showFavMentionBadges}
					showFavTypingBadge={this.settings.showFavTypingBadge}
					showEmptyFavBadges={this.settings.showEmptyFavBadges}
					showTabUnreadBadges={this.settings.showTabUnreadBadges}
					showTabMentionBadges={this.settings.showTabMentionBadges}
					showTabTypingBadge={this.settings.showTabTypingBadge}
					showEmptyTabBadges={this.settings.showEmptyTabBadges}
					showActiveTabUnreadBadges={this.settings.showActiveTabUnreadBadges}
					showActiveTabMentionBadges={this.settings.showActiveTabMentionBadges}
					showActiveTabTypingBadge={this.settings.showActiveTabTypingBadge}
					showEmptyActiveTabBadges={this.settings.showEmptyActiveTabBadges}
					showFavGroupUnreadBadges={this.settings.showFavGroupUnreadBadges}
					showFavGroupMentionBadges={this.settings.showFavGroupMentionBadges}
					showFavGroupTypingBadge={this.settings.showFavGroupTypingBadge}
					showEmptyFavGroupBadges={this.settings.showEmptyFavGroupBadges}
					compactStyle={this.settings.compactStyle}
					privacyMode={this.settings.privacyMode}
					radialStatusMode={this.settings.radialStatusMode}
					tabWidthMin={this.settings.tabWidthMin}
					showQuickSettings={this.settings.showQuickSettings}
					showNavButtons={this.settings.showNavButtons}
					alwaysFocusNewTabs={this.settings.alwaysFocusNewTabs}
					useStandardNav={this.settings.useStandardNav}
					tabs={this.settings.tabs}
					favs={this.settings.favs}
					favGroups={this.settings.favGroups}
					ref={TopBarRef}
					plugin={this}
				/>
			);
		});

		const forceUpdate = () => {
			const rootElement = document.getElementById("app-mount");
			const containerKey = Object.keys(rootElement).find((k) =>
				k.startsWith("__reactContainer$"),
			);
			const target = BdApi.Utils.findInTree(
				rootElement[containerKey],
				(c) => c.stateNode?.isReactComponent,
				{ walkable: ["child"] },
			);
			const { render } = target.stateNode;
			if (render.toString().includes("null")) return;
			target.stateNode.render = () => null;
			target.stateNode.forceUpdate(() => {
				target.stateNode.render = render;
				target.stateNode.forceUpdate();
			});
		};
		forceUpdate();
		patches.push(() => forceUpdate());
	}

	patchContextMenus() {
		patches.push(
			ContextMenu.patch("channel-context", (returnValue, props) => {
				if (!this.settings.showTabBar && !this.settings.showFavBar) return;
				returnValue.props.children.push(
					CreateTextChannelContextMenuChildren(this, props),
				);
			}),

			ContextMenu.patch("thread-context", (returnValue, props) => {
				if (!this.settings.showTabBar && !this.settings.showFavBar) return;
				returnValue.props.children.push(
					CreateThreadChannelContextMenuChildren(this, props),
				);
			}),

			ContextMenu.patch("user-context", (returnValue, props) => {
				if (!this.settings.showTabBar && !this.settings.showFavBar) return;
				if (!returnValue) return;
				if (
					!props.channel ||
					props.channel.recipients?.length !== 1 ||
					props.channel.recipients[0] !== props.user.id
				)
					return;
				returnValue.props.children.push(
					CreateDMContextMenuChildren(this, props),
				);
			}),

			ContextMenu.patch("gdm-context", (returnValue, props) => {
				if (!this.settings.showTabBar && !this.settings.showFavBar) return;
				if (!returnValue) return;
				returnValue.props.children.push(
					CreateGroupContextMenuChildren(this, props),
				);
			}),

			ContextMenu.patch("guild-context", (returnValue, props) => {
				if (
					(!this.settings.showTabBar && !this.settings.showFavBar) ||
					!props.guild
				)
					return;
				const channel = ChannelStore.getChannel(
					SelectedChannelStore.getChannelId(props.guild.id),
				);
				returnValue.props.children.push(
					CreateGuildContextMenuChildren(this, props, channel),
				);
			}),
		);
	}

	//#endregion

	//#region Handlers

	clickHandler(e) {
		if (!e.target.matches(".channelTabs-favGroupBtn")) {
			closeAllDropdowns();
		}
	}

	keybindHandler(e) {
		const keybinds = [
			{
				ctrlKey: true,
				keyCode: 87 /*w*/,
				action: this.closeCurrentTab,
			},
			{
				ctrlKey: true,
				keyCode: 33 /*pg_up*/,
				action: this.previousTab,
			},
			{
				ctrlKey: true,
				keyCode: 34 /*pg_down*/,
				action: this.nextTab,
			},
			{
				ctrlKey: true,
				keyCode: 84 /*t*/,
				action: this.openNewTab,
			},
		];
		keybinds.forEach((keybind) => {
			if (
				e.altKey === (keybind.altKey ?? false) &&
				e.ctrlKey === (keybind.ctrlKey ?? false) &&
				e.shiftKey === (keybind.shiftKey ?? false) &&
				e.keyCode === keybind.keyCode
			) {
				e.stopPropagation();
				keybind.action();
			}
		});
	}

	//#endregion

	//#region General Functions

	onSwitch() {
		if (switching) return;
		//console.log(this);
		if (TopBarRef.current) {
			TopBarRef.current.setState(
				{
					tabs: TopBarRef.current.state.tabs.map((tab) => {
						if (tab.selected) {
							const channelId = SelectedChannelStore.getChannelId();
							return {
								name: getCurrentName(),
								url: location.pathname,
								selected: true,
								currentStatus: getCurrentUserStatus(location.pathname),
								channelId: channelId,
								minimized:
									this.settings.tabs[
										this.settings.tabs.findIndex((tab) => tab.selected)
									].minimized,
							};
						} else {
							return Object.assign({}, tab);
						}
					}),
				},
				this.saveSettings,
			);
		} else if (!this.settings.reopenLastChannel) {
			const channelId = SelectedChannelStore.getChannelId();
			this.settings.tabs[this.settings.tabs.findIndex((tab) => tab.selected)] =
				{
					name: getCurrentName(),
					url: location.pathname,
					selected: true,
					currentStatus: getCurrentUserStatus(location.pathname),
					channelId: channelId,
					minimized:
						this.settings.tabs[
							this.settings.tabs.findIndex((tab) => tab.selected)
						].minimized,
				};
		}
	}

	mergeItems(itemsTab, itemsFav) {
		const out = [];
		if (this.settings.showTabBar) out.push(...itemsTab);
		if (this.settings.showFavBar) out.push(...itemsFav);
		return out;
	}

	//#endregion

	//#region Hotkey Functions

	nextTab() {
		if (TopBarRef.current)
			TopBarRef.current.switchToTab(
				(TopBarRef.current.state.selectedTabIndex + 1) %
					TopBarRef.current.state.tabs.length,
			);
	}

	previousTab() {
		if (TopBarRef.current)
			TopBarRef.current.switchToTab(
				(TopBarRef.current.state.selectedTabIndex -
					1 +
					TopBarRef.current.state.tabs.length) %
					TopBarRef.current.state.tabs.length,
			);
	}

	closeCurrentTab() {
		if (TopBarRef.current)
			TopBarRef.current.closeTab(TopBarRef.current.state.selectedTabIndex);
	}

	openNewTab() {
		if (!TopBarRef.current) return;
		TopBarRef.current.openNewTab();
	}

	//#endregion

	//#region Settings

	get defaultVariables() {
		return {
			tabs: [],
			favs: [],
			favGroups: [],
			showTabBar: true,
			showFavBar: true,
			reopenLastChannel: false,
			showFavUnreadBadges: true,
			showFavMentionBadges: true,
			showFavTypingBadge: true,
			showEmptyFavBadges: false,
			showTabUnreadBadges: true,
			showTabMentionBadges: true,
			showTabTypingBadge: true,
			showEmptyTabBadges: false,
			showActiveTabUnreadBadges: false,
			showActiveTabMentionBadges: false,
			showActiveTabTypingBadge: false,
			showEmptyActiveTabBadges: false,
			compactStyle: false,
			privacyMode: false,
			radialStatusMode: false,
			tabWidthMin: 100,
			showFavGroupUnreadBadges: true,
			showFavGroupMentionBadges: true,
			showFavGroupTypingBadge: true,
			showEmptyFavGroupBadges: false,
			showQuickSettings: true,
			showNavButtons: true,
			alwaysFocusNewTabs: false,
			useStandardNav: true,
		};
	}

	getSettingsPath(useOldLocation) {
		if (useOldLocation === true) {
			return this.meta.name;
		} else {
			const user_id = UserStore.getCurrentUser()?.id;
			return this.meta.name + "_new" + (user_id != null ? "_" + user_id : "");
		}
	}

	loadSettings() {
		if (
			Object.keys(Data.load(this.getSettingsPath(), "settings") ?? {})
				.length === 0
		) {
			this.settings =
				Data.load(this.getSettingsPath(true), "settings") ??
				this.defaultVariables;
		} else {
			this.settings =
				Data.load(this.getSettingsPath(), "settings") ?? this.defaultVariables;
		}
		this.settings.favs = this.settings.favs.map((fav) => {
			if (fav.channelId === undefined) {
				const match = fav.url.match(/^\/channels\/[^\/]+\/(\d+)$/);
				if (match) return Object.assign(fav, { channelId: match[1] });
			}
			if (fav.groupId === undefined) {
				return Object.assign(fav, { groupId: -1 });
			}
			return fav;
		});
		this.saveSettings();
	}

	saveSettings() {
		if (TopBarRef.current) {
			this.settings.tabs = TopBarRef.current.state.tabs;
			this.settings.favs = TopBarRef.current.state.favs;
			this.settings.favGroups = TopBarRef.current.state.favGroups;
		}

		try {
			Data.save(this.getSettingsPath(), "settings", this.settings);
		} catch (error) {
			console.error("Error saving settings:", error);
		}
	}

	getSettingsPanel() {
		return UI.buildSettingsPanel({
			settings: [
				//#region Startup Settings
				{
					id: "startupSettings",
					type: "category",
					name: "Startup Settings",
					settings: [
						{
							id: "reopenLastChannel",
							type: "switch",
							name: "Reopen last channel",
							note: "When starting the plugin (or discord) the channel will be selected again instead of the friends page",
							value: this.settings.reopenLastChannel,
							onChange: (checked) => {
								this.settings.reopenLastChannel = checked;
								this.saveSettings();
							},
						},
					],
				},
				//#endregion

				//#region General Appearance
				{
					id: "generalAppearance",
					type: "category",
					name: "General Appearance",
					settings: [
						{
							id: "showTabBar",
							type: "switch",
							name: "Show Tab Bar",
							note: "Allows you to have multiple tabs like in a web browser",
							value: this.settings.showTabBar,
							onChange: (checked) => {
								this.settings.showTabBar = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showTabBar: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showFavBar",
							type: "switch",
							name: "Show Fav Bar",
							note: "Allows you to add favorites by right clicking a tab or the fav bar",
							value: this.settings.showFavBar,
							onChange: (checked) => {
								this.settings.showFavBar = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showFavBar: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showQuickSettings",
							type: "switch",
							name: "Show Quick Settings",
							note: "Allows you to quickly change major settings from a context menu",
							value: this.settings.showQuickSettings,
							onChange: (checked) => {
								this.settings.showQuickSettings = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showQuickSettings: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showNavButtons",
							type: "switch",
							name: "Show Navigation Buttons",
							note: "Click to go the left or right tab, this behavior can be changed in Behavior settings",
							value: this.settings.showNavButtons,
							onChange: (checked) => {
								this.settings.showNavButtons = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showNavButtons: checked,
									});
								this.removeStyle();
								this.applyStyle();
								this.saveSettings();
							},
						},
						{
							id: "compactStyle",
							type: "switch",
							name: "Use Compact Look",
							note: "",
							value: this.settings.compactStyle,
							onChange: (checked) => {
								this.settings.compactStyle = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										compactStyle: checked,
									});
								this.removeStyle();
								this.applyStyle();
								this.saveSettings();
							},
						},
						{
							id: "privacyMode",
							type: "switch",
							name: "Enable Privacy Mode",
							note: "Obfusicates all the Sensitive Text in ChannelTabs",
							value: this.settings.privacyMode,
							onChange: (checked) => {
								this.settings.privacyMode = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										privacyMode: checked,
									});
								this.removeStyle();
								this.applyStyle();
								this.saveSettings();
							},
						},
						{
							id: "radialStatusMode",
							type: "switch",
							name: "Use Radial Status Indicators",
							note: "Changes the status indicator into a circular border",
							value: this.settings.radialStatusMode,
							onChange: (checked) => {
								this.settings.radialStatusMode = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										radialStatusMode: checked,
									});
								this.removeStyle();
								this.applyStyle();
								this.saveSettings();
							},
						},
						{
							id: "tabWidthMin",
							type: "slider",
							name: "Minimum Tab Width",
							note: "Set the limit on how small a tab can be before overflowing to a new row",
							min: 58,
							max: 220,
							value: this.settings.tabWidthMin,
							onChange: (value) => (
								(this.settings.tabWidthMin = Math.round(value)),
								this.saveSettings(),
								document.documentElement.style.setProperty(
									"--channelTabs-tabWidthMin",
									this.settings.tabWidthMin + "px",
								)
							),
							defaultValue: 100,
							markers: [60, 85, 100, 125, 150, 175, 200, 220],
							units: "px",
						},
					],
				},

				//#endregion

				//#region Behavior Settings
				{
					id: "behavior",
					type: "category",
					name: "Behavior",
					settings: [
						{
							id: "alwaysFocusNewTabs",
							type: "switch",
							name: "Always Auto Focus New Tabs",
							note: "Forces all newly created tabs to bring themselves to focus",
							value: this.settings.alwaysFocusNewTabs,
							onChange: (checked) => {
								this.settings.alwaysFocusNewTabs = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										alwaysFocusNewTabs: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "useStandardNav",
							type: "switch",
							name: "Primary Forward/Back Navigation",
							note: "Instead of scrolling down the row, use the previous and next buttons to navigate between pages",
							value: this.settings.useStandardNav,
							onChange: (checked) => {
								this.settings.useStandardNav = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										useStandardNav: checked,
									});
								this.saveSettings();
							},
						},
					],
				},

				//#endregion

				//#region Badge Visibility - Favs

				{
					id: "badgeVisibilityFavorites",
					type: "category",
					name: "Badge Visibility - Favorites",
					settings: [
						{
							id: "showFavUnreadBadges",
							type: "switch",
							name: "Show Unread",
							note: "",
							value: this.settings.showFavUnreadBadges,
							onChange: (checked) => {
								this.settings.showFavUnreadBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showFavUnreadBadges: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showFavMentionBadges",
							type: "switch",
							name: "Show Mentions",
							note: "",
							value: this.settings.showFavMentionBadges,
							onChange: (checked) => {
								this.settings.showFavMentionBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showFavMentionBadges: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showFavTypingBadge",
							type: "switch",
							name: "Show Typing",
							note: "",
							value: this.settings.showFavTypingBadge,
							onChange: (checked) => {
								this.settings.showFavTypingBadge = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showFavTypingBadge: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showEmptyFavBadges",
							type: "switch",
							name: "Show Empty",
							note: "",
							value: this.settings.showEmptyFavBadges,
							onChange: (checked) => {
								this.settings.showEmptyFavBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showEmptyFavBadges: checked,
									});
								this.saveSettings();
							},
						},
					],
				},

				//#endregion

				//#region Badge Visibility - Fav Groups

				{
					id: "badgeVisibilityFavoriteGroups",
					type: "category",
					name: "Badge Visibility - Favorite Groups",
					settings: [
						{
							id: "showFavGroupUnreadBadges",
							type: "switch",
							name: "Show Unread",
							note: "",
							value: this.settings.showFavGroupUnreadBadges,
							onChange: (checked) => {
								this.settings.showFavGroupUnreadBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showFavGroupUnreadBadges: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showFavGroupMentionBadges",
							type: "switch",
							name: "Show Mentions",
							note: "",
							value: this.settings.showFavGroupMentionBadges,
							onChange: (checked) => {
								this.settings.showFavGroupMentionBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showFavGroupMentionBadges: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showFavGroupTypingBadge",
							type: "switch",
							name: "Show Typing",
							note: "",
							value: this.settings.showFavGroupTypingBadge,
							onChange: (checked) => {
								this.settings.showFavGroupTypingBadge = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showFavGroupTypingBadge: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showEmptyGroupFavBadges",
							type: "switch",
							name: "Show Empty",
							note: "",
							value: this.settings.showEmptyGroupFavBadges,
							onChange: (checked) => {
								this.settings.showEmptyGroupFavBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showEmptyGroupFavBadges: checked,
									});
								this.saveSettings();
							},
						},
					],
				},

				//#endregion

				//#region Badge Visibility - Tabs

				{
					id: "badgeVisibilityTabs",
					type: "category",
					name: "Badge Visibility - Tabs",
					settings: [
						{
							id: "showTabUnreadBadges",
							type: "switch",
							name: "Show Unread",
							note: "",
							value: this.settings.showTabUnreadBadges,
							onChange: (checked) => {
								this.settings.showTabUnreadBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showTabUnreadBadges: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showTabMentionBadges",
							type: "switch",
							name: "Show Mentions",
							note: "",
							value: this.settings.showTabMentionBadges,
							onChange: (checked) => {
								this.settings.showTabMentionBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showTabMentionBadges: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showTabTypingBadge",
							type: "switch",
							name: "Show Typing",
							note: "",
							value: this.settings.showTabTypingBadge,
							onChange: (checked) => {
								this.settings.showTabTypingBadge = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showTabTypingBadge: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showEmptyTabBadges",
							type: "switch",
							name: "Show Empty",
							note: "",
							value: this.settings.showEmptyTabBadges,
							onChange: (checked) => {
								this.settings.showEmptyTabBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showEmptyTabBadges: checked,
									});
								this.saveSettings();
							},
						},
					],
				},

				//#endregion

				//#region Badge Visibility - Active Tabs

				{
					id: "badgeVisibilityActiveTabs",
					type: "category",
					name: "Badge Visibility - Active Tabs",
					settings: [
						{
							id: "showActiveTabUnreadBadges",
							type: "switch",
							name: "Show Unread",
							note: "",
							value: this.settings.showActiveTabUnreadBadges,
							onChange: (checked) => {
								this.settings.showActiveTabUnreadBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showActiveTabUnreadBadges: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showActiveTabMentionBadges",
							type: "switch",
							name: "Show Mentions",
							note: "",
							value: this.settings.showActiveTabMentionBadges,
							onChange: (checked) => {
								this.settings.showActiveTabMentionBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showActiveTabMentionBadges: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showActiveTabTypingBadge",
							type: "switch",
							name: "Show Typing",
							note: "",
							value: this.settings.showActiveTabTypingBadge,
							onChange: (checked) => {
								this.settings.showActiveTabTypingBadge = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showActiveTabTypingBadge: checked,
									});
								this.saveSettings();
							},
						},
						{
							id: "showEmptyActiveTabBadges",
							type: "switch",
							name: "Show Empty",
							note: "",
							value: this.settings.showEmptyActiveTabBadges,
							onChange: (checked) => {
								this.settings.showEmptyActiveTabBadges = checked;
								if (TopBarRef.current)
									TopBarRef.current.setState({
										showEmptyActiveTabBadges: checked,
									});
								this.saveSettings();
							},
						},
					],
				},

				//#endregion
			],
		});
	}

	//#endregion
};

//#endregion
