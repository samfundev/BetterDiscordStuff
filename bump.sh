cd src/ChannelTabs
npm version patch --no-git-tag-version
cd ../../
npm run build
git add Plugins/ChannelTabs/ChannelTabs.plugin.js src/ChannelTabs/package.json
git commit -m "Bump version"
