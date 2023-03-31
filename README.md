# xremap-gnome

GNOME Shell extension for xremap

## What's this?

The GNOME version of [xremap](https://github.com/k0kubun/xremap), a Linux key remapper,
relies on this GNOME Shell extension to fetch the active application name.

So you need to install this if you want to use [xremap](https://github.com/k0kubun/xremap) with `--features gnome`.

## Installation

Install xremap's GNOME Shell extension from [this link](https://extensions.gnome.org/extension/5060/xremap/),
switching OFF to ON.

## Development

```bash
git clone https://github.com/xremap/xremap-gnome ~/.local/share/gnome-shell/extensions/xremap@k0kubun.com
# Reload your GNOME Shell session, and then enable "Xremap" using:
gnome-extensions-app
```

## Release

1. Update `version` in `metadata.json`. Push it to master.
2. Run `./package.sh`. It creates `extension.zip`.
3. Upload it from https://extensions.gnome.org/upload/.

## License

GPLv2+
