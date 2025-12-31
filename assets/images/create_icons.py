from PIL import Image, ImageDraw

# Create icon.png (1024x1024)
icon = Image.new('RGB', (1024, 1024), color='#0b0f1e')
draw = ImageDraw.Draw(icon)
draw.ellipse([312, 312, 712, 712], fill='#22a2ff')
icon.save('icon.png', 'PNG')

# Create favicon.png (48x48)
favicon = Image.new('RGB', (48, 48), color='#0b0f1e')
draw_fav = ImageDraw.Draw(favicon)
draw_fav.ellipse([12, 12, 36, 36], fill='#22a2ff')
favicon.save('favicon.png', 'PNG')

print("Icons created successfully")
