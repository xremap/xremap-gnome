// Copyright (C) 2022 Takashi Kokubun
// Licence: GPLv2+

const { Gio } = imports.gi;

class Xremap {
  constructor() {
  }

  enable() {
    const dbus_object = `
      <node>
        <interface name="com.k0kubun.Xremap">
          <method name="WMClass">
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

  WMClass() {
    const actor = global.get_window_actors().find(a=>a.meta_window.has_focus()===true)
    return actor && actor.get_meta_window().get_wm_class();
  }
}

function init() {
  return new Xremap();
}
