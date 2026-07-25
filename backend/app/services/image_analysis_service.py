from io import BytesIO

from PIL import Image, ImageFilter, ImageStat


def analyze_image(file_contents: bytes) -> dict:
    with Image.open(BytesIO(file_contents)) as image:
        rgb_image = image.convert("RGB")

        width, height = rgb_image.size

        grayscale_image = rgb_image.convert("L")

        brightness_score = ImageStat.Stat(
            grayscale_image
        ).mean[0]

        edges = grayscale_image.filter(
            ImageFilter.FIND_EDGES
        )

        blur_score = ImageStat.Stat(edges).var[0]

        resized_image = rgb_image.resize((1, 1))

        dominant_red, dominant_green, dominant_blue = (
            resized_image.getpixel((0, 0))
        )

    return {
        "image_width": width,
        "image_height": height,
        "brightness_score": round(
            float(brightness_score),
            2,
        ),
        "blur_score": round(
            float(blur_score),
            2,
        ),
        "dominant_red": int(dominant_red),
        "dominant_green": int(dominant_green),
        "dominant_blue": int(dominant_blue),
    }