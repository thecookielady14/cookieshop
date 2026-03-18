from PIL import Image

def make_transparent(img_path, out_path, tolerance=30):
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    
    # Get the corner pixel to use as the background color to remove
    bg_color = datas[0] # Top-left pixel
    
    new_data = []
    for item in datas:
        # Check if the pixel color is similar to the background color
        if (abs(item[0] - bg_color[0]) < tolerance and
            abs(item[1] - bg_color[1]) < tolerance and
            abs(item[2] - bg_color[2]) < tolerance):
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(out_path, "PNG")

if __name__ == "__main__":
    make_transparent("/home/rossitto/main_linux/Antigravity/Website/website/public/logo.jpeg", "/home/rossitto/main_linux/Antigravity/Website/website/public/logo_transparent.png")
