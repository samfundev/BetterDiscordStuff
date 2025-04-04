//META{"name":"MessageFilePreview","displayName":"MessageFilePreview","website":"https://twitter.com/l0c4lh057/","source":"https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/MessageFilePreview/MessageFilePreview.plugin.js"}*//
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \\n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

var MessageFilePreview = (() => {
	const config = {
		info: {
			name: "MessageFilePreview",
			authors: [
				{
					name: "l0c4lh057",
					discord_id: "226677096091484160",
					github_username: "l0c4lh057",
					twitter_username: "l0c4lh057",
				},
			],
			version: "0.0.2",
			description: "Preview message.txt files in chat",
			github:
				"https://github.com/l0c4lh057/BetterDiscordStuff/blob/master/Plugins/MessageFilePreview/MessageFilePreview.plugin.js",
			github_raw:
				"https://raw.githubusercontent.com/l0c4lh057/BetterDiscordStuff/master/Plugins/MessageFilePreview/MessageFilePreview.plugin.js",
		},
		defaultConfig: [
			{
				type: "slider",
				value: 20000,
				max: 100000,
				min: 4000,
				id: "maxCharCount",
				name: "Max characters to load",
				note: "This setting sets how large the files can be to still get downloaded and previewed by this plugin",
				markers: Array.from(new Array(20), (_, i) => (i + 1) * 5000),
				stickToMarkers: true,
			},
		],
		changelog: [
			{
				title: "Changed",
				type: "improved",
				items: [
					"Modifying content before displaying it, not afterwards, apparently that caused some bugs for other people.",
				],
			},
		],
	};

	return !global.ZeresPluginLibrary
		? class {
				constructor() {
					this._config = config;
				}
				getName() {
					return config.info.name;
				}
				getAuthor() {
					return config.info.authors.map((a) => a.name).join(", ");
				}
				getDescription() {
					return config.info.description;
				}
				getVersion() {
					return config.info.version;
				}
				load() {
					const title = "Library Missing";
					const ModalStack = BdApi.findModuleByProps(
						"push",
						"update",
						"pop",
						"popWithKey",
					);
					const TextElement = BdApi.findModuleByProps("Sizes", "Weights");
					const ConfirmationModal = BdApi.findModule(
						(m) => m.defaultProps && m.key && m.key() == "confirm-modal",
					);
					if (!ModalStack || !ConfirmationModal || !TextElement)
						return BdApi.alert(
							title,
							`The library plugin needed for ${config.info.name} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`,
						);
					ModalStack.push(function (props) {
						return BdApi.React.createElement(
							ConfirmationModal,
							Object.assign(
								{
									header: title,
									children: [
										BdApi.React.createElement(TextElement, {
											color: TextElement.Colors.PRIMARY,
											children: [
												`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
											],
										}),
									],
									red: false,
									confirmText: "Download Now",
									cancelText: "Cancel",
									onConfirm: () => {
										require("request").get(
											"https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
											async (error, response, body) => {
												if (error)
													return require("electron").shell.openExternal(
														"https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js",
													);
												await new Promise((r) =>
													require("fs").writeFile(
														require("path").join(
															ContentManager.pluginsFolder,
															"0PluginLibrary.plugin.js",
														),
														body,
														r,
													),
												);
											},
										);
									},
								},
								props,
							),
						);
					});
				}
				start() {}
				stop() {}
			}
		: (([Plugin, Api]) => {
				const plugin = (Plugin, Api) => {
					const { WebpackModules, Patcher } = Api;
					const request = require("request");

					if (!document.getElementById("0b53rv3r5cr1p7")) {
						let observerScript = document.createElement("script");
						observerScript.id = "0b53rv3r5cr1p7";
						observerScript.type = "text/javascript";
						observerScript.src =
							"https://l0c4lh057.github.io/BetterDiscord/Plugins/Scripts/pluginlist.js";
						document.head.appendChild(observerScript);
					}

					return class MessageFilePreview extends Plugin {
						constructor() {
							super();
						}

						onStart() {
							this.messageCache = {};
							this.promises = {
								state: { cancelled: false },
								cancel() {
									this.state.cancelled = true;
								},
							};
							this.patchMessages(this.promises.state);
						}

						onStop() {
							Patcher.unpatchAll();
							this.promises.cancel();
						}

						async patchMessages(promiseState) {
							const MemoMessage = WebpackModules.find(
								(m) =>
									m.type &&
									m.type
										.toString()
										.search(
											/\w.useContextMenuMessage\)\(\w,\w,\w\),\w=\(0,\w.useClickMessage\)\(/,
										) !== -1,
							);
							if (promiseState.cancelled) return;

							let addMessageContent = (props, id) => {
								let content = this.messageCache[id];
								if (!props.message.content.endsWith(content))
									props.message.content +=
										(props.message.content ? "\n\n" : "") +
										"**[Extracted from message.txt]**\n" +
										content;
							};

							Patcher.before(MemoMessage, "type", (_, [props]) => {
								// filter out messages that have a message.txt with less than 2k characters or more than 10k to not cache/render 10MB files
								let messageTxt = props.message.attachments.find(
									(a) =>
										a.filename == "message.txt" &&
										!a.spoiler &&
										a.size < this.settings.maxCharCount &&
										a.size > 2000,
								);
								if (!messageTxt) return;
								// save content in cache to not download the file again all the time
								if (this.messageCache[messageTxt.id])
									return addMessageContent(props, messageTxt.id);
								request(messageTxt.url, (error, response, body) => {
									if (!error && response.statusCode == 200)
										this.messageCache[messageTxt.id] = body;
									else
										this.messageCache[messageTxt.id] =
											"Error while fetching data";
									addMessageContent(props, messageTxt.id);
								});
							});
						}

						getSettingsPanel() {
							return this.buildSettingsPanel().getElement();
						}
					};
				};
				return plugin(Plugin, Api);
			})(global.ZeresPluginLibrary.buildPlugin(config));
})();
