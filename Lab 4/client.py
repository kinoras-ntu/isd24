import socket
import json
import cv2
import numpy as np
import pyrealsense2 as rs

from mpipe import MediaPipe

HOST = "127.0.0.1"      # localhost
HOST = "172.20.10.3"    # hotspot
HOST = "192.168.1.120"  # csie523
PORT = 999

CART_ID = [50]
REFILL_ID = [7]
CALIBRATION_ID = [3, 4]

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

def transform(T, L):
    L.append(1)
    x, y, z = np.matmul(T, np.array(L))[:-1].tolist()
    return {'x': x, 'y': y, 'z': z}

def main():
    T = None
    calibrated = False

    ###############  Configuration  ###############

    # RealSense
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

    config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
    config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)

    pipeline.start(config)
    align_to = rs.stream.color
    align = rs.align(align_to)

    # ArUco
    arucoDict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_6X6_250)
    arucoParams = cv2.aruco.DetectorParameters()
    arucoDetector = cv2.aruco.ArucoDetector(arucoDict, arucoParams)

    # MediaPipe
    mp = MediaPipe()

    # Response
    response_message = {
        # Flags
        'needsRefill': False,
        'isDangerous': False,

        # NPC position
        'hasSkeletonData': True,
        'headPosition': {'x': 0.0, 'y': 0.0, 'z': 0.0},
        'leftHandPosition': {'x': 0.0, 'y': 0.0, 'z': 0.0},
        'rightHandPosition': {'x': 0.0, 'y': 0.0, 'z': 0.0},
        'leftLegPosition': {'x': 0.0, 'y': 0.0, 'z': 0.0},
        'rightLegPosition': {'x': 0.0, 'y': 0.0, 'z': 0.0},

        # Cart position
        'cartPosition': {'x': 0.0, 'y': 0.0, 'z': 0.0},
        'cartRotation': {'x': 0.0, 'y': 0.0, 'z': 0.0}
    }
    
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.connect((HOST, PORT))
            sock.setblocking(0)
            print("connected")
            # For every frame...
            while True:
                # Wait for the depth and the color frame
                frames = pipeline.wait_for_frames()
                aligned_frames = align.process(frames)
                depth_frame = aligned_frames.get_depth_frame()
                color_frame = aligned_frames.get_color_frame()
                if not depth_frame or not color_frame:
                    continue
                depth_intrinsics = depth_frame.profile.as_video_stream_profile().intrinsics
                color_image = np.asanyarray(color_frame.get_data())

                # Retrieve skeleton data
                detection_results = mp.detect(color_image)
                color_image = mp.draw_landmarks_on_image(color_image, detection_results)
                skeleton = mp.skeleton(color_image, detection_results, depth_frame)

                if calibrated:

                    ###############  NPC Skeleton  ###############

                    if skeleton is None:
                        response_message['hasSkeletonData'] = False
                    else:
                        response_message['hasSkeletonData'] = True
                        response_message['headPosition'] = transform(T, [skeleton['Head_x'],  skeleton['Head_y'],  skeleton['Head_z']])
                        response_message['leftHandPosition'] = transform(T, [skeleton['LHand_x'], skeleton['LHand_y'], skeleton['LHand_z']])
                        response_message['rightHandPosition'] = transform(T, [skeleton['RHand_x'], skeleton['RHand_y'], skeleton['RHand_z']])
                        response_message['leftLegPosition'] = transform(T, [skeleton['LLeg_x'], skeleton['LLeg_y'], skeleton['LLeg_z']])
                        response_message['rightLegPosition'] = transform(T, [skeleton['RLeg_x'], skeleton['RLeg_y'], skeleton['RLeg_z']])

                    ###############  ArUco Code  ###############

                    # Decode ArUco coordinates
                    aruco_coordinates = {}
                    corners, ids, _ = arucoDetector.detectMarkers(color_image)
                    for i in range(len(corners)):
                        x, y = centroid(corners[i][0])
                        depth = depth_frame.get_distance(x, y)
                        aruco_coordinates[int(ids[i][0])] = rs.rs2_deproject_pixel_to_point(depth_intrinsics, [x, y], depth)

                    # Get & transform cart coordinates
                    for id in CART_ID:
                        if id in aruco_coordinates:
                            response_message['cartPosition'] = transform(T, aruco_coordinates[id])
                        else:
                            print("[WARNING] Cart marker not found, using previous position.")

                    response_message['needsRefill'] = any([id in aruco_coordinates for id in REFILL_ID])

                    send(sock, response_message)

                        
                elif skeleton is not None:
                    # Not calibrated, but got skeleton info 
                    # Should receive Unity coordinates to calibrate
                    try:
                        print("[INFO] Calibrating...")

                        # Receive humanoid coordinates
                        msg = receive(sock)
                        unity_coordinates = [list(coor.values()) for coor in msg.values()]
                        unity_coordinates_array = np.array(unity_coordinates)

                        # Receive humanoid coordinates
                        realsense_humanoid_coordinates = [
                            [skeleton['Head_x'],  skeleton['Head_y'],  skeleton['Head_z']],
                            [skeleton['LHand_x'], skeleton['LHand_y'], skeleton['LHand_z']],
                            [skeleton['RHand_x'], skeleton['RHand_y'], skeleton['RHand_z']],
                        ]

                        # Decode ArUco coordinates
                        realsense_aruco_coordinates = {}
                        corners, ids, _ = arucoDetector.detectMarkers(color_image)
                        for i in range(len(corners)):
                            x, y = centroid(corners[i][0])
                            depth = depth_frame.get_distance(x, y)
                            realsense_aruco_coordinates[int(ids[i][0])] = rs.rs2_deproject_pixel_to_point(depth_intrinsics, [x, y], depth)
                        realsense_aruco_coordinates = {key: realsense_aruco_coordinates[key] for key in CALIBRATION_ID if key in realsense_aruco_coordinates}
                        if len(realsense_aruco_coordinates) < len(CALIBRATION_ID):
                            print("[ERROR] Failed to calibrate: Not enough code.")
                            continue
                        if any(all(x == 0.0 for x in coordinate) for coordinate in realsense_aruco_coordinates.values()):
                            print("[ERROR] Failed to calibrate: Invalid code coordinate.")
                            continue
                        realsense_aruco_coordinates = dict(sorted(realsense_aruco_coordinates.items()))
                        realsense_aruco_coordinates = list(realsense_aruco_coordinates.values())
                        
                        # Start to compute T
                        realsense_coordinates_array = np.array(realsense_humanoid_coordinates + realsense_aruco_coordinates)
                        T = find_transformation_matrix(realsense_coordinates_array, unity_coordinates_array)
                        calibrated = True
                        print("[INFO] Calibration done.")
                        
                    except Exception as error :
                        print("[ERROR] Failed to calibrate:", type(error).__name__, "-", error)

                # Show images for every frames
                cv2.namedWindow('RealSense', cv2.WINDOW_AUTOSIZE)
                cv2.imshow('RealSense', color_image)
                cv2.waitKey(1)


    finally:
        # Stop streaming
        pipeline.stop()

def receive(sock):
    data = sock.recv(2048)
    data = data.decode('utf-8')
    print("Received:", data)
    msg = json.loads(data)
    return msg

def send(sock, msg):
    data = json.dumps(msg)
    sock.sendall(data.encode('utf-8'))
    print("Sent:", msg)

if __name__ == '__main__':
    main()