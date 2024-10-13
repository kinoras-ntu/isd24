import socket
import json
import cv2
import numpy as np
import pyrealsense2 as rs
import time

from mediapipe import MediaPipe

HOST = "127.0.0.1"      # localhost
HOST = "172.20.10.3"    # hotspot
HOST = "192.168.1.120"  # csie523
PORT = 9999

def find_transformation_matrix(realsense_points, unity_points):
    assert realsense_points.shape == unity_points.shape, "Point sets must have the same shape."
    N = realsense_points.shape[0]
    assert N >= 4, "At least 4 points are required."

    # Prepare the design matrix A and the observation vector B
    A = np.zeros((N * 3, 12))
    B = np.zeros(N * 3)

    for i in range(N):
        x_r, y_r, z_r = realsense_points[i]
        x_u, y_u, z_u = unity_points[i]

        # Equation for x_u
        A[3 * i] = [x_r, y_r, z_r, 1, 0, 0, 0, 0, 0, 0, 0, 0]
        B[3 * i] = x_u

        # Equation for y_u
        A[3 * i + 1] = [0, 0, 0, 0, x_r, y_r, z_r, 1, 0, 0, 0, 0]
        B[3 * i + 1] = y_u

        # Equation for z_u
        A[3 * i + 2] = [0, 0, 0, 0, 0, 0, 0, 0, x_r, y_r, z_r, 1]
        B[3 * i + 2] = z_u

    # Solve the linear system A * p = B
    # p contains the elements of the transformation matrix T
    p, _, _, _ = np.linalg.lstsq(A, B, rcond=None)

    # Construct the transformation matrix T
    T = np.zeros((4, 4))
    T[0, :] = [p[0], p[1], p[2], p[3]]
    T[1, :] = [p[4], p[5], p[6], p[7]]
    T[2, :] = [p[8], p[9], p[10], p[11]]
    T[3, :] = [0, 0, 0, 1]  # Homogeneous coordinate
    return T

def centroid(vertices):
    x, y = 0, 0
    n = len(vertices)
    signed_area = 0
    for i in range(len(vertices)):
        x0, y0 = vertices[i]
        x1, y1 = vertices[(i + 1) % n]
        # shoelace formula
        area = (x0 * y1) - (x1 * y0)
        signed_area += area
        x += (x0 + x1) * area
        y += (y0 + y1) * area
    signed_area *= 0.5
    x /= 6 * signed_area
    y /= 6 * signed_area
    return int(x), int(y)

def main():
    T = None
    calibrated = False

    start_time = time.time()
    previous_time = start_time

    mp = MediaPipe()

    # Configure depth and color streams
    pipeline = rs.pipeline()
    config = rs.config()

    # Get device product line for setting a supporting resolution
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

    config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
    config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)

    arucoDict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
    arucoParams = cv2.aruco.DetectorParameters()

    # Start streaming
    pipeline.start(config)
    # Align Color and Depth
    align_to = rs.stream.color
    align = rs.align(align_to)
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect((HOST, PORT))
            sock.setblocking(0)
            while True:
                # Wait for a coherent pair of frames: depth and color
                frames = pipeline.wait_for_frames()
                aligned_frames = align.process(frames)
                depth_frame = aligned_frames.get_depth_frame()
                color_frame = aligned_frames.get_color_frame()
                if not depth_frame or not color_frame:
                    continue

                # Detect skeleton and send it to Unity
                color_image = np.asanyarray(color_frame.get_data())
            
                detection_results = mp.detect(color_image)
                color_image = mp.draw_landmarks_on_image(color_image, detection_results)
                skeleton_data = mp.skeleton(color_image, detection_results, depth_frame)
                if skeleton_data is not None:
                    realsense_coordinates = [
                        [skeleton_data['LHand_x'], skeleton_data['LHand_y'], skeleton_data['LHand_z']],
                        [skeleton_data['RHand_x'], skeleton_data['RHand_y'], skeleton_data['RHand_z']],
                        [skeleton_data['LLeg_x'],  skeleton_data['LLeg_y'],  skeleton_data['LLeg_z']],
                        [skeleton_data['RLeg_x'],  skeleton_data['RLeg_y'],  skeleton_data['RLeg_z']],
                        [skeleton_data['Head_x'],  skeleton_data['Head_y'],  skeleton_data['Head_z']]
                    ]
                    if not calibrated:
                        try:
                            msg = receive(sock)
                            realsense_coordinates_array = np.array(realsense_coordinates)
                            unity_coordinates_array = np.array([
                                [msg['LHand_x'], msg['LHand_y'], msg['LHand_z']],
                                [msg['RHand_x'], msg['RHand_y'], msg['RHand_z']],
                                [msg['LLeg_x'],  msg['LLeg_y'],  msg['LLeg_z']],
                                [msg['RLeg_x'],  msg['RLeg_y'],  msg['RLeg_z']],
                                [msg['Head_x'],  msg['Head_y'],  msg['Head_z']]
                            ])
                            T = find_transformation_matrix(realsense_coordinates_array, unity_coordinates_array)
                            calibrated = True
                            print("Calibration done.")
                        except:
                            pass
                    else:
                        cc = []     # calibrated_coordinates
                        for coordinate in realsense_coordinates:
                            coordinate.append(1)
                            x, y, z = np.matmul(T, np.array(coordinate))[:-1].tolist()
                            cc.append([x, y, z])
                        msg = {
                            'LHand_x': cc[0][0], 'LHand_y': cc[0][1], 'LHand_z': cc[0][2],
                            'RHand_x': cc[1][0], 'RHand_y': cc[1][1], 'RHand_z': cc[1][2],
                            'LLeg_x': cc[2][0], 'LLeg_y': cc[2][1], 'LLeg_z': cc[2][2],
                            'RLeg_x': cc[3][0], 'RLeg_y': cc[3][1], 'RLeg_z': cc[3][2],
                            'Head_x': cc[4][0], 'Head_y': cc[4][1], 'Head_z': cc[4][2],
                        }
                        send(sock, msg)

                    current_time = time.time()
                    time_difference = current_time - previous_time

                    print(f"Time since start: {time_difference:.2f} seconds")

                    previous_time = current_time

                    # Show images
                    cv2.namedWindow('RealSense', cv2.WINDOW_AUTOSIZE)
                    cv2.imshow('RealSense', color_image)
                    cv2.waitKey(1)
    finally:
        # Stop streaming
        pipeline.stop()

def receive(sock):
    data = sock.recv(1024)
    data = data.decode('utf-8')
    msg = json.loads(data)
    # print("Received: ", msg)
    return msg

def send(sock, msg):
    data = json.dumps(msg)
    sock.sendall(data.encode('utf-8'))
    # print("Sent: ", msg)

if __name__ == '__main__':
    main()