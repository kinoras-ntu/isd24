import cv2
import numpy as np
import pyrealsense2 as rs
from flask import Flask, render_template, Response, request, jsonify
from flask_socketio import SocketIO
from mpipe import MediaPipe


USE_REALSENSE = True
HOST, PORT = "127.0.0.1", 5000
WIDTH, HEIGHT, FPS = 640, 480, 30

latest_results = None


###############  Configuration  ###############

# Camera
if USE_REALSENSE:
    pipeline = rs.pipeline()
    config = rs.config()
    pipeline_wrapper = rs.pipeline_wrapper(pipeline)
    pipeline_profile = config.resolve(pipeline_wrapper)
    device = pipeline_profile.get_device()
    found_rgb = False
    for s in device.sensors:
        if s.get_info(rs.camera_info.name) == 'RGB Camera':
            found_rgb = True
            break
    if not found_rgb:
        print("[main] The demo requires Depth camera with Color sensor")
        exit(0)
    config.enable_stream(rs.stream.depth, WIDTH, HEIGHT, rs.format.z16, FPS)
    config.enable_stream(rs.stream.color, WIDTH, HEIGHT, rs.format.bgr8, FPS)
    pipeline.start(config)
    align_to = rs.stream.color
    align = rs.align(align_to)
else:
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
    cap.set(cv2.CAP_PROP_FPS, FPS)

# Flask
app = Flask(__name__)
socketio = SocketIO(app)

# MediaPipe
mp = MediaPipe()


###############  Functions  ###############

def generate_frames(outline: bool = False):
    global latest_results
    try:
        while True:
            # Wait for the depth and the color frame
            if USE_REALSENSE:
                # RealSense: Wait for the depth and the color frame
                frames = pipeline.wait_for_frames()
                aligned_frames = align.process(frames)
                color_frame = aligned_frames.get_color_frame()
                depth_frame = aligned_frames.get_depth_frame()
                if not color_frame or not depth_frame:
                    continue
                color_image = np.asanyarray(color_frame.get_data())
            else:
                # Webcam: Capture frames
                ret, color_image = cap.read()
                if not ret:
                    continue

            # Retrieve skeleton data
            detection_results = mp.detect(color_image)
            latest_results = detection_results

            # Draw landmarks on image
            color_image = mp.draw_landmarks_on_image(color_image, detection_results)

            if outline and detection_results.segmentation_mask is not None:
                # Convert the segmentation mask to binary mask
                segmentation_mask = detection_results.segmentation_mask
                # Threshold the mask to create a binary image
                mask = (segmentation_mask > 0.1).astype(np.uint8) * 255

                # Find contours on the mask
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                # Draw contours on the color image
                cv2.drawContours(color_image, contours, -1, (255, 255, 255), 2)

            _, buffer = cv2.imencode('.jpg', color_image)

            # Convert image to bytes
            color_image = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + color_image + b'\r\n')
    except Exception as e:
        print(f"Error in generate_frames(): {e}")


###############  Routes  ###############

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/video_feed')
def video_feed():
    outline = request.args.get('outline') == 'true'
    return Response(generate_frames(outline), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/nodes', methods=['GET'])
def get_nodes():
    global latest_results
    try:
        if latest_results is None:
            return jsonify({'error': 'No data available yet'}), 404

        if not hasattr(latest_results, 'pose_landmarks') or latest_results.pose_landmarks is None:
            return jsonify({'error': 'No landmarks detected'}), 400

        landmarks = latest_results.pose_landmarks.landmark
        landmarks = [{'nodeId': id, 'x': round(lm.x * WIDTH, 5), 'y': round(lm.y * HEIGHT, 5)} for id, lm in enumerate(landmarks)]

        return jsonify({'nodes': landmarks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


###############  Main  ###############

if __name__ == '__main__':
    try:
        socketio.run(app, host=HOST, port=PORT)
        # pipeline.start(config)
    finally:
        if USE_REALSENSE:
            # Stop the pipeline when the script ends
            pipeline.stop()