// Licence: GPLv2+

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class XremapPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();
    const page = new Adw.PreferencesPage({
      title: 'General',
      icon_name: 'dialog-information-symbolic',
    });
    window.add(page);

    const group = new Adw.PreferencesGroup({
      title: 'Socket Configuration',
      description: 'Configure the Unix socket for xremap communication',
    });
    page.add(group);

    const socketRow = new Adw.EntryRow({
      title: 'Socket Path',
      text: settings.get_string('socket-path'),
    });
    socketRow.set_show_apply_button(true);
    socketRow.connect('apply', () => {
      const path = socketRow.get_text();
      if (path !== settings.get_string('socket-path')) {
        settings.set_string('socket-path', path);
      }
    });
    group.add(socketRow);

    const infoGroup = new Adw.PreferencesGroup({title: 'Information'});
    page.add(infoGroup);
    const infoBox = new Gtk.Box({orientation: Gtk.Orientation.VERTICAL});
    infoBox.append(new Gtk.Label({
      label: 'The directory must exist and be writable by the gnome session ' +
             'user, otherwise the socket server will not run.',
      wrap: true,
      xalign: 0,
      margin_top: 12,
      margin_bottom: 12,
      margin_start: 12,
      margin_end: 12,
    }));
    infoGroup.add(new Adw.PreferencesRow({child: infoBox}));
  }
}
