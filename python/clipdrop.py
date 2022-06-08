# Process files using ClipDrop API

import argparse
import math
import os
import sys
import time
from os import listdir
from os.path import isfile, join

import numpy as np
import PIL
import requests
from black import main
from PIL import Image

parser = argparse.ArgumentParser(
    description='This tool can process images using the ClipAPI.')
parser.add_argument('--API_KEY', required=True, type=str,
                    help='The API key to use for the API call.')
parser.add_argument('--api', required=True, choices=('remove-background', 'super-resolution'),
                    help='The alogrythm to be applyed on all your images')
parser.add_argument('-i', '--input', required=True,
                    help='the folder containing the images to process')
parser.add_argument('-o', '--output', required=True,
                    help='the output folder')
parser.add_argument('--upscale', type=int, default=2,
                    help='the upscale ratio, can be 2 or 4')
parser.add_argument('--output_format',
                    choices=('png', 'jpeg', 'webp'),
                    default='png',
                    help='Select the new background')
parser.add_argument('--background_color',
                    type=str,
                    default=None,
                    help='Select the new background color, can be any color, or chekcboard, do not set to set a transparent background')
parser.add_argument('--join', action='store_true', default=False,
                    help='center the image')

args = parser.parse_args()


# API urls and Key
SUPER_RESOLUTION = 'https://apis.clipdrop.co/super-resolution/v1'
REMOVE_BACKGROUND = 'https://apis.clipdrop.co/remove-background/v1'
API_KEY = args.API_KEY


def call_remove_background_api(input_file, output_file):
    """call the API to remove the background"""
    output_format = os.path.splitext(output_file)[1].lower()
    img_in = open(input_file, 'rb')
    files = {'image_file': ('image.jpeg', img_in, 'image/jpeg')}
    image_type = {'.png': 'image/png', '.jpeg': 'image/jpeg',
                  '.jpg': 'image/jpeg', '.webp': 'image/webp'}[output_format.lower()]
    headers = {'x-api-key': API_KEY,
               'accept': image_type}
    r = requests.post(REMOVE_BACKGROUND,
                      stream=True,
                      files=files,
                      headers=headers)

    if r.ok:
        with open(output_file, 'wb') as f:
            for chunk in r:
                f.write(chunk)
    else:
        r.raise_for_status()


def call_super_resolution_api(input_file, output_file, scale=2):
    """call the API to upscale the image"""
    output_format = os.path.splitext(output_file)[1].lower()
    img_in = open(input_file, 'rb')
    files = {'image_file': ('image.jpeg', img_in, 'image/jpeg')}
    image_type = {'.png': 'image/png', '.jpeg': 'image/jpeg',
                  '.jpg': 'image/jpeg', '.webp': 'image/webp'}[output_format.lower()]
    headers = {'x-api-key': API_KEY,
               'accept': image_type}
    data = {'upscale': scale}
    r = requests.post(SUPER_RESOLUTION,
                      stream=True,
                      files=files,
                      headers=headers,
                      data=data)

    if r.ok:
        with open(output_file, 'wb') as f:
            for chunk in r:
                f.write(chunk)
    else:
        r.raise_for_status()


def checkerboard(h, w, channels=3, tiles=16, fg=.95, bg=.6):
    """Create a shape (w,h,1) array tiled with a checkerboard pattern."""
    square_size = [math.ceil(float(d / tiles) / 2) for d in [h, w]]
    board = [[fg, bg] * tiles, [bg, fg] * tiles] * tiles
    scaled = np.kron(board, np.ones(square_size))
    scaled = scaled[:h, :w]
    return Image.fromarray(np.uint8(np.dstack([scaled]*channels)*255))


def composite(image_in, f_out, color='white'):
    """compose an image with a new background and a checkerboard"""
    if color == 'checkerboard':
        img = Image.open(image_in)
        checker = checkerboard(h=img.size[1], w=img.size[0])
        checker.paste(img, (0, 0), img)
        checker.save(f_out)
    else:
        img = Image.open(image_in)
        background = Image.new('RGB', img.size, color=color)
        background.paste(img, (0, 0), img)
        background.save(f_out)


def resize(f_in, f_out, new_size):
    """resize an image"""
    img = Image.open(f_in)
    img.thumbnail(new_size, Image.ANTIALIAS)
    img = img.convert("RGB")
    img.save(f_out)


def join_imgs(imgs, filename_out):
    """join images to compare them"""
    images = [Image.open(x) for x in imgs]
    widths, heights = zip(*(i.size for i in images))

    total_width = sum(widths)
    max_height = max(heights)

    new_im = Image.new('RGB', (total_width, max_height))

    x_offset = 0
    for im in images:
        new_im.paste(im, (x_offset, 0))
        x_offset += im.size[0]
    new_im.save(filename_out)


# process all the images in the input folder
file_system = {
    'in': args.input,
    'out': args.output,
}

# Generate folders if needed
for key, folder in file_system.items():
    if not os.path.exists(folder):
        print('Creating ', folder)
        os.makedirs(folder)

# List files an iterate
files = [f for f in listdir(file_system['in'])
         if isfile(join(file_system['in'], f))]
for file in files:
    try:
        print(f'Start processing {file}')
        start = time.time()
        if args.api == 'remove-background':
            file_in = join(file_system['in'], file)
            name = os.path.splitext(file)[0]
            if args.background_color:
                file_out = join(file_system['out'], f'{name}.png')
                call_remove_background_api(file_in, 'temp.png')
                composite('temp.png', file_out, args.background_color)
                os.remove('temp.png')
            else:
                file_out = join(file_system['out'],
                                f'{name}.{args.output_format}')
                call_remove_background_api(file_in, file_out)
        elif args.api == 'super-resolution':
            file_in = join(file_system['in'], file)
            name = os.path.splitext(file)[0]
            file_out = join(file_system['out'], f'{name}.{args.output_format}')
            call_super_resolution_api(file_in, file_out, args.upscale)
        if args.join:
            join_imgs([file_in, file_out], file_out)
        end = time.time()
        print(f'{file} processed in {end - start} seconds')

    except KeyboardInterrupt:
        print('Interrupted')
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)
    except BaseException as error:
        print('Error with {}, {}'.format(file_system['in'], error))
