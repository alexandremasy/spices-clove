#!/usr/bin/env python3

import os
import fontforge
import argparse
import sys
from os import path

parser = argparse.ArgumentParser()
parser.add_argument("icons", help="path to the icons folder")
args = parser.parse_args()

# Check if the directory is given and valid
if path.exists(args.icons) == False:
    sys.exit('The icons folder does not exists')

if path.isdir(args.icons) == False:
    sys.exit('The icons path is not a folder')

# svg2ttf library does not support fill-rule="evenodd" so after converting icons to outlineStroke we fix path directions to work with "nonzero"
def files(path):
    for file in os.listdir(path):
        if os.path.isfile(os.path.join(path, file)):
            yield file

# refer to https://fontforge.org/docs/scripting/python/fontforge.html for documentation
# inspiration from https://github.com/FontCustom/fontcustom/blob/master/lib/fontcustom/scripts/generate.py
font = fontforge.font()
for file in files(args.icons):
    p = os.path.join(args.icons, file)
    glyph = font.createChar(123, file)
    glyph.importOutlines(p)
    glyph.round()
    glyph.simplify()
    glyph.simplify()
    glyph.correctDirection()
    glyph.export(p)
    glyph.clear()
