// Copyright (C) 2022 Takashi Kokubun
// Licence: GPLv2+

import Gio from 'gi://Gio';
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
  }

  disable() {
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
}
