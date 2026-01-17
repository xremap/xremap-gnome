# xremap-gnome

GNOME Shell extension for xremap

## What's this?

The GNOME version of [xremap](https://github.com/k0kubun/xremap), a Linux key remapper,
relies on this GNOME Shell extension to fetch the active application name.

So you need to install this if you want to use [xremap](https://github.com/k0kubun/xremap) with `--features gnome`.

## Installation

Install xremap's GNOME Shell extension from [this link](https://extensions.gnome.org/extension/5060/xremap/),
switching OFF to ON.

## Configuration

For a secure xremap configuration, [`xremap-socket`](https://github.com/millerdev/xremap-socket)
can be used to route active window requests to the active GNOME session. See the
`xremap-socket` README for configuration details.

By default the socket path is `/run/xremap/${UID}/xremap.sock` unless the
`/run/xremap/${UID}` directory does not exist, in which case the legacy default
`/run/xremap/gnome.sock` is used instead. The socket is activated only if its
parent directory exists and is writable by the GNOME session user. The socket
path can be changed with an environment variable, `XREMAP_GNOME_SOCKET`, which
can be set in `~/.config/environment.d/99-xremap.conf` or
`/etc/environment.d/90-xremap.conf`.

## Development

```bash
git clone https://github.com/xremap/xremap-gnome ~/.local/share/gnome-shell/extensions/xremap@k0kubun.com
# Reload your GNOME Shell session, and then enable "Xremap" using:
gnome-extensions-app
```

## Release

1. Update `version` in `metadata.json`. Push it to master.
2. Run `./package.sh`. It creates `extension.zip`.
3. Open https://extensions.gnome.org/upload/ and upload it.

## License

GPLv2+
