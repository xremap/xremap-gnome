#!/bin/bash
glib-compile-schemas --strict schemas/
zip extension.zip extension.js metadata.json prefs.js schemas/*
