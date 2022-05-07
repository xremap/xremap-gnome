# xremap-gnome

GNOME Shell extension for xremap

## What's this?

The GNOME version of [xremap](https://github.com/k0kubun/xremap), a Linux key remapper,
relies on this GNOME Shell extension to fetch the active application name.

So you need to install this if you want to use [xremap](https://github.com/k0kubun/xremap) with `--features gnome`.

## Installation

Run:

```bash
git clone https://github.com/xremap/xremap-gnome ~/.local/share/gnome-shell/extensions/xremap@k0kubun.com
```

and restart your GNOME Shell session, e.g. reboot. Then run:

```
gnome-extensions-app
```

Once you enable "Xremap" there, an xremap binary built with `--features gnome` should work.

## License

GPLv2+
