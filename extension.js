// Copyright (C) 2022 Takashi Kokubun
// Licence: GPLv2+

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class Xremap extends Extension {
  enable() {
    const dbus_object = `
      <node>
        <interface name="com.k0kubun.Xremap">
          <method name="ActiveWindow">
            <arg type="s" direction="out" name="win"/>
          </method>
          <method name="WMClass">
            <arg type="s" direction="out" name="win"/>
          </method>
          <method name="WMClasses">
            <arg type="s" direction="out" name="win"/>
          </method>
        </interface>
      </node>
    `;
    this.dbus = Gio.DBusExportedObject.wrapJSObject(dbus_object, this);
    this.dbus.export(Gio.DBus.session, '/com/k0kubun/Xremap');

    this._socketPath = this._getSocketPath()
    this._socketService = null;
    this._startSocketServer();
  }

  disable() {
    this._stopSocketServer();

    this.dbus.flush();
    this.dbus.unexport();
    delete this.dbus;
  }

  ActiveWindow() {
    const actor = global
      .get_window_actors()
      .find((a) => a.meta_window.has_focus() === true);
    if (actor) {
      const w = actor.get_meta_window();
      return JSON.stringify({
        wm_class: w.get_wm_class(),
        title: w.get_title(),
      });
    } else {
      return '{}';
    }
  }

  WMClass() {
    const actor = global
      .get_window_actors()
      .find((a) => a.meta_window.has_focus() === true);
    return actor && actor.get_meta_window().get_wm_class();
  }

  // To see the application names through the busctl
  WMClasses() {
    // Even if it makes the items in a list joined by "\n", dbus output escapes the new line characters.
    // So this outputs JSON array string instead of the plain text for understandability.
    return JSON.stringify([
      ...new Set(
        global
          .get_window_actors()
          .map((a) => a.get_meta_window().get_wm_class()),
      ),
    ]);
  }

  _startSocketServer() {
    if (this._socketService || !this._socketPath) {
      return;
    }

    try {
      const socketDir = GLib.path_get_dirname(this._socketPath);
      const dirFile = Gio.File.new_for_path(socketDir);
      if (!dirFile.query_exists(null)) {
        this._info(`Skipping socket server. Socket directory ${socketDir} does not exist.`);
        return;
      }
      const socketFile = Gio.File.new_for_path(this._socketPath);
      if (this._isSocket(socketFile)) {
        try {
          socketFile.delete(null);
        } catch (e) {
          this._error(`Skipping socket server. Cannot remove stale socket: ${e.message}`);
          return;
        }
      } else if (socketFile.query_exists(null)) {
        this._error(`Skipping socket server. Socket file has wrong type.`);
        return;
      }

      this._socketService = new Gio.SocketService();
      this._socketService.add_address(
        Gio.UnixSocketAddress.new(this._socketPath),
        Gio.SocketType.STREAM,
        Gio.SocketProtocol.DEFAULT,
        null
      );
      this._socketService.connect('incoming', this._handleConnection);
      this._socketService.start();
      this._log(`Socket server listening on ${this._socketPath}`);

      try {
        GLib.chmod(this._socketPath, 0o660);
      } catch (e) {
        this._error(`Cannot set socket permissions: ${e.message}`);
      }
    } catch (e) {
      this._error(`Cannot start socket server: ${e.message}`);
      this._socketService = null;
    }
  }

  _stopSocketServer() {
    if (this._socketService) {
      this._socketService.stop();
      this._socketService.close();
      this._socketService = null;
      try {
        const socketFile = Gio.File.new_for_path(this._socketPath);
        if (this._isSocket(socketFile)) {
          socketFile.delete(null);
          this._info(`Removed socket file: ${this._socketPath}`);
        }
      } catch (e) {
        this._error(`Failed to remove socket file: ${e.message}`);
      }
    }
  }

  _handleConnection = (service, connection) => {
    try {
      const inputStream = connection.get_input_stream();
      const outputStream = connection.get_output_stream();
      const dataInputStream = new Gio.DataInputStream({base_stream: inputStream});
      const [line] = dataInputStream.read_line_utf8(null);
      if (line) {
        const response = this._processCommand(line, outputStream);
        if (response) {
          outputStream.write(JSON.stringify(response) + '\n', null);
          outputStream.flush(null);
        }
      }
    } catch (e) {
      this._error(`Connection error: ${e.message}`);
    } finally {
      connection.close(null);
    }
    return true;
  }

  _processCommand(command, outputStream) {
    try {
      const cmd = JSON.parse(command);
      if (cmd === 'ActiveWindow') {
        return this._getActiveWindow() || {};
      }
      if (cmd === 'Windows') {
        // works with Niri variant of xremap
        return this._getWindows();
      }
      if (typeof cmd === 'object' && cmd.Run) {
        return this._run(cmd.Run);
      }
      this._error(`Unknown command: ${command}`);
      return { Error: 'Unknown command' };
    } catch (e) {
      this._error(`Command error: ${e.message}`);
      return { Error: e.message };
    }
  }

  _getActiveWindow() {
    const actor = global
      .get_window_actors()
      .find((a) => a.meta_window.has_focus() === true);
    if (actor) {
      const w = actor.get_meta_window();
      return { wm_class: w.get_wm_class() || '', title: w.get_title() || '' };
    }
    return null;
  }

  _getWindows() {
    const windows = [];
    const window = this._getActiveWindow();
    if (window) {
      windows.push({
        ...BASE_NIRI_WINDOW,
        app_id: window.wm_class,
        title: window.title,
      });
    }
    return { Ok: { Windows: windows } };
  }

  _run(command) {
    try {
      let proc = new Gio.Subprocess({
          argv: command,
          flags: GLib.SpawnFlags.SEARCH_PATH
               | GLib.SpawnFlags.STDIN_TO_DEV_NULL
               | GLib.SpawnFlags.STDOUT_TO_DEV_NULL
               | GLib.SpawnFlags.STDERR_TO_DEV_NULL
      });
      proc.init(null);
      proc.wait_check_async(null, (source, result) => {
        try {
          source.wait_check_finish(result);
        } catch (e) {
          this._error(`${JSON.stringify(command)} error: ${e.message}`);
        }
      });
    } catch (e) {
      this._error(`Cannot run ${JSON.stringify(command)}: ${e.message}`);
    }
    return "Ok";
  }

  _getSocketPath() {
    const envPath = GLib.getenv("XREMAP_GNOME_SOCKET");
    if (envPath) {
      return envPath;
    }
    const uid = Gio.Credentials.new().get_unix_user();
    return `/run/xremap/${uid}/gnome.sock`;
  }

  _isSocket(file) {
    return file.query_file_type('', null) === Gio.FileType.SPECIAL;
  }

  _info(message) {
    console.info(`[Xremap] ${message}`);
  }

  _log(message) {
    console.log(`[Xremap] ${message}`);
  }

  _error(message) {
    console.error(`[Xremap] ${message}`);
  }
}

const BASE_NIRI_WINDOW = {
  id: 1,
  app_id: '',
  title: '',
  workspace_id: 1,
  is_focused: true,
  is_floating: false,
  is_urgent: false,
  layout: {
    tile_size: [0, 0],
    window_size: [0, 0],
    window_offset_in_tile: [0, 0],
  },
};
