# Luminance Twibbon Generator

This is a web-based application that allows users to easily create a custom profile picture by overlaying a photo onto a pre-designed event frame. It was created for the "Luminance" event.

## Features

- **Upload Photo**: Users can upload their own photo from their device.
- **Adjust Photo**: Pan, zoom, and rotate the uploaded photo to get the perfect fit within the frame.
- **Live Preview**: See the final result in real-time on an HTML5 canvas.
- **Download Image**: Download the final merged image as a high-quality PNG file.
- **Copy Caption**: A pre-written event caption is provided, which can be copied to the clipboard with a single click.
- **Responsive Design**: The interface is fully responsive and works seamlessly on desktop, tablet, and mobile devices.
- **Engaging UI**: Features a modern dark theme with animations, a loading spinner, and confetti effects for a better user experience.

## Tech Stack

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Dependencies**: `canvas-confetti` for effects, `particles.js` for background animation.

## How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/OSISSMAIGS/Twibbonize-MPLS.git
    cd Twibbonize-MPLS
    ```

2.  **Create a virtual environment and activate it:**
    ```bash
    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # For Windows
    python -m venv venv
    venv\Scripts\activate
    ```

3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Flask application:**
    ```bash
    flask run
    ```

5.  Open your web browser and navigate to `http://127.0.0.1:5000`.
